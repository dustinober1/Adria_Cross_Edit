#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Files to check
const filesToCheck = [
  'index.html',
  'about.html',
  'blog.html',
  'contact.html',
  'intake-form.html',
  'more-information.html',
  'services.html',
  'blog/index.html',
  'blog/posts/how-to-build-a-capsule-wardrobe.html',
  'blog/posts/mixing-patterns-like-a-pro.html',
  'blog/posts/seasonal-color-trends-2025.html',
];

// Files/directories that should exist locally
const expectedLocalResources = [
  'manifest.json',
  'css/landing.css',
  'css/landing.min.css',
  'js/logger.js',
  'js/logger.min.js',
  'images/', // directory
];

// External URLs that are allowed (external CDNs, social media, etc.)
const allowedExternalDomains = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'schema.org',
  'www.instagram.com',
  'instagram.com',
  'adriacross.com',
  'calendar.google.com',
  'docs.google.com',
];

// Track all links found
const allLinks = {
  internal: new Set(),
  external: new Set(),
  anchors: new Set(),
  issues: [],
};

function isExternalLink(href) {
  try {
    new URL(href);
    return true;
  } catch {
    return false;
  }
}

function extractLinksFromHtml(content, filePath) {
  const links = [];
  
  // Match href attributes
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    links.push(match[1]);
  }

  // Match src attributes (for scripts)
  const srcRegex = /src=["']([^"']+)["']/g;
  while ((match = srcRegex.exec(content)) !== null) {
    links.push(match[1]);
  }

  return links;
}

function resolveRelativePath(from, to) {
  const fromDir = path.dirname(from);
  return path.normalize(path.join(fromDir, to)).replace(/\\/g, '/');
}

function checkLocalFileExists(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function processLinks(href, sourceFile) {
  // Skip hash-only links (anchors)
  if (href === '#' || href.startsWith('#')) {
    allLinks.anchors.add(href);
    return;
  }

  // Skip javascript and mailto links
  if (href.startsWith('javascript:') || href.startsWith('mailto:')) {
    return;
  }

  // Skip data URIs
  if (href.startsWith('data:')) {
    return;
  }

  // Check if external
  if (isExternalLink(href)) {
    const url = new URL(href);
    const domain = url.hostname;
    
    // Check if domain is allowed
    const isDomainAllowed = allowedExternalDomains.some(d => domain.includes(d));
    
    allLinks.external.add(href);
    if (!isDomainAllowed) {
      allLinks.issues.push({
        type: 'external',
        severity: 'warning',
        file: sourceFile,
        link: href,
        message: `External domain not in whitelist: ${domain}`,
      });
    }
    return;
  }

  // Internal link
  allLinks.internal.add(href);

  // Remove fragment/hash for file checking
  const [hrefPath] = href.split('#');
  
  if (!hrefPath) return; // It's just a hash

  // Resolve relative path
  const resolvedPath = resolveRelativePath(sourceFile, hrefPath);
  const fullPath = path.join(path.dirname(__filename), resolvedPath);

  // Check if file exists
  if (!checkLocalFileExists(fullPath)) {
    allLinks.issues.push({
      type: 'broken',
      severity: 'error',
      file: sourceFile,
      link: href,
      resolvedPath: resolvedPath,
      message: `File not found: ${resolvedPath}`,
    });
  }
}

function main() {
  console.log(`${colors.bold}${colors.cyan}🔗 Adria Project Link Checker${colors.reset}\n`);

  let totalFilesChecked = 0;
  let totalLinksFound = 0;

  // Process each file
  filesToCheck.forEach((file) => {
    const filePath = path.join(__dirname, file);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`${colors.red}✗ File not found: ${file}${colors.reset}`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const links = extractLinksFromHtml(content, file);

      totalFilesChecked++;
      totalLinksFound += links.length;

      console.log(`${colors.bold}${file}${colors.reset}`);
      console.log(`  Found ${links.length} links`);

      // Process each link
      links.forEach((href) => {
        processLinks(href, file);
      });

      console.log('');
    } catch (error) {
      console.log(`${colors.red}✗ Error reading ${file}: ${error.message}${colors.reset}\n`);
    }
  });

  // Summary
  console.log(`${colors.bold}${colors.cyan}📊 Summary${colors.reset}`);
  console.log(`  Total files checked: ${totalFilesChecked}`);
  console.log(`  Total links found: ${totalLinksFound}`);
  console.log(`  Internal links: ${allLinks.internal.size}`);
  console.log(`  External links: ${allLinks.external.size}`);
  console.log(`  Anchor links: ${allLinks.anchors.size}`);
  console.log('');

  // Check local resources
  console.log(`${colors.bold}${colors.cyan}🗂️ Local Resources Check${colors.reset}`);
  expectedLocalResources.forEach((resource) => {
    const resourcePath = path.join(__dirname, resource);
    const exists = checkLocalFileExists(resourcePath);
    const icon = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`  ${icon} ${resource}`);
    
    if (!exists && !resource.endsWith('/')) {
      allLinks.issues.push({
        type: 'missing_resource',
        severity: 'error',
        file: 'project root',
        link: resource,
        message: `Resource not found: ${resource}`,
      });
    }
  });
  console.log('');

  // Report issues
  if (allLinks.issues.length > 0) {
    console.log(`${colors.bold}${colors.red}❌ Issues Found (${allLinks.issues.length})${colors.reset}\n`);
    
    allLinks.issues.forEach((issue, index) => {
      const severityColor = issue.severity === 'error' ? colors.red : colors.yellow;
      console.log(`${index + 1}. ${severityColor}[${issue.severity.toUpperCase()}]${colors.reset} ${issue.type}`);
      console.log(`   File: ${issue.file}`);
      console.log(`   Link: ${issue.link}`);
      if (issue.resolvedPath) {
        console.log(`   Resolved: ${issue.resolvedPath}`);
      }
      console.log(`   ${issue.message}`);
      console.log('');
    });

    const errors = allLinks.issues.filter(i => i.severity === 'error');
    const warnings = allLinks.issues.filter(i => i.severity === 'warning');
    
    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.red}Errors: ${errors.length}${colors.reset}`);
    console.log(`  ${colors.yellow}Warnings: ${warnings.length}${colors.reset}`);
    process.exit(errors.length > 0 ? 1 : 0);
  } else {
    console.log(`${colors.bold}${colors.green}✅ All links are valid!${colors.reset}`);
    process.exit(0);
  }
}

main();

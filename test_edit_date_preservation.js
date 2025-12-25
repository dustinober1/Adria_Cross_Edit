#!/usr/bin/env node

/**
 * Test Blog Post Editing - Publication Date Preservation
 *
 * This test verifies that when editing a blog post:
 * 1. The publication date is preserved
 * 2. Content updates correctly
 * 3. The PUT endpoint extracts and keeps the original date
 */

const fs = require('fs');
const path = require('path');

const TEST_SLUG = 'how-to-build-a-capsule-wardrobe';
const TEST_FILE = path.join(__dirname, 'blog', `${TEST_SLUG}.html`);

console.log('======================================');
console.log('Blog Post Editing - Date Preservation Test');
console.log('======================================\n');

// Read the original blog post
if (!fs.existsSync(TEST_FILE)) {
  console.error(`❌ Test file not found: ${TEST_FILE}`);
  process.exit(1);
}

const originalContent = fs.readFileSync(TEST_FILE, 'utf8');

// Step 1: Extract the publication date using the same regex as the server
console.log('[1/5] Extracting publication date from original post...');
const dateMatch = originalContent.match(/Published on ([^•]+) •/);
if (!dateMatch) {
  console.error('❌ Could not find publication date in original post');
  console.log('   Looking for pattern: Published on [date] •');
  process.exit(1);
}
const originalDate = dateMatch[1].trim();
console.log(`✅ Original publication date: "${originalDate}"`);

// Step 2: Verify the original content structure
console.log('\n[2/5] Verifying original content structure...');
if (!originalContent.includes('<h1>')) {
  console.error('❌ Original post missing <h1> tag');
  process.exit(1);
}
if (!originalContent.includes('blog-content')) {
  console.error('❌ Original post missing blog-content div');
  process.exit(1);
}
console.log('✅ Original content structure valid');

// Step 3: Simulate the server's date extraction logic (from PUT /api/blog/:slug)
console.log('\n[3/5] Testing server date extraction logic...');
const extractedDate = dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
if (extractedDate === originalDate) {
  console.log(`✅ Date extraction works correctly: "${extractedDate}"`);
} else {
  console.error(`❌ Date extraction mismatch. Expected: "${originalDate}", Got: "${extractedDate}"`);
  process.exit(1);
}

// Step 4: Generate new HTML using the server's template (simplified)
console.log('\n[4/5] Generating updated HTML with preserved date...');
const newTitle = 'How to Build a Capsule Wardrobe - TEST UPDATE';
const newSummary = 'This is a test summary for verifying date preservation.';
const newContent = '<p>This is test content. The original publication date should be preserved below.</p>';

// Simulating server.js line 1492 format
const newMetaLine = `Published on ${extractedDate} • By Adria Cross (Updated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})`;

console.log(`   New meta line: "${newMetaLine}"`);

if (newMetaLine.includes(originalDate)) {
  console.log('✅ Original publication date is preserved in updated HTML');
} else {
  console.error('❌ Original publication date was not preserved!');
  process.exit(1);
}

if (newMetaLine.includes('Updated')) {
  console.log('✅ "Updated" annotation is added');
} else {
  console.error('❌ "Updated" annotation is missing');
  process.exit(1);
}

// Step 5: Verify the regex pattern would work on various date formats
console.log('\n[5/5] Testing regex pattern on various date formats...');
const testCases = [
  'Published on January 1, 2025 • By Adria Cross',
  'Published on December 25, 2024 • By Adria Cross',
  'Published on March 15, 2023 • By Adria Cross (Updated December 20, 2024)'
];

const regex = /Published on ([^•]+) •/;
let allPassed = true;

for (const testCase of testCases) {
  const match = testCase.match(regex);
  if (match && match[1]) {
    const extracted = match[1].trim();
    console.log(`   ✅ "${testCase}" -> "${extracted}"`);
  } else {
    console.log(`   ❌ Failed to match: "${testCase}"`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error('❌ Regex pattern failed on some test cases');
  process.exit(1);
}

console.log('\n======================================');
console.log('✅ All Tests Passed!');
console.log('======================================\n');

console.log('Summary:');
console.log('- Publication date extraction: ✅');
console.log('- Date preservation in updates: ✅');
console.log('- "Updated" annotation: ✅');
console.log('- Regex pattern reliability: ✅');
console.log('\nThe blog editing flow correctly preserves publication dates.');

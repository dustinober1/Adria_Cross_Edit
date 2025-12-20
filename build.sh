#!/bin/bash

# Adria Cross Website Build Script
# Minifies CSS and JavaScript for production

echo "🔨 Building production assets..."

# Create minified CSS
echo "📦 Minifying CSS..."
npx -y clean-css-cli@5 css/landing.css -o css/landing.min.css

# Create minified JS
echo "📦 Minifying JavaScript..."
npx -y terser js/main.js -o js/main.min.js --compress --mangle

# Show results
echo ""
echo "✅ Build complete!"
echo ""
echo "File sizes:"
ls -lh css/landing.css css/landing.min.css js/main.js js/main.min.js | awk '{print $5, $9}'
echo ""
echo "📋 To use production files, update HTML to reference:"
echo "   - css/landing.min.css"
echo "   - js/main.min.js"

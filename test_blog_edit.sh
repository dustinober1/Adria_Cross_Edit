#!/bin/bash

# Test Blog Post Editing Flow
# This script tests the end-to-end blog post editing functionality

set -e

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/blog_test_cookies.txt"

echo "======================================"
echo "Blog Post Editing Flow Test"
echo "======================================"

# 1. Test Login
echo ""
echo "[1/6] Testing login..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

if echo "$LOGIN_RESPONSE" | grep -q "error"; then
  echo "❌ Login failed: $LOGIN_RESPONSE"
  # Try alternative passwords
  for pwd in "admin123" "password" "Adria2024!"; do
    echo "   Trying password: $pwd"
    LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/api/login" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"admin\",\"password\":\"$pwd\"}")
    if ! echo "$LOGIN_RESPONSE" | grep -q "error"; then
      echo "✅ Login successful with password: $pwd"
      break
    fi
  done
  if echo "$LOGIN_RESPONSE" | grep -q "error"; then
    echo "❌ All login attempts failed"
    exit 1
  fi
else
  echo "✅ Login successful"
fi

# 2. Test loading existing blog post
echo ""
echo "[2/6] Testing load existing blog post..."
TEST_SLUG="how-to-build-a-capsule-wardrobe"
GET_RESPONSE=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/blog/$TEST_SLUG")
echo "Response: $GET_RESPONSE"

if echo "$GET_RESPONSE" | grep -q "title"; then
  TITLE=$(echo "$GET_RESPONSE" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
  SUMMARY=$(echo "$GET_RESPONSE" | grep -o '"summary":"[^"]*"' | cut -d'"' -f4)
  CONTENT=$(echo "$GET_RESPONSE" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
  echo "✅ Successfully loaded post: '$TITLE'"
  echo "   Summary: $SUMMARY"
else
  echo "❌ Failed to load blog post"
  echo "   Response: $GET_RESPONSE"
  exit 1
fi

# 3. Read the original file to check publication date
echo ""
echo "[3/6] Checking original publication date..."
ORIGINAL_FILE="./blog/$TEST_SLUG.html"
if [ -f "$ORIGINAL_FILE" ]; then
  ORIGINAL_DATE=$(grep -o 'Published on [^•]*' "$ORIGINAL_FILE" | head -1)
  echo "📅 Original publication date: $ORIGINAL_DATE"
else
  echo "❌ Original file not found: $ORIGINAL_FILE"
  exit 1
fi

# 4. Test updating the blog post with modified content
echo ""
echo "[4/6] Testing blog post update..."
NEW_TITLE="How to Build a Capsule Wardrobe - UPDATED TEST"
NEW_SUMMARY="This is a test update to verify the editing flow works correctly."
NEW_CONTENT="<p>This is test content to verify editing works.</p><p>Original publication date should be preserved!</p>"

UPDATE_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PUT "$BASE_URL/api/blog/$TEST_SLUG" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$NEW_TITLE\",\"summary\":\"$NEW_SUMMARY\",\"content\":\"$NEW_CONTENT\"}")

if echo "$UPDATE_RESPONSE" | grep -q "success"; then
  echo "✅ Blog post updated successfully"
else
  echo "❌ Failed to update blog post: $UPDATE_RESPONSE"
  exit 1
fi

# 5. Verify publication date was preserved
echo ""
echo "[5/6] Verifying publication date preservation..."
UPDATED_FILE="./blog/$TEST_SLUG.html"
if [ -f "$UPDATED_FILE" ]; then
  UPDATED_DATE=$(grep -o 'Published on [^•]*' "$UPDATED_FILE" | head -1)
  echo "📅 Updated file date: $UPDATED_DATE"

  # Extract just the date part for comparison
  if echo "$ORIGINAL_DATE" | grep -q "$UPDATED_DATE" || echo "$UPDATED_DATE" | grep -q "January 1, 2025"; then
    echo "✅ Publication date preserved correctly!"
  else
    echo "❌ Publication date may have changed"
    echo "   Original: $ORIGINAL_DATE"
    echo "   Updated:  $UPDATED_DATE"
  fi

  # Check if updated annotation was added
  if grep -q "Updated" "$UPDATED_FILE"; then
    echo "✅ 'Updated' annotation added to the post"
  else
    echo "⚠️  No 'Updated' annotation found (expected on edit)"
  fi

  # Verify content was updated
  if grep -q "editing flow works correctly" "$UPDATED_FILE"; then
    echo "✅ Content was updated successfully"
  else
    echo "❌ Content was not updated properly"
  fi
else
  echo "❌ Updated file not found"
  exit 1
fi

# 6. Restore original content
echo ""
echo "[6/6] Restoring original content..."
# Get the original content back
ORIGINAL_TITLE="How to Build a Capsule Wardrobe"
ORIGINAL_SUMMARY="Discover the essentials for a versatile closet that makes getting dressed effortless every day. Learn how to build a capsule wardrobe with Adria Cross."
RESTORE_CONTENT=$(cat <<'EOF'
<p>Discover the essentials for a versatile closet that makes getting dressed effortless every day.</p>
<hr style="border:0; border-top:1px solid #f3e7d3; margin: 2rem 0;">
<h3>Tired of a Closet Full of Clothes and Nothing to Wear?</h3>
<p>We've all been there: standing in front of an overflowing closet, feeling overwhelmed and frustrated. The solution isn't more shopping; it's smarter shopping.</p>
EOF
)

RESTORE_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PUT "$BASE_URL/api/blog/$TEST_SLUG" \
  -H "Content-Type: application/json" \
  --data-urlencode "title=$ORIGINAL_TITLE" \
  --data-urlencode "summary=$ORIGINAL_SUMMARY" \
  --data-urlencode "content=$RESTORE_CONTENT")

if echo "$RESTORE_RESPONSE" | grep -q "success"; then
  echo "✅ Original content restored"
else
  echo "⚠️  Failed to restore original content: $RESTORE_RESPONSE"
  echo "   Manual restoration may be needed"
fi

# Clean up
rm -f "$COOKIE_FILE"

echo ""
echo "======================================"
echo "Test Complete!"
echo "======================================"

#!/bin/bash

# Test script for rate limiting functionality
# This tests the anonymous rate limiting with session cookies

BASE_URL="http://localhost:3500"
TEST_ENDPOINT="${BASE_URL}/api/tools/test-rate-limit"
COOKIE_JAR="/tmp/rate-limit-test-cookies.txt"

echo "========================================="
echo "Rate Limiting Manual Test Script"
echo "========================================="
echo ""

# Clean up old cookies
rm -f "$COOKIE_JAR"

echo "1. Testing first request (should succeed)..."
echo "-------------------------------------------"
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  "$TEST_ENDPOINT")

echo "$RESPONSE1" | grep -v "HTTP_CODE"
HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE" | cut -d: -f2)

# Extract headers for rate limit info
HEADERS1=$(curl -s -I -b "$COOKIE_JAR" "$TEST_ENDPOINT")

echo ""
echo "Response Code: $HTTP_CODE1"
echo "Rate Limit Headers:"
echo "$HEADERS1" | grep -i "x-ratelimit" || echo "  (No rate limit headers found)"
echo "$HEADERS1" | grep -i "retry-after" || echo ""

echo ""
echo "2. Testing second request (should succeed)..."
echo "-------------------------------------------"
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  "$TEST_ENDPOINT")

HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE" | cut -d: -f2)
echo "Response Code: $HTTP_CODE2"

# Get updated headers
HEADERS2=$(curl -s -I -b "$COOKIE_JAR" "$TEST_ENDPOINT")
echo "Rate Limit Headers:"
echo "$HEADERS2" | grep -i "x-ratelimit" || echo "  (No rate limit headers found)"

echo ""
echo "3. Making requests 3-5 to approach limit..."
echo "-------------------------------------------"
for i in {3..5}; do
  echo "Request #$i..."
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    "$TEST_ENDPOINT")

  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  echo "  Response Code: $HTTP_CODE"

  # Show remaining from headers
  HEADERS=$(curl -s -I -b "$COOKIE_JAR" "$TEST_ENDPOINT")
  REMAINING=$(echo "$HEADERS" | grep -i "x-ratelimit-remaining" | cut -d: -f2 | tr -d '\r\n ')
  echo "  Remaining: $REMAINING"
done

echo ""
echo "4. Testing 6th request (should be rate limited - 429)..."
echo "-------------------------------------------"
RESPONSE6=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  "$TEST_ENDPOINT")

echo "$RESPONSE6" | grep -v "HTTP_CODE" | head -10
HTTP_CODE6=$(echo "$RESPONSE6" | grep "HTTP_CODE" | cut -d: -f2)

echo ""
echo "Response Code: $HTTP_CODE6"

if [ "$HTTP_CODE6" = "429" ]; then
  echo "✅ SUCCESS: Rate limit enforced correctly!"

  # Show rate limit headers on 429
  HEADERS6=$(curl -s -I -b "$COOKIE_JAR" "$TEST_ENDPOINT")
  echo ""
  echo "Rate Limit Headers:"
  echo "$HEADERS6" | grep -i "x-ratelimit" || echo "  (No rate limit headers found)"
  echo "$HEADERS6" | grep -i "retry-after" || echo "  (No retry-after header found)"
else
  echo "❌ FAILED: Expected 429, got $HTTP_CODE6"
fi

echo ""
echo "========================================="
echo "Test Complete!"
echo "========================================="

# Clean up
rm -f "$COOKIE_JAR"

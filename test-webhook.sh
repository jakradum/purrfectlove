#!/bin/bash

# Test script for contact message webhook
# Usage: ./test-webhook.sh [url]
# Example: ./test-webhook.sh http://localhost:3000

URL="${1:-http://localhost:3000}"

echo "Testing webhook endpoint at: $URL/api/webhooks/contact-message"
echo ""

curl -X POST "$URL/api/webhooks/contact-message" \
  -H "Content-Type: application/json" \
  -d '{
    "_type": "contactMessage",
    "_id": "test-123",
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message from the webhook test script.\n\nIt includes multiple lines to test formatting.",
    "locale": "en",
    "submittedAt": "'"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"'"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "Check your email inbox for the notification!"
echo "Also check the console logs for any errors."

#!/bin/bash

# GetMait Chat Webhook Test Script
# Dette script tester n8n webhook'en med mock data

echo "🍕 GetMait Chat Webhook Tester"
echo "================================"
echo ""

WEBHOOK_URL="https://n8n.getmait.dk/webhook/getmait-chat"

# Først skal vi finde en gyldig store_id fra Supabase
echo "📊 Henter store data fra Supabase..."

SUPABASE_URL="https://supabase.getmait.dk"
SUPABASE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDI4NjgwMCwiZXhwIjo0OTI1OTYwNDAwLCJyb2xlIjoiYW5vbiJ9.Lshy9-QNUcZhFol6_zI6yinhWak7nmkd03rMs94-viE"

# Hent første åbne store
STORE_DATA=$(curl -s "${SUPABASE_URL}/rest/v1/stores?is_open=eq.true&select=id,name,slug&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

STORE_ID=$(echo $STORE_DATA | jq -r '.[0].id // empty')
STORE_NAME=$(echo $STORE_DATA | jq -r '.[0].name // empty')
STORE_SLUG=$(echo $STORE_DATA | jq -r '.[0].slug // empty')

if [ -z "$STORE_ID" ]; then
  echo "❌ Kunne ikke finde nogen åbne stores i Supabase"
  echo "   Tjek at stores.is_open = true"
  exit 1
fi

echo "✅ Fandt store:"
echo "   Navn: $STORE_NAME"
echo "   Slug: $STORE_SLUG"
echo "   ID: $STORE_ID"
echo ""

# Test webhook
echo "🚀 Sender test besked til webhook..."
echo "   URL: $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Jeg vil gerne have en Margherita pizza\",
    \"store_id\": \"$STORE_ID\",
    \"store_name\": \"$STORE_NAME\",
    \"source\": \"test_script\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Response:"
echo "   HTTP Status: $HTTP_CODE"
echo ""
echo "   Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ SUCCESS! Webhook fungerer!"
else
  echo "❌ FEJL! Webhook returnerede HTTP $HTTP_CODE"
  echo ""
  echo "Troubleshooting:"
  echo "1. Er n8n workflow'et aktiveret?"
  echo "2. Tjek n8n execution logs"
  echo "3. Verificer webhook path: /webhook/getmait-chat"
fi

echo ""
echo "🔗 Åbn n8n for at se execution:"
echo "   http://n8n-c4kk4ow4wwgcwg88ss8g4ss4.46.224.239.43.sslip.io"

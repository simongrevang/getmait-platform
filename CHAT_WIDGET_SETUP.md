# GetMait AI Chat Widget - Setup Guide

## 📋 Oversigt

GetMait AI Chat Widget er en multi-tenant React-komponent, der fungerer som en autonom AI-tjener til pizzariaer. Widgetten tilpasser sig automatisk til hvert subdomain og henter branding fra Supabase.

## ✨ Features

- ✅ **Multi-tenant** - Automatisk subdomain detection
- ✅ **Dynamic branding** - Henter farver, navn og telefonnummer fra Supabase
- ✅ **n8n integration** - Sender beskeder med `store_id` til workflow
- ✅ **Responsive design** - Fungerer på mobil og desktop
- ✅ **"Mait" personlighed** - Uformel og hjælpsom tone
- ✅ **Kontaktbar** - Ring, SMS og Chat-funktioner

## 🚀 Installation

### 1. Environment Variables

Tilføj til din `.env` fil:

```env
VITE_SUPABASE_URL=https://supabase.getmait.dk
VITE_SUPABASE_ANON_KEY=din-supabase-anon-key
VITE_N8N_CHAT_WEBHOOK=https://din-n8n-url.dk/webhook/getmait-chat
```

### 2. Komponenten er allerede integreret

ChatWidget er allerede tilføjet til `App.jsx` og vil automatisk vises på alle sider.

### 3. Test lokalt

```bash
npm run dev
```

Åbn `http://localhost:3000?store=napoli-esbjerg` for at teste med en specifik butik.

## 🔧 Multi-tenant Logik

### Hostname Detection

Widgetten læser `window.location.hostname` og ekstraher slug'en:

| URL | Slug | Handling |
|-----|------|----------|
| `napoli.getmait.dk` | `napoli` | Henter "napoli" fra Supabase |
| `bella-aarhus.getmait.dk` | `bella-aarhus` | Henter "bella-aarhus" fra Supabase |
| `localhost:3000?store=napoli` | `napoli` | Development mode |

### Supabase Lookup

Widgetten sender et REST API kald til:

```
GET /rest/v1/stores?slug=eq.{slug}&select=id,name,primary_color,contact_phone,location&active=eq.true
```

**Headers:**
```json
{
  "apikey": "VITE_SUPABASE_ANON_KEY",
  "Authorization": "Bearer VITE_SUPABASE_ANON_KEY",
  "Content-Type": "application/json"
}
```

### Branding

Widgetten bruger følgende felter fra Supabase:

- `name` - Restaurantens navn (vises i header og velkomst)
- `primary_color` - Hovedfarve (knapper, header)
- `contact_phone` - Telefonnummer (Ring/SMS knapper)
- `location` - By/område (vises under navn)
- `id` - Store ID (sendes til n8n)

## 🔗 N8n Integration

### Webhook Payload

Når en besked sendes, sender widgetten følgende JSON til n8n:

```json
{
  "message": "Jeg vil gerne bestille en Margherita",
  "store_id": "uuid-fra-supabase",
  "store_name": "Napoli Pizza",
  "source": "web_chat",
  "timestamp": "2026-02-11T15:30:00.000Z"
}
```

### N8n Workflow Opsætning

#### 1. Opret Webhook Node

1. Åbn n8n og opret et nyt workflow
2. Tilføj en **Webhook** node
3. Konfigurer:
   - **HTTP Method:** POST
   - **Path:** `getmait-chat`
   - **Authentication:** None (eller Basic Auth hvis ønsket)
   - **Response Mode:** Respond When Last Node Finishes

#### 2. Hent Menukort fra Supabase

Tilføj en **Supabase** node (eller HTTP Request):

```javascript
// Supabase Query
GET /rest/v1/menu?store_id=eq.{{$json.store_id}}&tilgaengelig=eq.true
```

Dette henter menuen for den specifikke restaurant baseret på `store_id`.

#### 3. Send til AI (OpenAI/Anthropic)

Tilføj en **OpenAI** eller **Anthropic** node:

**System Prompt:**
```
Du er "Mait" - en uformel, hjælpsom AI-tjener for {{$json.store_name}}.

Din opgave:
1. Forstå kundens bestilling
2. Find retter fra menuen (vedlagt som JSON)
3. Bekræft priser og detaljer
4. Spørg om leveringsadresse hvis relevant

Tone: Venlig, uformel, dansk slang. Brug "Mait" i stedet for "du".

Menu:
{{$json.menu}}
```

**User Message:**
```
{{$json.message}}
```

#### 4. Returner Svar

Tilføj en **Respond to Webhook** node:

```json
{
  "output": "{{$json.ai_response}}",
  "store_id": "{{$json.store_id}}",
  "timestamp": "{{$now}}"
}
```

### Eksempel N8n Workflow (JSON)

```json
{
  "name": "GetMait Chat Handler",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "getmait-chat",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "={{$env.SUPABASE_URL}}/rest/v1/menu",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "store_id",
              "value": "=eq.{{$json.store_id}}"
            },
            {
              "name": "tilgaengelig",
              "value": "eq.true"
            }
          ]
        }
      },
      "name": "Fetch Menu from Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Du er Mait - en hjælpsom AI-tjener. Menu: {{$json.menu}}"
            },
            {
              "role": "user",
              "content": "={{$node.Webhook.json.message}}"
            }
          ]
        }
      },
      "name": "OpenAI",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "position": [650, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": {
          "output": "={{$json.choices[0].message.content}}",
          "store_id": "={{$node.Webhook.json.store_id}}"
        }
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Fetch Menu from Supabase", "type": "main", "index": 0 }]]
    },
    "Fetch Menu from Supabase": {
      "main": [[{ "node": "OpenAI", "type": "main", "index": 0 }]]
    },
    "OpenAI": {
      "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
    }
  }
}
```

## 🎨 Styling & Branding

### Custom Colors

Widgetten bruger automatisk `primary_color` fra Supabase:

```javascript
// Header baggrund
style={{ backgroundColor: store.primary_color }}

// Send knap
style={{ backgroundColor: store.primary_color }}
```

### Tone of Voice

Widgetten er designet med "Mait" personligheden:

- ✅ **Uformel:** "Hvad drømmer din mave om i dag, Mait?"
- ✅ **Hjælpsom:** "Jeg er klar til at hjælpe dig"
- ✅ **Personlig:** Bruger restaurantens navn i velkomsten

## 🧪 Testing

### Localhost Testing

```bash
# Start dev server
npm run dev

# Test med specifik butik
open http://localhost:3000?store=napoli-esbjerg
```

### Subdomain Testing

1. Tilføj til `/etc/hosts`:
   ```
   127.0.0.1 napoli.localhost
   127.0.0.1 bella.localhost
   ```

2. Åbn `http://napoli.localhost:3000`

### Production Testing

Deploy til Vercel/Netlify med wildcard domain (`*.getmait.dk`).

## 🐛 Fejlhåndtering

### Store ikke fundet

Hvis slug'en ikke findes i Supabase, viser widgetten:

```
❌ Kunne ikke indlæse chat
Kunne ikke finde restaurant med slug: napoli
```

### N8n webhook fejler

Hvis n8n ikke svarer, viser widgetten:

```
Hov, Mait! Jeg mistede forbindelsen til ovnen.
Prøv venligst igen eller giv os et kald på 12345678
```

### Loading State

Mens store data hentes:

```
⏳ Indlæser GetMait...
```

## 📊 Analytics & Logging

### Console Logs

Widgetten logger til konsollen:

```javascript
console.log('[GetMait Widget] Detected slug:', slug);
console.error('[GetMait Widget] Error fetching store:', error);
console.error('[GetMait Widget] Error sending message:', error);
```

### Tracking Events

Tilføj tracking i `handleSendMessage`:

```javascript
// Google Analytics
gtag('event', 'chat_message_sent', {
  store_id: store.id,
  store_name: store.name
});

// Amplitude, Mixpanel, etc.
```

## 🔐 Sikkerhed

### Environment Variables

- ✅ **Aldrig commit .env filer** til Git
- ✅ **Brug VITE_ prefix** for client-side variables
- ✅ **Supabase Row Level Security** skal være aktiveret

### Supabase RLS Policies

Sørg for at `stores` tabel har en read policy:

```sql
-- Allow read access to active stores
CREATE POLICY "Enable read access for active stores"
ON stores FOR SELECT
USING (active = true);
```

## 📝 Deployment Checklist

- [ ] Environment variables sat i Vercel/Netlify
- [ ] n8n webhook URL konfigureret
- [ ] Wildcard domain (`*.getmait.dk`) sat op
- [ ] Supabase RLS policies aktiveret
- [ ] Test på mindst 2 subdomains
- [ ] Test kontaktknapper (Ring/SMS)
- [ ] Verificer branding (farver, navn)

## 🤝 Support

Kontakt support@getmait.dk for hjælp med:

- Opsætning af n8n workflows
- Supabase konfiguration
- Multi-tenant troubleshooting

---

**Powered by GetMait.dk - Professional Automation** 🍕✨

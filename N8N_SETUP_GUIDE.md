# N8n GetMait Chat Webhook - Setup Guide

## 🎯 Oversigt

Denne guide hjælper dig med at opsætte n8n webhook'en til GetMait chat widgetten.

**Din n8n URL:** `http://n8n-c4kk4ow4wwgcwg88ss8g4ss4.46.224.239.43.sslip.io`

---

## 📋 Hurtig Start (5 minutter)

### 1. Åbn n8n

```bash
# Åbn i browser:
open http://n8n-c4kk4ow4wwgcwg88ss8g4ss4.46.224.239.43.sslip.io
```

### 2. Importer Workflow

1. Klik på **"+"** (New Workflow) i toppen
2. Klik på **"⋮"** (tre prikker) → **"Import from File"**
3. Vælg filen: `/root/getmait-platform/n8n-getmait-chat-workflow.json`
4. Klik **"Import"**

### 3. Konfigurer Supabase Credentials

1. Klik på **"Fetch Menu from Supabase"** noden
2. Under "Credentials", klik **"Create New"**
3. Vælg **"Supabase API"**
4. Indtast:
   - **Host:** `supabase.getmait.dk`
   - **Service Role Secret:** (find i Supabase dashboard under API settings)
5. Klik **"Save"**

### 4. Aktiver Workflow

1. Klik på **"Inactive"** switch i toppen → Skift til **"Active"**
2. Klik på **"Webhook - GetMait Chat"** noden
3. Kopier **Webhook URL** (vil se sådan ud):
   ```
   http://n8n-c4kk4ow4wwgcwg88ss8g4ss4.46.224.239.43.sslip.io/webhook/getmait-chat
   ```

### 5. Opdater .env

```bash
cd /root/getmait-platform

# Rediger .env og tilføj webhook URL
nano .env
```

Tilføj/opdater:
```env
VITE_N8N_CHAT_WEBHOOK=http://n8n-c4kk4ow4wwgcwg88ss8g4ss4.46.224.239.43.sslip.io/webhook/getmait-chat
```

Gem med `Ctrl+O` → `Enter` → `Ctrl+X`

### 6. Test!

```bash
# Start dev server
npm run dev

# Åbn i browser
open http://localhost:3000?store=napoli-esbjerg

# Test chat widgetten
```

---

## 🔍 Workflow Forklaring

### Node 1: Webhook - GetMait Chat
**Type:** Webhook Trigger
**Path:** `/webhook/getmait-chat`

Modtager POST requests fra chat widgetten med:
```json
{
  "message": "Jeg vil gerne have en Margherita",
  "store_id": "uuid-fra-supabase",
  "store_name": "Napoli Pizza",
  "source": "web_chat",
  "timestamp": "2026-02-11T15:30:00Z"
}
```

### Node 2: Fetch Menu from Supabase
**Type:** HTTP Request
**Method:** GET

Henter menuen fra Supabase baseret på `store_id`:
```
GET /rest/v1/menu?store_id=eq.{store_id}&tilgaengelig=eq.true
```

Returnerer:
```json
[
  {
    "id": "uuid",
    "navn": "Margherita",
    "pris": 70,
    "beskrivelse": "Klassisk med tomat og mozzarella",
    "kategori": "pizza"
  }
]
```

### Node 3: Prepare AI Context
**Type:** Set (Data transformation)

Sammensætter data til AI:
- `menu_json` - Menu som JSON string
- `user_message` - Brugerens besked
- `store_name` - Restaurantens navn
- `store_id` - Store ID

### Node 4: Simple Response (TEST)
**Type:** Set
**⚠️ MIDLERTIDIG NODE**

Genererer et simpelt test-svar uden AI.

**DU SKAL ERSTATTE DENNE** med en AI node (se næste sektion).

### Node 5: Respond to Webhook
**Type:** Respond to Webhook

Sender svar tilbage til chat widgetten:
```json
{
  "output": "AI's svar her",
  "store_id": "uuid",
  "timestamp": "2026-02-11T15:30:00Z"
}
```

---

## 🤖 Tilføj AI (OpenAI/Anthropic)

### Option A: OpenAI (Anbefalet)

1. **Slet** "Simple Response (TEST)" noden
2. Tilføj **"OpenAI Chat Model"** node
3. Konfigurer:
   - **Resource:** Chat
   - **Operation:** Message
   - **Model:** `gpt-4` eller `gpt-4-turbo`
   - **Messages:**
     - **System:**
       ```
       Du er "Mait" - en uformel, hjælpsom AI-tjener for {{ $json.store_name }}.

       Din opgave:
       1. Forstå kundens bestilling
       2. Find retter fra menuen (vedlagt som JSON)
       3. Bekræft priser og detaljer
       4. Saml bestillingen

       Tone: Venlig, uformel, dansk. Brug "Mait" i stedet for "du".

       Menu:
       {{ $json.menu_json }}
       ```
     - **User:**
       ```
       {{ $json.user_message }}
       ```
4. Forbind **Prepare AI Context** → **OpenAI** → **Respond to Webhook**
5. Gem og aktiver workflow

### Option B: Anthropic Claude

1. **Slet** "Simple Response (TEST)" noden
2. Tilføj **"Anthropic"** node
3. Konfigurer:
   - **Resource:** Message
   - **Model:** `claude-3-5-sonnet-20241022`
   - **Prompt:**
     ```
     <system>
     Du er "Mait" - en uformel AI-tjener for {{ $json.store_name }}.

     Menu (JSON):
     {{ $json.menu_json }}
     </system>

     <user>
     {{ $json.user_message }}
     </user>
     ```
4. Forbind **Prepare AI Context** → **Anthropic** → **Respond to Webhook**
5. Gem og aktiver workflow

---

## 🧪 Test Workflow

### Test i n8n (Manuelt)

1. Åbn workflow i n8n
2. Klik på **"Webhook - GetMait Chat"** noden
3. Klik **"Listen for Test Event"**
4. Send test request:

```bash
curl -X POST http://n8n-c4kk4ow4wwgcwg88ss8g4ss4.46.224.239.43.sslip.io/webhook-test/getmait-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Jeg vil gerne have en Margherita",
    "store_id": "find-uuid-i-supabase",
    "store_name": "Napoli Pizza",
    "source": "test"
  }'
```

5. Se output i n8n execution log

### Test fra Chat Widget

1. Start dev server: `npm run dev`
2. Åbn `http://localhost:3000?store=napoli-esbjerg`
3. Klik på chat-knappen
4. Send en besked: "Jeg vil gerne bestille en pizza"
5. Se svar i chatten

---

## 🔧 Troubleshooting

### Fejl: "Could not connect to Supabase"

**Årsag:** Forkerte Supabase credentials

**Fix:**
1. Åbn Supabase dashboard
2. Gå til **Settings** → **API**
3. Kopier **URL** og **service_role key** (IKKE anon key!)
4. Opdater credentials i n8n

### Fejl: "Menu not found"

**Årsag:** Ingen menu items for den pågældende `store_id`

**Fix:**
```sql
-- Check at menu items eksisterer
SELECT * FROM menu WHERE store_id = 'din-store-id';

-- Hvis tom, tilføj demo data
INSERT INTO menu (store_id, navn, pris, beskrivelse, kategori, tilgaengelig)
VALUES
  ('din-store-id', 'Margherita', 70, 'Klassisk pizza', 'pizza', true),
  ('din-store-id', 'Vesuvio', 75, 'Med skinke', 'pizza', true);
```

### Fejl: "Webhook timeout"

**Årsag:** n8n svarer ikke inden for 30 sekunder

**Fix:**
1. Tjek at workflow er **Active**
2. Tjek n8n execution logs for fejl
3. Test webhook manuelt (se "Test Workflow" sektion)

### Chat widgetten viser ingen svar

**Debug:**
1. Åbn browser console (F12)
2. Se efter fejl fra `[GetMait Widget]`
3. Tjek at `VITE_N8N_CHAT_WEBHOOK` er sat korrekt
4. Verificer at webhook URL'en er tilgængelig:
   ```bash
   curl -X POST http://din-webhook-url/webhook/getmait-chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```

---

## 📊 Monitoring & Logs

### N8n Execution Logs

1. Åbn n8n dashboard
2. Gå til **Executions** i sidebar
3. Se alle webhook requests og deres output
4. Klik på en execution for at se detaljer

### Widget Console Logs

Åbn browser console og se:
```
[GetMait Widget] Detected slug: napoli
[GetMait Widget] Sending message to n8n...
```

### Supabase Logs

1. Åbn Supabase dashboard
2. Gå til **Logs**
3. Filtrer på `menu` table
4. Se alle API requests

---

## 🚀 Production Deployment

### Sørg for at:

- [ ] Webhook er sat til **Production mode** i n8n
- [ ] Webhook URL bruger HTTPS (ikke HTTP)
- [ ] Supabase credentials er service_role (ikke anon)
- [ ] AI credentials (OpenAI/Anthropic) er konfigureret
- [ ] Environment variable `VITE_N8N_CHAT_WEBHOOK` er sat i production
- [ ] Test på mindst 2 forskellige stores

### Sikkerhed

**⚠️ VIGTIGT:**
- Webhook'en modtager data fra klienten - **valider altid input**
- Brug rate limiting på webhook'en
- Log alle requests til monitoring
- Krypter følsomme data (telefonnumre, adresser)

---

## 💡 Næste Skridt

### Forbedringer du kan tilføje:

1. **Order Management**
   - Gem ordre i Supabase `orders` tabel
   - Send bekræftelses-email/SMS

2. **Payment Integration**
   - Tilføj Stripe/MobilePay node
   - Håndter betalinger i workflow

3. **Advanced AI**
   - Fine-tune prompts for bedre forståelse
   - Tilføj conversation history
   - Multi-language support

4. **Analytics**
   - Track order conversion rate
   - Log populære retter
   - Send til Google Analytics

---

## 📞 Support

Problemer? Kontakt:
- Email: support@getmait.dk
- n8n Community: https://community.n8n.io

---

**Lavet med ❤️ af GetMait.dk - Professional Automation**

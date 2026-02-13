# n8n Workflow: Supabase Chat-historik (erstatter Simple Memory)

## Oversigt

Denne guide beskriver præcist hvordan du ændrer det eksisterende n8n workflow
"Webhook (Widget AI bot)" til at bruge Supabase-baseret chat-historik i stedet
for n8n's Simple Memory node.

### Fordele
- Persistent historik (overlever n8n restart)
- Delt på tværs af enheder (session_id er stabil)
- GDPR-venlig sletning per session
- Historik kan inspiceres i Supabase dashboard

---

## Forudsætning

Kør migrationen `migrations/001_create_chat_messages.sql` i Supabase SQL Editor
**før** du ændrer workflow'et.

---

## Nuværende workflow (FØR)

```
Webhook Trigger
  → Edit Fields (sætter sessionId)
    → Fetch Menu (Supabase)
      → Prepare AI Context
        → AI Agent (med Simple Memory sub-node)
          → Respond to Webhook
```

## Nyt workflow (EFTER)

```
Webhook Trigger
  → Edit Fields (sætter sessionId)        [BEHOLD - ingen ændring]
    → Fetch Chat History (Supabase)        [NY NODE]
      → Format History (Code node)         [NY NODE]
        → Fetch Menu (Supabase)            [BEHOLD - ingen ændring]
          → Prepare AI Context             [ÆNDRET - tilføj history felt]
            → AI Agent (UDEN Simple Memory) [ÆNDRET - fjern sub-node]
              → Save User Message          [NY NODE]
                → Save Assistant Message   [NY NODE]
                  → Respond to Webhook     [BEHOLD - ingen ændring]
```

---

## Node-for-node konfiguration

### Node 1: Fetch Chat History (NY)

**Type:** Supabase → Select Rows

| Felt | Værdi |
|---|---|
| **Credential** | Din eksisterende Supabase credential (service_role) |
| **Table** | `chat_messages` |
| **Filters** | `session_id` equals `{{ $json.sessionId }}` |
| **Order By** | `created_at` DESC |
| **Limit** | `10` |
| **Return All** | false |

**Placering:** Sæt den efter "Edit Fields" noden.

**Fejlhåndtering:** Under "Settings" → "On Error" → vælg **"Continue"**.
Hvis Supabase er nede, returnerer noden et tomt array og AI Agent svarer uden historik.

---

### Node 2: Format History (NY)

**Type:** Code (JavaScript)

**JavaScript:**
```javascript
// Hent chat-historik (kan være tom)
const rows = $input.all();

// Hvis ingen historik, returner tom streng
if (!rows || rows.length === 0) {
  return [{ json: { history: '', sessionId: $('Edit Fields').item.json.sessionId } }];
}

// Sortér ældste først (vi hentede DESC, vender om)
const sorted = [...rows].reverse();

// Formatér til tekst AI Agent kan forstå
const history = sorted
  .map(row => {
    const r = row.json;
    const label = r.role === 'user' ? 'Kunde' : 'Mait';
    return `${label}: ${r.content}`;
  })
  .join('\n');

return [{ json: { history, sessionId: $('Edit Fields').item.json.sessionId } }];
```

**Placering:** Efter "Fetch Chat History".

---

### Node 3: Prepare AI Context (ÆNDRET)

Tilføj et nyt felt:

| Felt | Expression |
|---|---|
| `history` | `{{ $json.history }}` |

De eksisterende felter (`menu_json`, `user_message`, `store_name`, `store_id`) beholdes.

---

### Node 4: AI Agent (ÆNDRET)

**Ændring 1:** Fjern "Simple Memory" sub-noden helt (højreklik → Delete).

**Ændring 2:** Opdater System Prompt til at inkludere historik:

```
Du er "Mait" – en uformel, venlig AI-tjener for {{ $json.store_name }}.

Din opgave:
1. Forstå kundens bestilling ud fra menuen
2. Bekræft priser og detaljer
3. Saml bestillingen klart
4. Hvis noget er uklart, spørg venligt

Tone: Afslappet dansk. Kald kunden "Mait". Brug korte svar.

{% if $json.history %}
Samtalehistorik (seneste beskeder):
{{ $json.history }}

Brug historikken til at fortsætte samtalen naturligt. Husk hvad kunden allerede har bestilt.
{% endif %}

Menukort (JSON):
{{ $json.menu_json }}
```

> **Bemærk:** Hvis din AI Agent bruger Anthropic Claude, kan du bruge
> ovenstående direkte. Hvis den bruger OpenAI, fungerer Jinja-syntax
> (`{% if %}`) også i n8n's expression engine.

**User Message:** `{{ $json.user_message }}` (uændret)

---

### Node 5: Save User Message (NY)

**Type:** Supabase → Insert Row

| Felt | Værdi / Expression |
|---|---|
| **Credential** | Din eksisterende Supabase credential |
| **Table** | `chat_messages` |
| **session_id** | `{{ $('Edit Fields').item.json.sessionId }}` |
| **store_id** | `{{ $('Edit Fields').item.json.store_id }}` |
| **role** | `user` |
| **content** | `{{ $('Edit Fields').item.json.message }}` |

**Placering:** Efter AI Agent.

---

### Node 6: Save Assistant Message (NY)

**Type:** Supabase → Insert Row

| Felt | Værdi / Expression |
|---|---|
| **Credential** | Din eksisterende Supabase credential |
| **Table** | `chat_messages` |
| **session_id** | `{{ $('Edit Fields').item.json.sessionId }}` |
| **store_id** | `{{ $('Edit Fields').item.json.store_id }}` |
| **role** | `assistant` |
| **content** | `{{ $json.output }}` |

**Placering:** Efter "Save User Message".

> **Bemærk:** `$json.output` refererer til AI Agent's output-felt.
> Tjek i n8n hvad feltet faktisk hedder (kan være `$json.text`
> eller `$json.response` afhængigt af AI model-node).

---

### Node 7: Respond to Webhook (UÆNDRET)

Sender stadig `output` feltet tilbage til klienten. Ingen ændring nødvendig,
men sørg for at den modtager data fra "Save Assistant Message" (eller direkte
fra AI Agent, med saves som side-branch).

**Alternativ arkitektur:** Hvis response-tid er vigtig, kan du sætte
Save User + Save Assistant som en parallel branch (ikke blocking).
Forbind AI Agent til BÅDE "Save User Message" OG "Respond to Webhook".
Save User → Save Assistant kører i baggrunden.

---

## Stabilitet

### Hvis historik-query fejler
- "Fetch Chat History" har `On Error: Continue` → returnerer tomt array
- "Format History" håndterer tomt array → `history = ''`
- AI Agent system prompt bruger `{% if %}` → historik-sektionen springes over
- **Resultat:** AI Agent svarer stadig, bare uden kontekst

### Hvis save fejler
- Sætter ikke saves som blocking (brug parallel branch)
- Kunden får stadig sit svar
- Fejlen logges i n8n execution log

### Logging
- Undgå at logge `content` felter i n8n (kan indeholde persondata)
- I n8n Settings → "Log Level" → sæt til "warn" (ikke "debug") i production
- Supabase RLS er aktiveret → anon-key kan kun indsætte, ikke slette

---

## Test

### 1. Test migrationen
```sql
-- I Supabase SQL Editor:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'chat_messages';
```

### 2. Test insert
```sql
INSERT INTO chat_messages (session_id, store_id, role, content)
VALUES ('test-session', NULL, 'user', 'Test besked');

SELECT * FROM chat_messages WHERE session_id = 'test-session';

-- Oprydning:
DELETE FROM chat_messages WHERE session_id = 'test-session';
```

### 3. Test workflow
```bash
curl -X POST https://n8n.getmait.dk/webhook/getmait-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hej Mait, hvad har I på menuen?",
    "store_id": "<NAPOLI_STORE_UUID>",
    "store_name": "Napoli Pizza",
    "source": "test",
    "sessionId": "test-session-001"
  }'
```

Send en **anden** besked med **samme** `sessionId` og verificer at AI'en husker:
```bash
curl -X POST https://n8n.getmait.dk/webhook/getmait-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Giv mig den første pizza du nævnte",
    "store_id": "<NAPOLI_STORE_UUID>",
    "store_name": "Napoli Pizza",
    "source": "test",
    "sessionId": "test-session-001"
  }'
```

### 4. Verificér i Supabase
```sql
SELECT session_id, role, content, created_at
FROM chat_messages
WHERE session_id = 'test-session-001'
ORDER BY created_at;
```

---

## GDPR oprydning

```sql
-- Slet en specifik session:
DELETE FROM chat_messages WHERE session_id = 'SESSION_ID';

-- Slet alt ældre end 90 dage:
DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '90 days';

-- Optionelt: Opret et n8n Schedule workflow der kører dagligt:
-- Trigger: Schedule (dagligt kl. 03:00)
-- Node: Supabase → Execute Query → DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '90 days'
```

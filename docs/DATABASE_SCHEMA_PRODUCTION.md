# DATABASE SCHEMA - PRODUCTION (Self-hosted Supabase)

> **KRITISK:** Dette dokument beskriver det faktiske produktionsschema på vores Coolify self-hosted Supabase instance.

## 🚨 VIGTIG REGEL: stores.id er INTEGER

**ALTID brug INTEGER for store_id i alle sammenhænge.**

### Core Princip

```
stores.id = INTEGER (auto-increment)
↓
chat_messages.store_id = INTEGER (foreign key)
menu.store_id = INTEGER (foreign key)
ordrer.store_id = INTEGER (foreign key)
```

**IKKE:**
- ❌ UUID
- ❌ TEXT
- ❌ slug
- ❌ string-UUID

**JA:**
- ✅ INTEGER
- ✅ number (TypeScript)
- ✅ int (SQL)

---

## 📊 Tabel Strukturer

### stores (Pizzaria/Restaurant)

```sql
CREATE TABLE stores (
  id                  INTEGER PRIMARY KEY,              -- Auto-increment, IKKE UUID
  slug                TEXT UNIQUE,                      -- URL-venlig identifier
  name                TEXT NOT NULL,                    -- Restaurant navn
  city                VARCHAR(100),                     -- By
  address             TEXT,                             -- Fuld adresse
  contact_phone       TEXT,                             -- Telefonnummer
  sms_phone           TEXT,                             -- SMS nummer
  primary_color       TEXT,                             -- Branding hex color
  cover_image_url     TEXT,                             -- Hero image
  cvr_number          TEXT,                             -- CVR nummer
  smiley_url          TEXT,                             -- Smiley rapport URL
  waiting_time        INTEGER DEFAULT 20,               -- Estimeret ventetid
  is_open             BOOLEAN DEFAULT true,             -- Om butikken er åben
  opening_hours       JSONB,                            -- Åbningstider struktur
  status              TEXT DEFAULT 'open',              -- Status: open/closed
  gateway_provider    TEXT DEFAULT 'quickpay',          -- Payment gateway
  gateway_api_key     TEXT,                             -- API nøgle
  gateway_merchant_id TEXT,                             -- Merchant ID
  mobilepay_number    TEXT,                             -- MobilePay nummer
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX stores_slug_key ON stores(slug);
```

**Multi-tenant identifikation:**
- Frontend: `slug` bruges i subdomain (napoli.getmait.dk)
- Backend: `id` (INTEGER) bruges til alle joins og foreign keys
- API: Konverter slug → id via lookup, brug derefter id

---

### chat_messages (AI Chat Beskeder)

```sql
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,  -- INTEGER!
  session_id  TEXT NOT NULL,                -- Unik per kunde/browser session
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,                -- Besked indhold
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_messages_session_created
  ON chat_messages(session_id, created_at DESC);
CREATE INDEX idx_chat_messages_created_at
  ON chat_messages(created_at);
```

**Session logik:**
- `session_id`: Genereres i frontend (browser sessionStorage)
- Format: `{store_id}_{timestamp}_{random}`
- Bruges til at hente chat historik for samme kunde
- `store_id`: Binder samtalen til korrekt restaurant (multi-tenant)

---

### menu (Menu Items)

```sql
CREATE TABLE menu (
  id           UUID PRIMARY KEY,
  store_id     INTEGER NOT NULL REFERENCES stores(id),  -- INTEGER!
  navn         TEXT NOT NULL,
  pris         NUMERIC(10,2) NOT NULL,
  beskrivelse  TEXT,
  kategori     TEXT NOT NULL,
  tilgaengelig BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX menu_store_id_fkey ON menu(store_id);
```

---

### ordrer (Orders)

```sql
CREATE TABLE ordrer (
  id         UUID PRIMARY KEY,
  store_id   INTEGER NOT NULL REFERENCES stores(id),  -- INTEGER!
  kunde_navn TEXT,
  total      NUMERIC(10,2),
  status     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ordrer_store_id_fkey ON ordrer(store_id);
```

---

## 🔧 Anvendelse i Kode

### TypeScript Types

```typescript
// ✅ KORREKT
interface Store {
  id: number;              // INTEGER
  slug: string;
  name: string;
  primary_color: string;
}

interface ChatMessage {
  id: string;              // UUID
  store_id: number;        // INTEGER - foreign key
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ❌ FORKERT
interface Store {
  id: string;              // NEVER UUID for stores!
}
```

### n8n Workflow (Postgres Insert)

```javascript
// ✅ KORREKT - store_id er number
{
  "store_id": {{ $json.store_id }},     // INTEGER fra webhook
  "session_id": "{{ $json.sessionId }}",
  "role": "user",
  "content": "{{ $json.message }}"
}

// ❌ FORKERT
{
  "store_id": "{{ $json.store_id }}"    // NEVER string/UUID
}
```

### SQL Queries

```sql
-- ✅ KORREKT - store_id behandles som integer
SELECT * FROM chat_messages
WHERE store_id = 1
  AND session_id = 'session_123'
ORDER BY created_at DESC;

-- ✅ KORREKT - JOIN på INTEGER
SELECT
  s.name,
  s.primary_color,
  cm.content
FROM chat_messages cm
JOIN stores s ON s.id = cm.store_id  -- INTEGER = INTEGER
WHERE cm.session_id = 'session_123';

-- ❌ FORKERT
WHERE store_id = 'uuid-string'  -- NEVER
```

### Supabase REST API

```javascript
// ✅ KORREKT
const { data } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('store_id', 1)              // number
  .eq('session_id', sessionId);

// ❌ FORKERT
.eq('store_id', 'uuid-string')    // NEVER
```

### Zod Schema

```typescript
// ✅ KORREKT
const ChatMessageSchema = z.object({
  store_id: z.number().int().positive(),     // INTEGER
  session_id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1)
});

// ❌ FORKERT
store_id: z.string().uuid()                  // NEVER
```

---

## 🏗️ Arkitektur: Multi-tenant Flow

### Frontend → Backend Flow

```
1. Browser: napoli.getmait.dk
   ↓
2. Extract slug: "napoli"
   ↓
3. Lookup: SELECT id FROM stores WHERE slug = 'napoli'
   → Returns: id = 1 (INTEGER)
   ↓
4. Store i state: storeId = 1
   ↓
5. Send til n8n webhook:
   {
     "message": "Jeg vil gerne bestille",
     "store_id": 1,           ← INTEGER
     "store_name": "Napoli",
     "session_id": "1_1234567890_abc123"
   }
   ↓
6. n8n insert til chat_messages:
   INSERT INTO chat_messages (store_id, session_id, role, content)
   VALUES (1, 'session_123', 'user', 'Jeg vil gerne bestille');
```

### Session Management

```javascript
// Frontend: ChatWidget.jsx
const sessionId = sessionStorage.getItem(`getmait_session_${store.id}`);
if (!sessionId) {
  sessionId = `${store.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(`getmait_session_${store.id}`, sessionId);
}

// Format: "1_1739456789_a1b2c3d4e"
//         └─┘ └─────────┘ └───────┘
//         │   timestamp   random
//         store_id (INTEGER)
```

---

## 🚀 Migrations

### Vigtige Regler

1. **Altid brug INTEGER for store_id**
   ```sql
   -- ✅ KORREKT
   store_id INTEGER NOT NULL REFERENCES stores(id)

   -- ❌ FORKERT
   store_id UUID NOT NULL REFERENCES stores(id)
   ```

2. **Kør migrations direkte mod database**
   ```bash
   docker exec -i supabase-db-rc48cws80w4wsgkk8okooc8o \
     psql -U supabase_admin -d postgres < migration.sql
   ```

3. **Verificer altid med \d**
   ```bash
   docker exec supabase-db-rc48cws80w4wsgkk8okooc8o \
     psql -U supabase_admin -d postgres -c "\d table_name"
   ```

---

## 📝 Checklist: Før du Committer Kode

- [ ] `store_id` er deklareret som `number` / `INTEGER` (ikke UUID/string)
- [ ] Alle foreign keys peger på `stores(id)` som INTEGER
- [ ] TypeScript types bruger `number` for store_id
- [ ] SQL queries joiner på INTEGER
- [ ] n8n inserts sender store_id som tal (ikke string)
- [ ] Zod schemas validerer store_id som z.number()
- [ ] Ingen UUID behandling af store_id
- [ ] Session_id er TEXT (det er OK)

---

## 🔍 Troubleshooting

### Fejl: Type mismatch i foreign key

```
ERROR: foreign key constraint cannot be implemented
DETAIL: Key columns "store_id" and "id" are of incompatible types: uuid and integer.
```

**Løsning:** Skift `store_id UUID` til `store_id INTEGER`

### Fejl: n8n insert fejler

```
ERROR: invalid input syntax for type integer: "uuid-string"
```

**Løsning:** Fjern quotes omkring store_id i n8n insert node

---

## 📍 Database Connection

**Container:** `supabase-db-rc48cws80w4wsgkk8okooc8o`

**Credentials:**
```bash
Host: supabase-db-rc48cws80w4wsgkk8okooc8o
Port: 5432
Database: postgres
User: supabase_admin
Password: [se Coolify secrets]
```

**Quick commands:**
```bash
# Verify table
docker exec supabase-db-rc48cws80w4wsgkk8okooc8o \
  psql -U supabase_admin -d postgres -c "\d chat_messages"

# Check stores.id type
docker exec supabase-db-rc48cws80w4wsgkk8okooc8o \
  psql -U supabase_admin -d postgres -c "\d stores"
```

---

## ⚠️ Hvis du Finder Outdated Kode

Hvis du ser kode der bruger UUID for `store_id`:
1. Det er **outdated**
2. Ret det til **INTEGER**
3. Antag altid at **produktionen er korrekt** (INTEGER)
4. Opdater denne dokumentation hvis strukturen ændres

---

**Sidst opdateret:** 13. Februar 2026
**Gældende for:** Coolify self-hosted Supabase (supabase.getmait.dk)
**Miljø:** Production

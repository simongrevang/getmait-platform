# Skalering til Nye Pizzariaer

Dette dokument forklarer hvordan du nemt kan tilføje nye pizzariaer til Getmait platformen.

## 🎯 Oversigt

Getmait platformen er designet som en **multi-tenant løsning**, hvor:

1. Hver pizzaria får sit eget **subdomain** (fx `napoli-esbjerg.getmait.dk`)
2. Data hentes dynamisk fra **Supabase database**
3. Branding og menu er **unik for hver pizzaria**

## 📝 Step-by-Step Guide

### 1. Opret ny butik i databasen

Log ind på din Supabase dashboard og kør følgende SQL:

```sql
-- Indsæt ny pizzaria
INSERT INTO stores (
  slug,              -- URL-venlig identifier (bruges i subdomain)
  name,              -- Pizzaria navn
  location,          -- By/område
  contact_phone,     -- Telefonnummer
  address,           -- Fuld adresse
  primary_color,     -- Branding farve (hex)
  waiting_time,      -- Estimeret ventetid i minutter
  cover_image_url,   -- URL til hero billede
  cvr_number         -- CVR nummer
)
VALUES (
  'bella-aarhus',                    -- Slug (vigtigt: skal være unikt!)
  'Bella Pizza',                      -- Navn
  'Aarhus',                          -- By
  '87 12 34 56',                     -- Telefon
  'Hovedgaden 123, 8000 Aarhus C',  -- Adresse
  '#dc2626',                         -- Rød farve
  25,                                -- 25 minutters ventetid
  'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca', -- Billede
  '87654321'                         -- CVR
);
```

### 2. Hent butikkens ID

```sql
SELECT id FROM stores WHERE slug = 'bella-aarhus';
```

Noter `id` værdien - du skal bruge den i næste step.

### 3. Tilføj menu items

```sql
-- Pizza items
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, featured)
VALUES
  -- Erstat <STORE_ID> med det ID du fik i step 2
  ('<STORE_ID>', 'Margherita', 70, 'Klassisk med tomat og mozzarella', 'pizza', true),
  ('<STORE_ID>', 'Pepperoni', 75, 'Med krydret pepperoni', 'pizza', true),
  ('<STORE_ID>', 'Hawaii', 75, 'Ananas og skinke', 'pizza', false),
  ('<STORE_ID>', 'Quattro Formaggi', 85, 'Fire oste', 'pizza', true),
  ('<STORE_ID>', 'Mexicana', 80, 'Mexikansk krydret', 'pizza', false);

-- Drinks
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
VALUES
  ('<STORE_ID>', 'Coca Cola', 25, '0.5L kold sodavand', 'drinks'),
  ('<STORE_ID>', 'Fanta Orange', 25, '0.5L kold sodavand', 'drinks'),
  ('<STORE_ID>', 'Faxe Kondi', 25, '0.5L kold sodavand', 'drinks'),
  ('<STORE_ID>', 'Kildevand', 20, '0.5L kildevand', 'drinks');

-- Desserts (valgfrit)
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
VALUES
  ('<STORE_ID>', 'Ben & Jerry''s', 45, 'Iscreme', 'desserts'),
  ('<STORE_ID>', 'Tiramisu', 40, 'Italiensk dessert', 'desserts');
```

### 4. Test din nye butik

Åbn browseren og gå til:

```
http://bella-aarhus.localhost:3000  (lokalt)
https://bella-aarhus.getmait.dk     (produktion)
```

## 🎨 Customization Options

### Branding Farve

Hver pizzaria kan have sin egen branding farve:

```sql
UPDATE stores
SET primary_color = '#10b981'  -- Grøn farve
WHERE slug = 'bella-aarhus';
```

Populære farver:
- Orange: `#ea580c` (default)
- Rød: `#dc2626`
- Grøn: `#10b981`
- Blå: `#2563eb`
- Lilla: `#9333ea`

### Hero Billede

Upload et billede til en image hosting service (Unsplash, Cloudinary, etc.) og opdater:

```sql
UPDATE stores
SET cover_image_url = 'https://your-image-url.com/pizza.jpg'
WHERE slug = 'bella-aarhus';
```

Anbefalede dimensioner: **1200x1200px** (kvadratisk)

### Ventetid

Juster den estimerede ventetid:

```sql
UPDATE stores
SET waiting_time = 30  -- 30 minutter
WHERE slug = 'bella-aarhus';
```

## 📊 Menu Kategorier

Platformen understøtter følgende kategorier:

- `pizza` - Pizzaer
- `drinks` - Drikkevarer
- `desserts` - Desserter
- `sides` - Tilbehør
- `salads` - Salater

Du kan tilføje egne kategorier efter behov.

## 🌟 Featured Items

Marker populære items som "featured":

```sql
UPDATE menu_items
SET featured = true
WHERE navn IN ('Margherita', 'Pepperoni', 'Quattro Formaggi');
```

Featured items får en stjerne-ikon i UI'et.

## 🔧 Bulk Import (Mange pizzariaer)

Hvis du skal tilføje mange pizzariaer ad gangen, kan du bruge CSV import:

### 1. Opret CSV fil: `stores.csv`

```csv
slug,name,location,contact_phone,address,cvr_number
napoli-esbjerg,Napoli Pizza,Esbjerg,75158881,Tarphagevej 34,12345678
bella-aarhus,Bella Pizza,Aarhus,87123456,Hovedgaden 123,87654321
roma-odense,Roma Pizza,Odense,66112233,Vestergade 45,11223344
```

### 2. Import til Supabase

Brug Supabase Table Editor:
1. Gå til Table Editor
2. Vælg `stores` tabel
3. Klik "Insert" → "Import from CSV"
4. Upload din CSV fil

## 🚨 Vigtigt at Huske

1. **Slug skal være unikt** - Ingen to butikker kan have samme slug
2. **Slug format**: `butik-by` (lowercase, bindestreg som separator)
3. **Telefon format**: Enten `12345678` eller `12 34 56 78`
4. **Active flag**: Sæt `active = false` for at skjule en butik midlertidigt

## 📈 Eksempel: Komplet Setup

Her er et komplet eksempel på at tilføje en ny pizzaria:

```sql
-- 1. Tilføj butik
INSERT INTO stores (slug, name, location, contact_phone, address, primary_color, cvr_number)
VALUES ('milano-aalborg', 'Milano Pizza', 'Aalborg', '98 76 54 32', 'Boulevarden 1, 9000 Aalborg', '#dc2626', '99887766')
RETURNING id;

-- 2. Tilføj menu (erstat <STORE_ID> med output fra ovenstående)
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, featured) VALUES
  ('<STORE_ID>', 'Margherita', 65, 'Tomat og mozzarella', 'pizza', true),
  ('<STORE_ID>', 'Pepperoni', 70, 'Med pepperoni', 'pizza', true),
  ('<STORE_ID>', 'Hawaii', 70, 'Ananas og skinke', 'pizza', false),
  ('<STORE_ID>', 'Quattro Stagioni', 80, 'Fire årstider', 'pizza', false),
  ('<STORE_ID>', 'Coca Cola', 25, '0.5L', 'drinks', false),
  ('<STORE_ID>', 'Fanta', 25, '0.5L', 'drinks', false);

-- 3. Verificer
SELECT
  s.name,
  s.slug,
  COUNT(m.id) as menu_items
FROM stores s
LEFT JOIN menu_items m ON s.id = m.store_id
WHERE s.slug = 'milano-aalborg'
GROUP BY s.id;
```

## 🎯 Next Steps

Efter setup:

1. Test butikken på subdomain
2. Verificer at menu vises korrekt
3. Test telefon og SMS links
4. Opdater branding hvis nødvendigt

## 📞 Support

Spørgsmål? Kontakt support@getmait.dk

-- ============================================
-- GETMAIT PLATFORM - DEMO DATA SETUP
-- ============================================
-- Dette script tilføjer demo data så du kan se landing pages

-- Slet eksisterende data (valgfrit)
-- TRUNCATE TABLE menu_items CASCADE;
-- TRUNCATE TABLE stores CASCADE;

-- ============================================
-- DEMO BUTIK 1: NAPOLI PIZZA ESBJERG
-- ============================================
INSERT INTO stores (slug, name, location, contact_phone, address, primary_color, waiting_time, cover_image_url, cvr_number, active)
VALUES (
  'napoli-esbjerg',
  'Napoli Pizza',
  'Esbjerg',
  '75 15 88 81',
  'Tarphagevej 34, 6710 Esbjerg V',
  '#ea580c',
  20,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200',
  '12345678',
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address,
  primary_color = EXCLUDED.primary_color,
  waiting_time = EXCLUDED.waiting_time,
  cover_image_url = EXCLUDED.cover_image_url,
  active = true;

-- Menu for Napoli Pizza
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, featured, active)
SELECT
  id,
  unnest(ARRAY['Margherita', 'Vesuvio', 'Roma', 'Miami', 'Quattro Stagioni', 'Pepperoni']),
  unnest(ARRAY[70, 75, 80, 85, 85, 80]),
  unnest(ARRAY[
    'Klassisk med tomat og frisk mozzarella',
    'Tomat, ost og lækker skinke',
    'Tomat, ost og krydret pepperoni',
    'Tomat, ost, møre kødstrimler og hvidløgsdressing',
    'Fire årstider med champignon, skinke, artiskok og oliven',
    'Krydret pepperoni og ekstra ost'
  ]),
  'pizza',
  unnest(ARRAY[true, true, true, false, false, false]),
  true
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

-- Drinks for Napoli
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, active)
SELECT
  id,
  unnest(ARRAY['Coca Cola', 'Fanta Orange', 'Faxe Kondi', 'Kildevand']),
  unnest(ARRAY[25, 25, 25, 20]),
  unnest(ARRAY['0.5L kold sodavand', '0.5L kold sodavand', '0.5L kold sodavand', '0.5L kildevand']),
  'drinks',
  true
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

-- ============================================
-- DEMO BUTIK 2: BELLA PIZZA AARHUS
-- ============================================
INSERT INTO stores (slug, name, location, contact_phone, address, primary_color, waiting_time, cover_image_url, cvr_number, active)
VALUES (
  'bella-aarhus',
  'Bella Pizza',
  'Aarhus',
  '87 12 34 56',
  'Hovedgaden 123, 8000 Aarhus C',
  '#dc2626',
  25,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200',
  '87654321',
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address,
  primary_color = EXCLUDED.primary_color,
  waiting_time = EXCLUDED.waiting_time,
  cover_image_url = EXCLUDED.cover_image_url,
  active = true;

-- Menu for Bella Pizza
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, featured, active)
SELECT
  id,
  unnest(ARRAY['Bella Special', 'Prosciutto', 'Carbonara', 'Vegetariana', 'Diavola']),
  unnest(ARRAY[90, 85, 80, 75, 85]),
  unnest(ARRAY[
    'Vores signatur pizza med parmaskinke og rucola',
    'Lufttørret parmaskinke og parmesan',
    'Flødesauce, bacon og æg',
    'Grøntsager og mozzarella',
    'Krydret salami og chili'
  ]),
  'pizza',
  unnest(ARRAY[true, true, false, false, true]),
  true
FROM stores WHERE slug = 'bella-aarhus'
ON CONFLICT DO NOTHING;

-- Drinks for Bella
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, active)
SELECT
  id,
  unnest(ARRAY['Coca Cola', 'Fanta', 'Sprite', 'Vand']),
  unnest(ARRAY[28, 28, 28, 22]),
  unnest(ARRAY['0.5L', '0.5L', '0.5L', '0.5L']),
  'drinks',
  true
FROM stores WHERE slug = 'bella-aarhus'
ON CONFLICT DO NOTHING;

-- ============================================
-- DEMO BUTIK 3: ROMA PIZZA ODENSE
-- ============================================
INSERT INTO stores (slug, name, location, contact_phone, address, primary_color, waiting_time, cover_image_url, cvr_number, active)
VALUES (
  'roma-odense',
  'Roma Pizza',
  'Odense',
  '66 11 22 33',
  'Vestergade 45, 5000 Odense C',
  '#10b981',
  30,
  'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=1200',
  '11223344',
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address,
  primary_color = EXCLUDED.primary_color,
  waiting_time = EXCLUDED.waiting_time,
  cover_image_url = EXCLUDED.cover_image_url,
  active = true;

-- Menu for Roma Pizza
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, featured, active)
SELECT
  id,
  unnest(ARRAY['Margherita Classica', 'Capricciosa', 'Napoletana', 'Tonno', 'Hawaii']),
  unnest(ARRAY[68, 78, 75, 82, 75]),
  unnest(ARRAY[
    'Original italiensk margherita',
    'Skinke, champignon og artiskok',
    'Ansjoser, kapers og oliven',
    'Tuna, løg og oliven',
    'Ananas og skinke'
  ]),
  'pizza',
  unnest(ARRAY[true, true, false, false, false]),
  true
FROM stores WHERE slug = 'roma-odense'
ON CONFLICT DO NOTHING;

-- Drinks for Roma
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, active)
SELECT
  id,
  unnest(ARRAY['Cola', 'Fanta', 'Vand']),
  unnest(ARRAY[24, 24, 20]),
  unnest(ARRAY['0.5L', '0.5L', '0.5L']),
  'drinks',
  true
FROM stores WHERE slug = 'roma-odense'
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICER DATA
-- ============================================
-- Check antal butikker
SELECT
  'Antal butikker:' as info,
  COUNT(*) as antal
FROM stores WHERE active = true;

-- Check menu items per butik
SELECT
  s.name as butik,
  s.slug,
  COUNT(m.id) as menu_items,
  s.primary_color as farve
FROM stores s
LEFT JOIN menu_items m ON s.id = m.store_id AND m.active = true
WHERE s.active = true
GROUP BY s.id, s.name, s.slug, s.primary_color
ORDER BY s.name;

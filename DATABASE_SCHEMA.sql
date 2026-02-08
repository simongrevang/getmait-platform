-- ============================================
-- GETMAIT PLATFORM - DATABASE SCHEMA
-- ============================================
-- Dette schema understøtter multi-tenant setup
-- hvor hver pizzaria har sin egen slug/subdomain
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STORES TABLE
-- ============================================
-- Hver pizzaria har sin egen række i denne tabel
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL, -- URL-venlig identifier (fx 'napoli-esbjerg')
  name TEXT NOT NULL, -- Pizzaria navn
  location TEXT, -- By/område
  contact_phone TEXT NOT NULL, -- Telefonnummer
  address TEXT, -- Fuld adresse
  primary_color TEXT DEFAULT '#ea580c', -- Branding farve (hex)
  waiting_time INTEGER DEFAULT 20, -- Estimeret ventetid i minutter
  cover_image_url TEXT, -- URL til hero billede
  cvr_number TEXT, -- CVR nummer
  active BOOLEAN DEFAULT true, -- Om butikken er aktiv
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for hurtigere slug lookup
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);

-- ============================================
-- MENU_ITEMS TABLE
-- ============================================
-- Menupunkter tilknyttet hver pizzaria
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  navn TEXT NOT NULL, -- Produktnavn
  pris NUMERIC(10,2) NOT NULL, -- Pris i DKK
  beskrivelse TEXT, -- Beskrivelse af produktet
  category TEXT NOT NULL, -- Kategori: 'pizza', 'drinks', 'desserts', 'sides', etc.
  featured BOOLEAN DEFAULT false, -- Om produktet er fremhævet
  image_url TEXT, -- Valgfrit produkt billede
  active BOOLEAN DEFAULT true, -- Om produktet er tilgængeligt
  sort_order INTEGER DEFAULT 0, -- Sorteringsrækkefølge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_store_id ON menu_items(store_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(active);

-- ============================================
-- EXAMPLE DATA - NAPOLI PIZZA ESBJERG
-- ============================================

-- Indsæt eksempel pizzaria
INSERT INTO stores (slug, name, location, contact_phone, address, primary_color, cvr_number)
VALUES (
  'napoli-esbjerg',
  'Napoli Pizza',
  'Esbjerg',
  '75 15 88 81',
  'Tarphagevej 34, 6710 Esbjerg V',
  '#ea580c',
  '12345678'
) ON CONFLICT (slug) DO NOTHING;

-- Indsæt eksempel menu items
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, featured)
SELECT
  id,
  'Margherita',
  70,
  'Klassisk med tomat og frisk mozzarella',
  'pizza',
  true
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category, featured)
SELECT
  id,
  'Vesuvio',
  75,
  'Tomat, ost og lækker skinke',
  'pizza',
  true
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
SELECT
  id,
  'Roma',
  80,
  'Tomat, ost og krydret pepperoni',
  'pizza'
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
SELECT
  id,
  'Miami',
  85,
  'Tomat, ost, møre kødstrimler og hvidløgsdressing',
  'pizza'
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
SELECT
  id,
  'Coca Cola',
  25,
  '0.5L kold sodavand',
  'drinks'
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
SELECT
  id,
  'Fanta Orange',
  25,
  '0.5L kold sodavand',
  'drinks'
FROM stores WHERE slug = 'napoli-esbjerg'
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - VALGFRIT
-- ============================================
-- Aktiver RLS hvis du vil have ekstra sikkerhed

-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
-- CREATE POLICY "Public stores are viewable by everyone"
--   ON stores FOR SELECT
--   USING (active = true);

-- CREATE POLICY "Public menu items are viewable by everyone"
--   ON menu_items FOR SELECT
--   USING (active = true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- QUERY EXAMPLES
-- ============================================

-- Hent alle aktive butikker
-- SELECT * FROM stores WHERE active = true;

-- Hent menu for specifik butik via slug
-- SELECT m.*
-- FROM menu_items m
-- JOIN stores s ON m.store_id = s.id
-- WHERE s.slug = 'napoli-esbjerg' AND m.active = true
-- ORDER BY m.category, m.sort_order, m.pris;

-- Tilføj ny pizzaria
-- INSERT INTO stores (slug, name, location, contact_phone, address, cvr_number)
-- VALUES ('bella-aarhus', 'Bella Pizza', 'Aarhus', '87 12 34 56', 'Hovedgaden 1, 8000 Aarhus C', '87654321');

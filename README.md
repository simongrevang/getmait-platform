# Getmait Platform - Din Pizza. Din Mait. 🍕

Modern og skalerbar platform til pizzariaer med AI-drevet bestilling.

## ✨ Features

- **Skalerbar til flere pizzariaer** - Multitenancy via subdomain/slug system
- **Dynamisk data fra Supabase** - Alt hentes fra database
- **Moderne React + Vite** - Hurtig development og build
- **Tailwind CSS** - Utility-first styling
- **Mobil-optimeret** - Responsivt design

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Konfiguration

Kopier `.env.example` til `.env`:

```bash
cp .env.example .env
```

Opdater `.env` med dine Supabase credentials:

```env
VITE_SUPABASE_URL=din-supabase-url
VITE_SUPABASE_ANON_KEY=din-supabase-anon-key
```

### 3. Development

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

### 4. Production Build

```bash
npm run build
```

Build filerne findes i `dist/` mappen.

## 📊 Database Setup

### Supabase Tabeller

#### `stores` tabel
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  contact_phone TEXT NOT NULL,
  address TEXT,
  primary_color TEXT DEFAULT '#ea580c',
  waiting_time INTEGER DEFAULT 20,
  cover_image_url TEXT,
  cvr_number TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `menu_items` tabel
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  navn TEXT NOT NULL,
  pris NUMERIC(10,2) NOT NULL,
  beskrivelse TEXT,
  category TEXT NOT NULL, -- 'pizza', 'drinks', 'desserts', etc.
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tilføj ny pizzaria

```sql
-- Indsæt ny butik
INSERT INTO stores (slug, name, location, contact_phone, address, cvr_number)
VALUES (
  'napoli-esbjerg',
  'Napoli Pizza',
  'Esbjerg',
  '75 15 88 81',
  'Tarphagevej 34, 6710 Esbjerg V',
  '12345678'
);

-- Indsæt menu items (eksempel)
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
SELECT
  id,
  'Margherita',
  70,
  'Klassisk med tomat og frisk mozzarella',
  'pizza'
FROM stores WHERE slug = 'napoli-esbjerg';
```

## 🎨 Customization

### Branding

Hver pizzaria kan have sin egen branding ved at opdatere følgende felter i `stores` tabellen:

- `primary_color` - Hovedfarve (hex color)
- `cover_image_url` - Hero billede URL
- `name` - Pizzaria navn
- `location` - By/område

### Subdomain Routing

Platformen bruger slug-baseret routing:

- `napoli-esbjerg.getmait.dk` → Viser Napoli Pizza i Esbjerg
- `bella-aarhus.getmait.dk` → Viser Bella Pizza i Aarhus
- osv.

## 📱 Deployment

### Vercel (Anbefalet)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Docker

```bash
# Build image
docker build -t getmait-platform .

# Run container
docker run -p 3000:3000 getmait-platform
```

## 🔧 Tech Stack

- **React 18** - UI Library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend & Database
- **Lucide React** - Icons

## 📝 License

© 2026 Getmait.dk - Professional Automation

## 🤝 Support

Kontakt os på support@getmait.dk for hjælp.

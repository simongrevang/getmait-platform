# Deployment Guide - Getmait Platform

## 📋 Forudsætninger

- Node.js 18+ installeret
- Supabase projekt oprettet
- GitHub konto (til Vercel/Netlify deployment)

## 🗄️ Database Setup

### 1. Opret Supabase Projekt

1. Gå til [supabase.com](https://supabase.com)
2. Opret nyt projekt
3. Noter din `Project URL` og `anon public` key

### 2. Kør Database Migrations

1. Åbn Supabase SQL Editor
2. Kør indholdet af `DATABASE_SCHEMA.sql`
3. Verificer at tabellerne er oprettet:
   - `stores`
   - `menu_items`

### 3. Tilføj din første pizzaria

```sql
-- Indsæt ny butik
INSERT INTO stores (slug, name, location, contact_phone, address, primary_color, cvr_number)
VALUES (
  'din-pizzaria-slug',
  'Din Pizzaria Navn',
  'By',
  '12345678',
  'Adresse 123, 1234 By',
  '#ea580c',
  '12345678'
);

-- Hent store_id for din butik
SELECT id FROM stores WHERE slug = 'din-pizzaria-slug';

-- Indsæt menu items
INSERT INTO menu_items (store_id, navn, pris, beskrivelse, category)
VALUES
  ('<store_id>', 'Margherita', 70, 'Klassisk pizza', 'pizza'),
  ('<store_id>', 'Vesuvio', 75, 'Med skinke', 'pizza'),
  ('<store_id>', 'Coca Cola', 25, '0.5L', 'drinks');
```

## 🚀 Deploy til Vercel (Anbefalet)

### Via Vercel Dashboard

1. Gå til [vercel.com](https://vercel.com)
2. Klik "New Project"
3. Import dit GitHub repository
4. Konfigurer Environment Variables:
   - `VITE_SUPABASE_URL`: Din Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Din Supabase anon key
5. Klik "Deploy"

### Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Tilføj environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Redeploy med nye env vars
vercel --prod
```

## 🌐 Custom Domain Setup

### Wildcard Subdomain (Multi-tenant)

For at understøtte flere pizzariaer på subdomains:

#### Vercel

1. Gå til Project Settings → Domains
2. Tilføj dit domæne: `getmait.dk`
3. Tilføj wildcard domain: `*.getmait.dk`
4. Opdater DNS med Vercel's records

#### DNS Setup (Eksempel med Cloudflare)

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

### Subdomain Routing

Hver pizzaria får sit eget subdomain:

- `napoli-esbjerg.getmait.dk` → Napoli Pizza i Esbjerg
- `bella-aarhus.getmait.dk` → Bella Pizza i Aarhus
- osv.

Slug i URL matcher `slug` i `stores` tabellen.

## 🐳 Docker Deployment (Avanceret)

### Build og kør lokalt

```bash
# Opret Dockerfile
cat > Dockerfile <<'EOF'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Opret nginx.conf
cat > nginx.conf <<'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Build image
docker build -t getmait-platform .

# Run container
docker run -p 3000:80 getmait-platform
```

### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:80"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
```

## 🔧 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase Project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon public key | `eyJ...` |

## ✅ Deployment Checklist

- [ ] Database schema kørt i Supabase
- [ ] Mindst én butik tilføjet til `stores` tabel
- [ ] Menu items tilføjet til `menu_items` tabel
- [ ] Environment variables konfigureret
- [ ] Custom domain sat op (hvis relevant)
- [ ] Wildcard subdomain konfigureret (hvis multi-tenant)
- [ ] Test deployment på subdomain

## 🐛 Troubleshooting

### Blank side efter deployment

- Tjek browser console for fejl
- Verificer at environment variables er sat korrekt
- Tjek at Supabase URL er tilgængelig

### "Kunne ikke finde pizzaria" fejl

- Tjek at `slug` i URL matcher `slug` i database
- Verificer at butikken er `active = true`
- Tjek Supabase credentials

### Menu vises ikke

- Verificer at `menu_items` er tilknyttet korrekt `store_id`
- Tjek at items er `active = true`
- Se Supabase logs for fejl

## 📞 Support

Kontakt support@getmait.dk for deployment hjælp.

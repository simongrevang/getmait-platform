# Project Structure - Getmait Platform

```
getmait-platform/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI workflow
├── src/
│   ├── lib/
│   │   └── supabase.js           # Supabase client configuration
│   ├── App.jsx                    # Main application component
│   ├── index.css                  # Global styles with Tailwind
│   └── main.jsx                   # Application entry point
├── public/                        # Static assets
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── DATABASE_SCHEMA.sql            # Complete database schema
├── DEPLOYMENT.md                  # Deployment guide
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── postcss.config.js              # PostCSS configuration
├── README.md                      # Main documentation
├── SKALERING.md                   # Scaling guide (Danish)
├── tailwind.config.js             # Tailwind CSS configuration
└── vite.config.js                 # Vite build configuration
```

## 📁 Key Files

### `/src/App.jsx`
Den primære React komponent der:
- Henter butiks- og menudata fra Supabase
- Håndterer slug-baseret routing
- Renderer hero section, menu og footer
- Implementerer kategori-filtrering

### `/src/lib/supabase.js`
Supabase client konfiguration:
- Initialiserer Supabase connection
- Eksporterer client til brug i hele app'en

### `DATABASE_SCHEMA.sql`
Komplet database schema inklusiv:
- `stores` tabel (pizzaria information)
- `menu_items` tabel (menukort)
- Indexes for performance
- Eksempel data
- Helper functions og triggers

### `DEPLOYMENT.md`
Deployment guide for:
- Vercel (anbefalet)
- Netlify
- Docker
- Custom domain setup
- Wildcard subdomain konfiguration

### `SKALERING.md`
Guide til at tilføje nye pizzariaer:
- Step-by-step SQL queries
- Bulk import eksempler
- Customization options
- Best practices

## 🎯 Data Flow

```
URL (subdomain) → App.jsx → Supabase
    ↓                ↓           ↓
bella-aarhus → Extract slug → Query stores & menu_items
                                  ↓
                            Render dynamic UI
```

## 🔑 Environment Variables

| Variable | Sted | Beskrivelse |
|----------|------|-------------|
| `VITE_SUPABASE_URL` | `.env` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` | Supabase anon key |

⚠️ **Vigtigt**: `.env` er i `.gitignore` - brug `.env.example` som template

## 🏗️ Architecture

### Multi-tenant Design

Platformen bruger **subdomain-baseret multi-tenancy**:

1. **Subdomain extraction**: `bella-aarhus.getmait.dk` → `bella-aarhus`
2. **Database lookup**: Find store med `slug = 'bella-aarhus'`
3. **Data loading**: Hent menu items for den specifikke store
4. **Dynamic rendering**: Render UI med butikkens data og branding

### Component Structure

```
App.jsx
├── Loading State
├── Error State
└── Main Layout
    ├── Navigation Bar
    │   ├── Store Name & Logo
    │   └── Contact Info + CTA
    ├── Hero Section
    │   ├── Headline
    │   ├── Description
    │   ├── Action Buttons (Call/SMS)
    │   └── Store Image + Status Badge
    ├── Menu Section
    │   ├── Category Filter Buttons
    │   ├── Menu Item Grid
    │   └── Expand/Collapse Toggle
    ├── Feature Section
    │   └── "Spørg din Mait" highlight
    └── Footer
        ├── Store Info
        └── Getmait Branding
```

## 🎨 Styling System

### Tailwind Utilities

Primære utility classes:
- `italic-caps` - Custom class for italic uppercase text
- `hero-gradient` - Custom gradient background
- Responsive prefixes: `md:`, `lg:`
- State modifiers: `hover:`, `group-hover:`

### Dynamic Styling

Branding farve injiceres dynamisk via `style` prop:

```jsx
style={{ backgroundColor: brandColor }}
```

Dette tillader hver pizzaria at have sin egen farve uden CSS overrides.

## 🔄 Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   ```

2. **Testing**
   - Test med forskellige slugs i URL
   - Verificer data loading
   - Check responsive design

3. **Build**
   ```bash
   npm run build
   ```

4. **Preview Production**
   ```bash
   npm run preview
   ```

## 📊 Performance Considerations

### Optimizations

- **Vite**: Hurtig HMR og optimeret build
- **Database indexes**: På `slug`, `store_id`, `category`, `active` felter
- **Image loading**: Lazy loading via browser native
- **Code splitting**: Automatisk via Vite

### Future Improvements

- [ ] Image optimization med CDN
- [ ] Caching strategy for store/menu data
- [ ] Loading skeletons for bedre UX
- [ ] Error boundaries for robustness

## 🧪 Testing Strategy

### Manual Testing Checklist

- [ ] Homepage loader korrekt
- [ ] Menu items vises
- [ ] Kategori filtrering virker
- [ ] Telefon og SMS links virker på mobil
- [ ] Responsivt design på alle skærm størrelser
- [ ] Branding farve anvendes korrekt
- [ ] Error states vises ved manglende data

### Future Automated Testing

```bash
# Unit tests (future)
npm test

# E2E tests (future)
npm run test:e2e
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Lucide Icons](https://lucide.dev)

## 🤝 Contributing

Se [README.md](README.md) for contribution guidelines.

## 📄 License

© 2026 Getmait.dk - Professional Automation

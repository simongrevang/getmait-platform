# Changelog

All notable changes to Getmait Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-08

### Added
- Initial release of Getmait Platform
- React + Vite setup with Tailwind CSS
- Complete Supabase integration for multi-tenant architecture
- Dynamic data loading from database
- Slug-based subdomain routing for multiple pizzerias
- Database schema with `stores` and `menu_items` tables
- Responsive design with modern UI
- Hero section with call-to-action buttons (Call/SMS)
- Dynamic menu section with category filtering
- Expandable menu view
- Featured items support with star icon
- Custom branding colors per store
- Comprehensive README with setup instructions
- Deployment guide for Vercel, Netlify, and Docker
- Scaling guide for adding new pizzerias (SKALERING.md)
- Project structure documentation
- GitHub Actions CI workflow
- Database migration script with example data
- Environment variables template (.env.example)

### Features
- **Multi-tenant Support**: Each pizzeria gets its own subdomain
- **Dynamic Branding**: Custom colors, images, and content per store
- **Mobile Optimized**: Fully responsive design
- **Fast Performance**: Optimized with Vite and Tailwind
- **Easy Scaling**: Simple SQL queries to add new stores
- **Category Filtering**: Filter menu by pizza, drinks, desserts, etc.
- **Featured Items**: Highlight popular menu items
- **Contact Integration**: Direct phone and SMS links

### Technical
- React 18 with hooks (useState, useEffect)
- Supabase JS client v2
- Tailwind CSS v3
- Vite v5 build system
- Lucide React icons
- PostCSS with autoprefixer

## [Unreleased]

### Planned Features
- [ ] Admin dashboard for store management
- [ ] Real-time menu updates
- [ ] Order tracking integration
- [ ] Analytics dashboard
- [ ] Customer reviews and ratings
- [ ] Image optimization with CDN
- [ ] Progressive Web App (PWA) support
- [ ] Multi-language support
- [ ] Opening hours display with real-time status
- [ ] Special offers and promotions section
- [ ] Email notifications for orders
- [ ] Customer loyalty program integration

### Future Improvements
- [ ] Loading skeletons for better UX
- [ ] Error boundaries
- [ ] Unit and E2E tests
- [ ] Performance monitoring
- [ ] SEO optimization
- [ ] Accessibility improvements (WCAG compliance)
- [ ] Dark mode support

---

[1.0.0]: https://github.com/simongrevang/getmait-platform/releases/tag/v1.0.0

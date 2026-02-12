-- ============================================
-- MIGRATION: Tilføj smiley_url kolonne til stores
-- ============================================
-- Dato: 2026-02-12
-- Formål: Tilføj link til Fødevarestyrelsens kontrolrapport
-- ============================================

-- Tilføj smiley_url kolonne til stores tabellen
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS smiley_url TEXT;

-- Tilføj kommentar til kolonnen
COMMENT ON COLUMN stores.smiley_url IS 'URL til Fødevarestyrelsens kontrolrapport (smiley-ordning)';

-- ============================================
-- EKSEMPEL: Opdater Napoli Pizza med kontrolrapport URL
-- ============================================
-- Udkommentér og rediger URL når du har den rigtige:
-- UPDATE stores
-- SET smiley_url = 'https://www.findsmiley.dk/...'
-- WHERE slug = 'napoli-esbjerg';

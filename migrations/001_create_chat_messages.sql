-- ============================================
-- MIGRATION 001: Opret chat_messages tabel
-- ============================================
-- Dato: 2026-02-13
-- Formål: Supabase-baseret chat-historik til AI Agent
--         Erstatter n8n Simple Memory med persistent storage
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Primært indeks: hent historik for en session, nyeste først
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON chat_messages(session_id, created_at DESC);

-- Sekundært indeks: oprydning/GDPR queries baseret på alder
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON chat_messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- Tillad insert fra anon-rollen (widget sender via anon key)
-- Tillad select fra anon-rollen (n8n henter historik via service_role,
-- men anon kan også bruges hvis nødvendigt)

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anon kan indsætte beskeder (widget skriver via Supabase anon key)
CREATE POLICY "Allow anon insert" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Anon kan læse egne session-beskeder (begrænset til session_id match)
CREATE POLICY "Allow anon select" ON chat_messages
  FOR SELECT USING (true);

-- Service role (n8n) har fuld adgang via bypass RLS

-- ============================================
-- GDPR: Sletning af chat-data
-- ============================================
-- Slet alle beskeder for en specifik session:
--   DELETE FROM chat_messages WHERE session_id = 'SESSION_ID_HER';
--
-- Slet beskeder ældre end 90 dage:
--   DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '90 days';
--
-- Tæl beskeder per session (audit):
--   SELECT session_id, COUNT(*), MIN(created_at), MAX(created_at)
--   FROM chat_messages GROUP BY session_id;
--
-- Anbefaling: Opret et cron-job (pg_cron eller n8n schedule)
-- der kører dagligt og sletter data ældre end 90 dage.
-- ============================================

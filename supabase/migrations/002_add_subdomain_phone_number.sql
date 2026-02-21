-- Add subdomain column if it doesn't exist
-- Populated from slug for existing stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'subdomain'
  ) THEN
    ALTER TABLE stores ADD COLUMN subdomain TEXT;
    UPDATE stores SET subdomain = slug WHERE subdomain IS NULL AND slug IS NOT NULL;
    CREATE UNIQUE INDEX idx_stores_subdomain ON stores(subdomain) WHERE subdomain IS NOT NULL;
  END IF;
END $$;

-- Add phone_number column if it doesn't exist
-- Populated from contact_phone for existing stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE stores ADD COLUMN phone_number TEXT;
    UPDATE stores SET phone_number = contact_phone WHERE phone_number IS NULL AND contact_phone IS NOT NULL;
  END IF;
END $$;

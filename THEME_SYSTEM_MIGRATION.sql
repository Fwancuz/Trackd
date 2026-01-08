-- Theme System Migration
-- Dodanie kolumny theme do tabeli user_settings
-- Data: 2026-01-08

-- ============================================
-- MIGRATION: Dodanie kolumny theme
-- ============================================

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'classic';

-- Dodaj constraint aby tylko pozwalać na validne wartości motywu
ALTER TABLE public.user_settings
ADD CONSTRAINT check_valid_theme 
CHECK (theme IN ('classic', 'professional', 'metal'));

-- Stwórz index dla szybszych zapytań
CREATE INDEX IF NOT EXISTS idx_user_settings_theme 
ON public.user_settings(theme);

-- Update kolumny updated_at dla istniejących rekordów
UPDATE public.user_settings 
SET updated_at = NOW() 
WHERE theme IS NULL;

-- Sprawdzenie czy migacja powiodła się
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_settings' AND column_name = 'theme';

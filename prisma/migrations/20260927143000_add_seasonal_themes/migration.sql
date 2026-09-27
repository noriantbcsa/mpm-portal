-- Temas visuales sutiles para festividades colombianas. El modo automático
-- se resuelve en la aplicación; la base de datos solo conserva la preferencia.
CREATE TYPE "SeasonalThemeMode" AS ENUM ('AUTOMATIC', 'MANUAL', 'OFF');
CREATE TYPE "SeasonalThemePreset" AS ENUM (
  'DEFAULT',
  'NEGROS_Y_BLANCOS',
  'CARNAVAL',
  'SAN_PEDRO',
  'COLOMBIA',
  'AMOR_Y_AMISTAD',
  'VELITAS',
  'NAVIDAD'
);

ALTER TABLE "SiteSettings"
  ADD COLUMN "seasonalThemeMode" "SeasonalThemeMode" NOT NULL DEFAULT 'AUTOMATIC',
  ADD COLUMN "seasonalThemePreset" "SeasonalThemePreset" NOT NULL DEFAULT 'DEFAULT';

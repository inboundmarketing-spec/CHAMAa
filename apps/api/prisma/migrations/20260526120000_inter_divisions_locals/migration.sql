-- Inter edition, divisions, match points, local guides
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "points_base" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "home_points_awarded" INTEGER;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "away_points_awarded" INTEGER;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "points_warning" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

ALTER TABLE "modalidades" ADD COLUMN IF NOT EXISTS "bracket_published" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "match_disciplines" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points_delta" INTEGER NOT NULL,
    "athlete_name" TEXT,
    "minute" INTEGER,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "match_disciplines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inter_editions" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_game_day_index" INTEGER NOT NULL DEFAULT 1,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inter_editions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inter_game_days" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL DEFAULT 'current',
    "day_index" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inter_game_days_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "atletica_divisions" (
    "id" TEXT NOT NULL,
    "atletica_id" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "atletica_divisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "accommodations" (
    "id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accommodations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "local_guide_places" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "site_url" TEXT,
    "menu_url" TEXT,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "local_guide_places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "atletica_id" TEXT,
    "campus_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "location_name" TEXT NOT NULL,
    "address" TEXT,
    "map_url" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inter_game_days_edition_id_day_index_key" ON "inter_game_days"("edition_id", "day_index");
CREATE UNIQUE INDEX IF NOT EXISTS "atletica_divisions_atletica_id_key" ON "atletica_divisions"("atletica_id");
CREATE UNIQUE INDEX IF NOT EXISTS "accommodations_campus_id_key" ON "accommodations"("campus_id");
CREATE INDEX IF NOT EXISTS "local_guide_places_type_status_idx" ON "local_guide_places"("type", "status");

ALTER TABLE "match_disciplines" DROP CONSTRAINT IF EXISTS "match_disciplines_match_id_fkey";
ALTER TABLE "match_disciplines" ADD CONSTRAINT "match_disciplines_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inter_game_days" DROP CONSTRAINT IF EXISTS "inter_game_days_edition_id_fkey";
ALTER TABLE "inter_game_days" ADD CONSTRAINT "inter_game_days_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "inter_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "atletica_divisions" DROP CONSTRAINT IF EXISTS "atletica_divisions_atletica_id_fkey";
ALTER TABLE "atletica_divisions" ADD CONSTRAINT "atletica_divisions_atletica_id_fkey" FOREIGN KEY ("atletica_id") REFERENCES "atleticas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "accommodations" DROP CONSTRAINT IF EXISTS "accommodations_campus_id_fkey";
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "challenges" DROP CONSTRAINT IF EXISTS "challenges_atletica_id_fkey";
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_atletica_id_fkey" FOREIGN KEY ("atletica_id") REFERENCES "atleticas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "challenges" DROP CONSTRAINT IF EXISTS "challenges_campus_id_fkey";
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "inter_editions" ("id", "status", "current_game_day_index", "updated_at")
VALUES ('current', 'active', 1, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Modalidade: modo de pontuação
ALTER TABLE "modalidades" ADD COLUMN IF NOT EXISTS "scoring_mode" TEXT NOT NULL DEFAULT 'versus';

UPDATE "modalidades"
SET "scoring_mode" = 'placement'
WHERE "slug" LIKE 'atletismo-%' OR "slug" LIKE 'natacao-%';

-- Partidas: times opcionais (provas com várias atléticas)
ALTER TABLE "matches" ALTER COLUMN "home_team" DROP NOT NULL;
ALTER TABLE "matches" ALTER COLUMN "away_team" DROP NOT NULL;

-- Participantes com colocação
CREATE TABLE IF NOT EXISTS "match_participants" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "placement" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "match_participants_match_id_team_key"
ON "match_participants"("match_id", "team");

ALTER TABLE "match_participants"
ADD CONSTRAINT "match_participants_match_id_fkey"
FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cronômetro ao vivo e período de jogo
ALTER TABLE "matches" ADD COLUMN "live_started_at" TIMESTAMP(3);
ALTER TABLE "matches" ADD COLUMN "game_period" TEXT;

-- Classificação geral das atléticas
CREATE TABLE "atletica_standings" (
    "id" TEXT NOT NULL,
    "atletica_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atletica_standings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "atletica_standings_atletica_id_key" ON "atletica_standings"("atletica_id");

ALTER TABLE "atletica_standings" ADD CONSTRAINT "atletica_standings_atletica_id_fkey" FOREIGN KEY ("atletica_id") REFERENCES "atleticas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

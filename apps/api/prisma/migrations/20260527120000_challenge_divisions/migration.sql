-- AlterTable
ALTER TABLE "challenges" ADD COLUMN "challenge_type" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "challenges_challenge_type_key" ON "challenges"("challenge_type");

-- CreateTable
CREATE TABLE "atletica_challenge_divisions" (
    "id" TEXT NOT NULL,
    "atletica_id" TEXT NOT NULL,
    "challenge_type" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atletica_challenge_divisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "atletica_challenge_divisions_atletica_id_challenge_type_key" ON "atletica_challenge_divisions"("atletica_id", "challenge_type");

-- AddForeignKey
ALTER TABLE "atletica_challenge_divisions" ADD CONSTRAINT "atletica_challenge_divisions_atletica_id_fkey" FOREIGN KEY ("atletica_id") REFERENCES "atleticas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

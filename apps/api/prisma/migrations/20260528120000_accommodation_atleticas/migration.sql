-- Alojamentos: múltiplas atléticas + link do mapa (remove vínculo 1:1 com campus)

CREATE TABLE "accommodation_atleticas" (
    "accommodation_id" TEXT NOT NULL,
    "atletica_id" TEXT NOT NULL,

    CONSTRAINT "accommodation_atleticas_pkey" PRIMARY KEY ("accommodation_id","atletica_id")
);

ALTER TABLE "accommodations" ADD COLUMN "map_url" TEXT;

INSERT INTO "accommodation_atleticas" ("accommodation_id", "atletica_id")
SELECT a.id, at.id
FROM "accommodations" a
JOIN "atleticas" at ON at.campus_id = a.campus_id;

ALTER TABLE "accommodations" DROP CONSTRAINT IF EXISTS "accommodations_campus_id_key";
ALTER TABLE "accommodations" DROP CONSTRAINT IF EXISTS "accommodations_campus_id_fkey";
ALTER TABLE "accommodations" DROP COLUMN "campus_id";

ALTER TABLE "accommodation_atleticas" ADD CONSTRAINT "accommodation_atleticas_accommodation_id_fkey" FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accommodation_atleticas" ADD CONSTRAINT "accommodation_atleticas_atletica_id_fkey" FOREIGN KEY ("atletica_id") REFERENCES "atleticas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

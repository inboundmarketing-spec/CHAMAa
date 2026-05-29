-- Confirmações / atribuição de neutros / autorização de C.O. da praça
CREATE TABLE IF NOT EXISTS "match_assignments" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "match_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "match_closure_requests" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "home_score" INTEGER NOT NULL,
    "away_score" INTEGER NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "match_closure_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_coordinator_authorizations" (
    "id" TEXT NOT NULL,
    "coordinator_id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "authorized_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "venue_coordinator_authorizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "match_assignments_match_id_admin_user_id_key"
    ON "match_assignments"("match_id", "admin_user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "venue_coordinator_authorizations_coordinator_id_venue_id_key"
    ON "venue_coordinator_authorizations"("coordinator_id", "venue_id");

DO $$ BEGIN
    ALTER TABLE "match_assignments"
        ADD CONSTRAINT "match_assignments_match_id_fkey"
        FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "match_assignments"
        ADD CONSTRAINT "match_assignments_admin_user_id_fkey"
        FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "match_assignments"
        ADD CONSTRAINT "match_assignments_assigned_by_id_fkey"
        FOREIGN KEY ("assigned_by_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "match_closure_requests"
        ADD CONSTRAINT "match_closure_requests_match_id_fkey"
        FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "match_closure_requests"
        ADD CONSTRAINT "match_closure_requests_requested_by_id_fkey"
        FOREIGN KEY ("requested_by_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "match_closure_requests"
        ADD CONSTRAINT "match_closure_requests_reviewed_by_id_fkey"
        FOREIGN KEY ("reviewed_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "venue_coordinator_authorizations"
        ADD CONSTRAINT "venue_coordinator_authorizations_coordinator_id_fkey"
        FOREIGN KEY ("coordinator_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "venue_coordinator_authorizations"
        ADD CONSTRAINT "venue_coordinator_authorizations_venue_id_fkey"
        FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "venue_coordinator_authorizations"
        ADD CONSTRAINT "venue_coordinator_authorizations_authorized_by_id_fkey"
        FOREIGN KEY ("authorized_by_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

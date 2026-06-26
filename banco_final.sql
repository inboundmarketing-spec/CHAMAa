--
-- PostgreSQL database dump
--


-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accommodation_atleticas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accommodation_atleticas (
    accommodation_id text NOT NULL,
    atletica_id text NOT NULL
);


--
-- Name: accommodations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accommodations (
    id text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    latitude double precision,
    longitude double precision,
    notes text,
    image_urls text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    map_url text
);


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text,
    name text NOT NULL,
    role text DEFAULT 'agent'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    venue_id text
);


--
-- Name: allowed_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.allowed_emails (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    venue_id text,
    added_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: app_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_config (
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: atletica_challenge_divisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atletica_challenge_divisions (
    id text NOT NULL,
    atletica_id text NOT NULL,
    challenge_type text NOT NULL,
    division text NOT NULL,
    source text DEFAULT 'seed'::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: atletica_divisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atletica_divisions (
    id text NOT NULL,
    atletica_id text NOT NULL,
    division text NOT NULL,
    source text DEFAULT 'seed'::text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: atletica_standings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atletica_standings (
    id text NOT NULL,
    atletica_id text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    played integer DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    draws integer DEFAULT 0 NOT NULL,
    losses integer DEFAULT 0 NOT NULL,
    goals_for integer DEFAULT 0 NOT NULL,
    goals_against integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: atleticas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atleticas (
    id text NOT NULL,
    name text NOT NULL,
    campus_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: broadcast_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.broadcast_targets (
    id text NOT NULL,
    wa_id text NOT NULL,
    label text NOT NULL,
    type text DEFAULT 'group'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    can_send boolean DEFAULT true NOT NULL,
    is_restricted boolean DEFAULT false NOT NULL,
    last_synced_at timestamp(3) without time zone,
    participant_count integer
);


--
-- Name: campaign_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_groups (
    campaign_id text NOT NULL,
    broadcast_target_id text NOT NULL
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    segment_id text,
    status text DEFAULT 'draft'::text NOT NULL,
    template_name text,
    sent_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    link_url text,
    media_type text,
    media_url text,
    group_sent_count integer DEFAULT 0 NOT NULL,
    send_to_opt_in boolean DEFAULT true NOT NULL
);


--
-- Name: campi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campi (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id text NOT NULL,
    title text NOT NULL,
    atletica_id text,
    campus_id text,
    scheduled_at timestamp(3) without time zone NOT NULL,
    location_name text NOT NULL,
    address text,
    map_url text,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    challenge_type text
);


--
-- Name: conversation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_sessions (
    id text NOT NULL,
    wa_user_id text NOT NULL,
    mode text DEFAULT 'bot'::text NOT NULL,
    menu_state text DEFAULT 'root'::text NOT NULL,
    campus_id text,
    atletica_id text,
    assigned_to text,
    last_message_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: festival_artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.festival_artists (
    id text NOT NULL,
    festival_day_id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    set_starts_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: festival_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.festival_days (
    id text NOT NULL,
    festival_id text NOT NULL,
    day_index integer NOT NULL,
    title text NOT NULL,
    starts_at timestamp(3) without time zone NOT NULL,
    ends_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: festival_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.festival_media (
    id text NOT NULL,
    festival_id text,
    festival_day_id text,
    festival_artist_id text,
    type text NOT NULL,
    url text NOT NULL,
    caption text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: festivals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.festivals (
    id text NOT NULL,
    name text DEFAULT 'Interunesp'::text NOT NULL,
    promo_video_url text,
    promo_image_url text,
    tenda_location_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    passport_purchase_url text,
    tenda_address text,
    tenda_map_url text
);


--
-- Name: handoff_closures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.handoff_closures (
    id text NOT NULL,
    wa_user_id text NOT NULL,
    closed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: handoff_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.handoff_messages (
    id text NOT NULL,
    wa_user_id text NOT NULL,
    direction text NOT NULL,
    content text NOT NULL,
    agent_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: help_feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.help_feedbacks (
    id text NOT NULL,
    help_session_id text NOT NULL,
    wa_user_id text NOT NULL,
    resolved boolean,
    suggestion text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: help_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.help_sessions (
    id text NOT NULL,
    wa_user_id text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at timestamp(3) without time zone
);


--
-- Name: instagram_media_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_media_queue (
    id text NOT NULL,
    media_id text NOT NULL,
    media_type text NOT NULL,
    caption text,
    media_url text,
    permalink text,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_by text,
    sent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: inter_editions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inter_editions (
    id text DEFAULT 'current'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    current_game_day_index integer DEFAULT 1 NOT NULL,
    starts_at timestamp(3) without time zone,
    ends_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: inter_game_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inter_game_days (
    id text NOT NULL,
    edition_id text DEFAULT 'current'::text NOT NULL,
    day_index integer NOT NULL,
    label text NOT NULL,
    starts_at timestamp(3) without time zone NOT NULL,
    ends_at timestamp(3) without time zone NOT NULL,
    closed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: knowledge_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_articles (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    tags text DEFAULT ''::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: local_guide_places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.local_guide_places (
    id text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    latitude double precision,
    longitude double precision,
    phone text,
    site_url text,
    menu_url text,
    image_urls text[] DEFAULT ARRAY[]::text[],
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    map_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    latitude double precision,
    longitude double precision
);


--
-- Name: match_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_assignments (
    id text NOT NULL,
    match_id text NOT NULL,
    admin_user_id text NOT NULL,
    assigned_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: match_closure_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_closure_requests (
    id text NOT NULL,
    match_id text NOT NULL,
    requested_by_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    home_score integer NOT NULL,
    away_score integer NOT NULL,
    reviewed_by_id text,
    reviewed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: match_disciplines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_disciplines (
    id text NOT NULL,
    match_id text NOT NULL,
    team text NOT NULL,
    type text NOT NULL,
    points_delta integer NOT NULL,
    athlete_name text,
    minute integer,
    notes text,
    created_by_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: match_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_events (
    id text NOT NULL,
    match_id text NOT NULL,
    type text NOT NULL,
    team text,
    minute integer,
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: match_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_incidents (
    id text NOT NULL,
    match_id text NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    athlete_name text,
    team text,
    minute integer,
    action_taken text,
    reported_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    game_ended_at timestamp(3) without time zone,
    game_started_at timestamp(3) without time zone
);


--
-- Name: match_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_participants (
    id text NOT NULL,
    match_id text NOT NULL,
    team text NOT NULL,
    placement integer,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id text NOT NULL,
    modalidade_id text NOT NULL,
    venue_id text,
    home_team text,
    away_team text,
    home_score integer DEFAULT 0 NOT NULL,
    away_score integer DEFAULT 0 NOT NULL,
    scheduled_at timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    bracket_round text,
    bracket_info text,
    division text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    game_period text,
    live_started_at timestamp(3) without time zone,
    points_base integer DEFAULT 10 NOT NULL,
    home_points_awarded integer,
    away_points_awarded integer,
    points_warning boolean DEFAULT false NOT NULL
);


--
-- Name: modalidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modalidades (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category text DEFAULT 'collective'::text NOT NULL,
    gender text DEFAULT 'male'::text NOT NULL,
    scoring_mode text DEFAULT 'versus'::text NOT NULL,
    bracket_published boolean DEFAULT false NOT NULL
);


--
-- Name: notification_opt_ins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_opt_ins (
    id text NOT NULL,
    wa_user_id text NOT NULL,
    segment text DEFAULT 'general'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.segments (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    filters jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sports_alert_atleticas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sports_alert_atleticas (
    wa_user_id text NOT NULL,
    atletica_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: venue_coordinator_authorizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_coordinator_authorizations (
    id text NOT NULL,
    coordinator_id text NOT NULL,
    venue_id text NOT NULL,
    authorized_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: venues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venues (
    id text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    map_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    latitude double precision,
    longitude double precision
);


--
-- Name: wa_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wa_users (
    id text NOT NULL,
    wa_id text NOT NULL,
    name text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_events (
    id text NOT NULL,
    processed boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('8a0e27bd-8f28-4597-8816-e191c4ce7447', '5ad28184f29942ea420dfc459cf74a27028d2dc72745e0fff58549b3342c5b5a', '2026-05-25 15:44:51.901167+00', '20260524120000_placement_scoring', '', NULL, '2026-05-25 15:44:51.901167+00', 0);
INSERT INTO public._prisma_migrations VALUES ('696ef976-2cbb-48a8-9a44-4ec422847723', '5eabd0b6b9653db8ff774c8a9220a45c0488c7117df22ce7b6dffd2bfe7f93a7', '2026-05-25 15:44:55.703258+00', '20260525120000_live_timer_standings', '', NULL, '2026-05-25 15:44:55.703258+00', 0);
INSERT INTO public._prisma_migrations VALUES ('758c95f8-7c13-49a6-bb29-05df6dcdda5f', 'd360cbbb8351870a7e0b4dd80febab8fa8a2b1b31c2833ad6c170ee63363a8d1', '2026-05-25 15:44:59.593516+00', '20260526120000_inter_divisions_locals', NULL, NULL, '2026-05-25 15:44:58.841384+00', 1);
INSERT INTO public._prisma_migrations VALUES ('3b2e11fd-2f0b-4dcd-925e-8ef64307fb0c', '4ec0db626cf3123a51ea1e73ffda72f7e8279e94a9e6b0ba9655af8c75e1b204', '2026-05-25 16:16:10.413033+00', '20260527120000_challenge_divisions', NULL, NULL, '2026-05-25 16:16:10.344999+00', 1);
INSERT INTO public._prisma_migrations VALUES ('c300551c-4384-42d9-98c0-1b788c85c96b', '6eb902eafb949237a2f8d67bf8afcafab74b1e95aef19f2c9cbb716ee4e8e95b', '2026-05-25 17:01:44.968958+00', '20260528120000_accommodation_atleticas', NULL, NULL, '2026-05-25 17:01:44.789166+00', 1);


--
-- Data for Name: accommodation_atleticas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhb30011us502672lpyn', 'seed-atletica-sao-jose-do-rio-preto');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhcf0018us50j8ajgn7l', 'seed-atletica-sao-jose-dos-campos');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhd8001fus5070ekcbf9', 'seed-atletica-sao-paulo');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhe5001mus50v1ni8c9y', 'seed-atletica-sao-vicente');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhfe001tus500q15rx7x', 'seed-atletica-sorocaba');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhgg0020us5095xv22vd', 'seed-atletica-tupa');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhh60027us50dten14r6', 'seed-atletica-araraquara');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhi4002eus503b9t5m7u', 'seed-atletica-aracatuba');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhj6002lus5071j5llc8', 'seed-atletica-assis');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhjw002sus50fv8o6hx1', 'seed-atletica-bauru');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhks002zus50xz2e2v8a', 'seed-atletica-botucatu');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhm00036us50focfigo9', 'seed-atletica-dracena');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhmq003dus50pt87fbg9', 'seed-atletica-franca');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhnv003kus501uab4yji', 'seed-atletica-guaratingueta');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhos003rus505rbhw29y', 'seed-atletica-ilha-solteira');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhpw003yus502u9ei4kc', 'seed-atletica-itapeva');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhqs0045us503ln36r70', 'seed-atletica-jaboticabal');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhs8004cus506eogr8ye', 'seed-atletica-marilia');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhsy004jus50mpv9wjn9', 'seed-atletica-ourinhos');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhto004qus50eyqlgt3l', 'seed-atletica-presidente-prudente');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhuc004xus50xebunvaj', 'seed-atletica-registro');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhv40054us50hdcci3sz', 'seed-atletica-rio-claro');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhw2005bus50ouxz38ci', 'seed-atletica-rosana');
INSERT INTO public.accommodation_atleticas VALUES ('cmplyjhxo005ius506v2hzcap', 'seed-atletica-sao-joao-da-boa-vista');


--
-- Data for Name: accommodations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accommodations VALUES ('cmplyjhb30011us502672lpyn', 'Alojamento São José do Rio Preto', 'Alojamento oficial — São José do Rio Preto (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.047', '2026-05-26 01:29:34.047', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhcf0018us50j8ajgn7l', 'Alojamento São José dos Campos', 'Alojamento oficial — São José dos Campos (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.095', '2026-05-26 01:29:34.095', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhd8001fus5070ekcbf9', 'Alojamento São Paulo', 'Alojamento oficial — São Paulo (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.125', '2026-05-26 01:29:34.125', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhe5001mus50v1ni8c9y', 'Alojamento São Vicente', 'Alojamento oficial — São Vicente (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.157', '2026-05-26 01:29:34.157', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhfe001tus500q15rx7x', 'Alojamento Sorocaba', 'Alojamento oficial — Sorocaba (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.202', '2026-05-26 01:29:34.202', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhgg0020us5095xv22vd', 'Alojamento Tupã', 'Alojamento oficial — Tupã (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.24', '2026-05-26 01:29:34.24', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhh60027us50dten14r6', 'Alojamento Araraquara', 'Alojamento oficial — Araraquara (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.266', '2026-05-26 01:29:34.266', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhi4002eus503b9t5m7u', 'Alojamento Araçatuba', 'Alojamento oficial — Araçatuba (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.3', '2026-05-26 01:29:34.3', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhj6002lus5071j5llc8', 'Alojamento Assís', 'Alojamento oficial — Assís (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.339', '2026-05-26 01:29:34.339', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhjw002sus50fv8o6hx1', 'Alojamento Bauru', 'Alojamento oficial — Bauru (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.364', '2026-05-26 01:29:34.364', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhks002zus50xz2e2v8a', 'Alojamento Botucatu', 'Alojamento oficial — Botucatu (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.397', '2026-05-26 01:29:34.397', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhm00036us50focfigo9', 'Alojamento Dracena', 'Alojamento oficial — Dracena (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.441', '2026-05-26 01:29:34.441', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhmq003dus50pt87fbg9', 'Alojamento Franca', 'Alojamento oficial — Franca (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.466', '2026-05-26 01:29:34.466', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhnv003kus501uab4yji', 'Alojamento Guaratinguetá', 'Alojamento oficial — Guaratinguetá (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.507', '2026-05-26 01:29:34.507', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhos003rus505rbhw29y', 'Alojamento Ilha Solteira', 'Alojamento oficial — Ilha Solteira (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.541', '2026-05-26 01:29:34.541', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhpw003yus502u9ei4kc', 'Alojamento Itapeva', 'Alojamento oficial — Itapeva (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.58', '2026-05-26 01:29:34.58', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhqs0045us503ln36r70', 'Alojamento Jaboticabal', 'Alojamento oficial — Jaboticabal (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.613', '2026-05-26 01:29:34.613', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhs8004cus506eogr8ye', 'Alojamento Marília', 'Alojamento oficial — Marília (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.664', '2026-05-26 01:29:34.664', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhsy004jus50mpv9wjn9', 'Alojamento Ourinhos', 'Alojamento oficial — Ourinhos (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.69', '2026-05-26 01:29:34.69', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhto004qus50eyqlgt3l', 'Alojamento Presidente Prudente', 'Alojamento oficial — Presidente Prudente (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.716', '2026-05-26 01:29:34.716', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhuc004xus50xebunvaj', 'Alojamento Registro', 'Alojamento oficial — Registro (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.741', '2026-05-26 01:29:34.741', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhv40054us50hdcci3sz', 'Alojamento Rio Claro', 'Alojamento oficial — Rio Claro (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.769', '2026-05-26 01:29:34.769', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhw2005bus50ouxz38ci', 'Alojamento Rosana', 'Alojamento oficial — Rosana (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.802', '2026-05-26 01:29:34.802', NULL);
INSERT INTO public.accommodations VALUES ('cmplyjhxo005ius506v2hzcap', 'Alojamento São João da Boa Vista', 'Alojamento oficial — São João da Boa Vista (cadastrar endereço no painel)', NULL, NULL, NULL, '{}', '2026-05-26 01:29:34.86', '2026-05-26 01:29:34.86', NULL);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admin_users VALUES ('cmpiqfk2w0000uso87zxt6qo8', 'admin@interunesp.local', '$2b$10$YqMa.wlOBxxoc5HN7hvZGOYCQ6G2HRdYmmi3Ua3X5Gybbjqix9Gr.', 'Admin Inter', 'admin', '2026-05-23 19:19:15.484', NULL);
INSERT INTO public.admin_users VALUES ('cmpiwveqk0002us08tpjbvdvg', 'copraca@interunesp.local', '$2b$10$6GsC7IMhplDqsh5j90ieT.UG8DEgncIjwb3GcWntXIVQCe.xuC4Be', 'C.O. Praça — Ginásio', 'venue_coordinator', '2026-05-23 22:19:32.813', 'seed-venue-ginasio');
INSERT INTO public.admin_users VALUES ('cmpj4owgw0003usosthitz5un', 'neutro@interunesp.local', '$2b$10$3vp354wT7ZW7KqyBDcEdhOm3LcUar0dv1/JicUmL0V.VCTJoBeXgW', 'Neutro — Ginásio', 'neutral', '2026-05-24 01:58:26.145', NULL);
INSERT INTO public.admin_users VALUES ('cmpj4owh50004usos5qof2ds0', 'mesa@interunesp.local', '$2b$10$3vp354wT7ZW7KqyBDcEdhOm3LcUar0dv1/JicUmL0V.VCTJoBeXgW', 'Mesa da Lieu', 'mesa_lieu', '2026-05-24 01:58:26.153', NULL);


--
-- Data for Name: allowed_emails; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.allowed_emails VALUES ('cmpj5bn4e000xusmo5zstcvyq', 'mesa@interunesp.local', 'Mesa', 'mesa_lieu', NULL, NULL, '2026-05-24 02:16:07.119', '2026-05-26 01:29:35.154');
INSERT INTO public.allowed_emails VALUES ('cmpj5bn82000zusmo83wnb20d', 'copraca@interunesp.local', 'C.O. Praça — Ginásio', 'venue_coordinator', 'seed-venue-ginasio', NULL, '2026-05-24 02:16:07.25', '2026-05-26 01:29:35.168');
INSERT INTO public.allowed_emails VALUES ('cmpj5bn9y0011usmoyz4xwpwd', 'neutro@interunesp.local', 'Neutro', 'neutral', NULL, NULL, '2026-05-24 02:16:07.318', '2026-05-26 01:29:35.178');


--
-- Data for Name: app_config; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.app_config VALUES ('bracket_exclusions', '{"cmpiwvf7h000ius081nl6en9u":[],"cmpiwvet40006us08wb767y5e":["Araraquara","Araçatuba","Assís","Bauru","Botucatu","Dracena"],"cmpiwvesc0004us08bv7aglp9":[]}', '2026-05-26 00:35:21.625');


--
-- Data for Name: atletica_challenge_divisions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tf002push09azigfu1', 'seed-atletica-bauru', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.383');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt0027ush0zq708fq3', 'seed-atletica-sao-jose-do-rio-preto', 'battery', 'first', 'seed', '2026-05-26 01:29:34.058');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003jush0rueyjp7d', 'seed-atletica-sao-jose-do-rio-preto', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.064');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt0029ush0taidyr5t', 'seed-atletica-sao-jose-dos-campos', 'battery', 'first', 'seed', '2026-05-26 01:29:34.103');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003lush0ugutq94d', 'seed-atletica-sao-jose-dos-campos', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.112');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqu002bush0e65dzzei', 'seed-atletica-sao-paulo', 'battery', 'second', 'seed', '2026-05-26 01:29:34.133');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003nush0bvxxrtv5', 'seed-atletica-sao-paulo', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.14');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqu002dush01bxcleyu', 'seed-atletica-sao-vicente', 'battery', 'first', 'manual', '2026-05-26 01:29:34.183');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003push0ltiilbj7', 'seed-atletica-sao-vicente', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.19');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqu002fush0sti2j8rn', 'seed-atletica-sorocaba', 'battery', 'second', 'seed', '2026-05-26 01:29:34.218');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003rush0489euiej', 'seed-atletica-sorocaba', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.226');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqu002hush05ih3eq6b', 'seed-atletica-tupa', 'battery', 'first', 'seed', '2026-05-26 01:29:34.248');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0th003tush0wg73y0j3', 'seed-atletica-tupa', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.253');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqs0017ush02533ht79', 'seed-atletica-araraquara', 'battery', 'first', 'seed', '2026-05-26 01:29:34.273');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tf002jush0w3gvt4lj', 'seed-atletica-araraquara', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.278');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqs0019ush0j1wstpvw', 'seed-atletica-aracatuba', 'battery', 'first', 'seed', '2026-05-26 01:29:34.307');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tf002lush098nyo7rl', 'seed-atletica-aracatuba', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.318');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqs001bush0f5cwi704', 'seed-atletica-assis', 'battery', 'second', 'seed', '2026-05-26 01:29:34.346');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tf002nush0kdccyn0b', 'seed-atletica-assis', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.351');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqs001dush06zaqm75h', 'seed-atletica-bauru', 'battery', 'first', 'seed', '2026-05-26 01:29:34.377');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001fush0qoexry6x', 'seed-atletica-botucatu', 'battery', 'first', 'seed', '2026-05-26 01:29:34.407');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tf002rush0dvo20bfg', 'seed-atletica-botucatu', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.416');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001hush0wsxopulb', 'seed-atletica-dracena', 'battery', 'second', 'seed', '2026-05-26 01:29:34.448');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tf002tush0vkdhj0wz', 'seed-atletica-dracena', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.453');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001jush0wxcn3uih', 'seed-atletica-franca', 'battery', 'second', 'seed', '2026-05-26 01:29:34.474');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg002vush0stmh7u1z', 'seed-atletica-franca', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.493');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001lush0rlyhmfe4', 'seed-atletica-guaratingueta', 'battery', 'first', 'seed', '2026-05-26 01:29:34.514');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg002xush04rujxiqn', 'seed-atletica-guaratingueta', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.519');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001nush0vwnfe6ek', 'seed-atletica-ilha-solteira', 'battery', 'first', 'seed', '2026-05-26 01:29:34.55');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg002zush0eo33d98w', 'seed-atletica-ilha-solteira', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.556');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001push0qgmsgqy2', 'seed-atletica-itapeva', 'battery', 'second', 'seed', '2026-05-26 01:29:34.589');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg0031ush0vhhe64nm', 'seed-atletica-itapeva', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.596');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001rush0dbyb3zji', 'seed-atletica-jaboticabal', 'battery', 'first', 'seed', '2026-05-26 01:29:34.627');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg0033ush0vh6qq5xp', 'seed-atletica-jaboticabal', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.643');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001tush0awy32ya4', 'seed-atletica-marilia', 'battery', 'second', 'seed', '2026-05-26 01:29:34.672');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg0035ush0bed40cwf', 'seed-atletica-marilia', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.678');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001vush0mmil1s1u', 'seed-atletica-ourinhos', 'battery', 'second', 'seed', '2026-05-26 01:29:34.698');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg0037ush0mzrlezxc', 'seed-atletica-ourinhos', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.703');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001xush0ywcq91e5', 'seed-atletica-presidente-prudente', 'battery', 'first', 'seed', '2026-05-26 01:29:34.723');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg0039ush08kof8gq9', 'seed-atletica-presidente-prudente', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.729');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt001zush0dvnpyz23', 'seed-atletica-registro', 'battery', 'second', 'seed', '2026-05-26 01:29:34.748');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003bush081bsiufw', 'seed-atletica-registro', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.753');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt0021ush05y8soh8n', 'seed-atletica-rio-claro', 'battery', 'first', 'seed', '2026-05-26 01:29:34.777');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003dush0hdb1nxeb', 'seed-atletica-rio-claro', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.782');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt0023ush01gax78pw', 'seed-atletica-rosana', 'battery', 'second', 'seed', '2026-05-26 01:29:34.817');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003fush0twu26tcd', 'seed-atletica-rosana', 'cheer', 'second', 'seed', '2026-05-26 01:29:34.843');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfuyqt0025ush0vqx205un', 'seed-atletica-sao-joao-da-boa-vista', 'battery', 'first', 'seed', '2026-05-26 01:29:34.872');
INSERT INTO public.atletica_challenge_divisions VALUES ('cmplfv0tg003hush0ucr258ui', 'seed-atletica-sao-joao-da-boa-vista', 'cheer', 'first', 'seed', '2026-05-26 01:29:34.878');


--
-- Data for Name: atletica_divisions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.atletica_divisions VALUES ('cmplyjham0010us50o28txef4', 'seed-atletica-sao-jose-do-rio-preto', 'first', 'seed', '2026-05-26 01:29:34.031');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhc20017us50nonhi57c', 'seed-atletica-sao-jose-dos-campos', 'first', 'seed', '2026-05-26 01:29:34.082');
INSERT INTO public.atletica_divisions VALUES ('cmplfnqw00005ush0ej07fg8k', 'seed-atletica-sao-paulo', 'second', 'manual', '2026-05-26 01:29:34.117');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhdu001lus50cf9kl4e2', 'seed-atletica-sao-vicente', 'first', 'seed', '2026-05-26 01:29:34.146');
INSERT INTO public.atletica_divisions VALUES ('cmplfnofl0003ush05oxwmv98', 'seed-atletica-sorocaba', 'second', 'manual', '2026-05-26 01:29:34.195');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhg8001zus508r186572', 'seed-atletica-tupa', 'first', 'seed', '2026-05-26 01:29:34.232');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhgz0026us50s7y4ah8i', 'seed-atletica-araraquara', 'first', 'seed', '2026-05-26 01:29:34.26');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhhy002dus50u9xvoa1r', 'seed-atletica-aracatuba', 'first', 'seed', '2026-05-26 01:29:34.294');
INSERT INTO public.atletica_divisions VALUES ('cmplfo5k4000hush00wamc4ub', 'seed-atletica-assis', 'second', 'manual', '2026-05-26 01:29:34.332');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhjp002rus50rzapba7a', 'seed-atletica-bauru', 'first', 'seed', '2026-05-26 01:29:34.357');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhkl002yus505bsdm6xz', 'seed-atletica-botucatu', 'first', 'seed', '2026-05-26 01:29:34.39');
INSERT INTO public.atletica_divisions VALUES ('cmplfo3be000fush0xpkcddiq', 'seed-atletica-dracena', 'second', 'manual', '2026-05-26 01:29:34.429');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhmk003cus50sr61y9a7', 'seed-atletica-franca', 'second', 'seed', '2026-05-26 01:29:34.46');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhno003jus50yqcrqjp8', 'seed-atletica-guaratingueta', 'first', 'seed', '2026-05-26 01:29:34.5');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhod003qus50glus6jfr', 'seed-atletica-ilha-solteira', 'first', 'seed', '2026-05-26 01:29:34.526');
INSERT INTO public.atletica_divisions VALUES ('cmplfnz9o000dush08n5uj7bp', 'seed-atletica-itapeva', 'second', 'manual', '2026-05-26 01:29:34.565');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhqm0044us50bxu98ip7', 'seed-atletica-jaboticabal', 'first', 'seed', '2026-05-26 01:29:34.606');
INSERT INTO public.atletica_divisions VALUES ('cmplfndsw0001ush02pwckc6n', 'seed-atletica-marilia', 'second', 'manual', '2026-05-26 01:29:34.648');
INSERT INTO public.atletica_divisions VALUES ('cmplfnx1a000bush0p5rtclme', 'seed-atletica-ourinhos', 'second', 'manual', '2026-05-26 01:29:34.683');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhti004pus508fbf8h0y', 'seed-atletica-presidente-prudente', 'first', 'seed', '2026-05-26 01:29:34.71');
INSERT INTO public.atletica_divisions VALUES ('cmplfnv1l0009ush0xvhgvsgx', 'seed-atletica-registro', 'second', 'manual', '2026-05-26 01:29:34.734');
INSERT INTO public.atletica_divisions VALUES ('cmplyjhuw0053us50mfsfdrj6', 'seed-atletica-rio-claro', 'first', 'seed', '2026-05-26 01:29:34.761');
INSERT INTO public.atletica_divisions VALUES ('cmplfnty60007ush03tcn23tn', 'seed-atletica-rosana', 'second', 'manual', '2026-05-26 01:29:34.787');
INSERT INTO public.atletica_divisions VALUES ('cmplh2lfd0001useshs7boax2', 'seed-atletica-sao-joao-da-boa-vista', 'first', 'manual', '2026-05-26 01:29:34.85');


--
-- Data for Name: atletica_standings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.atletica_standings VALUES ('cmpl9s7e5000tus8gydvrilil', 'seed-atletica-registro', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e6000vus8go0xku263', 'seed-atletica-rio-claro', 0, 2, 0, 0, 2, 1, 3, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e6000xus8gl7sudss2', 'seed-atletica-rosana', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e6000zus8gbzuil66v', 'seed-atletica-sao-joao-da-boa-vista', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e60011us8g0e9hmf17', 'seed-atletica-sao-jose-do-rio-preto', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e60013us8gm0d0lr8q', 'seed-atletica-sao-jose-dos-campos', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e60015us8g2zrdxcj1', 'seed-atletica-sao-paulo', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e70017us8gx5sqczjl', 'seed-atletica-sao-vicente', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e70019us8giqw4scjb', 'seed-atletica-sorocaba', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e7001bus8g1j57kwy3', 'seed-atletica-tupa', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e20001us8g0aztwdh3', 'seed-atletica-araraquara', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e30003us8gcliffbet', 'seed-atletica-aracatuba', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e30005us8gwu9fs3h7', 'seed-atletica-assis', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e30007us8g0hyegdvu', 'seed-atletica-bauru', 6, 2, 2, 0, 0, 3, 1, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e30009us8g0liyfv95', 'seed-atletica-botucatu', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e4000bus8gxwifvemx', 'seed-atletica-dracena', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e4000dus8g5d5k2oue', 'seed-atletica-franca', 3, 1, 1, 0, 0, 3, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e4000fus8glmjcldm4', 'seed-atletica-guaratingueta', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e4000hus8gibap2gul', 'seed-atletica-ilha-solteira', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e4000jus8g9dsnpnji', 'seed-atletica-itapeva', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e5000lus8gmlnafqic', 'seed-atletica-jaboticabal', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e5000nus8g2mse9es6', 'seed-atletica-marilia', 0, 1, 0, 0, 1, 0, 3, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e5000pus8gw666ij8g', 'seed-atletica-ourinhos', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');
INSERT INTO public.atletica_standings VALUES ('cmpl9s7e5000rus8gxqdit07m', 'seed-atletica-presidente-prudente', 0, 0, 0, 0, 0, 0, 0, '2026-05-25 15:13:56.037');


--
-- Data for Name: atleticas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.atleticas VALUES ('seed-atletica-sao-jose-do-rio-preto', 'Atlética São José do Rio Preto', 'cmpj70mvf000nus805ro4sqcv', '2026-05-24 03:03:32.818');
INSERT INTO public.atleticas VALUES ('seed-atletica-sao-jose-dos-campos', 'Atlética São José dos Campos', 'cmpj70mvr000ous80p0oxu201', '2026-05-24 03:03:32.837');
INSERT INTO public.atleticas VALUES ('seed-atletica-sao-paulo', 'Atlética São Paulo', 'cmpj70mw9000pus80fhagd172', '2026-05-24 03:03:32.847');
INSERT INTO public.atleticas VALUES ('seed-atletica-sao-vicente', 'Atlética São Vicente', 'cmpj70mwk000qus80wi9ls5kr', '2026-05-24 03:03:32.858');
INSERT INTO public.atleticas VALUES ('seed-atletica-sorocaba', 'Atlética Sorocaba', 'cmpj70mwz000rus80fbqj4ejm', '2026-05-24 03:03:32.872');
INSERT INTO public.atleticas VALUES ('seed-atletica-tupa', 'Atlética Tupã', 'cmpj70mx9000sus808l1u5c0t', '2026-05-24 03:03:32.883');
INSERT INTO public.atleticas VALUES ('seed-atletica-araraquara', 'Atlética Araraquara', 'cmpj70mq40005us80adwv5kzi', '2026-05-24 03:03:32.627');
INSERT INTO public.atleticas VALUES ('seed-atletica-aracatuba', 'Atlética Araçatuba', 'cmpj70mqk0006us80m4p6taom', '2026-05-24 03:03:32.642');
INSERT INTO public.atleticas VALUES ('seed-atletica-assis', 'Atlética Assís', 'cmpj70mqv0007us802qc57bu7', '2026-05-24 03:03:32.653');
INSERT INTO public.atleticas VALUES ('seed-atletica-bauru', 'Atlética Bauru', 'cmpiqfk970001uso8docz8nb9', '2026-05-23 19:19:15.813');
INSERT INTO public.atleticas VALUES ('seed-atletica-botucatu', 'Atlética Botucatu', 'cmpj70mrh0009us80so5oby2i', '2026-05-24 03:03:32.674');
INSERT INTO public.atleticas VALUES ('seed-atletica-dracena', 'Atlética Dracena', 'cmpj70mrq000aus809youxu5t', '2026-05-24 03:03:32.684');
INSERT INTO public.atleticas VALUES ('seed-atletica-franca', 'Atlética Franca', 'cmpj70ms1000bus80gfu17rkf', '2026-05-24 03:03:32.694');
INSERT INTO public.atleticas VALUES ('seed-atletica-guaratingueta', 'Atlética Guaratinguetá', 'cmpj70msb000cus80ocqja29j', '2026-05-24 03:03:32.705');
INSERT INTO public.atleticas VALUES ('seed-atletica-ilha-solteira', 'Atlética Ilha Solteira', 'cmpj70msm000dus801t067k5z', '2026-05-24 03:03:32.715');
INSERT INTO public.atleticas VALUES ('seed-atletica-itapeva', 'Atlética Itapeva', 'cmpj70msw000eus80doz794mb', '2026-05-24 03:03:32.725');
INSERT INTO public.atleticas VALUES ('seed-atletica-jaboticabal', 'Atlética Jaboticabal', 'cmpj70mt6000fus801a423p0a', '2026-05-24 03:03:32.735');
INSERT INTO public.atleticas VALUES ('seed-atletica-marilia', 'Atlética Marília', 'cmpj70mtf000gus80iddpkq9i', '2026-05-24 03:03:32.745');
INSERT INTO public.atleticas VALUES ('seed-atletica-ourinhos', 'Atlética Ourinhos', 'cmpj70mtr000hus80fntfjra7', '2026-05-24 03:03:32.756');
INSERT INTO public.atleticas VALUES ('seed-atletica-presidente-prudente', 'Atlética Presidente Prudente', 'cmpj70mu0000ius805ipk7zrk', '2026-05-24 03:03:32.766');
INSERT INTO public.atleticas VALUES ('seed-atletica-registro', 'Atlética Registro', 'cmpj70mua000jus803fk2acec', '2026-05-24 03:03:32.776');
INSERT INTO public.atleticas VALUES ('seed-atletica-rio-claro', 'Atlética Rio Claro', 'cmpj70mul000kus80sucpxdxk', '2026-05-24 03:03:32.787');
INSERT INTO public.atleticas VALUES ('seed-atletica-rosana', 'Atlética Rosana', 'cmpj70muv000lus801aqbofov', '2026-05-24 03:03:32.797');
INSERT INTO public.atleticas VALUES ('seed-atletica-sao-joao-da-boa-vista', 'Atlética São João da Boa Vista', 'cmpj70mv5000mus80klsrpsg2', '2026-05-24 03:03:32.806');


--
-- Data for Name: broadcast_targets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.broadcast_targets VALUES ('cmpjamq6w0000usdstj5t8ix5', '120363000000000001@g.us', 'Grupo demo — Comissão', 'group', true, '2026-05-24 04:44:42.392', true, false, '2026-05-26 12:28:40.426', 42);
INSERT INTO public.broadcast_targets VALUES ('cmpjamq7l0001usdsdplubzrv', '120363000000000002@g.us', 'Grupo demo — Atléticas (somente admins)', 'group', true, '2026-05-24 04:44:42.417', false, true, '2026-05-26 12:28:40.426', 128);


--
-- Data for Name: campaign_groups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.campaigns VALUES ('cmpj7dfgb0000usjcy88ie4ht', 'oi', 'Como estão ', NULL, 'draft', NULL, 0, '2026-05-24 03:13:29.723', '2026-05-24 03:13:29.723', NULL, NULL, NULL, 0, true);
INSERT INTO public.campaigns VALUES ('cmpj7dndf0001usjcqdyv71xt', 'oi', 'Como estão sss', NULL, 'sent', NULL, 0, '2026-05-24 03:13:39.987', '2026-05-25 14:04:32.717', NULL, NULL, NULL, 0, true);


--
-- Data for Name: campi; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.campi VALUES ('cmpj70mq40005us80adwv5kzi', 'Araraquara', 'araraquara', '2026-05-24 03:03:32.62');
INSERT INTO public.campi VALUES ('cmpj70mqk0006us80m4p6taom', 'Araçatuba', 'aracatuba', '2026-05-24 03:03:32.637');
INSERT INTO public.campi VALUES ('cmpj70mqv0007us802qc57bu7', 'Assís', 'assis', '2026-05-24 03:03:32.648');
INSERT INTO public.campi VALUES ('cmpiqfk970001uso8docz8nb9', 'Bauru', 'bauru', '2026-05-23 19:19:15.787');
INSERT INTO public.campi VALUES ('cmpj70mrh0009us80so5oby2i', 'Botucatu', 'botucatu', '2026-05-24 03:03:32.669');
INSERT INTO public.campi VALUES ('cmpj70mrq000aus809youxu5t', 'Dracena', 'dracena', '2026-05-24 03:03:32.679');
INSERT INTO public.campi VALUES ('cmpj70ms1000bus80gfu17rkf', 'Franca', 'franca', '2026-05-24 03:03:32.689');
INSERT INTO public.campi VALUES ('cmpj70msb000cus80ocqja29j', 'Guaratinguetá', 'guaratingueta', '2026-05-24 03:03:32.699');
INSERT INTO public.campi VALUES ('cmpj70msm000dus801t067k5z', 'Ilha Solteira', 'ilha-solteira', '2026-05-24 03:03:32.71');
INSERT INTO public.campi VALUES ('cmpj70msw000eus80doz794mb', 'Itapeva', 'itapeva', '2026-05-24 03:03:32.72');
INSERT INTO public.campi VALUES ('cmpj70mt6000fus801a423p0a', 'Jaboticabal', 'jaboticabal', '2026-05-24 03:03:32.73');
INSERT INTO public.campi VALUES ('cmpj70mtf000gus80iddpkq9i', 'Marília', 'marilia', '2026-05-24 03:03:32.74');
INSERT INTO public.campi VALUES ('cmpj70mtr000hus80fntfjra7', 'Ourinhos', 'ourinhos', '2026-05-24 03:03:32.751');
INSERT INTO public.campi VALUES ('cmpj70mu0000ius805ipk7zrk', 'Presidente Prudente', 'presidente-prudente', '2026-05-24 03:03:32.761');
INSERT INTO public.campi VALUES ('cmpj70mua000jus803fk2acec', 'Registro', 'registro', '2026-05-24 03:03:32.77');
INSERT INTO public.campi VALUES ('cmpj70mul000kus80sucpxdxk', 'Rio Claro', 'rio-claro', '2026-05-24 03:03:32.782');
INSERT INTO public.campi VALUES ('cmpj70muv000lus801aqbofov', 'Rosana', 'rosana', '2026-05-24 03:03:32.791');
INSERT INTO public.campi VALUES ('cmpj70mv5000mus80klsrpsg2', 'São João da Boa Vista', 'sao-joao-da-boa-vista', '2026-05-24 03:03:32.802');
INSERT INTO public.campi VALUES ('cmpj70mvf000nus805ro4sqcv', 'São José do Rio Preto', 'sao-jose-do-rio-preto', '2026-05-24 03:03:32.812');
INSERT INTO public.campi VALUES ('cmpj70mvr000ous80p0oxu201', 'São José dos Campos', 'sao-jose-dos-campos', '2026-05-24 03:03:32.823');
INSERT INTO public.campi VALUES ('cmpj70mw9000pus80fhagd172', 'São Paulo', 'sao-paulo', '2026-05-24 03:03:32.841');
INSERT INTO public.campi VALUES ('cmpj70mwk000qus80wi9ls5kr', 'São Vicente', 'sao-vicente', '2026-05-24 03:03:32.852');
INSERT INTO public.campi VALUES ('cmpj70mwz000rus80fbqj4ejm', 'Sorocaba', 'sorocaba', '2026-05-24 03:03:32.867');
INSERT INTO public.campi VALUES ('cmpj70mx9000sus808l1u5c0t', 'Tupã', 'tupa', '2026-05-24 03:03:32.878');


--
-- Data for Name: challenges; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.challenges VALUES ('cmplm0l630000us7sw7dy8ncl', 'Desafio de Baterias', NULL, NULL, '2026-08-08 22:38:00', 'Tste', NULL, NULL, 'desafio de baterias', '2026-05-25 19:38:57.196', '2026-05-25 19:38:57.196', 'battery');
INSERT INTO public.challenges VALUES ('cmplyjhz2005ous508vbsatv5', 'Desafio de Cheer', NULL, NULL, '2026-06-01 22:00:00', 'Local a definir', NULL, NULL, 'Cadastre data, local e observações no painel Desafios.', '2026-05-26 01:29:34.91', '2026-05-26 01:29:34.91', 'cheer');


--
-- Data for Name: conversation_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.conversation_sessions VALUES ('cmpiv41g9000jusx0dw45uceh', 'cmpiv41fr000husx0yzahqq7j', 'bot', 'root', NULL, NULL, NULL, '2026-05-23 21:30:17.393', '2026-05-23 21:30:16.281', '2026-05-23 21:52:58.045');
INSERT INTO public.conversation_sessions VALUES ('cmpiv1sir0002usx0724p1xh1', 'cmpiv1si30000usx0urrfozjw', 'bot', 'root', NULL, NULL, NULL, '2026-05-23 21:28:35.338', '2026-05-23 21:28:31.395', '2026-05-23 21:52:59.634');
INSERT INTO public.conversation_sessions VALUES ('cmpiqta5g0002us6sng1u99y1', 'cmpiqta510000us6snjmxaevf', 'bot', 'accommodation_guide', 'cmpj70msm000dus801t067k5z', NULL, NULL, '2026-05-26 12:33:22.064', '2026-05-23 19:29:55.876', '2026-05-26 12:33:22.065');
INSERT INTO public.conversation_sessions VALUES ('cmpiuustv000ausg81q2ts1h7', 'cmpiuussz0008usg81jhn4p2m', 'bot', 'root', NULL, NULL, NULL, '2026-05-23 21:23:14.7', '2026-05-23 21:23:05.204', '2026-05-23 21:23:14.701');
INSERT INTO public.conversation_sessions VALUES ('cmpiv052w000fusg8160vx2or', 'cmpiv052c000dusg8yiqqmpk4', 'bot', 'root', NULL, NULL, NULL, '2026-05-23 21:27:17.252', '2026-05-23 21:27:14.36', '2026-05-23 21:27:17.254');
INSERT INTO public.conversation_sessions VALUES ('cmpiv0rxe000ousg8z3m61muv', 'cmpiv0rwq000musg83okw4sc0', 'bot', 'root', NULL, NULL, NULL, '2026-05-23 21:27:45.363', '2026-05-23 21:27:43.97', '2026-05-23 21:27:45.364');
INSERT INTO public.conversation_sessions VALUES ('cmpiv34e5000fusx0krmarco1', 'cmpiv34dj000dusx07sjv6wrg', 'bot', 'root', NULL, NULL, NULL, '2026-05-23 21:29:34.523', '2026-05-23 21:29:33.437', '2026-05-23 21:29:34.524');


--
-- Data for Name: festival_artists; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.festival_artists VALUES ('seed-artist-sup-1', 'seed-festival-day-1', 'Atração 1', 'supporting', 1, NULL, '2026-05-24 04:09:15.548');
INSERT INTO public.festival_artists VALUES ('seed-artist-sup-2', 'seed-festival-day-2', 'Atração 2', 'supporting', 1, NULL, '2026-05-24 04:09:15.575');
INSERT INTO public.festival_artists VALUES ('seed-artist-sup-3', 'seed-festival-day-3', 'Atração 3', 'supporting', 1, NULL, '2026-05-24 04:09:15.597');
INSERT INTO public.festival_artists VALUES ('seed-artist-hl-1', 'seed-festival-day-1', 'DJ Campus', 'headliner', 0, NULL, '2026-05-24 04:09:15.542');
INSERT INTO public.festival_artists VALUES ('seed-artist-hl-2', 'seed-festival-day-2', 'Banda UNESP', 'headliner', 0, NULL, '2026-05-24 04:09:15.569');
INSERT INTO public.festival_artists VALUES ('seed-artist-hl-3', 'seed-festival-day-3', 'DJ Fechamento', 'headliner', 0, NULL, '2026-05-24 04:09:15.592');


--
-- Data for Name: festival_days; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.festival_days VALUES ('seed-festival-day-1', 'seed-festival', 1, 'Abertura', '2026-05-25 21:00:00', '2026-05-26 09:00:00', '2026-05-24 04:09:15.528', '2026-05-26 01:29:35.222');
INSERT INTO public.festival_days VALUES ('seed-festival-day-2', 'seed-festival', 2, 'Noite principal', '2026-05-26 21:00:00', '2026-05-27 09:00:00', '2026-05-24 04:09:15.561', '2026-05-26 01:29:35.257');
INSERT INTO public.festival_days VALUES ('seed-festival-day-3', 'seed-festival', 3, 'Encerramento', '2026-05-27 21:00:00', '2026-05-28 09:00:00', '2026-05-24 04:09:15.586', '2026-05-26 01:29:35.275');


--
-- Data for Name: festival_media; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: festivals; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.festivals VALUES ('seed-festival', 'Interunesp', NULL, NULL, 'seed-location-festa', '2026-05-24 04:09:15.52', '2026-05-26 01:29:35.206', NULL, 'Rod. Inter, km 5', NULL);


--
-- Data for Name: handoff_closures; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.handoff_closures VALUES ('cmpj7ogiw0001ushwao0umar0', 'cmpiqta510000us6snjmxaevf', '2026-05-24 03:22:04.328');


--
-- Data for Name: handoff_messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.handoff_messages VALUES ('cmpishaew0004us7silz8lcs0', 'cmpiqta510000us6snjmxaevf', 'inbound', 'oi', NULL, '2026-05-23 20:16:35.576');
INSERT INTO public.handoff_messages VALUES ('cmpishoq20009us7s17s6d5bv', 'cmpiqta510000us6snjmxaevf', 'inbound', 'oi', NULL, '2026-05-23 20:16:54.123');
INSERT INTO public.handoff_messages VALUES ('cmpishu0c000eus7s2jvoo7ic', 'cmpiqta510000us6snjmxaevf', 'inbound', 'oi', NULL, '2026-05-23 20:17:00.972');
INSERT INTO public.handoff_messages VALUES ('cmpisngmi0004us1w941qh3so', 'cmpiqta510000us6snjmxaevf', 'inbound', 'oi', NULL, '2026-05-23 20:21:23.563');
INSERT INTO public.handoff_messages VALUES ('cmpisop350009us1wxo6bu86f', 'cmpiqta510000us6snjmxaevf', 'inbound', 'oi', NULL, '2026-05-23 20:22:21.186');
INSERT INTO public.handoff_messages VALUES ('cmpisow5z000eus1wxbr1pbso', 'cmpiqta510000us6snjmxaevf', 'inbound', 'oi', NULL, '2026-05-23 20:22:30.359');
INSERT INTO public.handoff_messages VALUES ('cmpitlr50000pus942g8xktej', 'cmpiqta510000us6snjmxaevf', 'inbound', '[SOS] Usuário solicitou atendimento humano Lieu', NULL, '2026-05-23 20:48:03.492');
INSERT INTO public.handoff_messages VALUES ('cmpiu4u150013usswg1kxm9ld', 'cmpiqta510000us6snjmxaevf', 'inbound', '[SOS] Usuário solicitou atendimento humano Lieu', NULL, '2026-05-23 21:02:53.705');
INSERT INTO public.handoff_messages VALUES ('cmpiv06ub000kusg8qjt3xgrh', 'cmpiv052c000dusg8yiqqmpk4', 'inbound', '[SOS] Usuário solicitou atendimento humano Lieu', NULL, '2026-05-23 21:27:16.643');
INSERT INTO public.handoff_messages VALUES ('cmpiv1v1k0009usx0kgyr92oa', 'cmpiv1si30000usx0urrfozjw', 'inbound', '[SOS] Usuário solicitou atendimento humano Lieu', NULL, '2026-05-23 21:28:34.665');
INSERT INTO public.handoff_messages VALUES ('cmpiv1vk6000cusx0ga6t77gf', 'cmpiv1si30000usx0urrfozjw', 'inbound', 'msg humano', NULL, '2026-05-23 21:28:35.334');
INSERT INTO public.handoff_messages VALUES ('cmpiv41hi000lusx0eb8xchgz', 'cmpiv41fr000husx0yzahqq7j', 'inbound', '[SOS] Usuário solicitou atendimento humano Lieu', NULL, '2026-05-23 21:30:16.326');
INSERT INTO public.handoff_messages VALUES ('cmpiv42b1000ousx0ybm2wrc0', 'cmpiv41fr000husx0yzahqq7j', 'inbound', 'preciso de ajuda urgente', NULL, '2026-05-23 21:30:17.389');
INSERT INTO public.handoff_messages VALUES ('cmpj79899000cusmo74rnl6qu', 'cmpiqta510000us6snjmxaevf', 'inbound', '[SOS] Usuário solicitou atendimento humano Lieu', NULL, '2026-05-24 03:10:13.773');
INSERT INTO public.handoff_messages VALUES ('cmpj79sy0000eusmogeewsfhb', 'cmpiqta510000us6snjmxaevf', 'outbound', 'oi', 'cmpiqfk2w0000uso87zxt6qo8', '2026-05-24 03:10:40.585');
INSERT INTO public.handoff_messages VALUES ('cmpj7a1dd000gusmow59f010q', 'cmpiqta510000us6snjmxaevf', 'outbound', 'como posso ajudar?
', 'cmpiqfk2w0000uso87zxt6qo8', '2026-05-24 03:10:51.505');


--
-- Data for Name: help_feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.help_feedbacks VALUES ('cmpitlk44000kus94n7cz2zj4', 'cmpitl0ih0009us94c8o1q3l0', 'cmpiqta510000us6snjmxaevf', false, NULL, '2026-05-23 20:47:54.388');
INSERT INTO public.help_feedbacks VALUES ('cmpitmp750012us94f11s0mt5', 'cmpitmikc000uus94oia14h6l', 'cmpiqta510000us6snjmxaevf', true, NULL, '2026-05-23 20:48:47.634');
INSERT INTO public.help_feedbacks VALUES ('cmpity27k000huswomcly3ewp', 'cmpitxohh0009uswotckj8cm2', 'cmpiqta510000us6snjmxaevf', false, NULL, '2026-05-23 20:57:37.712');
INSERT INTO public.help_feedbacks VALUES ('cmpityhi20010usworpxzv3lj', 'cmpitydp1000suswoy3apfmzv', 'cmpiqta510000us6snjmxaevf', true, NULL, '2026-05-23 20:57:57.531');
INSERT INTO public.help_feedbacks VALUES ('cmpiu4kx8000fussw3b27ygc9', 'cmpiu4gqf0007usswlk894wvx', 'cmpiqta510000us6snjmxaevf', NULL, NULL, '2026-05-23 21:02:41.9');
INSERT INTO public.help_feedbacks VALUES ('cmpiu4s4a000yusswbagjtwd1', 'cmpiu4pts000qusswobk66tmg', 'cmpiqta510000us6snjmxaevf', false, NULL, '2026-05-23 21:02:51.227');
INSERT INTO public.help_feedbacks VALUES ('cmpj792d90009usmoqfq66ixx', 'cmpj78z090005usmox8qja8af', 'cmpiqta510000us6snjmxaevf', false, NULL, '2026-05-24 03:10:06.142');
INSERT INTO public.help_feedbacks VALUES ('cmpllomta000cuso48fkou043', 'cmpllmi0a0003uso494rjma39', 'cmpiqta510000us6snjmxaevf', NULL, 'testando', '2026-05-25 19:29:39.454');


--
-- Data for Name: help_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.help_sessions VALUES ('cmplbpzvg002xus0g9cpjem0f', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "QUANDo o inter vai acontecer?"}, {"role": "assistant", "content": "🔥 *chaminha* — datas que encontrei:\n\n*Data do Inter 2026*\n22 de novembro"}, {"role": "user", "content": "quanto tempo vai durar?"}, {"role": "assistant", "content": "🔥 Desculpe, a *chaminha* só consegue ajudar com assuntos do *Interunesp* (jogos, festas, atléticas, locais, horários e regras do evento).\n\nSe precisar de uma pessoa da *Lieu*, toque em *Encerrar* e depois em *Ainda não*."}, {"role": "user", "content": "onde o inter vai acontecer?"}, {"role": "assistant", "content": "🔥 *chaminha* — resposta direta:\n\n*Local do Inter 2026*\nO inter 2026 vai acontecer na cidade de Presidente Prudente"}, {"role": "user", "content": "oi"}, {"role": "assistant", "content": "🔥 *chaminha*\n\n*Jogos ao vivo:*\n- Basquete: 1 x 0 · Intervalo (Ginásio Municipal)\n*Festas:*\n- Dia 2 — Noite principal: 25/05/2026, 18:00:00\n- Dia 3 — Encerramento: 26/05/2026, 18:00:00"}]', '2026-05-25 14:50:46.877', '2026-05-25 16:03:09.603');
INSERT INTO public.help_sessions VALUES ('cmpisvqxm0007usjkny8czzim', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "quando vai ser o inter?"}, {"role": "assistant", "content": "🔥 *chaminha* — aqui está o que encontrei:\n\n*Ingressos e pacotes*\nO pacote do Inter pode ser consultado no menu *Ingresso* do bot. Você recebe um QR code único no WhatsApp para validação na entrada de festas e tendas.\n\n*O que é o Interunesp*\nO Interunesp é o maior evento esportivo e cultural universitário do interior de São Paulo. Reúne atléticas de vários campi em competições, festas, tendas e integração.\n\n_Se não respondeu sua dúvida, reformule ou toque em *Concluir conversa*._"}, {"role": "user", "content": "oi"}, {"role": "assistant", "content": "🔥 *chaminha*\n\n*Jogos ao vivo:*\n- Futsal: Bauru 2 x 1 Rio Claro (Ginásio Municipal)\n\n_Se não respondeu sua dúvida, reformule ou toque em *Concluir conversa*._"}]', '2026-05-23 20:27:50.17', '2026-05-23 20:44:43.113');
INSERT INTO public.help_sessions VALUES ('cmpithjsm000ausvsgpybcufb', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "quando vai ser o inter?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nNão tenho *data ou horário* sobre *Interunesp* cadastrado na base.\n\nA comissão pode cadastrar as datas em *Base conhecimento*. Enquanto isso, confira a agenda do dia no menu *Festas*.\n\n_Se não respondeu sua dúvida, reformule ou toque em *Concluir conversa*._"}]', '2026-05-23 20:44:47.35', '2026-05-23 20:46:52.2');
INSERT INTO public.help_sessions VALUES ('cmpitl0ih0009us94c8o1q3l0', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "quando vai ser o inter?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nAinda não sei a *data ou horário* sobre *Interunesp*.\n\nEnquanto isso, confira a agenda do dia no menu *Festas*.\n\n_Se não respondeu sua dúvida, reformule ou toque em *Concluir conversa*._"}]', '2026-05-23 20:47:28.986', '2026-05-23 20:47:50.26');
INSERT INTO public.help_sessions VALUES ('cmpitmikc000uus94oia14h6l', 'cmpiqta510000us6snjmxaevf', 'closed', '[]', '2026-05-23 20:48:39.037', '2026-05-23 20:48:46.028');
INSERT INTO public.help_sessions VALUES ('cmpitxohh0009uswotckj8cm2', 'cmpiqta510000us6snjmxaevf', 'closed', '[]', '2026-05-23 20:57:19.925', '2026-05-23 20:57:26.395');
INSERT INTO public.help_sessions VALUES ('cmpitydp1000suswoy3apfmzv', 'cmpiqta510000us6snjmxaevf', 'closed', '[]', '2026-05-23 20:57:52.598', '2026-05-23 20:57:56.226');
INSERT INTO public.help_sessions VALUES ('cmpiu4gqf0007usswlk894wvx', 'cmpiqta510000us6snjmxaevf', 'closed', '[]', '2026-05-23 21:02:36.472', '2026-05-23 21:02:38.094');
INSERT INTO public.help_sessions VALUES ('cmpiu4pts000qusswobk66tmg', 'cmpiqta510000us6snjmxaevf', 'closed', '[]', '2026-05-23 21:02:48.256', '2026-05-23 21:02:49.88');
INSERT INTO public.help_sessions VALUES ('cmpj78z090005usmox8qja8af', 'cmpiqta510000us6snjmxaevf', 'closed', '[]', '2026-05-24 03:10:01.785', '2026-05-24 03:10:04.365');
INSERT INTO public.help_sessions VALUES ('cmplhevy70009usesh9rubf18', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "Quando vai ser o inter?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nSobre as datas:\n\nO inter 2026 vai acontecer entre os dias 20 e 22 de novembro"}, {"role": "user", "content": "Que horas vai acontecer?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nPelo que tenho na base:\n\nO inter 2026 vai acontecer na cidade de Presidente Prudente\n\n• *Data do Inter 2026:* O inter 2026 vai acontecer entre os dias 20 e 22 de novembro"}]', '2026-05-25 17:30:06.271', '2026-05-25 17:30:52.712');
INSERT INTO public.help_sessions VALUES ('cmplhg762000huses407evfzj', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "Onde vai ser o inter?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nSobre as datas:\n\nO inter 2026 vai acontecer entre os dias 20 e 22 de novembro"}, {"role": "user", "content": "oi"}, {"role": "assistant", "content": "🔥 *chaminha*\n\n*Próximos jogos:*\n- Basquete: SP x SV — 27/11/2026, 23:21:00 (Ginásio Municipal)\n*Festas:*\n- Dia 2 — Noite principal: 25/05/2026, 18:00:00\n- Dia 3 — Encerramento: 26/05/2026, 18:00:00"}]', '2026-05-25 17:31:07.467', '2026-05-25 18:50:20.572');
INSERT INTO public.help_sessions VALUES ('cmplkpqy90005use81b0g3kv9', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "onde vai ser o inter?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nSobre o local:\n\nO *Interunesp* acontece em *Presidente Prudente*.\n\n_Endereços de festas e praças esportivas: menus *Festas* → Local e *Esportes* → Praças._"}, {"role": "user", "content": "onde foi o inter no ano passado?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nAinda não sei o *local ou endereço* sobre *Interunesp*.\n\nCadastre o artigo *Local do Inter* na base de conhecimento com a cidade-sede."}, {"role": "user", "content": "onde foi o inter no ano passado?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nAinda não sei o *local ou endereço* sobre *Interunesp*.\n\nCadastre o artigo *Local do Inter* na base de conhecimento com a cidade-sede."}, {"role": "user", "content": "oi"}, {"role": "assistant", "content": "🔥 *chaminha*\n\n*Próximos jogos:*\n- Basquete: SP x SV — 27/11/2026, 23:21:00 (Ginásio Municipal)\n*Festas:*\n- Dia 2 — Noite principal: 25/05/2026, 18:00:00\n- Dia 3 — Encerramento: 26/05/2026, 18:00:00"}]', '2026-05-25 19:02:31.858', '2026-05-25 19:08:02.429');
INSERT INTO public.help_sessions VALUES ('cmplka8q10006usbomz5eg41s', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "onde vai ser o inter?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nSobre o local:\n\n*Parque de Exposições:* Rod. Inter, km 5\n*Praças esportivas:*\n• Ginásio Municipal — Av. Principal, 100 - Centro\n\n_Detalhes de festas: menu *Festas* → Local. Jogos: *Esportes* → Praças._"}, {"role": "user", "content": "quando vai ser?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nSobre as datas:\n\nO inter 2026 vai acontecer entre os dias 20 e 22 de novembro"}]', '2026-05-25 18:50:28.394', '2026-05-25 19:02:27.583');
INSERT INTO public.help_sessions VALUES ('cmplkx2xg0007use489yz0w0m', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "onde vai ser o inter"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nSobre o local:\n\nO *Interunesp* acontece em *Presidente Prudente*.\n\n_Endereços de festas e praças esportivas: menus *Festas* → Local e *Esportes* → Praças._"}, {"role": "user", "content": "onde foi o inetr no ano passado?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nAinda não sei o *local ou endereço* sobre *Interunesp*.\n\nCadastre o artigo *Local do Inter* na base de conhecimento com a cidade-sede."}]', '2026-05-25 19:08:13.973', '2026-05-25 19:18:12.694');
INSERT INTO public.help_sessions VALUES ('cmpllmi0a0003uso494rjma39', 'cmpiqta510000us6snjmxaevf', 'closed', '[{"role": "user", "content": "oque é o inter?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nO Interunesp é o maior evento esportivo e cultural universitário do interior de São Paulo. Reúne atléticas de vários campi em competições, festas, tendas e integração."}, {"role": "user", "content": "onde aconteceu no ano passado?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nO *Interunesp* em *2025* foi em *São José do Rio Preto*."}, {"role": "user", "content": "e esse no onde vai acontecer?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nO *Interunesp* em *2026* é em *Presidente Prudente*."}, {"role": "user", "content": "qual a data?"}, {"role": "assistant", "content": "🔥 *chaminha*\n\nO inter 2026 vai acontecer entre os dias 20 e 22 de novembro"}]', '2026-05-25 19:27:59.915', '2026-05-25 19:29:14.534');


--
-- Data for Name: instagram_media_queue; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: inter_editions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inter_editions VALUES ('current', 'active', 1, NULL, NULL, '2026-05-25 15:44:58.853');


--
-- Data for Name: inter_game_days; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inter_game_days VALUES ('cmplyjh9i000uus507zblc74a', 'current', 1, 'Dia 1', '2026-05-25 11:00:00', '2026-05-26 01:00:00', NULL, '2026-05-26 01:29:33.991');
INSERT INTO public.inter_game_days VALUES ('cmplyjh9r000wus503iadxbcm', 'current', 2, 'Dia 2', '2026-05-26 11:00:00', '2026-05-27 01:00:00', NULL, '2026-05-26 01:29:34');
INSERT INTO public.inter_game_days VALUES ('cmplyjh9y000yus5051j873nx', 'current', 3, 'Dia 3', '2026-05-27 11:00:00', '2026-05-28 01:00:00', NULL, '2026-05-26 01:29:34.006');


--
-- Data for Name: knowledge_articles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.knowledge_articles VALUES ('cmpl936jw0001us846xgu13l2', 'Local do Inter 2026', 'O inter 2026 vai acontecer na cidade de Presidente Prudente', 'Local, localização, onde, em que lugar,', true, '2026-05-25 13:37:03.212', '2026-05-25 13:37:10.781');
INSERT INTO public.knowledge_articles VALUES ('cmpl91h6q0000us842l03mf26', 'Data do Inter 2026', 'O inter 2026 vai acontecer entre os dias 20 e 22 de novembro', 'Data, Dia, dias, Quando', true, '2026-05-25 13:35:43.663', '2026-05-25 13:37:39.914');
INSERT INTO public.knowledge_articles VALUES ('cmplkrqbe0008use87b4m07u7', 'Local do Inter 2025', 'São José do Rio Preto', 'Local, localização, onde, em que lugar,', true, '2026-05-25 19:04:04.347', '2026-05-25 19:04:04.347');
INSERT INTO public.knowledge_articles VALUES ('seed-kb-ingresso', 'Ingressos e pacotes', 'O pacote do Inter pode ser consultado no menu *Ingresso* do bot. Você recebe um link para comprar o passaporte e garantir entrada nas festas.', 'ingresso,qr,pacote,ticket', true, '2026-05-23 20:06:51.134', '2026-05-26 00:52:05.131');
INSERT INTO public.knowledge_articles VALUES ('seed-kb-inter', 'O que é o Interunesp', 'O Interunesp é o maior evento esportivo e cultural universitário do interior de São Paulo. Reúne atléticas de vários campi em competições, festas, tendas e integração.', 'inter,interunesp,geral', true, '2026-05-23 20:06:51.103', '2026-05-26 01:29:35.316');
INSERT INTO public.knowledge_articles VALUES ('seed-kb-sos', 'Ajuda humana (Lieu)', 'Use *Ajuda* para perguntas à chaminha (IA). Se precisar de uma pessoa da Lieu, encerre a conversa e toque em *SOS Lieu* para atendimento humano prioritário.', 'sos,lieu,ajuda,atendimento', true, '2026-05-23 20:06:51.14', '2026-05-26 01:29:35.323');
INSERT INTO public.knowledge_articles VALUES ('seed-kb-esportes', 'Esportes e placar', 'No menu *Esportes* você vê placar ao vivo, próximos jogos, atlética e chaveamento. Os placares são atualizados pela comissão em tempo real durante os jogos.', 'jogo,placar,esporte,modalidade', true, '2026-05-23 20:06:51.146', '2026-05-26 01:29:35.328');
INSERT INTO public.knowledge_articles VALUES ('seed-kb-festas', 'Festas', 'No menu *Festas* há programação dos 3 dias (cerca de 12h cada), headliner por dia, line-up, local e vídeo promocional. Horários podem mudar — confira a agenda atualizada.', 'festa,show,lineup,local', true, '2026-05-23 20:06:51.165', '2026-05-26 01:29:35.342');


--
-- Data for Name: local_guide_places; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.locations VALUES ('seed-location-tenda', 'Parque de Exposições', 'Rod. Inter, km 5', NULL, '2026-05-23 19:19:15.923', NULL, NULL);
INSERT INTO public.locations VALUES ('seed-location-festa', 'Parque de Exposições', 'Rod. Inter, km 5', NULL, '2026-05-26 01:29:35.196', NULL, NULL);


--
-- Data for Name: match_assignments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: match_closure_requests; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: match_disciplines; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: match_events; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: match_incidents; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.match_incidents VALUES ('cmpl9t4e9001dus8gek86myyt', 'cmpj3fdla0001us5ou5v11y7o', 'other', 'Não houve intercorrência', NULL, NULL, NULL, NULL, NULL, '2026-05-25 13:57:13.474', '2026-05-25 13:57:13.474', '2026-05-25 13:57:13.471', NULL);
INSERT INTO public.match_incidents VALUES ('cmpl9tchj002rus8gmm1iy0oy', 'cmpj31p910001usf0kzfkpirg', 'other', 'Não houve intercorrência', NULL, NULL, NULL, NULL, NULL, '2026-05-25 13:57:23.959', '2026-05-25 13:57:23.959', '2026-05-25 13:57:23.956', NULL);
INSERT INTO public.match_incidents VALUES ('cmplbnnp50001us0golu4ntif', 'seed-match-1', 'other', 'Não houve intercorrência', NULL, NULL, NULL, NULL, NULL, '2026-05-25 14:48:57.785', '2026-05-25 14:49:21.361', '2026-05-25 14:49:21.358', '2026-05-25 14:48:57.784');
INSERT INTO public.match_incidents VALUES ('cmplcj2an0008us94n280l3k2', 'cmplciv960001us94rp6g5dss', 'other', 'Não houve intercorrência', NULL, NULL, NULL, NULL, NULL, '2026-05-25 15:13:23.039', '2026-05-25 15:13:56.021', '2026-05-25 15:13:56.018', '2026-05-25 15:13:23.038');


--
-- Data for Name: match_participants; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.match_participants VALUES ('cmplcjrjy001dus94otuy8ggt', 'cmplciv960001us94rp6g5dss', 'Rosana', 1, 0, '2026-05-25 15:13:55.775');
INSERT INTO public.match_participants VALUES ('cmplcjrjy001eus94o4c44k9n', 'cmplciv960001us94rp6g5dss', 'São José do Rio Preto', 5, 1, '2026-05-25 15:13:55.775');
INSERT INTO public.match_participants VALUES ('cmplcjrjy001fus94lbcuhd21', 'cmplciv960001us94rp6g5dss', 'São Paulo', 2, 2, '2026-05-25 15:13:55.775');
INSERT INTO public.match_participants VALUES ('cmplcjrjy001gus945qvg59c7', 'cmplciv960001us94rp6g5dss', 'Ilha Solteira', 3, 3, '2026-05-25 15:13:55.775');
INSERT INTO public.match_participants VALUES ('cmplcjrjy001hus940lalsh1n', 'cmplciv960001us94rp6g5dss', 'Ourinhos', 4, 4, '2026-05-25 15:13:55.775');


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.matches VALUES ('cmpj31p910001usf0kzfkpirg', 'cmpiwvf7b000hus08cpugkmm2', 'seed-venue-ginasio', 'Rio Claro', 'Bauru', 0, 1, '2026-12-26 00:00:00', 'finished', NULL, NULL, NULL, '2026-05-24 01:12:24.047', '2026-05-25 13:57:23.945', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmpiz1usl0001us9slucrtwdb', 'cmpiwvesc0004us08bv7aglp9', 'seed-venue-ginasio', 'SV', 'SP', 0, 0, '2026-08-07 23:22:00', 'finished', NULL, NULL, NULL, '2026-05-23 23:20:32.77', '2026-05-23 23:21:30.584', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplciv960001us94rp6g5dss', 'cmpiwvf7r000jus08e6tyh3oy', 'seed-venue-ginasio', NULL, NULL, 0, 0, '2026-06-06 15:19:00', 'finished', NULL, NULL, 'Revezamento 4x100 metros rasos', '2026-05-25 15:13:13.915', '2026-05-25 15:13:56.009', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmpldtpcf0001useo1xqtqn8o', 'cmpiwvf7r000jus08e6tyh3oy', 'seed-venue-ginasio', 'Rosana', 'São José do Rio Preto', 0, 0, '2026-05-25 15:49:38.929', 'scheduled', 'Oitavas', NULL, NULL, '2026-05-25 15:49:39.066', '2026-05-25 15:49:39.066', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmpiz3mdd0003us9so2th7lcd', 'cmpiwvesr0005us08hgzihdku', 'seed-venue-ginasio', 'SP', 'SV', 1, 0, '2026-11-28 02:21:00', 'scheduled', NULL, NULL, NULL, '2026-05-23 23:21:55.202', '2026-05-25 17:11:02.833', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmpj3fdla0001us5ou5v11y7o', 'cmpiwveut000aus08s6o4b28v', 'seed-venue-ginasio', 'Franca', 'Marília', 3, 0, '2026-07-29 06:22:00', 'finished', NULL, NULL, NULL, '2026-05-24 01:23:02.158', '2026-05-25 13:57:13.461', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwx8440019usfsyuushls7', 'cmpiwvesc0004us08bv7aglp9', NULL, 'Bauru', 'São Vicente', 0, 0, '2026-05-26 00:44:16.083', 'scheduled', 'Oitavas (1ª divisão)', 'Confronto 1 · Bauru × São Vicente', NULL, '2026-05-26 00:44:16.084', '2026-05-26 00:44:16.084', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwxpon001busfso82giexx', 'cmpiwvesc0004us08bv7aglp9', NULL, 'São José dos Campos', 'Franca', 0, 0, '2026-05-26 00:44:38.855', 'scheduled', 'Oitavas (1ª divisão)', 'Confronto 2 · São José dos Campos × Franca', NULL, '2026-05-26 00:44:38.856', '2026-05-26 00:44:38.856', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwxxui001dusfs14nxmyjj', 'cmpiwvesc0004us08bv7aglp9', NULL, 'Botucatu', 'São José do Rio Preto', 0, 0, '2026-05-26 00:44:49.433', 'scheduled', 'Oitavas (1ª divisão)', 'Confronto 3 · Botucatu × São José do Rio Preto', NULL, '2026-05-26 00:44:49.434', '2026-05-26 00:44:49.434', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwy2jd001fusfs3x4t8yyh', 'cmpiwvesc0004us08bv7aglp9', NULL, 'Tupã', 'Rio Claro', 0, 0, '2026-05-26 00:44:55.512', 'scheduled', 'Oitavas (1ª divisão)', 'Confronto 4 · Tupã × Rio Claro', NULL, '2026-05-26 00:44:55.513', '2026-05-26 00:44:55.513', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwya7q001husfsi9xq2y2w', 'cmpiwvesc0004us08bv7aglp9', NULL, 'Presidente Prudente', 'Guaratinguetá', 0, 0, '2026-05-26 00:45:05.462', 'scheduled', 'Oitavas (1ª divisão)', 'Confronto 5 · Presidente Prudente × Guaratinguetá', NULL, '2026-05-26 00:45:05.463', '2026-05-26 00:45:05.463', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwyeie001jusfs3t0910ef', 'cmpiwvesc0004us08bv7aglp9', NULL, 'Jaboticabal', 'Araçatuba', 0, 0, '2026-05-26 00:45:11.03', 'scheduled', 'Oitavas (1ª divisão)', 'Confronto 6 · Jaboticabal × Araçatuba', NULL, '2026-05-26 00:45:11.031', '2026-05-26 00:45:11.031', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwym22001lusfsejcba117', 'cmpiwvesc0004us08bv7aglp9', NULL, 'Ilha Solteira', 'Araraquara', 0, 0, '2026-05-26 00:45:20.809', 'scheduled', 'Oitavas (1ª divisão)', 'Confronto 7 · Ilha Solteira × Araraquara', NULL, '2026-05-26 00:45:20.81', '2026-05-26 00:45:20.81', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwzase001nusfsdd5ghvpk', 'cmpiwvesc0004us08bv7aglp9', NULL, NULL, NULL, 0, 0, '2026-05-26 00:45:52.862', 'scheduled', 'Quartas (1ª divisão)', 'Confronto 8 · Vencedor confronto 1 × Vencedor confronto 2', NULL, '2026-05-26 00:45:52.863', '2026-05-26 00:45:52.863', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwzasm001pusfsnmzeaydi', 'cmpiwvesc0004us08bv7aglp9', NULL, NULL, NULL, 0, 0, '2026-05-26 00:45:52.87', 'scheduled', 'Quartas (1ª divisão)', 'Confronto 9 · Vencedor confronto 3 × Vencedor confronto 4', NULL, '2026-05-26 00:45:52.871', '2026-05-26 00:45:52.871', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwzast001rusfso9ln8232', 'cmpiwvesc0004us08bv7aglp9', NULL, NULL, NULL, 0, 0, '2026-05-26 00:45:52.877', 'scheduled', 'Quartas (1ª divisão)', 'Confronto 10 · Vencedor confronto 5 × Vencedor confronto 6', NULL, '2026-05-26 00:45:52.877', '2026-05-26 00:45:52.877', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwzat0001tusfs21j0szja', 'cmpiwvesc0004us08bv7aglp9', NULL, NULL, NULL, 0, 0, '2026-05-26 00:45:52.883', 'scheduled', 'Semifinal (1ª divisão)', 'Confronto 11 · Vencedor confronto 8 × Vencedor confronto 9', NULL, '2026-05-26 00:45:52.884', '2026-05-26 00:45:52.884', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwzat9001vusfs4hdpht7k', 'cmpiwvesc0004us08bv7aglp9', NULL, NULL, NULL, 0, 0, '2026-05-26 00:45:52.892', 'scheduled', 'Semifinal (1ª divisão)', 'Confronto 12 · Vencedor confronto 10 × Vencedor confronto 7', NULL, '2026-05-26 00:45:52.893', '2026-05-26 00:45:52.893', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplwzatf001xusfs3dfbc27x', 'cmpiwvesc0004us08bv7aglp9', NULL, NULL, NULL, 0, 0, '2026-05-26 00:45:52.899', 'scheduled', 'Final (1ª divisão)', 'Confronto 13 · Vencedor confronto 11 × Vencedor confronto 12', NULL, '2026-05-26 00:45:52.9', '2026-05-26 00:45:52.9', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('cmplx0b7h001zusfs0c16dvzk', 'cmpiwvesc0004us08bv7aglp9', NULL, 'São Paulo', 'São João da Boa Vista', 0, 0, '2026-05-26 00:46:40.06', 'scheduled', 'Oitavas (2ª divisão)', 'Confronto 1 · São Paulo × São João da Boa Vista', NULL, '2026-05-26 00:46:40.061', '2026-05-26 00:46:40.061', NULL, NULL, 10, NULL, NULL, false);
INSERT INTO public.matches VALUES ('seed-match-1', 'cmpiwveut000aus08s6o4b28v', 'seed-venue-ginasio', 'Bauru', 'Rio Claro', 2, 1, '2026-05-24 17:00:00', 'scheduled', 'Grupos', NULL, NULL, '2026-05-23 19:19:15.895', '2026-05-26 01:29:35.187', NULL, NULL, 10, NULL, NULL, false);


--
-- Data for Name: modalidades; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.modalidades VALUES ('cmpiwvesc0004us08bv7aglp9', 'Basquete', 'basquete-masculino', '2026-05-23 22:19:32.893', 'collective', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvet40006us08wb767y5e', 'Futebol de Campo', 'futebol-campo-masculino', '2026-05-23 22:19:32.92', 'collective', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwveth0007us08x3q3oecg', 'Futebol de Campo', 'futebol-campo-feminino', '2026-05-23 22:19:32.933', 'collective', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwveu00008us0805e15agz', 'Futebol Society', 'futebol-society-masculino', '2026-05-23 22:19:32.952', 'collective', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwveuf0009us088ss010a2', 'Futebol Society', 'futebol-society-feminino', '2026-05-23 22:19:32.968', 'collective', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwveut000aus08s6o4b28v', 'Futsal', 'futsal-masculino', '2026-05-23 22:19:32.982', 'collective', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvev0000bus08hnub5iqk', 'Futsal', 'futsal-feminino', '2026-05-23 22:19:32.988', 'collective', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvevh000cus08d6uloss5', 'Handebol', 'handebol-masculino', '2026-05-23 22:19:33.005', 'collective', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvew0000dus08ohxmtiv1', 'Handebol', 'handebol-feminino', '2026-05-23 22:19:33.024', 'collective', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvewd000eus08wqruc9ou', 'Vôlei', 'volei-masculino', '2026-05-23 22:19:33.037', 'collective', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvewv000fus08ha7uvam1', 'Vôlei', 'volei-feminino', '2026-05-23 22:19:33.055', 'collective', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvex6000gus08u4rxrnqv', 'Vôlei de Praia', 'volei-praia-masculino', '2026-05-23 22:19:33.066', 'collective', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf7b000hus08cpugkmm2', 'Vôlei de Praia', 'volei-praia-feminino', '2026-05-23 22:19:33.432', 'collective', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf7h000ius081nl6en9u', 'Atletismo', 'atletismo-masculino', '2026-05-23 22:19:33.438', 'individual', 'male', 'placement', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf7r000jus08e6tyh3oy', 'Atletismo', 'atletismo-feminino', '2026-05-23 22:19:33.448', 'individual', 'female', 'placement', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf7x000kus08izix38z4', 'Judô', 'judo-masculino', '2026-05-23 22:19:33.453', 'individual', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf82000lus08df8ybh82', 'Judô', 'judo-feminino', '2026-05-23 22:19:33.459', 'individual', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf8d000mus08lxatzpi7', 'Natação', 'natacao-masculino', '2026-05-23 22:19:33.47', 'individual', 'male', 'placement', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf8q000nus089ltev5f3', 'Natação', 'natacao-feminino', '2026-05-23 22:19:33.483', 'individual', 'female', 'placement', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf8w000ous08qoxhnb53', 'Tênis de Mesa', 'tenis-mesa-masculino', '2026-05-23 22:19:33.488', 'individual', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf91000pus081ep8mb8e', 'Tênis de Mesa', 'tenis-mesa-feminino', '2026-05-23 22:19:33.493', 'individual', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf9b000qus08ep5ejqx7', 'Tênis de Campo', 'tenis-campo-masculino', '2026-05-23 22:19:33.503', 'individual', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf9q000rus08n4t3rzxh', 'Tênis de Campo', 'tenis-campo-feminino', '2026-05-23 22:19:33.518', 'individual', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvf9x000sus088hitwbm6', 'Xadrez', 'xadrez-masculino', '2026-05-23 22:19:33.525', 'individual', 'male', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvfad000tus08ryv4x7ap', 'Xadrez', 'xadrez-feminino', '2026-05-23 22:19:33.542', 'individual', 'female', 'versus', false);
INSERT INTO public.modalidades VALUES ('cmpiwvesr0005us08hgzihdku', 'Basquete', 'basquete-feminino', '2026-05-23 22:19:32.908', 'collective', 'female', 'versus', false);


--
-- Data for Name: notification_opt_ins; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notification_opt_ins VALUES ('cmpirnqyc000pus74leyjd0hk', 'cmpiqta510000us6snjmxaevf', 'general', false, '2026-05-23 19:53:37.332');


--
-- Data for Name: segments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.segments VALUES ('cmpiqfkel0003uso8wu0dsblk', 'Geral', 'general', 'Todos com opt-in geral', NULL, '2026-05-23 19:19:15.982');


--
-- Data for Name: sports_alert_atleticas; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: venue_coordinator_authorizations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.venue_coordinator_authorizations VALUES ('cmpj6qkue0001usu0t0bevzrc', 'cmpiwveqk0002us08tpjbvdvg', 'seed-venue-ginasio', 'cmpiqfk2w0000uso87zxt6qo8', '2026-05-24 02:55:43.622');


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.venues VALUES ('seed-venue-ginasio', 'Ginásio Municipal', 'Av. Principal, 100 - Centro', 'https://maps.google.com', '2026-05-23 19:19:15.865', NULL, NULL);


--
-- Data for Name: wa_users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.wa_users VALUES ('cmpiuussz0008usg81jhn4p2m', '5511888777666', 'Demo', '2026-05-23 21:23:05.171', '2026-05-23 21:23:14.684');
INSERT INTO public.wa_users VALUES ('cmpiv052c000dusg8yiqqmpk4', '5511777666555', 'Demo', '2026-05-23 21:27:14.34', '2026-05-23 21:27:17.239');
INSERT INTO public.wa_users VALUES ('cmpiv0rwq000musg83okw4sc0', '5511666555444', 'Demo', '2026-05-23 21:27:43.947', '2026-05-23 21:27:45.349');
INSERT INTO public.wa_users VALUES ('cmpiv1si30000usx0urrfozjw', '5511999000111', 'Demo', '2026-05-23 21:28:31.371', '2026-05-23 21:28:35.31');
INSERT INTO public.wa_users VALUES ('cmpiv34dj000dusx07sjv6wrg', '5511999000333', 'Demo', '2026-05-23 21:29:33.416', '2026-05-23 21:29:34.512');
INSERT INTO public.wa_users VALUES ('cmpiv41fr000husx0yzahqq7j', '5511999000444', 'Demo', '2026-05-23 21:30:16.264', '2026-05-23 21:30:17.377');
INSERT INTO public.wa_users VALUES ('cmpiqta510000us6snjmxaevf', '5511999999999', 'Demo', '2026-05-23 19:29:55.861', '2026-05-26 12:33:22.05');


--
-- Data for Name: webhook_events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.webhook_events VALUES ('sim-1779564595824', true, '2026-05-23 19:29:55.833');
INSERT INTO public.webhook_events VALUES ('sim-1779564961718', true, '2026-05-23 19:36:01.76');
INSERT INTO public.webhook_events VALUES ('sim-1779564975315', true, '2026-05-23 19:36:15.32');
INSERT INTO public.webhook_events VALUES ('sim-1779565063716', true, '2026-05-23 19:37:43.736');
INSERT INTO public.webhook_events VALUES ('sim-1779565067584', true, '2026-05-23 19:37:47.587');
INSERT INTO public.webhook_events VALUES ('sim-1779565973416', true, '2026-05-23 19:52:53.447');
INSERT INTO public.webhook_events VALUES ('sim-1779565983344', true, '2026-05-23 19:53:03.347');
INSERT INTO public.webhook_events VALUES ('sim-1779565987208', true, '2026-05-23 19:53:07.215');
INSERT INTO public.webhook_events VALUES ('sim-1779565995971', true, '2026-05-23 19:53:15.979');
INSERT INTO public.webhook_events VALUES ('sim-1779566003799', true, '2026-05-23 19:53:23.802');
INSERT INTO public.webhook_events VALUES ('sim-1779566005731', true, '2026-05-23 19:53:25.734');
INSERT INTO public.webhook_events VALUES ('sim-1779566011374', true, '2026-05-23 19:53:31.384');
INSERT INTO public.webhook_events VALUES ('sim-1779566017277', true, '2026-05-23 19:53:37.294');
INSERT INTO public.webhook_events VALUES ('sim-1779566043438', true, '2026-05-23 19:54:03.445');
INSERT INTO public.webhook_events VALUES ('sim-1779566045467', true, '2026-05-23 19:54:05.476');
INSERT INTO public.webhook_events VALUES ('sim-1779566047736', true, '2026-05-23 19:54:07.743');
INSERT INTO public.webhook_events VALUES ('sim-1779566050032', true, '2026-05-23 19:54:10.04');
INSERT INTO public.webhook_events VALUES ('sim-1779566051842', true, '2026-05-23 19:54:11.844');
INSERT INTO public.webhook_events VALUES ('sim-1779566054827', true, '2026-05-23 19:54:14.829');
INSERT INTO public.webhook_events VALUES ('sim-1779566175898', true, '2026-05-23 19:56:15.903');
INSERT INTO public.webhook_events VALUES ('sim-1779567395508', true, '2026-05-23 20:16:35.541');
INSERT INTO public.webhook_events VALUES ('sim-1779567414093', true, '2026-05-23 20:16:54.098');
INSERT INTO public.webhook_events VALUES ('sim-1779567420943', true, '2026-05-23 20:17:00.946');
INSERT INTO public.webhook_events VALUES ('sim-1779567683470', true, '2026-05-23 20:21:23.48');
INSERT INTO public.webhook_events VALUES ('sim-1779567741150', true, '2026-05-23 20:22:21.153');
INSERT INTO public.webhook_events VALUES ('sim-1779567750330', true, '2026-05-23 20:22:30.333');
INSERT INTO public.webhook_events VALUES ('sim-1779568066614', true, '2026-05-23 20:27:46.619');
INSERT INTO public.webhook_events VALUES ('sim-1779568070138', true, '2026-05-23 20:27:50.141');
INSERT INTO public.webhook_events VALUES ('sim-1779568084929', true, '2026-05-23 20:28:04.933');
INSERT INTO public.webhook_events VALUES ('sim-1779569076859', true, '2026-05-23 20:44:36.862');
INSERT INTO public.webhook_events VALUES ('sim-1779569083090', true, '2026-05-23 20:44:43.093');
INSERT INTO public.webhook_events VALUES ('sim-1779569087327', true, '2026-05-23 20:44:47.33');
INSERT INTO public.webhook_events VALUES ('sim-1779569098074', true, '2026-05-23 20:44:58.077');
INSERT INTO public.webhook_events VALUES ('sim-1779569212173', true, '2026-05-23 20:46:52.175');
INSERT INTO public.webhook_events VALUES ('sim-1779569246722', true, '2026-05-23 20:47:26.728');
INSERT INTO public.webhook_events VALUES ('sim-1779569248925', true, '2026-05-23 20:47:28.928');
INSERT INTO public.webhook_events VALUES ('sim-1779569258351', true, '2026-05-23 20:47:38.354');
INSERT INTO public.webhook_events VALUES ('sim-1779569270237', true, '2026-05-23 20:47:50.24');
INSERT INTO public.webhook_events VALUES ('sim-1779569274364', true, '2026-05-23 20:47:54.366');
INSERT INTO public.webhook_events VALUES ('sim-1779569283443', true, '2026-05-23 20:48:03.447');
INSERT INTO public.webhook_events VALUES ('sim-1779569319011', true, '2026-05-23 20:48:39.013');
INSERT INTO public.webhook_events VALUES ('sim-1779569326005', true, '2026-05-23 20:48:46.007');
INSERT INTO public.webhook_events VALUES ('sim-1779569327609', true, '2026-05-23 20:48:47.611');
INSERT INTO public.webhook_events VALUES ('sim-1779569330531', true, '2026-05-23 20:48:50.533');
INSERT INTO public.webhook_events VALUES ('sim-1779569835956', true, '2026-05-23 20:57:15.959');
INSERT INTO public.webhook_events VALUES ('sim-1779569839900', true, '2026-05-23 20:57:19.902');
INSERT INTO public.webhook_events VALUES ('sim-1779569846372', true, '2026-05-23 20:57:26.373');
INSERT INTO public.webhook_events VALUES ('sim-1779569857691', true, '2026-05-23 20:57:37.693');
INSERT INTO public.webhook_events VALUES ('sim-1779569867738', true, '2026-05-23 20:57:47.741');
INSERT INTO public.webhook_events VALUES ('sim-1779569869317', true, '2026-05-23 20:57:49.319');
INSERT INTO public.webhook_events VALUES ('sim-1779569872574', true, '2026-05-23 20:57:52.577');
INSERT INTO public.webhook_events VALUES ('sim-1779569876206', true, '2026-05-23 20:57:56.208');
INSERT INTO public.webhook_events VALUES ('sim-1779569877508', true, '2026-05-23 20:57:57.511');
INSERT INTO public.webhook_events VALUES ('sim-1779569880459', true, '2026-05-23 20:58:00.462');
INSERT INTO public.webhook_events VALUES ('sim-1779570153369', true, '2026-05-23 21:02:33.372');
INSERT INTO public.webhook_events VALUES ('sim-1779570156437', true, '2026-05-23 21:02:36.44');
INSERT INTO public.webhook_events VALUES ('sim-1779570158059', true, '2026-05-23 21:02:38.061');
INSERT INTO public.webhook_events VALUES ('sim-1779570161874', true, '2026-05-23 21:02:41.877');
INSERT INTO public.webhook_events VALUES ('sim-1779570163854', true, '2026-05-23 21:02:43.857');
INSERT INTO public.webhook_events VALUES ('sim-1779570165895', true, '2026-05-23 21:02:45.897');
INSERT INTO public.webhook_events VALUES ('sim-1779570168233', true, '2026-05-23 21:02:48.235');
INSERT INTO public.webhook_events VALUES ('sim-1779570169855', true, '2026-05-23 21:02:49.858');
INSERT INTO public.webhook_events VALUES ('sim-1779570171205', true, '2026-05-23 21:02:51.208');
INSERT INTO public.webhook_events VALUES ('sim-1779570173665', true, '2026-05-23 21:02:53.667');
INSERT INTO public.webhook_events VALUES ('sim-1779570930679', true, '2026-05-23 21:15:30.683');
INSERT INTO public.webhook_events VALUES ('sim-1779570985457', true, '2026-05-23 21:16:25.459');
INSERT INTO public.webhook_events VALUES ('sim-1779570991745', true, '2026-05-23 21:16:31.748');
INSERT INTO public.webhook_events VALUES ('sim-1779570996761', true, '2026-05-23 21:16:36.763');
INSERT INTO public.webhook_events VALUES ('sim-1779571385149', true, '2026-05-23 21:23:05.155');
INSERT INTO public.webhook_events VALUES ('sim-1779571385788', true, '2026-05-23 21:23:05.79');
INSERT INTO public.webhook_events VALUES ('sim-1779571394674', true, '2026-05-23 21:23:14.676');
INSERT INTO public.webhook_events VALUES ('sim-1779571634322', true, '2026-05-23 21:27:14.325');
INSERT INTO public.webhook_events VALUES ('sim-1779571635109', true, '2026-05-23 21:27:15.114');
INSERT INTO public.webhook_events VALUES ('sim-1779571635757', true, '2026-05-23 21:27:15.761');
INSERT INTO public.webhook_events VALUES ('sim-1779571636408', true, '2026-05-23 21:27:16.411');
INSERT INTO public.webhook_events VALUES ('sim-1779571637213', true, '2026-05-23 21:27:17.219');
INSERT INTO public.webhook_events VALUES ('sim-1779571663909', true, '2026-05-23 21:27:43.912');
INSERT INTO public.webhook_events VALUES ('sim-1779571664583', true, '2026-05-23 21:27:44.585');
INSERT INTO public.webhook_events VALUES ('sim-1779571665283', true, '2026-05-23 21:27:45.285');
INSERT INTO public.webhook_events VALUES ('sim-1779571711145-nu11lp', true, '2026-05-23 21:28:31.154');
INSERT INTO public.webhook_events VALUES ('sim-1779571712235-etdylr', true, '2026-05-23 21:28:32.239');
INSERT INTO public.webhook_events VALUES ('sim-1779571712882-pkshu7', true, '2026-05-23 21:28:32.886');
INSERT INTO public.webhook_events VALUES ('sim-1779571714543-qaj11p', true, '2026-05-23 21:28:34.547');
INSERT INTO public.webhook_events VALUES ('sim-1779571715300-eq76ad', true, '2026-05-23 21:28:35.303');
INSERT INTO public.webhook_events VALUES ('sim-1779571773404-la5xdm', true, '2026-05-23 21:29:33.409');
INSERT INTO public.webhook_events VALUES ('sim-1779571774476-yez5ge', true, '2026-05-23 21:29:34.478');
INSERT INTO public.webhook_events VALUES ('sim-1779571816255-btyj2v', true, '2026-05-23 21:30:16.258');
INSERT INTO public.webhook_events VALUES ('sim-1779571817369-bmhdwb', true, '2026-05-23 21:30:17.372');
INSERT INTO public.webhook_events VALUES ('sim-1779573091368-i15edw', true, '2026-05-23 21:51:31.707');
INSERT INTO public.webhook_events VALUES ('sim-1779573101990-g19848', true, '2026-05-23 21:51:41.996');
INSERT INTO public.webhook_events VALUES ('sim-1779573114142-8jgm6p', true, '2026-05-23 21:51:54.148');
INSERT INTO public.webhook_events VALUES ('sim-1779591570206-kodrnr', true, '2026-05-24 02:59:30.216');
INSERT INTO public.webhook_events VALUES ('sim-1779591574546-gctwic', true, '2026-05-24 02:59:34.567');
INSERT INTO public.webhook_events VALUES ('sim-1779591603747-orffx9', true, '2026-05-24 03:00:03.751');
INSERT INTO public.webhook_events VALUES ('sim-1779591608529-8q4fhp', true, '2026-05-24 03:00:08.533');
INSERT INTO public.webhook_events VALUES ('sim-1779591609996-ub1loi', true, '2026-05-24 03:00:09.999');
INSERT INTO public.webhook_events VALUES ('sim-1779591647671-2u36mg', true, '2026-05-24 03:00:47.675');
INSERT INTO public.webhook_events VALUES ('sim-1779591653908-lnu1z5', true, '2026-05-24 03:00:53.911');
INSERT INTO public.webhook_events VALUES ('sim-1779592198922-fn2th9', true, '2026-05-24 03:09:58.927');
INSERT INTO public.webhook_events VALUES ('sim-1779592201762-umrmny', true, '2026-05-24 03:10:01.765');
INSERT INTO public.webhook_events VALUES ('sim-1779592204343-k7q2kv', true, '2026-05-24 03:10:04.345');
INSERT INTO public.webhook_events VALUES ('sim-1779592206118-1kzrs5', true, '2026-05-24 03:10:06.12');
INSERT INTO public.webhook_events VALUES ('sim-1779592213733-z7ywxc', true, '2026-05-24 03:10:13.735');
INSERT INTO public.webhook_events VALUES ('sim-1779593888401-7eut9x', true, '2026-05-24 03:38:08.405');
INSERT INTO public.webhook_events VALUES ('sim-1779593890757-53tckb', true, '2026-05-24 03:38:10.759');
INSERT INTO public.webhook_events VALUES ('sim-1779608584959-e2ux5c', true, '2026-05-24 07:43:04.968');
INSERT INTO public.webhook_events VALUES ('sim-1779608591316-4dm7e5', true, '2026-05-24 07:43:11.318');
INSERT INTO public.webhook_events VALUES ('sim-1779608594526-2b3kjv', true, '2026-05-24 07:43:14.528');
INSERT INTO public.webhook_events VALUES ('sim-1779608599920-qv3dys', true, '2026-05-24 07:43:19.922');
INSERT INTO public.webhook_events VALUES ('sim-1779718581388-7q3hhy', true, '2026-05-25 14:16:21.4');
INSERT INTO public.webhook_events VALUES ('sim-1779718584867-os7wkr', true, '2026-05-25 14:16:24.869');
INSERT INTO public.webhook_events VALUES ('sim-1779718607918-bhq2py', true, '2026-05-25 14:16:47.921');
INSERT INTO public.webhook_events VALUES ('sim-1779718863440-9vh5qo', true, '2026-05-25 14:21:03.443');
INSERT INTO public.webhook_events VALUES ('sim-1779718894893-n0o68e', true, '2026-05-25 14:21:34.911');
INSERT INTO public.webhook_events VALUES ('sim-1779719185343-3mtem6', true, '2026-05-25 14:26:25.346');
INSERT INTO public.webhook_events VALUES ('sim-1779719192934-dut9wc', true, '2026-05-25 14:26:32.936');
INSERT INTO public.webhook_events VALUES ('sim-1779719198393-uwf4zd', true, '2026-05-25 14:26:38.413');
INSERT INTO public.webhook_events VALUES ('sim-1779720645000-sguac6', true, '2026-05-25 14:50:45.004');
INSERT INTO public.webhook_events VALUES ('sim-1779720646819-hoaru9', true, '2026-05-25 14:50:46.821');
INSERT INTO public.webhook_events VALUES ('sim-1779720658702-5vg47a', true, '2026-05-25 14:50:58.704');
INSERT INTO public.webhook_events VALUES ('sim-1779720676376-19jfn0', true, '2026-05-25 14:51:16.379');
INSERT INTO public.webhook_events VALUES ('sim-1779720713457-jvblqp', true, '2026-05-25 14:51:53.46');
INSERT INTO public.webhook_events VALUES ('sim-1779724987257-y5epbg', true, '2026-05-25 16:03:07.262');
INSERT INTO public.webhook_events VALUES ('sim-1779724989578-qttla9', true, '2026-05-25 16:03:09.581');
INSERT INTO public.webhook_events VALUES ('sim-1779725010035-rop6t7', true, '2026-05-25 16:03:30.037');
INSERT INTO public.webhook_events VALUES ('sim-1779725013076-47d4xo', true, '2026-05-25 16:03:33.078');
INSERT INTO public.webhook_events VALUES ('sim-1779730185566-ia3zm8', true, '2026-05-25 17:29:45.569');
INSERT INTO public.webhook_events VALUES ('sim-1779730206217-pj3dmb', true, '2026-05-25 17:30:06.219');
INSERT INTO public.webhook_events VALUES ('sim-1779730214506-x8ga99', true, '2026-05-25 17:30:14.508');
INSERT INTO public.webhook_events VALUES ('sim-1779730247359-wr7nfd', true, '2026-05-25 17:30:47.363');
INSERT INTO public.webhook_events VALUES ('sim-1779730255551-xnrzvg', true, '2026-05-25 17:30:55.554');
INSERT INTO public.webhook_events VALUES ('sim-1779730267443-zlfmwk', true, '2026-05-25 17:31:07.446');
INSERT INTO public.webhook_events VALUES ('sim-1779730278791-xhondp', true, '2026-05-25 17:31:18.793');
INSERT INTO public.webhook_events VALUES ('sim-1779735009691-m9tuf5', true, '2026-05-25 18:50:09.695');
INSERT INTO public.webhook_events VALUES ('sim-1779735024779-kr7s2t', true, '2026-05-25 18:50:24.783');
INSERT INTO public.webhook_events VALUES ('sim-1779735028369-ha144s', true, '2026-05-25 18:50:28.372');
INSERT INTO public.webhook_events VALUES ('sim-1779735035292-iqrk0a', true, '2026-05-25 18:50:35.295');
INSERT INTO public.webhook_events VALUES ('sim-1779735069074-jw8p8n', true, '2026-05-25 18:51:09.079');
INSERT INTO public.webhook_events VALUES ('sim-1779735748541-52dyj8', true, '2026-05-25 19:02:28.545');
INSERT INTO public.webhook_events VALUES ('sim-1779735751833-i3g45m', true, '2026-05-25 19:02:31.836');
INSERT INTO public.webhook_events VALUES ('sim-1779735757202-71c7tx', true, '2026-05-25 19:02:37.205');
INSERT INTO public.webhook_events VALUES ('sim-1779735787353-1jozcr', true, '2026-05-25 19:03:07.356');
INSERT INTO public.webhook_events VALUES ('sim-1779735856319-ud3fsm', true, '2026-05-25 19:04:16.322');
INSERT INTO public.webhook_events VALUES ('sim-1779736078497-okc56e', true, '2026-05-25 19:07:58.506');
INSERT INTO public.webhook_events VALUES ('sim-1779736085298-n0qrtz', true, '2026-05-25 19:08:05.302');
INSERT INTO public.webhook_events VALUES ('sim-1779736087480-qc991b', true, '2026-05-25 19:08:07.483');
INSERT INTO public.webhook_events VALUES ('sim-1779736093946-j8wuyn', true, '2026-05-25 19:08:13.949');
INSERT INTO public.webhook_events VALUES ('sim-1779736102575-2be0x5', true, '2026-05-25 19:08:22.577');
INSERT INTO public.webhook_events VALUES ('sim-1779736118557-qkoz1y', true, '2026-05-25 19:08:38.56');
INSERT INTO public.webhook_events VALUES ('sim-1779737262460-f2dmv2', true, '2026-05-25 19:27:42.492');
INSERT INTO public.webhook_events VALUES ('sim-1779737279886-d553ki', true, '2026-05-25 19:27:59.89');
INSERT INTO public.webhook_events VALUES ('sim-1779737286984-j2pwc3', true, '2026-05-25 19:28:06.988');
INSERT INTO public.webhook_events VALUES ('sim-1779737308908-w9v3dm', true, '2026-05-25 19:28:28.912');
INSERT INTO public.webhook_events VALUES ('sim-1779737321592-tbte21', true, '2026-05-25 19:28:41.595');
INSERT INTO public.webhook_events VALUES ('sim-1779737336045-1j410b', true, '2026-05-25 19:28:56.051');
INSERT INTO public.webhook_events VALUES ('sim-1779737354504-00ijx9', true, '2026-05-25 19:29:14.508');
INSERT INTO public.webhook_events VALUES ('sim-1779737366626-e4r1cb', true, '2026-05-25 19:29:26.629');
INSERT INTO public.webhook_events VALUES ('sim-1779737379425-x22jo7', true, '2026-05-25 19:29:39.429');
INSERT INTO public.webhook_events VALUES ('sim-1779737388276-bq90sc', true, '2026-05-25 19:29:48.279');
INSERT INTO public.webhook_events VALUES ('sim-1779756493299-vet40f', true, '2026-05-26 00:48:13.304');
INSERT INTO public.webhook_events VALUES ('sim-1779756496450-40h28d', true, '2026-05-26 00:48:16.452');
INSERT INTO public.webhook_events VALUES ('sim-1779756499872-g02ilh', true, '2026-05-26 00:48:19.875');
INSERT INTO public.webhook_events VALUES ('sim-1779756507429-undye6', true, '2026-05-26 00:48:27.432');
INSERT INTO public.webhook_events VALUES ('sim-1779756512644-rznz7y', true, '2026-05-26 00:48:32.648');
INSERT INTO public.webhook_events VALUES ('sim-1779798678719-8nxzdn', true, '2026-05-26 12:31:18.724');
INSERT INTO public.webhook_events VALUES ('sim-1779798718191-sm4sm4', true, '2026-05-26 12:31:58.195');
INSERT INTO public.webhook_events VALUES ('sim-1779798727927-tyq6fm', true, '2026-05-26 12:32:07.93');
INSERT INTO public.webhook_events VALUES ('sim-1779798738547-sgofkf', true, '2026-05-26 12:32:18.55');
INSERT INTO public.webhook_events VALUES ('sim-1779798767337-vfgi8g', true, '2026-05-26 12:32:47.341');
INSERT INTO public.webhook_events VALUES ('sim-1779798775698-4vik76', true, '2026-05-26 12:32:55.701');
INSERT INTO public.webhook_events VALUES ('sim-1779798796880-1r8ema', true, '2026-05-26 12:33:16.883');
INSERT INTO public.webhook_events VALUES ('sim-1779798802043-i9p7ik', true, '2026-05-26 12:33:22.045');


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accommodation_atleticas accommodation_atleticas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accommodation_atleticas
    ADD CONSTRAINT accommodation_atleticas_pkey PRIMARY KEY (accommodation_id, atletica_id);


--
-- Name: accommodations accommodations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accommodations
    ADD CONSTRAINT accommodations_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: allowed_emails allowed_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allowed_emails
    ADD CONSTRAINT allowed_emails_pkey PRIMARY KEY (id);


--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (key);


--
-- Name: atletica_challenge_divisions atletica_challenge_divisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atletica_challenge_divisions
    ADD CONSTRAINT atletica_challenge_divisions_pkey PRIMARY KEY (id);


--
-- Name: atletica_divisions atletica_divisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atletica_divisions
    ADD CONSTRAINT atletica_divisions_pkey PRIMARY KEY (id);


--
-- Name: atletica_standings atletica_standings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atletica_standings
    ADD CONSTRAINT atletica_standings_pkey PRIMARY KEY (id);


--
-- Name: atleticas atleticas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atleticas
    ADD CONSTRAINT atleticas_pkey PRIMARY KEY (id);


--
-- Name: broadcast_targets broadcast_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broadcast_targets
    ADD CONSTRAINT broadcast_targets_pkey PRIMARY KEY (id);


--
-- Name: campaign_groups campaign_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_groups
    ADD CONSTRAINT campaign_groups_pkey PRIMARY KEY (campaign_id, broadcast_target_id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: campi campi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campi
    ADD CONSTRAINT campi_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: conversation_sessions conversation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_pkey PRIMARY KEY (id);


--
-- Name: festival_artists festival_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_artists
    ADD CONSTRAINT festival_artists_pkey PRIMARY KEY (id);


--
-- Name: festival_days festival_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_days
    ADD CONSTRAINT festival_days_pkey PRIMARY KEY (id);


--
-- Name: festival_media festival_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_media
    ADD CONSTRAINT festival_media_pkey PRIMARY KEY (id);


--
-- Name: festivals festivals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festivals
    ADD CONSTRAINT festivals_pkey PRIMARY KEY (id);


--
-- Name: handoff_closures handoff_closures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handoff_closures
    ADD CONSTRAINT handoff_closures_pkey PRIMARY KEY (id);


--
-- Name: handoff_messages handoff_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handoff_messages
    ADD CONSTRAINT handoff_messages_pkey PRIMARY KEY (id);


--
-- Name: help_feedbacks help_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_feedbacks
    ADD CONSTRAINT help_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: help_sessions help_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_sessions
    ADD CONSTRAINT help_sessions_pkey PRIMARY KEY (id);


--
-- Name: instagram_media_queue instagram_media_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_media_queue
    ADD CONSTRAINT instagram_media_queue_pkey PRIMARY KEY (id);


--
-- Name: inter_editions inter_editions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inter_editions
    ADD CONSTRAINT inter_editions_pkey PRIMARY KEY (id);


--
-- Name: inter_game_days inter_game_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inter_game_days
    ADD CONSTRAINT inter_game_days_pkey PRIMARY KEY (id);


--
-- Name: knowledge_articles knowledge_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_articles
    ADD CONSTRAINT knowledge_articles_pkey PRIMARY KEY (id);


--
-- Name: local_guide_places local_guide_places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.local_guide_places
    ADD CONSTRAINT local_guide_places_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: match_assignments match_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_assignments
    ADD CONSTRAINT match_assignments_pkey PRIMARY KEY (id);


--
-- Name: match_closure_requests match_closure_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_closure_requests
    ADD CONSTRAINT match_closure_requests_pkey PRIMARY KEY (id);


--
-- Name: match_disciplines match_disciplines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_disciplines
    ADD CONSTRAINT match_disciplines_pkey PRIMARY KEY (id);


--
-- Name: match_events match_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_pkey PRIMARY KEY (id);


--
-- Name: match_incidents match_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_incidents
    ADD CONSTRAINT match_incidents_pkey PRIMARY KEY (id);


--
-- Name: match_participants match_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_participants
    ADD CONSTRAINT match_participants_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: modalidades modalidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalidades
    ADD CONSTRAINT modalidades_pkey PRIMARY KEY (id);


--
-- Name: notification_opt_ins notification_opt_ins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_opt_ins
    ADD CONSTRAINT notification_opt_ins_pkey PRIMARY KEY (id);


--
-- Name: segments segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.segments
    ADD CONSTRAINT segments_pkey PRIMARY KEY (id);


--
-- Name: sports_alert_atleticas sports_alert_atleticas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sports_alert_atleticas
    ADD CONSTRAINT sports_alert_atleticas_pkey PRIMARY KEY (wa_user_id, atletica_id);


--
-- Name: venue_coordinator_authorizations venue_coordinator_authorizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_coordinator_authorizations
    ADD CONSTRAINT venue_coordinator_authorizations_pkey PRIMARY KEY (id);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: wa_users wa_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wa_users
    ADD CONSTRAINT wa_users_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: admin_users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_users_email_key ON public.admin_users USING btree (email);


--
-- Name: allowed_emails_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX allowed_emails_email_key ON public.allowed_emails USING btree (email);


--
-- Name: atletica_challenge_divisions_atletica_id_challenge_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX atletica_challenge_divisions_atletica_id_challenge_type_key ON public.atletica_challenge_divisions USING btree (atletica_id, challenge_type);


--
-- Name: atletica_divisions_atletica_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX atletica_divisions_atletica_id_key ON public.atletica_divisions USING btree (atletica_id);


--
-- Name: atletica_standings_atletica_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX atletica_standings_atletica_id_key ON public.atletica_standings USING btree (atletica_id);


--
-- Name: broadcast_targets_wa_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX broadcast_targets_wa_id_key ON public.broadcast_targets USING btree (wa_id);


--
-- Name: campi_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX campi_slug_key ON public.campi USING btree (slug);


--
-- Name: challenges_challenge_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX challenges_challenge_type_key ON public.challenges USING btree (challenge_type);


--
-- Name: conversation_sessions_wa_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX conversation_sessions_wa_user_id_key ON public.conversation_sessions USING btree (wa_user_id);


--
-- Name: festival_days_festival_id_day_index_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX festival_days_festival_id_day_index_key ON public.festival_days USING btree (festival_id, day_index);


--
-- Name: handoff_closures_wa_user_id_closed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX handoff_closures_wa_user_id_closed_at_idx ON public.handoff_closures USING btree (wa_user_id, closed_at DESC);


--
-- Name: help_feedbacks_help_session_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX help_feedbacks_help_session_id_key ON public.help_feedbacks USING btree (help_session_id);


--
-- Name: instagram_media_queue_media_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX instagram_media_queue_media_id_key ON public.instagram_media_queue USING btree (media_id);


--
-- Name: inter_game_days_edition_id_day_index_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inter_game_days_edition_id_day_index_key ON public.inter_game_days USING btree (edition_id, day_index);


--
-- Name: local_guide_places_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX local_guide_places_type_status_idx ON public.local_guide_places USING btree (type, status);


--
-- Name: match_assignments_match_id_admin_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX match_assignments_match_id_admin_user_id_key ON public.match_assignments USING btree (match_id, admin_user_id);


--
-- Name: match_incidents_match_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX match_incidents_match_id_key ON public.match_incidents USING btree (match_id);


--
-- Name: match_participants_match_id_team_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX match_participants_match_id_team_key ON public.match_participants USING btree (match_id, team);


--
-- Name: modalidades_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX modalidades_slug_key ON public.modalidades USING btree (slug);


--
-- Name: notification_opt_ins_wa_user_id_segment_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notification_opt_ins_wa_user_id_segment_key ON public.notification_opt_ins USING btree (wa_user_id, segment);


--
-- Name: segments_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX segments_slug_key ON public.segments USING btree (slug);


--
-- Name: venue_coordinator_authorizations_coordinator_id_venue_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX venue_coordinator_authorizations_coordinator_id_venue_id_key ON public.venue_coordinator_authorizations USING btree (coordinator_id, venue_id);


--
-- Name: wa_users_wa_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX wa_users_wa_id_key ON public.wa_users USING btree (wa_id);


--
-- Name: accommodation_atleticas accommodation_atleticas_accommodation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accommodation_atleticas
    ADD CONSTRAINT accommodation_atleticas_accommodation_id_fkey FOREIGN KEY (accommodation_id) REFERENCES public.accommodations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accommodation_atleticas accommodation_atleticas_atletica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accommodation_atleticas
    ADD CONSTRAINT accommodation_atleticas_atletica_id_fkey FOREIGN KEY (atletica_id) REFERENCES public.atleticas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_users admin_users_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: allowed_emails allowed_emails_added_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allowed_emails
    ADD CONSTRAINT allowed_emails_added_by_id_fkey FOREIGN KEY (added_by_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: allowed_emails allowed_emails_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allowed_emails
    ADD CONSTRAINT allowed_emails_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: atletica_challenge_divisions atletica_challenge_divisions_atletica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atletica_challenge_divisions
    ADD CONSTRAINT atletica_challenge_divisions_atletica_id_fkey FOREIGN KEY (atletica_id) REFERENCES public.atleticas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: atletica_divisions atletica_divisions_atletica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atletica_divisions
    ADD CONSTRAINT atletica_divisions_atletica_id_fkey FOREIGN KEY (atletica_id) REFERENCES public.atleticas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: atletica_standings atletica_standings_atletica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atletica_standings
    ADD CONSTRAINT atletica_standings_atletica_id_fkey FOREIGN KEY (atletica_id) REFERENCES public.atleticas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: atleticas atleticas_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atleticas
    ADD CONSTRAINT atleticas_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campi(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campaign_groups campaign_groups_broadcast_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_groups
    ADD CONSTRAINT campaign_groups_broadcast_target_id_fkey FOREIGN KEY (broadcast_target_id) REFERENCES public.broadcast_targets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_groups campaign_groups_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_groups
    ADD CONSTRAINT campaign_groups_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaigns campaigns_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.segments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: challenges challenges_atletica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_atletica_id_fkey FOREIGN KEY (atletica_id) REFERENCES public.atleticas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: challenges challenges_campus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campi(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversation_sessions conversation_sessions_wa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_wa_user_id_fkey FOREIGN KEY (wa_user_id) REFERENCES public.wa_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: festival_artists festival_artists_festival_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_artists
    ADD CONSTRAINT festival_artists_festival_day_id_fkey FOREIGN KEY (festival_day_id) REFERENCES public.festival_days(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: festival_days festival_days_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_days
    ADD CONSTRAINT festival_days_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.festivals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: festival_media festival_media_festival_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_media
    ADD CONSTRAINT festival_media_festival_artist_id_fkey FOREIGN KEY (festival_artist_id) REFERENCES public.festival_artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: festival_media festival_media_festival_day_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_media
    ADD CONSTRAINT festival_media_festival_day_id_fkey FOREIGN KEY (festival_day_id) REFERENCES public.festival_days(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: festival_media festival_media_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festival_media
    ADD CONSTRAINT festival_media_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.festivals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: festivals festivals_tenda_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.festivals
    ADD CONSTRAINT festivals_tenda_location_id_fkey FOREIGN KEY (tenda_location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: handoff_closures handoff_closures_wa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handoff_closures
    ADD CONSTRAINT handoff_closures_wa_user_id_fkey FOREIGN KEY (wa_user_id) REFERENCES public.wa_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: handoff_messages handoff_messages_wa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handoff_messages
    ADD CONSTRAINT handoff_messages_wa_user_id_fkey FOREIGN KEY (wa_user_id) REFERENCES public.wa_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: help_feedbacks help_feedbacks_help_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_feedbacks
    ADD CONSTRAINT help_feedbacks_help_session_id_fkey FOREIGN KEY (help_session_id) REFERENCES public.help_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: help_feedbacks help_feedbacks_wa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_feedbacks
    ADD CONSTRAINT help_feedbacks_wa_user_id_fkey FOREIGN KEY (wa_user_id) REFERENCES public.wa_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: help_sessions help_sessions_wa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_sessions
    ADD CONSTRAINT help_sessions_wa_user_id_fkey FOREIGN KEY (wa_user_id) REFERENCES public.wa_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inter_game_days inter_game_days_edition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inter_game_days
    ADD CONSTRAINT inter_game_days_edition_id_fkey FOREIGN KEY (edition_id) REFERENCES public.inter_editions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_assignments match_assignments_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_assignments
    ADD CONSTRAINT match_assignments_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_assignments match_assignments_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_assignments
    ADD CONSTRAINT match_assignments_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: match_assignments match_assignments_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_assignments
    ADD CONSTRAINT match_assignments_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_closure_requests match_closure_requests_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_closure_requests
    ADD CONSTRAINT match_closure_requests_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_closure_requests match_closure_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_closure_requests
    ADD CONSTRAINT match_closure_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: match_closure_requests match_closure_requests_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_closure_requests
    ADD CONSTRAINT match_closure_requests_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: match_disciplines match_disciplines_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_disciplines
    ADD CONSTRAINT match_disciplines_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_events match_events_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_incidents match_incidents_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_incidents
    ADD CONSTRAINT match_incidents_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_participants match_participants_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_participants
    ADD CONSTRAINT match_participants_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_modalidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_modalidade_id_fkey FOREIGN KEY (modalidade_id) REFERENCES public.modalidades(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: matches matches_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notification_opt_ins notification_opt_ins_wa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_opt_ins
    ADD CONSTRAINT notification_opt_ins_wa_user_id_fkey FOREIGN KEY (wa_user_id) REFERENCES public.wa_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sports_alert_atleticas sports_alert_atleticas_atletica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sports_alert_atleticas
    ADD CONSTRAINT sports_alert_atleticas_atletica_id_fkey FOREIGN KEY (atletica_id) REFERENCES public.atleticas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sports_alert_atleticas sports_alert_atleticas_wa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sports_alert_atleticas
    ADD CONSTRAINT sports_alert_atleticas_wa_user_id_fkey FOREIGN KEY (wa_user_id) REFERENCES public.wa_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venue_coordinator_authorizations venue_coordinator_authorizations_authorized_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_coordinator_authorizations
    ADD CONSTRAINT venue_coordinator_authorizations_authorized_by_id_fkey FOREIGN KEY (authorized_by_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: venue_coordinator_authorizations venue_coordinator_authorizations_coordinator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_coordinator_authorizations
    ADD CONSTRAINT venue_coordinator_authorizations_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: venue_coordinator_authorizations venue_coordinator_authorizations_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_coordinator_authorizations
    ADD CONSTRAINT venue_coordinator_authorizations_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--



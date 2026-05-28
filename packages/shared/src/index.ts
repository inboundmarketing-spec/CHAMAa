export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  FINISHED = 'finished',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

export enum SessionMode {
  BOT = 'bot',
  HUMAN = 'human',
}

export enum BotMenuState {
  ROOT = 'root',
  SPORTS = 'sports',
  SPORTS_LIVE = 'sports_live',
  SPORTS_UPCOMING = 'sports_upcoming',
  SPORTS_ATLETICA = 'sports_atletica',
  SPORTS_BRACKET = 'sports_bracket',
  SPORTS_BRACKET_MOD = 'sports_bracket_mod',
  SPORTS_BRACKET_GENDER = 'sports_bracket_gender',
  SPORTS_BRACKET_VIEW = 'sports_bracket_view',
  SPORTS_STANDINGS = 'sports_standings',
  SPORTS_STANDINGS_MOD = 'sports_standings_mod',
  SPORTS_STANDINGS_GENDER = 'sports_standings_gender',
  SPORTS_VENUES = 'sports_venues',
  ATLETICA = 'atletica',
  ATLETICA_VIEW = 'atletica_view',
  CHALLENGES = 'challenges',
  ACCOMMODATION = 'accommodation',
  ACCOMMODATION_CAMPUS = 'accommodation_campus',
  ACCOMMODATION_GUIDE = 'accommodation_guide',
  FESTAS = 'festas',
  FESTAS_NEARBY = 'festas_nearby',
  FESTAS_TODAY = 'festas_today',
  FESTAS_TENDA = 'festas_tenda',
  FESTAS_LINEUP = 'festas_lineup',
  FESTAS_DAY = 'festas_day',
  ALERTS = 'alerts',
  ALERTS_OPT_IN = 'alerts_opt_in',
  ALERTS_ATLETICAS = 'alerts_atleticas',
  HELP_ACTIVE = 'help_active',
  HELP_FEEDBACK = 'help_feedback',
  HELP_SUGGESTION = 'help_suggestion',
  SOS = 'sos',
}

export enum InstagramMediaStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT = 'sent',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum AdminRole {
  ADMIN = 'admin',
  MESA_LIEU = 'mesa_lieu',
  CO_DIRECTOR = 'co_director',
  CRIATIVA = 'criativa',
  MODERATOR = 'moderator',
  AGENT = 'agent',
  VENUE_COORDINATOR = 'venue_coordinator',
  NEUTRAL = 'neutral',
  LOCAL_GUIDE = 'local_guide',
}

export enum InterEditionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

/** Papéis com acesso irrestrito a todo o painel. */
export const FULL_ACCESS_ROLES: readonly AdminRole[] = [
  AdminRole.ADMIN,
  AdminRole.MESA_LIEU,
  AdminRole.CO_DIRECTOR,
  AdminRole.CRIATIVA,
  AdminRole.MODERATOR,
  AdminRole.AGENT,
];

export enum ClosureRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export function hasFullAccess(role: string): boolean {
  return (FULL_ACCESS_ROLES as readonly string[]).includes(role);
}

/** Campanhas manuais e moderação/envio Instagram. */
export const BROADCAST_MANAGER_ROLES: readonly AdminRole[] = [
  AdminRole.ADMIN,
  AdminRole.MESA_LIEU,
  AdminRole.CRIATIVA,
];

export function canManageBroadcasts(role: string): boolean {
  return (BROADCAST_MANAGER_ROLES as readonly string[]).includes(role);
}

/** Festas / line-up no painel (acesso amplo, exceto diretor C.O.). */
export function canManageFestas(role: string): boolean {
  return hasFullAccess(role) && role !== AdminRole.CO_DIRECTOR;
}

export function isVenueCoordinatorRole(role: string): boolean {
  return role === AdminRole.VENUE_COORDINATOR;
}

export function isNeutralRole(role: string): boolean {
  return role === AdminRole.NEUTRAL;
}

export function isSportsOnlyRole(role: string): boolean {
  return isVenueCoordinatorRole(role) || isNeutralRole(role);
}

export {
  authorizationRoleTier,
  canManageAuthorizations,
  canGrantAuthorizationRole,
  grantableAuthorizationRoles,
  isHigherAuthorizationRole,
} from './role-hierarchy';

export enum SportCategory {
  COLLECTIVE = 'collective',
  INDIVIDUAL = 'individual',
}

export enum SportGender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum MatchIncidentType {
  INJURY = 'injury',
  EQUIPMENT = 'equipment',
  WEATHER = 'weather',
  DISPUTE = 'dispute',
  SECURITY = 'security',
  OTHER = 'other',
}

/** Prefixo de linha de lista: alterna inscrição em alertas esportivos por atlética. */
export const ALERT_ATLETICA_TOGGLE_PREFIX = 'alert_atl_toggle_';

export const BOT_BUTTON_IDS = {
  SPORTS: 'btn_sports',
  FESTAS: 'btn_festas',
  ALERTS: 'btn_alerts',
  HELP: 'btn_help',
  HELP_DONE: 'btn_help_done',
  HELP_RESOLVED_YES: 'btn_help_resolved_yes',
  HELP_RESOLVED_NO: 'btn_help_resolved_no',
  HELP_SKIP_SUGGESTION: 'btn_help_skip_sugg',
  HELP_SUGGESTION: 'btn_help_suggestion',
  SOS: 'btn_sos',
  BACK: 'btn_back',
  LIVE_SCORE: 'btn_live',
  UPCOMING: 'btn_upcoming',
  MY_ATLETICA: 'btn_atletica',
  BRACKET: 'btn_bracket',
  STANDINGS: 'btn_standings',
  SPORTS_VENUES: 'btn_sports_venues',
  CHALLENGES: 'btn_challenges',
  ATLETICA: 'btn_atletica_menu',
  ACCOMMODATION: 'btn_accommodation',
  ACC_MARMITA: 'btn_acc_marmita',
  ACC_PHARMACY: 'btn_acc_pharmacy',
  ACC_HOSPITAL: 'btn_acc_hospital',
  ACC_FAST_FOOD: 'btn_acc_fast_food',
  FESTAS_NEARBY: 'btn_festas_nearby',
  BRACKET_MALE: 'btn_bracket_male',
  BRACKET_FEMALE: 'btn_bracket_female',
  FESTAS_TODAY: 'btn_festas_today',
  FESTAS_TENDA: 'btn_festas_tenda',
  FESTAS_LINEUP: 'btn_festas_lineup',
  FESTAS_PROMO: 'btn_festas_promo',
  FESTAS_DAY_1: 'btn_festas_day_1',
  FESTAS_DAY_2: 'btn_festas_day_2',
  FESTAS_DAY_3: 'btn_festas_day_3',
  FESTAS_PASSPORT: 'btn_festas_passport',
  OPT_IN_YES: 'btn_opt_in_yes',
  OPT_IN_NO: 'btn_opt_in_no',
  ALERTS_ATLETICAS: 'btn_alerts_atleticas',
  IG_APPROVE: 'btn_ig_approve',
  IG_REJECT: 'btn_ig_reject',
} as const;

export {
  ATLETICAS,
  ATLETICA_LOGO_FILES,
  ATLETICA_SOURCE_FILES,
  atleticaLogoUrl,
  isAtleticaName,
  type AtleticaName,
} from './atleticas';

export {
  ATLETISMO_PROVAS,
  NATACAO_PROVAS,
  provasForSportSlug,
  type AtletismoProva,
  type NatacaoProva,
} from './individual-events';

export {
  ScoringMode,
  isPlacementModalidade,
  usesEliminationBracket,
  placementLabel,
} from './scoring';

export {
  GAME_PERIODS,
  type GamePeriod,
  gamePeriodLabel,
  formatElapsedSeconds,
  elapsedSecondsSince,
} from './match-clock';

export {
  STANDINGS_POINTS,
  type StandingRow,
  sortStandingsRows,
  formatStandingsTable,
  formatStandingsWhatsApp,
} from './standings';

export {
  DIVISION_ONE_CAMPUSES,
  AtleticaDivisionTier,
  AtleticaDivisionSource,
  isDivisionOneCampus,
  divisionTierLabel,
} from './divisions';

export {
  ChallengeType,
  CHALLENGE_TYPE_LABELS,
  CHALLENGE_TYPES,
  challengeTypeLabel,
} from './challenges';

export {
  MatchDisciplineType,
  MATCH_POINTS_DEFAULTS,
  MATCH_DISCIPLINE_LABELS,
  defaultPointsDeltaForDiscipline,
} from './match-points';

export {
  LocalGuidePlaceType,
  LocalGuidePlaceStatus,
  LOCAL_GUIDE_TYPE_LABELS,
  ACCOMMODATION_GUIDE_TYPES,
} from './local-guides';

export {
  haversineKm,
  formatDistanceKm,
  sortByDistance,
  type GeoPoint,
} from './proximity';

export {
  planEliminationBracket,
  describeBracketPlan,
  buildByeNote,
  getFirstRoundByeTeams,
  bracketRoundLabel,
  planWithDivisionSuffix,
  DIVISION_LABELS,
  type BracketPlan,
  type BracketPlannedRound,
  type BracketPlannedMatch,
} from './bracket-plan';
export {
  parseConfrontoNum,
  flattenBracketPlan,
  findNextPlannedMatch,
  teamsUsedInRealMatches,
  pickRandomPair,
  divisionFromRoundName,
  isRealTeamMatch,
  occupiedConfrontoSlots,
  realTeamSlotsFromPlan,
  buildNumberedBracketInfo,
} from './bracket-draw';

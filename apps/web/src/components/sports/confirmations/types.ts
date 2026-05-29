import type { MatchRow } from '../MatchesTab';

export type NeutralUser = { id: string; name: string; email: string };

export type CoordinatorUser = NeutralUser & {
  venueId?: string | null;
  venue?: { id: string; name: string } | null;
};

export type VenueAuthorization = {
  id: string;
  createdAt: string;
  coordinator: NeutralUser;
  venue: { id: string; name: string };
  authorizedBy: { id: string; name: string };
};

export type ClosureRequest = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
  match: MatchRow;
  requestedBy?: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string } | null;
};

export type Assignment = {
  id: string;
  match: MatchRow;
  adminUser: NeutralUser;
  assignedBy: { id: string; name: string };
};

export type ConfirmationsData = {
  closureRequests: ClosureRequest[];
  assignments: Assignment[];
  neutrals?: NeutralUser[];
  coordinators?: CoordinatorUser[];
  venueAuthorizations?: VenueAuthorization[];
  venueAuthorized?: boolean;
};

export type ConfirmationsActions = {
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  assignNeutral: (e: React.FormEvent) => Promise<void>;
  revokeAssignment: (id: string) => Promise<void>;
  authorizeCoordinator: (id: string) => Promise<void>;
  revokeVenueAuthorization: (id: string) => Promise<void>;
};

export type AssignFilters = {
  filterGender: string;
  filterModalidadeId: string;
  filterStatus: string;
  assignMatchId: string;
  assignNeutralId: string;
  setFilterGender: (v: string) => void;
  setFilterModalidadeId: (v: string) => void;
  setFilterStatus: (v: string) => void;
  setAssignMatchId: (v: string) => void;
  setAssignNeutralId: (v: string) => void;
  resetAssignFilters: () => void;
  filteredMatches: MatchRow[];
  filteredModalidades: MatchRow['modalidade'][];
};

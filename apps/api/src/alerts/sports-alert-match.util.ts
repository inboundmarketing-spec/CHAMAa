/** Times em `Match.homeTeam` / `awayTeam` usam o nome do campus (mesmo critério do menu Esportes). */
export function campusTeamNamesFromAtleticas(
  atleticas: { campus: { name: string } }[],
): string[] {
  const names = new Set<string>();
  for (const a of atleticas) {
    const n = a.campus.name.trim();
    if (n) names.add(n.toLowerCase());
  }
  return [...names];
}

type MatchTeamsInput = {
  homeTeam?: string | null;
  awayTeam?: string | null;
  participants?: { team: string }[];
};

export function matchInvolvesCampusTeams(
  match: MatchTeamsInput,
  campusTeamNames: string[],
): boolean {
  if (!campusTeamNames.length) return false;

  const teams: string[] = [];
  if (match.homeTeam?.trim()) teams.push(match.homeTeam.trim().toLowerCase());
  if (match.awayTeam?.trim()) teams.push(match.awayTeam.trim().toLowerCase());
  for (const p of match.participants ?? []) {
    if (p.team?.trim()) teams.push(p.team.trim().toLowerCase());
  }

  return teams.some((t) => campusTeamNames.includes(t));
}

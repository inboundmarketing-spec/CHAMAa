/** Dados de transição de status ao vivo para PATCH de partida. */
export function liveStatusPatch(
  newStatus: string | undefined,
  previousStatus: string | undefined,
): { liveStartedAt?: Date | null; gamePeriod?: null } {
  if (!newStatus || newStatus === previousStatus) return {};

  if (newStatus === 'live' && previousStatus !== 'live') {
    return { liveStartedAt: new Date() };
  }

  if (
    previousStatus === 'live' &&
    (newStatus === 'scheduled' ||
      newStatus === 'finished' ||
      newStatus === 'cancelled')
  ) {
    return { liveStartedAt: null, gamePeriod: null };
  }

  return {};
}

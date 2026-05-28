'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BracketDrawIntro } from '@/components/bracket/BracketDrawIntro';
import { playSound } from '@/lib/ui-sound';
import { api } from '@/lib/api';
import { ATLETICAS, DIVISION_LABELS } from '@chama/shared';
import { hasFullAccess, useAdminUser } from '@/lib/admin-user';
import {
  formatModalidadeOption,
  GENDER_LABELS,
  modalidadeSportName,
} from '@/lib/sports-labels';
import type { BracketDrawContext } from '@/components/bracket/bracket-draw-types';
import { BracketDrawArena } from '@/components/bracket/BracketDrawArena';
import {
  BracketEligibilityPanel,
  type BracketEligibilityApi,
} from '@/components/bracket/BracketEligibilityPanel';
import type {
  BracketDrawOutcome,
  BracketDrawOverlayPhase,
} from '@/components/bracket/bracket-draw-types';
import { computeBracketDrawProgress } from '@/lib/bracket-progress';
import {
  BRACKET_PHASES,
  filterSameDivisionTeams,
  getTeamDivisionKey,
  bracketMatchCaption,
  matchLabel,
  mergeBracketTeamOptions,
  parseConfrontoFromInfo,
  phaseHint,
  sortRounds,
} from '@/lib/bracket-utils';

type Modalidade = {
  id: string;
  name: string;
  gender: string;
  bracketPublished: boolean;
};

type BracketMatch = {
  id: string;
  homeTeam: string | null;
  awayTeam: string | null;
  bracketRound: string | null;
  bracketInfo: string | null;
  scheduledAt: string;
  status: string;
  venue?: { name: string } | null;
};

type DivisionRow = { atleticaId: string; team: string; division: string };

export default function BracketPage() {
  const user = useAdminUser();
  const canEdit = hasFullAccess(user);

  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [viewModalidadeId, setViewModalidadeId] = useState('');
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [teamDivisions, setTeamDivisions] = useState<Map<string, string>>(
    new Map(),
  );
  const [bracketRound, setBracketRound] = useState<string>(BRACKET_PHASES[0]);
  const [drawOverlay, setDrawOverlay] =
    useState<BracketDrawOverlayPhase>('idle');
  const [drawOutcome, setDrawOutcome] = useState<BracketDrawOutcome | null>(
    null,
  );
  const [lastDrawAction, setLastDrawAction] = useState<'next' | 'reshuffle'>(
    'next',
  );
  const [lastAnnouncedDivision, setLastAnnouncedDivision] = useState<
    string | null
  >(null);
  const [pendingDrawAction, setPendingDrawAction] = useState<
    'next' | 'reshuffle' | null
  >(null);
  const [showIntro, setShowIntro] = useState(false);
  const drawing = drawOverlay !== 'idle';
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastConfronto, setLastConfronto] = useState<number | null>(null);
  const [manualHome, setManualHome] = useState('');
  const [manualAway, setManualAway] = useState('');
  const [excludedTeams, setExcludedTeams] = useState<Set<string>>(new Set());
  const [eligibility, setEligibility] = useState<BracketEligibilityApi | null>(
    null,
  );
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(
    null,
  );
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editHome, setEditHome] = useState('');
  const [editAway, setEditAway] = useState('');

  const viewMod = modalidades.find((m) => m.id === viewModalidadeId);
  const editModalidadeId = viewModalidadeId;

  const load = useCallback(async () => {
    const [mod, divs] = await Promise.all([
      api<Modalidade[]>('/api/admin/bracket/modalidades'),
      api<DivisionRow[]>('/api/admin/standings/divisions'),
    ]);
    setModalidades(mod);
    setTeamDivisions(
      new Map(divs.map((d) => [d.team.toLowerCase(), d.division])),
    );
    setViewModalidadeId((prev) => {
      if (prev && mod.some((m) => m.id === prev)) return prev;
      return mod[0]?.id ?? '';
    });
  }, []);

  const loadMatches = useCallback(async (modId: string) => {
    if (!modId) {
      setBracketMatches([]);
      return;
    }
    const rows = await api<BracketMatch[]>(
      `/api/admin/bracket/matches?modalidadeId=${encodeURIComponent(modId)}`,
    );
    setBracketMatches(rows);
  }, []);

  const loadExclusions = useCallback(async (modId: string) => {
    if (!modId) {
      setExcludedTeams(new Set());
      return;
    }
    const res = await api<{ excludedTeams: string[] }>(
      `/api/admin/bracket/exclusions?modalidadeId=${encodeURIComponent(modId)}`,
    );
    setExcludedTeams(new Set(res.excludedTeams));
  }, []);

  const loadEligibility = useCallback(async (modId: string) => {
    if (!modId) {
      setEligibility(null);
      setEligibilityError(null);
      return;
    }
    setEligibilityLoading(true);
    setEligibilityError(null);
    try {
      const res = await api<BracketEligibilityApi>(
        `/api/admin/bracket/eligibility?modalidadeId=${encodeURIComponent(modId)}`,
      );
      setEligibility(res);
    } catch (e) {
      setEligibility(null);
      setEligibilityError(
        e instanceof Error ? e.message : 'Erro ao carregar elegibilidade',
      );
    } finally {
      setEligibilityLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    if (viewModalidadeId) {
      loadMatches(viewModalidadeId).catch(console.error);
      loadExclusions(viewModalidadeId).catch(console.error);
      loadEligibility(viewModalidadeId).catch(console.error);
    }
  }, [viewModalidadeId, loadMatches, loadExclusions, loadEligibility]);

  useEffect(() => {
    setLastConfronto(null);
    setLastAnnouncedDivision(null);
  }, [viewModalidadeId]);

  const roundsInBracket = useMemo(() => {
    const names = bracketMatches
      .map((m) => m.bracketRound)
      .filter((r): r is string => !!r);
    return sortRounds([...new Set(names)]);
  }, [bracketMatches]);

  useEffect(() => {
    if (roundsInBracket.length && !roundsInBracket.includes(bracketRound)) {
      setBracketRound(roundsInBracket[0]);
    }
  }, [roundsInBracket, bracketRound]);

  async function saveExclusions(next: Set<string>) {
    if (!editModalidadeId || !canEdit) return;
    setExcludedTeams(next);
    await api('/api/admin/bracket/exclusions', {
      method: 'PUT',
      body: JSON.stringify({
        modalidadeId: editModalidadeId,
        excludedTeams: [...next],
      }),
    });
  }

  function toggleExcluded(team: string) {
    const next = new Set(excludedTeams);
    if (next.has(team)) next.delete(team);
    else next.add(team);
    saveExclusions(next)
      .then(() => loadEligibility(editModalidadeId))
      .catch((e) => {
        setResult(e instanceof Error ? e.message : 'Erro ao salvar exclusões');
        loadExclusions(editModalidadeId).catch(console.error);
        loadEligibility(editModalidadeId).catch(console.error);
      });
  }

  const eligibleTeams = useMemo(
    () => ATLETICAS.filter((t) => !excludedTeams.has(t)),
    [excludedTeams],
  );

  const drawProgress = useMemo(
    () =>
      computeBracketDrawProgress(
        eligibleTeams,
        teamDivisions,
        bracketMatches,
      ),
    [eligibleTeams, teamDivisions, bracketMatches],
  );

  const drawContext = useMemo((): BracketDrawContext | null => {
    if (!viewMod) return null;
    const activeDiv = drawProgress.divisions.find(
      (d) => d.divisionLabel === drawProgress.activeDivisionLabel,
    );
    if (!activeDiv || !drawProgress.activeDivisionLabel) return null;
    const divIndex = drawProgress.divisions.findIndex(
      (d) => d.divisionLabel === activeDiv.divisionLabel,
    );
    const prevComplete =
      divIndex > 0 && drawProgress.divisions[divIndex - 1]?.isComplete;
    return {
      sportLabel: modalidadeSportName(viewMod.name, viewMod.gender),
      genderLabel: GENDER_LABELS[viewMod.gender] ?? viewMod.gender,
      divisionLabel: activeDiv.divisionLabel,
      teamCount: activeDiv.teamCount,
      isNextDivision: prevComplete,
    };
  }, [viewMod, drawProgress]);

  const drawTeams = useMemo(() => {
    if (!drawContext) return eligibleTeams;
    const div = drawProgress.divisions.find(
      (d) => d.divisionLabel === drawContext.divisionLabel,
    );
    if (!div) return eligibleTeams;
    return eligibleTeams.filter(
      (t) => (teamDivisions.get(t.toLowerCase()) ?? 'first') === div.division,
    );
  }, [eligibleTeams, drawContext, drawProgress, teamDivisions]);

  const awayOptions = useMemo(
    () =>
      filterSameDivisionTeams(manualHome, eligibleTeams, teamDivisions),
    [manualHome, teamDivisions, eligibleTeams],
  );

  const editHomeOptions = useMemo(
    () => mergeBracketTeamOptions(eligibleTeams, editHome, editAway),
    [eligibleTeams, editHome, editAway],
  );

  const editAwayOptions = useMemo(
    () =>
      filterSameDivisionTeams(
        editHome,
        mergeBracketTeamOptions(eligibleTeams, editAway),
        teamDivisions,
      ),
    [editHome, editAway, eligibleTeams, teamDivisions],
  );

  const editDivisionLabel = editHome
    ? (DIVISION_LABELS[getTeamDivisionKey(editHome, teamDivisions)] ??
      getTeamDivisionKey(editHome, teamDivisions))
    : null;

  useEffect(() => {
    if (!editHome || !editAway) return;
    if (!editAwayOptions.includes(editAway)) {
      setEditAway('');
    }
  }, [editHome, editAway, editAwayOptions]);

  const matchesInPhase = bracketMatches.filter(
    (m) =>
      m.bracketRound === bracketRound ||
      (m.bracketRound?.startsWith(`${bracketRound} (`) ?? false),
  );

  async function resetBracket() {
    if (!editModalidadeId || !canEdit) return;
    const label = viewMod
      ? formatModalidadeOption(viewMod.name, viewMod.gender)
      : 'esta modalidade';
    if (
      !confirm(
        `Apagar todo o chaveamento de ${label}? Os confrontos de mata-mata serão removidos e a publicação no bot será desfeita.`,
      )
    ) {
      return;
    }
    setResetting(true);
    setResult(null);
    try {
      const res = await api<{ deletedCount: number }>(
        '/api/admin/bracket/reset',
        {
          method: 'POST',
          body: JSON.stringify({ modalidadeId: editModalidadeId }),
        },
      );
      setLastConfronto(null);
      setLastAnnouncedDivision(null);
      setResult(
        res.deletedCount > 0
          ? `Chaveamento resetado (${res.deletedCount} confronto${res.deletedCount === 1 ? '' : 's'} removido${res.deletedCount === 1 ? '' : 's'}).`
          : 'Chaveamento resetado (não havia confrontos).',
      );
      await load();
      await loadMatches(editModalidadeId);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Erro ao resetar chaveamento');
    } finally {
      setResetting(false);
    }
  }

  function needsDivisionAnnounce(action: 'next' | 'reshuffle') {
    if (action === 'reshuffle' || !drawContext) return false;
    return lastAnnouncedDivision !== drawContext.divisionLabel;
  }

  function beginDrawFlow(action: 'next' | 'reshuffle') {
    if (needsDivisionAnnounce(action)) {
      setPendingDrawAction(action);
      setDrawOverlay('announce');
      return;
    }
    void runDrawStep(action);
  }

  function handleAnnounceComplete() {
    if (drawContext) {
      setLastAnnouncedDivision(drawContext.divisionLabel);
    }
    const action = pendingDrawAction ?? 'next';
    setPendingDrawAction(null);
    void runDrawStep(action);
  }

  function handleDrawNext() {
    if (!drawProgress.hasStarted) {
      setShowIntro(true);
      return;
    }
    beginDrawFlow('next');
  }

  function handleIntroComplete() {
    setShowIntro(false);
    beginDrawFlow('next');
  }

  function buildOutcomeMessage(
    outcome: BracketDrawOutcome,
    action: 'next' | 'reshuffle',
  ) {
    if (outcome.isPlaceholderBatch) {
      const n = outcome.autoNote?.match(/\d+/)?.[0] ?? '';
      const suffix = n
        ? ` (${n} rodada(s) de vencedores montada(s) automaticamente).`
        : '.';
      return `Rodadas montadas automaticamente${suffix}`;
    }
    const label = outcome.away
      ? `${outcome.home} × ${outcome.away}`
      : outcome.home;
    if (action === 'reshuffle') {
      return `Confronto #${outcome.confronto} resorteado: ${label}.`;
    }
    if (outcome.published) {
      return `Confronto #${outcome.confronto}: ${label}. Chave completa e publicada no bot.${outcome.autoNote ?? ''}`;
    }
    return `Confronto #${outcome.confronto}: ${label}.${outcome.autoNote ?? ''}`;
  }

  async function runDrawStep(action: 'next' | 'reshuffle') {
    if (!editModalidadeId || !canEdit) return;
    setLastDrawAction(action);
    setDrawOverlay('spinning');
    setDrawOutcome(null);
    setResult(null);
    const minSpin = action === 'next' ? 3200 : 2400;
    try {
      const res = await Promise.all([
        api<{
          pair: { home: string; away: string | null; info?: string };
          match: BracketMatch;
          autoCreatedCount?: number;
          published?: boolean;
        }>('/api/admin/bracket/draw-step', {
          method: 'POST',
          body: JSON.stringify({
            modalidadeId: editModalidadeId,
            teams: eligibleTeams,
            action,
          }),
        }),
        new Promise<void>((r) => setTimeout(r, minSpin)),
      ]).then(([apiRes]) => apiRes);

      const confronto = parseConfrontoFromInfo(res.match.bracketInfo);
      const isPlaceholderBatch = Boolean(
        (res.autoCreatedCount ?? 0) > 0 &&
          !res.match.homeTeam &&
          !res.match.awayTeam,
      );
      if (!isPlaceholderBatch) {
        setLastConfronto(confronto);
      }
      const autoNote =
        res.autoCreatedCount && res.autoCreatedCount > 0
          ? isPlaceholderBatch
            ? ` (${res.autoCreatedCount} rodada(s) de vencedores montada(s) automaticamente)`
            : res.autoCreatedCount > 1
              ? ` (${res.autoCreatedCount - 1} rodada(s) de vencedores montada(s) automaticamente)`
              : ''
          : '';
      const ctx = drawContext ?? {
        sportLabel: viewMod
          ? modalidadeSportName(viewMod.name, viewMod.gender)
          : '',
        genderLabel: viewMod
          ? (GENDER_LABELS[viewMod.gender] ?? viewMod.gender)
          : '',
        divisionLabel: drawProgress.activeDivisionLabel ?? '',
        teamCount: eligibleTeams.length,
        isNextDivision: false,
      };
      const outcome: BracketDrawOutcome = {
        ...ctx,
        confronto,
        home: res.pair.home,
        away: res.pair.away,
        published: res.published,
        autoNote: autoNote || undefined,
        isPlaceholderBatch,
        isBye: !isPlaceholderBatch && !res.pair.away,
      };
      await load();
      await loadMatches(editModalidadeId);
      setDrawOutcome(outcome);
      setDrawOverlay('result');
      playSound('drawReveal');
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Erro no sorteio');
      setDrawOverlay('idle');
      setDrawOutcome(null);
    }
  }

  function handleDrawContinue() {
    if (drawOutcome) {
      setResult(buildOutcomeMessage(drawOutcome, lastDrawAction));
    }
    setDrawOverlay('idle');
    setDrawOutcome(null);
  }

  function handleDrawAgain() {
    setDrawOverlay('idle');
    setDrawOutcome(null);
    void runDrawStep('reshuffle');
  }

  async function runDrawFull() {
    if (!editModalidadeId || !canEdit) return;
    if (
      !confirm(
        'Montar todos os confrontos de uma vez? Use o sorteio passo a passo se preferir ir revelando aos poucos.',
      )
    ) {
      return;
    }
    setDrawOverlay('spinning');
    setDrawOutcome(null);
    setResult(null);
    await new Promise((r) => setTimeout(r, 3800));
    try {
      const res = await api<{ pairs: { info?: string }[] }>(
        '/api/admin/bracket/draw',
        {
          method: 'POST',
          body: JSON.stringify({
            modalidadeId: editModalidadeId,
            teams: eligibleTeams,
            fullBracket: true,
          }),
        },
      );
      setLastConfronto(null);
      playSound('drawReveal');
      await load();
      await loadMatches(editModalidadeId);
      setResult(
        `Chave montada: ${res.pairs.length} confronto(s). Publicada no WhatsApp.`,
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Erro no sorteio');
    } finally {
      setDrawOverlay('idle');
    }
  }

  async function deleteMatch(id: string) {
    if (!confirm('Excluir este confronto da chave?')) return;
    try {
      await api(`/api/admin/bracket/matches/${id}`, { method: 'DELETE' });
      setResult('Confronto excluído.');
      await loadMatches(editModalidadeId);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Erro ao excluir');
    }
  }

  async function saveEditMatch(id: string) {
    if (!editHome || !editAway) return;
    const homeDiv = getTeamDivisionKey(editHome, teamDivisions);
    const awayDiv = getTeamDivisionKey(editAway, teamDivisions);
    if (homeDiv !== awayDiv) {
      setResult(
        'Confrontos só são permitidos entre atléticas da mesma divisão.',
      );
      return;
    }
    try {
      await api(`/api/admin/bracket/matches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ homeTeam: editHome, awayTeam: editAway }),
      });
      setEditingMatchId(null);
      setResult('Confronto atualizado.');
      await loadMatches(editModalidadeId);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  }

  async function addManual() {
    if (!editModalidadeId || !manualHome || !manualAway) return;
    const homeDiv = getTeamDivisionKey(manualHome, teamDivisions);
    const awayDiv = getTeamDivisionKey(manualAway, teamDivisions);
    if (homeDiv !== awayDiv) {
      setResult(
        'Confrontos só são permitidos entre atléticas da mesma divisão.',
      );
      return;
    }
    try {
      await api('/api/admin/bracket/manual', {
        method: 'POST',
        body: JSON.stringify({
          modalidadeId: editModalidadeId,
          teams: eligibleTeams,
          homeTeam: manualHome,
          awayTeam: manualAway,
          bracketRound,
        }),
      });
      setResult('Confronto cadastrado. Chave publicada no WhatsApp.');
      setManualHome('');
      setManualAway('');
      await load();
      await loadMatches(editModalidadeId);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Erro ao cadastrar');
    }
  }

  const modalityOptions = useMemo(
    () =>
      [...modalidades].sort((a, b) =>
        formatModalidadeOption(a.name, a.gender).localeCompare(
          formatModalidadeOption(b.name, b.gender),
          'pt-BR',
        ),
      ),
    [modalidades],
  );

  return (
    <div className="bracket-page-layout">
      <BracketDrawIntro active={showIntro} onComplete={handleIntroComplete} />
      <div>
        <h1>Chaveamento</h1>
        <p className="page-intro">
          Cadastre confrontos manuais ou sorteie um por vez — manuais são
          preservados. Rodadas de vencedores montam sozinhas; só as oitavas (ou
          jogo 1) usam sorteio aleatório. Natação e atletismo não usam mata-mata.
        </p>
      </div>

      <div className="bracket-filter-bar">
        <div className="bracket-filter-mod">
          <label className="field-label" htmlFor="view-mod">
            Modalidade
          </label>
          <select
            id="view-mod"
            value={viewModalidadeId}
            onChange={(e) => {
              setViewModalidadeId(e.target.value);
              setLastConfronto(null);
            }}
          >
            {modalityOptions.length === 0 && (
              <option value="">Carregando…</option>
            )}
            {modalityOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {formatModalidadeOption(m.name, m.gender)}
                {m.bracketPublished ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </div>
        {viewMod && (
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
            {viewMod.bracketPublished ? (
              <span className="badge">Publicada no bot</span>
            ) : (
              'Ainda não publicada'
            )}
          </p>
        )}
        {canEdit && editModalidadeId && (
          <button
            type="button"
            className="btn btn-secondary btn-sm bracket-reset-btn"
            disabled={resetting || drawing}
            onClick={() => resetBracket()}
          >
            {resetting ? 'Resetando…' : 'Resetar chaveamento'}
          </button>
        )}
      </div>

      {modalityOptions.length === 0 && (
        <p className="bracket-toast">
          Nenhuma modalidade com mata-mata disponível.
        </p>
      )}

      {canEdit && editModalidadeId && (
        <>
          <BracketDrawArena
            teams={drawTeams}
            modalityLabel={
              viewMod
                ? formatModalidadeOption(viewMod.name, viewMod.gender)
                : undefined
            }
            bracketMatches={bracketMatches}
            progress={drawProgress}
            onDrawNext={handleDrawNext}
            drawOverlay={drawOverlay}
            drawContext={drawContext}
            drawOutcome={drawOutcome}
            onAnnounceComplete={handleAnnounceComplete}
            onDrawContinue={handleDrawContinue}
            onDrawAgain={handleDrawAgain}
            canReshuffleDraw={
              drawOverlay === 'result' ||
              (drawProgress.hasStarted &&
                (drawProgress.divisions.find(
                  (d) => d.divisionLabel === drawProgress.activeDivisionLabel,
                )?.canReshuffle ??
                  false))
            }
            introActive={showIntro}
            canEdit={canEdit}
            lastConfronto={lastConfronto}
          />

          <details className="bracket-settings" open>
            <summary>Configurações e confrontos da fase</summary>
            <div className="bracket-settings-body">
              <h4 style={{ margin: '0.75rem 0 0.5rem' }}>
                Elegibilidade por divisão (API)
              </h4>
              <BracketEligibilityPanel
                api={eligibility}
                loading={eligibilityLoading}
                error={eligibilityError}
                divisions={drawProgress.divisions}
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.75rem 0 0' }}>
                Sorteio rápido (monta a chave inteira de uma vez):
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: '0.75rem' }}
                disabled={drawing || eligibleTeams.length < 2}
                onClick={() => runDrawFull()}
              >
                Montar chave completa
              </button>
              <h4 style={{ margin: '1rem 0 0.5rem' }}>
                Atléticas fora do sorteio
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
                {excludedTeams.size} excluída
                {excludedTeams.size === 1 ? '' : 's'} · {phaseHint(eligibleTeams.length)}
              </p>
              <div className="bracket-exclude-grid">
                {ATLETICAS.map((t) => (
                  <label key={t} className="bracket-exclude-item">
                    <input
                      type="checkbox"
                      checked={excludedTeams.has(t)}
                      onChange={() => toggleExcluded(t)}
                    />
                    {t}
                  </label>
                ))}
              </div>

              <h4 style={{ margin: '1.25rem 0 0.5rem' }}>
                Adicionar confronto manual
              </h4>
              <div className="bracket-manual-row">
                <select
                  value={bracketRound}
                  onChange={(e) => setBracketRound(e.target.value)}
                >
                  {BRACKET_PHASES.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                  {roundsInBracket
                    .filter(
                      (r) =>
                        !(BRACKET_PHASES as readonly string[]).includes(r),
                    )
                    .map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                </select>
                <select
                  value={manualHome}
                  onChange={(e) => {
                    setManualHome(e.target.value);
                    setManualAway('');
                  }}
                >
                  <option value="">Time A</option>
                  {eligibleTeams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={manualAway}
                  onChange={(e) => setManualAway(e.target.value)}
                  disabled={!manualHome}
                >
                  <option value="">Time B (mesma divisão)</option>
                  {awayOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={!manualHome || !manualAway}
                  onClick={() => addManual()}
                >
                  Adicionar
                </button>
              </div>

              <h4 style={{ margin: '1.25rem 0 0.5rem' }}>
                Editar rodada — {bracketRound} ({matchesInPhase.length})
              </h4>
              {roundsInBracket.length > 0 && (
                <select
                  value={bracketRound}
                  onChange={(e) => setBracketRound(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                >
                  {roundsInBracket.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
              {matchesInPhase.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Nenhum confronto nesta fase.
                </p>
              ) : (
                <ul className="bracket-phase-list">
                  {matchesInPhase.map((m) => (
                    <li key={m.id}>
                      {editingMatchId === m.id ? (
                        <div className="bracket-edit-row">
                          <select
                            value={editHome}
                            onChange={(e) => {
                              setEditHome(e.target.value);
                              setEditAway('');
                            }}
                          >
                            <option value="">Time A</option>
                            {editHomeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <span>×</span>
                          <select
                            value={editAway}
                            onChange={(e) => setEditAway(e.target.value)}
                            disabled={!editHome}
                          >
                            <option value="">
                              Time B (mesma divisão)
                            </option>
                            {editAwayOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-sm"
                            disabled={!editHome || !editAway}
                            onClick={() => saveEditMatch(m.id)}
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingMatchId(null)}
                          >
                            Cancelar
                          </button>
                          {editDivisionLabel && (
                            <span
                              className="bracket-edit-division-hint"
                              style={{
                                fontSize: '0.8rem',
                                color: 'var(--muted)',
                              }}
                            >
                              Divisão: {editDivisionLabel}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="bracket-phase-match">
                            <strong>{matchLabel(m)}</strong>
                            {bracketMatchCaption(m) && (
                              <span
                                className="bracket-match-caption"
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--muted)',
                                }}
                              >
                                {bracketMatchCaption(m)}
                              </span>
                            )}
                            <span className="bracket-match-actions">
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setEditingMatchId(m.id);
                                  setEditHome(m.homeTeam ?? '');
                                  setEditAway(m.awayTeam ?? '');
                                }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => deleteMatch(m.id)}
                              >
                                Excluir
                              </button>
                            </span>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        </>
      )}

      {result && <p className="bracket-toast">{result}</p>}
    </div>
  );
}

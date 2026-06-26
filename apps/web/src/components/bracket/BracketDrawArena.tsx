'use client';

import { describeBracketPlan } from '@chama/shared';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AtleticaLogo } from '@/components/sports/AtleticaLogo';
import type { BracketDrawProgress } from '@/lib/bracket-progress';
import type { BracketMatchLike } from '@/lib/bracket-utils';
import { ChaminhaLogo } from '@/components/chaminha/ChaminhaLogo';
import { playSound, resetDrawTickCounter } from '@/lib/ui-sound';
import type {
  BracketDrawContext,
  BracketDrawOutcome,
  BracketDrawOverlayPhase,
} from './bracket-draw-types';
import { BracketTreeView } from './BracketTreeView';

type Props = {
  teams: string[];
  modalityLabel?: string;
  bracketMatches: BracketMatchLike[];
  progress: BracketDrawProgress;
  onDrawNext: () => void;
  drawOverlay: BracketDrawOverlayPhase;
  drawContext: BracketDrawContext | null;
  drawOutcome: BracketDrawOutcome | null;
  onAnnounceComplete: () => void;
  onDrawContinue: () => void;
  onDrawAgain: () => void;
  canReshuffleDraw: boolean;
  introActive?: boolean;
  canEdit: boolean;
  lastConfronto?: number | null;
};

function TeamChip({
  name,
  size = 28,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`bracket-team-chip ${className}`.trim()} style={style}>
      <AtleticaLogo name={name} size={size} />
      <span className="bracket-team-chip-name">{name}</span>
    </span>
  );
}

function DrawCarousel({
  teams,
  focusTeam,
  nameTick,
  showOrbit,
}: {
  teams: string[];
  focusTeam: string;
  nameTick: number;
  showOrbit: boolean;
}) {
  const orbitStyle = { '--orbit-n': teams.length } as CSSProperties;

  return (
    <div className="bracket-draw-drum bracket-draw-drum--carousel bracket-draw-drum--fullscreen">
      {showOrbit && (
        <div className="bracket-draw-orbit" style={orbitStyle} aria-hidden>
          {teams.map((t, i) => (
            <TeamChip
              key={t}
              name={t}
              size={30}
              className={`is-orbit${t === focusTeam ? ' is-orbit-active' : ''}`}
              style={{ '--orbit-i': i } as CSSProperties}
            />
          ))}
        </div>
      )}
      <div
        className="bracket-draw-focus bracket-draw-sorteador"
        key={`${focusTeam}-${nameTick}`}
      >
        <div className="bracket-draw-focus-ring" aria-hidden />
        <div className="bracket-draw-focus-spotlight" aria-hidden />
        <div className="bracket-draw-focus-logos">
          <AtleticaLogo name={focusTeam} size={96} />
          <div className="bracket-draw-focus-flame" aria-hidden>
            <ChaminhaLogo size={48} priority animated />
          </div>
        </div>
        <span className="bracket-draw-focus-name">{focusTeam}</span>
      </div>
      <div className="bracket-draw-drum-overlay">
        <span className="bracket-draw-dice" aria-hidden>
          🎲
        </span>
        <span className="bracket-spinner-label">Sorteando confronto…</span>
      </div>
    </div>
  );
}

function DrawModalityMeta({ ctx }: { ctx: BracketDrawContext }) {
  return (
    <p className="bracket-draw-meta-line">
      {ctx.sportLabel} · {ctx.genderLabel} ·{' '}
      <strong>{ctx.divisionLabel}</strong>
    </p>
  );
}

function DrawDivisionAnnounce({
  ctx,
  onStart,
}: {
  ctx: BracketDrawContext;
  onStart: () => void;
}) {
  return (
    <div className="bracket-draw-announce">
      {ctx.isNextDivision && (
        <p className="bracket-draw-announce-badge">Próxima etapa</p>
      )}
      <p className="bracket-draw-announce-eyebrow">
        {ctx.isNextDivision
          ? 'Agora o sorteio da'
          : 'Sorteio da divisão'}
      </p>
      <p className="bracket-draw-announce-division">{ctx.divisionLabel}</p>
      <p className="bracket-draw-meta-line">
        {ctx.sportLabel} · {ctx.genderLabel}
      </p>
      <p className="bracket-draw-announce-teams">
        <strong>{ctx.teamCount}</strong> atlética
        {ctx.teamCount === 1 ? '' : 's'} nesta divisão
      </p>
      <button
        type="button"
        className="btn bracket-draw-btn bracket-draw-btn-hero bracket-draw-announce-btn"
        onClick={onStart}
      >
        Iniciar roleta
      </button>
    </div>
  );
}

function DrawResultPanel({
  outcome,
  canReshuffle,
  onContinue,
  onDrawAgain,
}: {
  outcome: BracketDrawOutcome;
  canReshuffle: boolean;
  onContinue: () => void;
  onDrawAgain: () => void;
}) {
  return (
    <div className="bracket-draw-result">
      <p className="bracket-draw-result-eyebrow">Resultado do sorteio</p>
      <DrawModalityMeta ctx={outcome} />
      {outcome.isPlaceholderBatch ? (
        <>
          <p className="bracket-draw-result-confronto">
            Rodadas montadas automaticamente
          </p>
          <p className="bracket-draw-result-placeholder">
            Confrontos de <em>vencedor confronto N</em> criados na chave — sem
            sorteio de atléticas.
          </p>
        </>
      ) : (
        <>
          <p className="bracket-draw-result-confronto">
            Confronto #{outcome.confronto}
          </p>
          <div className="bracket-draw-result-pair">
            <div className="bracket-draw-result-team">
              <AtleticaLogo name={outcome.home} size={80} />
              <span>{outcome.home}</span>
            </div>
            {outcome.away ? (
              <>
                <span className="bracket-draw-result-vs" aria-hidden>
                  ×
                </span>
                <div className="bracket-draw-result-team">
                  <AtleticaLogo name={outcome.away} size={80} />
                  <span>{outcome.away}</span>
                </div>
              </>
            ) : (
              <p className="bracket-draw-result-bye">Folga</p>
            )}
          </div>
        </>
      )}
      {outcome.published && (
        <p className="bracket-draw-result-note">Chave publicada no bot</p>
      )}
      {outcome.autoNote && (
        <p className="bracket-draw-result-note">{outcome.autoNote}</p>
      )}
      <div className="bracket-draw-result-actions">
        {canReshuffle && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDrawAgain();
            }}
          >
            ↻ Sortear novamente
          </button>
        )}
        <button
          type="button"
          className="btn bracket-draw-btn bracket-draw-btn-hero"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function DrawFullscreenOverlay({
  children,
  drawContext,
  phase,
}: {
  children: ReactNode;
  drawContext?: BracketDrawContext | null;
  phase: 'announce' | 'spinning' | 'result';
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`bracket-draw-fullscreen bracket-draw-fullscreen--${phase}${phase === 'spinning' ? ' bracket-draw-fullscreen--spinning' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="bracket-draw-fullscreen-bg" aria-hidden />
      <div className="bracket-draw-fullscreen-rays" aria-hidden />
      <div className="bracket-draw-fullscreen-glow" aria-hidden />
      {phase === 'spinning' && drawContext && (
        <header className="bracket-draw-fullscreen-header">
          <p className="bracket-draw-fullscreen-eyebrow">Sorteio ao vivo</p>
          <DrawModalityMeta ctx={drawContext} />
        </header>
      )}
      <div className="bracket-draw-fullscreen-stage">{children}</div>
    </div>,
    document.body,
  );
}

export function BracketDrawArena({
  teams,
  modalityLabel,
  bracketMatches,
  progress,
  onDrawNext,
  drawOverlay,
  drawContext,
  drawOutcome,
  onAnnounceComplete,
  onDrawContinue,
  onDrawAgain,
  canReshuffleDraw,
  introActive = false,
  canEdit,
  lastConfronto,
}: Props) {
  const busy = drawOverlay !== 'idle' || introActive;
  const announcing = drawOverlay === 'announce' && drawContext !== null;
  const spinning = drawOverlay === 'spinning';
  const showingResult = drawOverlay === 'result' && drawOutcome !== null;
  const [focusIndex, setFocusIndex] = useState(0);
  const [nameTick, setNameTick] = useState(0);

  const structureHint = useMemo(
    () => describeBracketPlan(teams.length),
    [teams.length],
  );

  const activeDiv = progress.divisions.find(
    (d) => d.divisionLabel === progress.activeDivisionLabel,
  );

  const focusTeam = teams[focusIndex] ?? teams[0] ?? '';
  const showTree = progress.hasStarted && drawOverlay === 'idle';
  const showPool = !progress.hasStarted && drawOverlay === 'idle';
  const showOrbit = teams.length > 1;

  const nextLabel = activeDiv?.nextNeedsDraw
    ? activeDiv.nextConfronto
      ? `Sortear confronto #${activeDiv.nextConfronto}`
      : 'Sortear próximo confronto'
    : activeDiv?.nextIsPlaceholder
      ? `Montar ${(activeDiv.nextRound ?? 'próxima rodada').replace(/\s*\([^)]*\)\s*$/, '')}`
      : 'Avançar chave';

  useEffect(() => {
    if (!spinning || teams.length === 0) {
      if (!spinning) setFocusIndex(0);
      return;
    }
    resetDrawTickCounter();
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setNameTick(i);
      setFocusIndex((prev) => {
        if (teams.length <= 1) return 0;
        let next = Math.floor(Math.random() * teams.length);
        while (next === prev && teams.length > 1) {
          next = Math.floor(Math.random() * teams.length);
        }
        return next;
      });
    }, 380);
    return () => clearInterval(id);
  }, [spinning, teams]);

  useEffect(() => {
    if (spinning && nameTick > 0) {
      playSound('drawTick');
    }
  }, [spinning, nameTick]);

  useEffect(() => {
    if (!announcing) return;
    playSound('introPop');
  }, [announcing]);

  useEffect(() => {
    if (!showingResult || !drawOutcome) return;
    const homeIdx = teams.findIndex(
      (t) => t.toLowerCase() === drawOutcome.home.toLowerCase(),
    );
    if (homeIdx >= 0) setFocusIndex(homeIdx);
  }, [showingResult, drawOutcome, teams]);

  const overlayOpen = drawOverlay !== 'idle';

  return (
    <>
      <section
        className={`bracket-arena${overlayOpen ? ' is-drawing-active' : ''}${showTree ? ' has-bracket' : ''}`}
        aria-labelledby="bracket-arena-title"
      >
        <div className="bracket-arena-glow" aria-hidden />
        <div className="bracket-arena-rays" aria-hidden />

        <header className="bracket-arena-header">
          <div>
            <p className="bracket-arena-eyebrow">Mata-mata</p>
            <h2 id="bracket-arena-title">Sorteio da chave</h2>
            {modalityLabel && (
              <p className="bracket-arena-modality">{modalityLabel}</p>
            )}
            <p className="bracket-arena-sub">
              <strong>{teams.length}</strong> atlética
              {teams.length === 1 ? '' : 's'} elegível
              {teams.length === 1 ? '' : 'is'}
              {progress.hasStarted && (
                <>
                  {' '}
                  · <strong>{progress.totalCreated}</strong>/
                  {progress.totalPlanned} confrontos
                </>
              )}
            </p>
            <p className="bracket-arena-structure">{structureHint}</p>
            {activeDiv && (
              <p className="bracket-arena-division-count">
                Divisão ativa: <strong>{activeDiv.teamCount}</strong> atlética
                {activeDiv.teamCount === 1 ? '' : 's'}
                {activeDiv.firstRoundByeTeams.length > 0 && (
                  <>
                    {' '}
                    · folga nas oitavas:{' '}
                    <strong>{activeDiv.firstRoundByeTeams.join(', ')}</strong>
                  </>
                )}
              </p>
            )}
            {activeDiv?.byeNote && !progress.isComplete && (
              <p className="bracket-arena-bye-note">{activeDiv.byeNote}</p>
            )}
            {activeDiv?.auditIssues && activeDiv.auditIssues.length > 0 && (
              <div className="bracket-arena-audit" role="alert">
                {activeDiv.auditIssues.map((msg) => (
                  <p key={msg}>{msg}</p>
                ))}
              </div>
            )}
          </div>
          {canEdit && !busy && !progress.isComplete && (
            <div className="bracket-arena-header-actions">
              {progress.hasStarted && activeDiv?.canReshuffle && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={busy}
                  onClick={onDrawAgain}
                >
                  ↻ Resortear último
                </button>
              )}
              <button
                type="button"
                className="btn bracket-draw-btn bracket-draw-btn-hero"
                disabled={busy || teams.length < 2}
                onClick={onDrawNext}
              >
                {progress.hasStarted
                  ? activeDiv?.nextNeedsDraw
                    ? `🎲 ${nextLabel}`
                    : nextLabel
                  : '🎲 Sortear primeiro confronto'}
              </button>
            </div>
          )}
        </header>

        <div
          className={`bracket-arena-stage${overlayOpen ? ' is-drawing' : ''}${showTree ? ' has-tree' : ''}`}
          aria-live={overlayOpen ? 'off' : 'polite'}
        >
          {showTree ? (
            <BracketTreeView
              matches={bracketMatches}
              highlightConfronto={lastConfronto ?? undefined}
              emptyMessage="Nenhum confronto sorteado ainda."
            />
          ) : overlayOpen ? (
            <p className="bracket-draw-stage-busy" aria-hidden>
              Sorteio em andamento…
            </p>
          ) : showPool ? (
            <div className="bracket-teams-pool">
              {teams.map((t) => (
                <TeamChip key={t} name={t} size={32} />
              ))}
            </div>
          ) : null}
        </div>

        {canEdit && (
          <div className="bracket-arena-actions">
            {overlayOpen ? (
              <button
                type="button"
                className="btn bracket-draw-btn bracket-draw-btn-hero"
                disabled
              >
                <span className="bracket-draw-spinner" aria-hidden />
                {announcing
                  ? 'Anunciando divisão…'
                  : showingResult
                    ? 'Aguardando confirmação…'
                    : 'Sorteando…'}
              </button>
            ) : progress.isComplete ? (
              <p className="bracket-arena-complete">
                Chave completa — publicada no bot quando o último confronto foi
                adicionado.
              </p>
            ) : (
              <button
                type="button"
                className="btn bracket-draw-btn bracket-draw-btn-hero bracket-draw-btn-secondary"
                disabled={teams.length < 2 || busy}
                onClick={onDrawNext}
              >
                {progress.hasStarted
                  ? activeDiv?.nextNeedsDraw
                    ? `🎲 ${nextLabel}`
                    : nextLabel
                  : '🎲 Sortear primeiro confronto'}
              </button>
            )}
            <p className="bracket-arena-warn">
              Confrontos <strong>manuais</strong> são preservados e recebem o
              próximo número da chave. O sorteio aleatório só emparelha atléticas
              ainda livres. Rodadas de <em>vencedor confronto N</em> são montadas
              automaticamente, sem sorteio.
            </p>
          </div>
        )}
      </section>

      {announcing && drawContext && (
        <DrawFullscreenOverlay drawContext={drawContext} phase="announce">
          <DrawDivisionAnnounce
            ctx={drawContext}
            onStart={onAnnounceComplete}
          />
        </DrawFullscreenOverlay>
      )}

      {spinning && (
        <DrawFullscreenOverlay drawContext={drawContext} phase="spinning">
          <DrawCarousel
            teams={teams}
            focusTeam={focusTeam}
            nameTick={nameTick}
            showOrbit={showOrbit}
          />
        </DrawFullscreenOverlay>
      )}

      {showingResult && drawOutcome && (
        <DrawFullscreenOverlay drawContext={drawOutcome} phase="result">
          <DrawResultPanel
            outcome={drawOutcome}
            canReshuffle={canReshuffleDraw}
            onContinue={onDrawContinue}
            onDrawAgain={onDrawAgain}
          />
        </DrawFullscreenOverlay>
      )}
    </>
  );
}

'use client';

import {
  formatModalidadeOption,
  modalidadeSportName,
} from '@/lib/sports-labels';
import type { AssignFilters } from './types';
import type { NeutralUser } from './types';
import { matchOptionLabel } from './shared';

export function AssignNeutralForm({
  filters,
  neutrals,
  onSubmit,
  compact,
}: {
  filters: AssignFilters;
  neutrals: NeutralUser[];
  onSubmit: (e: React.FormEvent) => void;
  compact?: boolean;
}) {
  const {
    filterGender,
    filterModalidadeId,
    filterStatus,
    assignMatchId,
    assignNeutralId,
    setFilterGender,
    setFilterModalidadeId,
    setFilterStatus,
    setAssignMatchId,
    setAssignNeutralId,
    resetAssignFilters,
    filteredMatches,
    filteredModalidades,
  } = filters;

  return (
    <form className={compact ? undefined : 'card auth-ops-section'} onSubmit={onSubmit}>
      {!compact && (
        <header className="auth-ops-section__head">
          <h3 style={{ margin: 0 }}>Atribuir neutro</h3>
          <p className="auth-ops-section__desc">
            Escolha modalidade, partida e neutro que poderá operar o placar ao
            vivo.
          </p>
        </header>
      )}

      <div className="bracket-filter-bar" style={{ marginBottom: '1rem' }}>
        <div className="bracket-filter-mod">
          <label className="field-label">Gênero</label>
          <select
            value={filterGender}
            onChange={(e) => {
              setFilterGender(e.target.value);
              setFilterModalidadeId('all');
              setAssignMatchId('');
            }}
          >
            <option value="all">Todos</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
          </select>
        </div>
        <div className="bracket-filter-mod">
          <label className="field-label">Modalidade</label>
          <select
            value={filterModalidadeId}
            onChange={(e) => {
              setFilterModalidadeId(e.target.value);
              setAssignMatchId('');
            }}
          >
            <option value="all">Todas</option>
            {filteredModalidades.map((m) => (
              <option key={m.id} value={m.id}>
                {filterGender === 'all'
                  ? formatModalidadeOption(m.name, m.gender)
                  : modalidadeSportName(m.name, m.gender)}
              </option>
            ))}
          </select>
        </div>
        <div className="bracket-filter-mod">
          <label className="field-label">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setAssignMatchId('');
            }}
          >
            <option value="all">Não finalizadas</option>
            <option value="live">Ao vivo</option>
            <option value="scheduled">Agendadas</option>
            <option value="delayed">Adiadas</option>
          </select>
        </div>
        {(filterGender !== 'all' ||
          filterModalidadeId !== 'all' ||
          filterStatus !== 'all') && (
          <button
            type="button"
            className="btn btn-secondary btn-sm bracket-reset-btn"
            onClick={resetAssignFilters}
          >
            Limpar
          </button>
        )}
      </div>

      <p
        style={{
          margin: '0 0 1rem',
          fontSize: '0.85rem',
          color: 'var(--muted)',
        }}
      >
        {filteredMatches.length === 0
          ? 'Nenhuma partida nos filtros.'
          : `${filteredMatches.length} partida(s)`}
      </p>

      <div className="form-grid">
        <div>
          <label className="field-label">Partida</label>
          <select
            value={assignMatchId}
            onChange={(e) => setAssignMatchId(e.target.value)}
            required
            disabled={filteredMatches.length === 0}
          >
            <option value="">Selecione…</option>
            {filteredMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {matchOptionLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Neutro</label>
          <select
            value={assignNeutralId}
            onChange={(e) => setAssignNeutralId(e.target.value)}
            required
            disabled={neutrals.length === 0}
          >
            <option value="">Selecione…</option>
            {neutrals.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {neutrals.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Nenhum neutro cadastrado.
        </p>
      )}

      <button
        type="submit"
        className="btn"
        style={{ marginTop: '1rem' }}
        disabled={
          !assignMatchId || !assignNeutralId || filteredMatches.length === 0
        }
      >
        Conceder acesso
      </button>
    </form>
  );
}

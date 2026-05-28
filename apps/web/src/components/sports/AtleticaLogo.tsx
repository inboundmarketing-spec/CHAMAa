'use client';

import { useState } from 'react';
import { ATLETICAS, atleticaLogoUrl } from '@chama/shared';

export function AtleticaLogo({
  name,
  size = 48,
}: {
  name: string;
  size?: number;
}) {
  const src = atleticaLogoUrl(name);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className="atletica-logo-fallback"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        aria-hidden
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="atletica-logo"
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function AtleticaSelect({
  value,
  onChange,
  exclude,
  onlyFrom,
  required,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  exclude?: string;
  onlyFrom?: string[];
  required?: boolean;
  label: string;
}) {
  const pool = onlyFrom ?? ATLETICAS;
  return (
    <>
      <label className="field-label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Selecione...</option>
        {pool.filter((a) => a !== exclude).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </>
  );
}

export function MatchTeams({
  homeTeam,
  awayTeam,
  logoSize = 24,
}: {
  homeTeam?: string | null;
  awayTeam?: string | null;
  logoSize?: number;
}) {
  if (!homeTeam && !awayTeam) return <span style={{ color: 'var(--muted)' }}>—</span>;
  if (!awayTeam && homeTeam) {
    return (
      <span className="match-team">
        <AtleticaLogo name={homeTeam} size={logoSize} />
        {homeTeam}
      </span>
    );
  }
  return (
    <span className="match-teams">
      <span className="match-team">
        <AtleticaLogo name={homeTeam!} size={logoSize} />
        {homeTeam}
      </span>
      <span className="match-vs">x</span>
      <span className="match-team">
        <AtleticaLogo name={awayTeam!} size={logoSize} />
        {awayTeam}
      </span>
    </span>
  );
}

export function AtleticaMultiSelect({
  selected,
  onChange,
  min = 2,
}: {
  selected: string[];
  onChange: (teams: string[]) => void;
  min?: number;
}) {
  const [pick, setPick] = useState('');

  function add() {
    const name = pick.trim();
    if (!name || selected.includes(name)) return;
    onChange([...selected, name]);
    setPick('');
  }

  function remove(name: string) {
    onChange(selected.filter((t) => t !== name));
  }

  return (
    <div className="atletica-multi">
      <div className="atletica-multi-add">
        <select value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Adicionar atlética...</option>
          {ATLETICAS.filter((a) => !selected.includes(a)).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={add}
          disabled={!pick}
        >
          Incluir
        </button>
      </div>
      {selected.length > 0 && (
        <ul className="atletica-multi-list">
          {selected.map((name) => (
            <li key={name}>
              <AtleticaLogo name={name} size={28} />
              <span>{name}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => remove(name)}
                aria-label={`Remover ${name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected.length < min && (
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Inclua ao menos {min} atléticas.
        </p>
      )}
    </div>
  );
}

export function MatchParticipantsList({
  participants,
  logoSize = 22,
}: {
  participants: { team: string; placement?: number | null }[];
  logoSize?: number;
}) {
  if (!participants.length) {
    return <span style={{ color: 'var(--muted)' }}>—</span>;
  }
  return (
    <ul className="match-participants-list">
      {participants.map((p) => (
        <li key={p.team}>
          <AtleticaLogo name={p.team} size={logoSize} />
          <span>{p.team}</span>
          {p.placement != null && p.placement > 0 && (
            <span className="placement-badge">{p.placement}º</span>
          )}
        </li>
      ))}
    </ul>
  );
}

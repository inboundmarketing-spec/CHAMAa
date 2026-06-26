import { GENDER_LABELS, modalidadeSportName } from '@/lib/sports-labels';

export function ModalidadeLabel({
  name,
  gender,
  division,
}: {
  name: string;
  gender: string;
  division?: string | null;
}) {
  return (
    <>
      {modalidadeSportName(name, gender)}
      <br />
      <small style={{ color: 'var(--muted)' }}>
        {GENDER_LABELS[gender] ?? gender}
        {division ? ` · ${division}` : ''}
      </small>
    </>
  );
}

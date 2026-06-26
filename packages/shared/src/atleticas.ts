export const ATLETICAS = [
  'Araraquara',
  'Araçatuba',
  'Assís',
  'Bauru',
  'Botucatu',
  'Dracena',
  'Franca',
  'Guaratinguetá',
  'Ilha Solteira',
  'Itapeva',
  'Jaboticabal',
  'Marília',
  'Ourinhos',
  'Presidente Prudente',
  'Registro',
  'Rio Claro',
  'Rosana',
  'São João da Boa Vista',
  'São José do Rio Preto',
  'São José dos Campos',
  'São Paulo',
  'São Vicente',
  'Sorocaba',
  'Tupã',
] as const;

export type AtleticaName = (typeof ATLETICAS)[number];

/** Arquivo em /public/atleticas (slug.ext) */
export const ATLETICA_LOGO_FILES: Record<AtleticaName, string> = {
  Araraquara: 'araraquara.png',
  Araçatuba: 'aracatuba.png',
  Assís: 'assis.png',
  Bauru: 'bauru.png',
  Botucatu: 'botucatu.png',
  Dracena: 'dracena.png',
  Franca: 'franca.png',
  Guaratinguetá: 'guaratingueta.png',
  'Ilha Solteira': 'ilha-solteira.png',
  Itapeva: 'itapeva.png',
  Jaboticabal: 'jaboticabal.png',
  Marília: 'marilia.png',
  Ourinhos: 'ourinhos.png',
  'Presidente Prudente': 'presidente-prudente.png',
  Registro: 'registro.png',
  'Rio Claro': 'rio-claro.png',
  Rosana: 'rosana.png',
  'São João da Boa Vista': 'sao-joao-da-boa-vista.png',
  'São José do Rio Preto': 'sao-jose-do-rio-preto.png',
  'São José dos Campos': 'sao-jose-dos-campos.jpg',
  'São Paulo': 'sao-paulo.png',
  'São Vicente': 'sao-vicente.png',
  Sorocaba: 'sorocaba.png',
  Tupã: 'tupa.png',
};

export function isAtleticaName(value: string): value is AtleticaName {
  return (ATLETICAS as readonly string[]).includes(value);
}

export function atleticaLogoUrl(name: string): string | null {
  if (!isAtleticaName(name)) return null;
  return `/atleticas/${ATLETICA_LOGO_FILES[name]}`;
}

/** Mapa nome do arquivo original (packages/aaa) → slug público */
export const ATLETICA_SOURCE_FILES: Record<AtleticaName, string> = {
  Araraquara: 'Araraquara.png',
  Araçatuba: 'Araçatuba.png',
  Assís: 'Assis.png',
  Bauru: 'Bauru.png',
  Botucatu: 'Botucatu.png',
  Dracena: 'Dracena.png',
  Franca: 'Franca.png',
  Guaratinguetá: 'Guaratinguetá.png',
  'Ilha Solteira': 'Ilha Solteira.png',
  Itapeva: 'Itapeva.png',
  Jaboticabal: 'Jaboticabal.png',
  Marília: 'Marília.png',
  Ourinhos: 'Ourinhos.png',
  'Presidente Prudente': 'Presidente Prudente.png',
  Registro: 'Registro.png',
  'Rio Claro': 'Rio Claro.png',
  Rosana: 'Rosana.png',
  'São João da Boa Vista': 'São João da Boa Vista.png',
  'São José do Rio Preto': 'São José do Rio Preto.png',
  'São José dos Campos': 'São José dos Campos.jpg',
  'São Paulo': 'São Paulo.png',
  'São Vicente': 'São Vicente.png',
  Sorocaba: 'Sorocaba.png',
  Tupã: 'Tupã.png',
};

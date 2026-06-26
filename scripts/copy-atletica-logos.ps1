# Copia logos de packages/aaa para apps/web/public/atleticas
$srcDir = "f:\CHAMA\packages\aaa"
$destDir = "f:\CHAMA\apps\web\public\atleticas"

$map = @{
  'araraquara.png' = 'Araraquara.png'
  'aracatuba.png' = 'Ara*atuba.png'
  'assis.png' = 'Assis.png'
  'bauru.png' = 'Bauru.png'
  'botucatu.png' = 'Botucatu.png'
  'dracena.png' = 'Dracena.png'
  'franca.png' = 'Franca.png'
  'guaratingueta.png' = 'Guaratinguet*.png'
  'ilha-solteira.png' = 'Ilha Solteira.png'
  'itapeva.png' = 'Itapeva.png'
  'jaboticabal.png' = 'Jaboticabal.png'
  'marilia.png' = 'Mar*lia.png'
  'ourinhos.png' = 'Ourinhos.png'
  'presidente-prudente.png' = 'Presidente Prudente.png'
  'registro.png' = 'Registro.png'
  'rio-claro.png' = 'Rio Claro.png'
  'rosana.png' = 'Rosana.png'
  'sao-joao-da-boa-vista.png' = 'S*o Jo*o da Boa Vista.png'
  'sao-jose-do-rio-preto.png' = 'S*o Jos* do Rio Preto.png'
  'sao-jose-dos-campos.jpg' = 'S*o Jos* dos Campos.jpg'
  'sao-paulo.png' = 'S*o Paulo.png'
  'sao-vicente.png' = 'S*o Vicente.png'
  'sorocaba.png' = 'Sorocaba.png'
  'tupa.png' = 'Tup*.png'
}

New-Item -ItemType Directory -Force -Path $destDir | Out-Null

foreach ($entry in $map.GetEnumerator()) {
  $found = Get-ChildItem $srcDir -File | Where-Object { $_.Name -like $entry.Value } | Select-Object -First 1
  if ($found) {
    Copy-Item $found.FullName (Join-Path $destDir $entry.Key) -Force
    Write-Host "OK $($entry.Key) <- $($found.Name)"
  } else {
    Write-Warning "Missing: $($entry.Key) ($($entry.Value))"
  }
}

# Instala as skills e ferramentas de vídeo/mídia no Windows.
# Uso: clique com o botão direito nesta pasta > "Abrir no Terminal" e rode:
#   powershell -ExecutionPolicy Bypass -File .\instalar-windows.ps1
$ErrorActionPreference = "Continue"
$Aqui  = $PSScriptRoot
$Sk    = Join-Path $HOME ".claude\skills"
$Tools = Join-Path $HOME "claude-tools"
$Tmp   = Join-Path $env:TEMP ("claude-setup-" + [guid]::NewGuid())
function Ok($m){ Write-Host "  [OK] $m" -ForegroundColor Green }
function Falta($m){ Write-Host "  [X]  $m" -ForegroundColor Red; $script:Faltou = $true }
$Faltou = $false

Write-Host "1/7 - Conferindo programas necessarios"
foreach($p in "git","node","npm","ffmpeg"){ if(Get-Command $p -ErrorAction SilentlyContinue){ Ok $p } else { Falta "$p nao encontrado" } }
# Python de verdade (o "python" da Microsoft Store e so um atalho que nao funciona)
$Py = $null
foreach($c in @("py -3","python","python3")){ $exe,$arg = $c.Split(" ",2); try { $v = & $exe $arg --version 2>&1 } catch { $v = "" }; if("$v" -match "^Python 3\.(\d+)"){ $Py = $c; break } }
if($Py){ Ok "python ($Py)" } else { Falta "python nao encontrado (o atalho da Microsoft Store nao conta)" }
function PyRun { $exe,$arg = $Py.Split(" ",2); if($arg){ & $exe $arg @args } else { & $exe @args } }
if($Faltou){
  Write-Host ""
  Write-Host "Instale o que faltou (no Terminal) e rode de novo:"
  Write-Host "  winget install --id Python.Python.3.12 -e   (e tambem Git.Git, OpenJS.NodeJS.LTS, Gyan.FFmpeg se faltarem)"
  Write-Host "Depois feche e abra o Terminal."
  exit 1
}

Write-Host "2/7 - Copiando as skills para $Sk"
New-Item -ItemType Directory -Force -Path $Sk | Out-Null
Copy-Item -Recurse -Force (Join-Path $Aqui "skills\*") $Sk
Ok "skills copiadas"

Write-Host "3/7 - OneTake (motion 'uma tomada so')"
Remove-Item -Recurse -Force (Join-Path $Sk "onetake") -ErrorAction SilentlyContinue
git clone -q --depth 1 https://github.com/feitangyuan/onetake.git (Join-Path $Sk "onetake"); if($?){ Ok "onetake" }

Write-Host "4/7 - Stickman Video Director"
git clone -q --depth 1 https://github.com/kaomei/stickman-video-director.git (Join-Path $Tmp "stick")
if($?){
  Remove-Item -Recurse -Force (Join-Path $Sk "directing-stickman-videos") -ErrorAction SilentlyContinue
  Copy-Item -Recurse (Join-Path $Tmp "stick\skills\directing-stickman-videos") $Sk
  Push-Location (Join-Path $Sk "directing-stickman-videos"); npm ci --no-audit --no-fund | Out-Null; Pop-Location
  Ok "directing-stickman-videos"
}

Write-Host "5/7 - Hypit (programa) e Claude Animation Base"
npm install --global @hypit/hypit | Out-Null; if($?){ Ok "hypit" } else { Falta "hypit" }
New-Item -ItemType Directory -Force -Path $Tools | Out-Null
$Cab = Join-Path $Tools "ClaudeAnimationBase"
Remove-Item -Recurse -Force $Cab -ErrorAction SilentlyContinue
git clone -q --depth 1 https://github.com/JohnHeibel/ClaudeAnimationBase.git $Cab
if($?){ Push-Location $Cab; npm install --no-audit --no-fund | Out-Null; Pop-Location; Ok "ClaudeAnimationBase em $Tools" }

Write-Host "6/7 - Pacotes Python (earshot, voz Kokoro, renderizador)"
PyRun -m pip install --user --quiet "git+https://github.com/Leonxlnx/earshot"; if($LASTEXITCODE -eq 0){ Ok "earshot" } else { Falta "earshot" }
PyRun -m pip install --user --quiet kokoro-onnx soundfile scipy numpy playwright; if($LASTEXITCODE -eq 0){ Ok "kokoro-onnx, soundfile, scipy, numpy, playwright" } else { Falta "pacotes python" }
PyRun -m playwright install chromium | Out-Null; if($LASTEXITCODE -eq 0){ Ok "navegador do playwright" } else { Falta "navegador do playwright" }
$Kk = Join-Path $Tools "kokoro"; New-Item -ItemType Directory -Force -Path $Kk | Out-Null
foreach($f in "kokoro-v1.0.onnx","voices-v1.0.bin"){
  $dst = Join-Path $Kk $f
  if(-not (Test-Path $dst)){ Invoke-WebRequest -UseBasicParsing -OutFile $dst "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f" }
}
Ok "modelos de voz Kokoro em $Kk"

Write-Host "7/7 - Preferencias (CLAUDE.md)"
$Cm = Join-Path $HOME ".claude\CLAUDE.md"
if(Test-Path $Cm){ Copy-Item (Join-Path $Aqui "CLAUDE.md") (Join-Path $HOME ".claude\CLAUDE.casadoja.md"); Ok "voce ja tinha um CLAUDE.md; preferencias salvas em CLAUDE.casadoja.md (junte manualmente)" }
else { Copy-Item (Join-Path $Aqui "CLAUDE.md") $Cm; Ok "CLAUDE.md criado" }
Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Pronto. Abra o Claude Code (ou o app Claude no modo Code) e as skills ja aparecem."
Write-Host "Para o Gemini: crie a chave em https://aistudio.google.com/apikey e rode (uma vez):"
Write-Host '  setx GEMINI_API_KEY "sua-chave"'

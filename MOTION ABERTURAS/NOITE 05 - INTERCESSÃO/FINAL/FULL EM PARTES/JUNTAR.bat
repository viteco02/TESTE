@echo off
cd /d "%~dp0"
copy /b noite05_full.mp4.part00+noite05_full.mp4.part01+noite05_full.mp4.part02+noite05_full.mp4.part03+noite05_full.mp4.part04+noite05_full.mp4.part05 NOITE05_VOZ_TRILHA_EFEITOS.mp4
copy /b noite05_SO_VOZ.mp4.part00+noite05_SO_VOZ.mp4.part01+noite05_SO_VOZ.mp4.part02+noite05_SO_VOZ.mp4.part03+noite05_SO_VOZ.mp4.part04+noite05_SO_VOZ.mp4.part05 NOITE05_SO_VOZ.mp4
copy /b noite05_SEM_AUDIO.mp4.part00+noite05_SEM_AUDIO.mp4.part01+noite05_SEM_AUDIO.mp4.part02+noite05_SEM_AUDIO.mp4.part03+noite05_SEM_AUDIO.mp4.part04+noite05_SEM_AUDIO.mp4.part05 NOITE05_SEM_AUDIO.mp4
copy /b noite05_COM_CAUDA.mp4.part00+noite05_COM_CAUDA.mp4.part01+noite05_COM_CAUDA.mp4.part02+noite05_COM_CAUDA.mp4.part03+noite05_COM_CAUDA.mp4.part04+noite05_COM_CAUDA.mp4.part05 NOITE05_COM_3s_EXTRA_SELO.mp4
echo Pronto!
pause

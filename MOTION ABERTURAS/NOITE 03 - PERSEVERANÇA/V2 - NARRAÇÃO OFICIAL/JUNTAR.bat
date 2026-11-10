@echo off
cd /d "%~dp0"
copy /b v2_full.mp4.part00+v2_full.mp4.part01+v2_full.mp4.part02+v2_full.mp4.part03 NOITE03_VOZ_TRILHA_EFEITOS.mp4
copy /b v2_SO_VOZ.mp4.part00+v2_SO_VOZ.mp4.part01+v2_SO_VOZ.mp4.part02+v2_SO_VOZ.mp4.part03 NOITE03_SO_VOZ.mp4
copy /b v2_SEM_AUDIO.mp4.part00+v2_SEM_AUDIO.mp4.part01+v2_SEM_AUDIO.mp4.part02+v2_SEM_AUDIO.mp4.part03 NOITE03_SEM_AUDIO.mp4
echo Pronto!
pause

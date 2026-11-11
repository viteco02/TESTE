@echo off
cd /d "%~dp0"
copy /b noite04_full.mp4.part00+noite04_full.mp4.part01+noite04_full.mp4.part02+noite04_full.mp4.part03 NOITE04_VOZ_TRILHA_EFEITOS.mp4
copy /b noite04_SO_VOZ.mp4.part00+noite04_SO_VOZ.mp4.part01+noite04_SO_VOZ.mp4.part02+noite04_SO_VOZ.mp4.part03 NOITE04_SO_VOZ.mp4
copy /b noite04_SEM_AUDIO.mp4.part00+noite04_SEM_AUDIO.mp4.part01+noite04_SEM_AUDIO.mp4.part02+noite04_SEM_AUDIO.mp4.part03 NOITE04_SEM_AUDIO.mp4
echo Pronto!
pause

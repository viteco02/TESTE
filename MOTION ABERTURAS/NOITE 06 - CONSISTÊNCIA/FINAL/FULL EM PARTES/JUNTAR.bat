@echo off
cd /d "%~dp0"
copy /b noite06_full.mp4.part00+noite06_full.mp4.part01 NOITE06_VOZ_TRILHA_EFEITOS.mp4
copy /b noite06_SO_VOZ.mp4.part00+noite06_SO_VOZ.mp4.part01 NOITE06_SO_VOZ.mp4
copy /b noite06_SEM_AUDIO.mp4.part00+noite06_SEM_AUDIO.mp4.part01 NOITE06_SEM_AUDIO.mp4
copy /b noite06_COM_CAUDA.mp4.part00+noite06_COM_CAUDA.mp4.part01+noite06_COM_CAUDA.mp4.part02 NOITE06_COM_3s_EXTRA_SELO.mp4
echo Pronto!
pause

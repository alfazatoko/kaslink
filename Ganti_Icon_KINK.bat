@echo off
setlocal
title ANTIGRAVITY - KINK Dev Mode

:: Set colors for premium look (White on Blue/Black)
color 0b

echo.
echo  ##########################################################
echo  #                                                        #
echo  #         ANTIGRAVITY AI - DEVELOPMENT ENGINE            #
echo  #         -----------------------------------            #
echo  #            PROJECT: KINK POS SYSTEM PRO                #
echo  #                                                        #
echo  ##########################################################
echo.
echo  [SYSTEM] Memulai lingkungan pengembangan...
echo.

:: 1. Buka folder project di explorer
echo  [1/3] Membuka direktori project...
start .

:: 2. Jalankan server lokal di jendela baru
echo  [2/3] Mengaktifkan Local Server (Port 3000)...
start "KINK_SERVER" cmd /c "npx serve . -p 3000"

:: 3. Tunggu sebentar agar server naik, lalu buka browser
timeout /t 3 /nobreak > nul
echo  [3/3] Menghubungkan ke browser...
start http://localhost:3000

:: 4. Pastikan Shortcut ada di Desktop dengan Icon KINK
echo  [4/4] Sinkronisasi shortcut di Desktop...
powershell -Command ^
    "$desktop = [Environment]::GetFolderPath('Desktop');" ^
    "$s = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desktop 'Edit KINK (Antigravity).lnk'));" ^
    "$s.TargetPath = '%~f0';" ^
    "$s.WorkingDirectory = '%~dp0';" ^
    "$s.IconLocation = '%~dp0logo.png';" ^
    "$s.Description = 'Mulai Edit KINK dengan Antigravity';" ^
    "$s.Save();"

echo.
echo  ==========================================================
echo   STATUS: AKTIF ^& TERPASANG DI DESKTOP
echo   SIAP UNTUK EDITING BERSAMA ANTIGRAVITY AI
echo  ==========================================================
echo.
echo  Sistem siap. Selamat bekerja!
timeout /t 5 > nul
exit

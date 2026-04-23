@echo off
:: Script untuk mengganti icon shortcut KINK di Desktop
:: Dibuat oleh Antigravity

set "ICON_FILE=logo.png"
set "ICON_PATH=%~dp0%ICON_FILE%"
set "SHORTCUT_NAME=KINK.lnk"

echo ===========================================
echo    Pembaruan Icon Aplikasi KINK
echo ===========================================
echo.

if not exist "%ICON_PATH%" (
    echo [ERROR] File icon tidak ditemukan di: %ICON_PATH%
    pause
    exit /b
)

echo Sedang memperbarui shortcut di Desktop...

powershell -Command ^
    "$desktop = [Environment]::GetFolderPath('Desktop');" ^
    "$shortcutPath = Join-Path $desktop '%SHORTCUT_NAME%';" ^
    "if (Test-Path $shortcutPath) {" ^
    "    $shell = New-Object -ComObject WScript.Shell;" ^
    "    $shortcut = $shell.CreateShortcut($shortcutPath);" ^
    "    $shortcut.IconLocation = '%ICON_PATH%';" ^
    "    $shortcut.Save();" ^
    "    Write-Host '--- Berhasil! Icon shortcut telah diperbarui. ---' -ForegroundColor Green;" ^
    "} else {" ^
    "    Write-Host '[PERINGATAN] Shortcut %SHORTCUT_NAME% tidak ditemukan di Desktop.' -ForegroundColor Yellow;" ^
    "    Write-Host 'Pastikan aplikasi sudah terpasang (install) di Desktop.' -ForegroundColor Gray;" ^
    "}"

echo.
echo Selesai.
pause

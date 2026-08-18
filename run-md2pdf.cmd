@echo off
setlocal
rem تشغيل أداة تحويل Markdown إلى PDF عبر بيئة Conda (md2pdf)
set "CONDA_ENV=C:\Users\LENOVO\miniconda3\envs\md2pdf"
set "PATH=%CONDA_ENV%\Library\bin;%PATH%"
set "WEASYPRINT_DLL_DIRECTORIES=%CONDA_ENV%\Library\bin"
"%CONDA_ENV%\python.exe" "%~dp0md2pdf.py" %*
endlocal

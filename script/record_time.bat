@echo off
setlocal enabledelayedexpansion

:: Set program name and string to search for
set command=%~1

:: recording start time
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set start_time=%%a

:: Execute the program and redirect the output to a variable
:: call %command% > temp.txt
:: Execute program
call %command%

:: Record the end time and calculate the execution time
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set end_time=%%a
set /a elapsed_time=(1!end_time:~8,6!-1!start_time:~8,6!+1000000) %% 1000000 * 1000 + (1!end_time:~15,3!-1!start_time:~15,3!)

:: Print execution results
:: type "temp.txt"
:: Delete Temporary Files
:: del temp.txt

:: Output execution time
echo Execution time: !elapsed_time! milliseconds.

endlocal

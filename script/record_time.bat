@echo off
setlocal enabledelayedexpansion

:: 设置程序名称和要搜索的字符串
set command=%~1

:: 记录开始时间
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set start_time=%%a

:: 执行程序并将输出重定向到变量中
:: call %command% > temp.txt
:: 执行程序
call %command%

:: 记录结束时间并计算执行时间
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set end_time=%%a
set /a elapsed_time=(1!end_time:~8,6!-1!start_time:~8,6!+1000000) %% 1000000 * 1000 + (1!end_time:~15,3!-1!start_time:~15,3!)

:: 打印执行结果
:: type "temp.txt"
:: 删除临时文件
:: del temp.txt

:: 输出执行时间
echo Execution time: !elapsed_time! milliseconds.

endlocal

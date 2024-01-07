@echo off

call script\execute_circom.bat zk\experiment 1-1 a a bn128 15 1-1input.json
call script\execute_circom.bat zk\experiment 1-2 a a bn128 15 1-2input.json
call script\execute_circom.bat zk\experiment 1-3 a a bn128 15 1-3input.json
call script\execute_circom.bat zk\experiment 1-4 a a bn128 16 1-4input.json
call script\execute_circom.bat zk\experiment 1-5 a a bn128 16 1-5input.json
call script\execute_circom.bat zk\experiment 1-6 a a bn128 16 1-6input.json

call script\execute_circom.bat zk\experiment 1-1_orign a a bn128 14 1-1input_without_audit.json
call script\execute_circom.bat zk\experiment 1-2_orign a a bn128 15 1-2input_without_audit.json
call script\execute_circom.bat zk\experiment 1-3_orign a a bn128 15 1-3input_without_audit.json
call script\execute_circom.bat zk\experiment 1-4_orign a a bn128 15 1-4input_without_audit.json
call script\execute_circom.bat zk\experiment 1-5_orign a a bn128 15 1-5input_without_audit.json
call script\execute_circom.bat zk\experiment 1-6_orign a a bn128 15 1-6input_without_audit.json


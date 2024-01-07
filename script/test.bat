@echo off
setlocal enabledelayedexpansion

:: mkdir zk\experiment

:: compiling circuits
@REM circom zk\circuits\1-1.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\circuits\1-2.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\circuits\1-3.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\circuits\1-4.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\circuits\1-5.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\circuits\1-6.circom -o zk\experiment\ --r1cs --wasm

@REM node zk\experiment\1-1_js\generate_witness.js zk\experiment\1-1_js\1-1.wasm zk\experiment\1-1input.json zk\experiment\1-1witness.wtns
@REM node zk\experiment\1-2_js\generate_witness.js zk\experiment\1-2_js\1-2.wasm zk\experiment\1-2input.json zk\experiment\1-2witness.wtns
@REM node zk\experiment\1-3_js\generate_witness.js zk\experiment\1-3_js\1-3.wasm zk\experiment\1-3input.json zk\experiment\1-3witness.wtns
@REM node zk\experiment\1-4_js\generate_witness.js zk\experiment\1-4_js\1-4.wasm zk\experiment\1-4input.json zk\experiment\1-4witness.wtns
@REM node zk\experiment\1-5_js\generate_witness.js zk\experiment\1-5_js\1-5.wasm zk\experiment\1-5input.json zk\experiment\1-5witness.wtns
@REM node zk\experiment\1-6_js\generate_witness.js zk\experiment\1-6_js\1-6.wasm zk\experiment\1-6input.json zk\experiment\1-6witness.wtns

@REM echo 1-1
@REM script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-1verification_key.json zk/experiment/1-1output.json zk/experiment/1-1proof.json"
@REM echo 1-2
@REM script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-2verification_key.json zk/experiment/1-2output.json zk/experiment/1-2proof.json"
@REM echo 1-3
@REM script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-3verification_key.json zk/experiment/1-3output.json zk/experiment/1-3proof.json"
@REM echo 1-4
@REM script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-4verification_key.json zk/experiment/1-4output.json zk/experiment/1-4proof.json"
@REM echo 1-5
@REM script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-5verification_key.json zk/experiment/1-5output.json zk/experiment/1-5proof.json"
@REM echo 1-6
@REM script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-6verification_key.json zk/experiment/1-6output.json zk/experiment/1-6proof.json"



@REM call script\execute_circom.bat zk\experiment 1-1_orign a a bn128 14 1-1input_without_audit.json
@REM call script\execute_circom.bat zk\experiment 1-2_orign a a bn128 15 1-2input_without_audit.json
@REM call script\execute_circom.bat zk\experiment 1-3_orign a a bn128 15 1-3input_without_audit.json
@REM call script\execute_circom.bat zk\experiment 1-4_orign a a bn128 15 1-4input_without_audit.json
@REM call script\execute_circom.bat zk\experiment 1-5_orign a a bn128 15 1-5input_without_audit.json
@REM call script\execute_circom.bat zk\experiment 1-6_orign a a bn128 15 1-6input_without_audit.json

@REM circom zk\experiment\1-1_orign.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\experiment\1-2_orign.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\experiment\1-3_orign.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\experiment\1-4_orign.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\experiment\1-5_orign.circom -o zk\experiment\ --r1cs --wasm
@REM circom zk\experiment\1-6_orign.circom -o zk\experiment\ --r1cs --wasm


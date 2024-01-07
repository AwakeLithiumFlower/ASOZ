@echo off
setlocal enabledelayedexpansion

:: parameters
set filepath=%~1
set jobName=%~2
set randText=%~3
set contributor=%~4
set curve=%~5
set tau=%~6
set secretFile=%~7

cd %filepath%

:: compiling circuits
circom %jobName%.circom --r1cs --wasm --sym

:: computing witness
:: Computing the witness with WebAssembly
node %jobName%_js\generate_witness.js %jobName%_js\%jobName%.wasm %secretFile% %jobName%witness.wtns

:: proving circuits with ZK
:: start a new "powers of tau" ceremony
call snarkjs powersoftau new %curve% %tau% pot%tau%_0000.ptau -v
:: contribute to the ceremony
:: Generate random number file
echo %randText%
echo %randText%>randtext.txt
call snarkjs powersoftau contribute pot%tau%_0000.ptau pot%tau%_0001.ptau --name="First contribution" -v < randtext.txt
:: Phase 2
call snarkjs powersoftau prepare phase2 pot%tau%_0001.ptau pot%tau%_final.ptau -v
:: generate a .zkey file that will contain the proving and verification keys together with all phase 2 contributions
call snarkjs groth16 setup %jobName%.r1cs pot%tau%_final.ptau %jobName%_0000.zkey
:: Contribute to the phase 2 of the ceremony
echo %contributor%>contributor.txt
call snarkjs zkey contribute %jobName%_0000.zkey %jobName%_0001.zkey --name="1st Contributor Name" -v < contributor.txt
:: Export the verification key
call snarkjs zkey export verificationkey %jobName%_0001.zkey %jobName%verification_key.json


:: Generating a Proof
call snarkjs groth16 prove %jobName%_0001.zkey %jobName%witness.wtns %jobName%proof.json %jobName%output.json

:: Verifying a Proof
:: call snarkjs groth16 verify verification_key.json public.json proof.json
:: Generate input parameters for the smart contract function verifyProof, which actually correspond to the proof file
:: call snarkjs generatecall

@echo off
setlocal enabledelayedexpansion

echo proof part2
echo 1-1
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-1_0001.zkey zk/experiment/1-1witness.wtns zk/experiment/1-1proof.json zk/experiment/1-1output.json"
echo 1-2
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-2_0001.zkey zk/experiment/1-2witness.wtns zk/experiment/1-2proof.json zk/experiment/1-2output.json"
echo 1-3
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-3_0001.zkey zk/experiment/1-3witness.wtns zk/experiment/1-3proof.json zk/experiment/1-3output.json"
echo 1-4
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-4_0001.zkey zk/experiment/1-4witness.wtns zk/experiment/1-4proof.json zk/experiment/1-4output.json"
echo 1-5
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-5_0001.zkey zk/experiment/1-5witness.wtns zk/experiment/1-5proof.json zk/experiment/1-5output.json"
echo 1-6
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-6_0001.zkey zk/experiment/1-6witness.wtns zk/experiment/1-6proof.json zk/experiment/1-6output.json"

echo 1-1_orign
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-1_orign_0001.zkey zk/experiment/1-1_orignwitness.wtns zk/experiment/1-1_orignproof.json zk/experiment/1-1_orignoutput.json"
echo 1-2_orign
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-2_orign_0001.zkey zk/experiment/1-2_orignwitness.wtns zk/experiment/1-2_orignproof.json zk/experiment/1-2_orignoutput.json"
echo 1-3_orign
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-3_orign_0001.zkey zk/experiment/1-3_orignwitness.wtns zk/experiment/1-3_orignproof.json zk/experiment/1-3_orignoutput.json"
echo 1-4_orign
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-4_orign_0001.zkey zk/experiment/1-4_orignwitness.wtns zk/experiment/1-4_orignproof.json zk/experiment/1-4_orignoutput.json"
echo 1-5_orign
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-5_orign_0001.zkey zk/experiment/1-5_orignwitness.wtns zk/experiment/1-5_orignproof.json zk/experiment/1-5_orignoutput.json"
echo 1-6_orign
call script\record_time.bat "call snarkjs groth16 prove zk/experiment/1-6_orign_0001.zkey zk/experiment/1-6_orignwitness.wtns zk/experiment/1-6_orignproof.json zk/experiment/1-6_orignoutput.json"


echo verify part
echo 1-1
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-1verification_key.json zk/experiment/1-1output.json zk/experiment/1-1proof.json"
echo 1-2
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-2verification_key.json zk/experiment/1-2output.json zk/experiment/1-2proof.json"
echo 1-3
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-3verification_key.json zk/experiment/1-3output.json zk/experiment/1-3proof.json"
echo 1-4
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-4verification_key.json zk/experiment/1-4output.json zk/experiment/1-4proof.json"
echo 1-5
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-5verification_key.json zk/experiment/1-5output.json zk/experiment/1-5proof.json"
echo 1-6
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-6verification_key.json zk/experiment/1-6output.json zk/experiment/1-6proof.json"


echo 1-1_orign
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-1_orignverification_key.json zk/experiment/1-1_orignoutput.json zk/experiment/1-1_orignproof.json"
echo 1-2_orign
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-2_orignverification_key.json zk/experiment/1-2_orignoutput.json zk/experiment/1-2_orignproof.json"
echo 1-3_orign
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-3_orignverification_key.json zk/experiment/1-3_orignoutput.json zk/experiment/1-3_orignproof.json"
echo 1-4_orign
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-4_orignverification_key.json zk/experiment/1-4_orignoutput.json zk/experiment/1-4_orignproof.json"
echo 1-5_orign
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-5_orignverification_key.json zk/experiment/1-5_orignoutput.json zk/experiment/1-5_orignproof.json"
echo 1-6_orign
call script\record_time.bat "call snarkjs groth16 verify zk/experiment/1-6_orignverification_key.json zk/experiment/1-6_orignoutput.json zk/experiment/1-6_orignproof.json"


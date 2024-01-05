[ -d zk/zkey ] || mkdir zk/experiment

# Compile circuits
circom zk/circuits/1-1.circom -o zk/experiment/ --r1cs --wasm
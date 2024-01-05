pragma circom 2.0.0;

include "merkle.circom";

// parameters needed to be changed with the change of merkle tree depth
component main { public [root] } = Mkt2Verifier(32);
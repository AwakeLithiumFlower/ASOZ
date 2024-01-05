pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/babyjub.circom";
include "basic_tool.circom";
include "merkle.circom";

template testAdd() {
    signal input x1;
    signal input y1;
    signal input x2;
    signal input y2;
    signal output xout;
    signal output yout;

    component add = BabyAdd();

    add.x1 <== x1;
    add.y1 <== y1;
    add.x2 <== x2;
    add.y2 <== y2;
    log(add.xout);
    log(add.yout);
    xout <== add.xout;
    yout <== add.yout;
}

component main = testAdd();

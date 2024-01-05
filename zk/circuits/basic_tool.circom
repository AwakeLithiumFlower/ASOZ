pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/babyjub.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/escalarmulfix.circom";

template isOdd() {
    signal input in;
    signal output out;

    out <-- in % 2;
}

template BabyPbkGH(type) {
    signal input  in;
    signal output Ax;
    signal output Ay;

    var BASE8[2];

    if (type == 0){
        // g
        BASE8 = [
                        10457101036533406547632367118273992217979173478358440826365724437999023779287,
                        19824078218392094440610104313265183977899662750282163392862422243483260492317
                   ];
    } else if (type == 1){
        // h
        BASE8 = [
                        2671756056509184035029146175565761955751135805354291559563293617232983272177,
                        2663205510731142763556352975002641716101654201788071096152948830924149045094
                   ];
    }else{
        // upk
        BASE8 = [
                        6331850395537585927290680390752447884532794188697923556312761505688747217175,
                        2462143816122748060390620296277376383273414174303403200944239221836425025776
                   ];
    }

    component pvkBits = Num2Bits(256);
    pvkBits.in <== in;

    component mulFix = EscalarMulFix(256, BASE8);

    var i;
    for (i=0; i<256; i++) {
        mulFix.e[i] <== pvkBits.out[i];
    }
    Ax  <== mulFix.out[0];
    Ay  <== mulFix.out[1];
}

template PRFk(){
    signal input pk;
    signal input rho;
    signal output outx;
    signal output outy;

    component mul1 = BabyPbkGH(0);
    component mul2 = BabyPbkGH(1);

    mul1.in <== pk;
    mul2.in <== rho;

    component adder = BabyAdd();
    adder.x1 <== mul1.Ax;
    adder.y1 <== mul1.Ay;
    adder.x2 <== mul2.Ax;
    adder.y2 <== mul2.Ay;

    outx <== adder.xout;
    outy <== adder.yout;
}

template PRFsn(){
    signal input rho;
    signal input pkx;
    signal input pky;
    signal output out;

    component mul1 = BabyPbkGH(1);
    mul1.in <== rho;
    component adder = BabyAdd();
    adder.x1 <== mul1.Ax;
    adder.y1 <== mul1.Ay;
    adder.x2 <== pkx;
    adder.y2 <== pky;

//    component hashV = Poseidon(1);
//    hashV.inputs[0] <== adder.xout;

    out <== adder.xout;
}

template cmGenerate(){
    signal input pk;
    signal input rho;
    signal input v;
    signal output outx;
    signal output outy;

    component prf = PRFk();
    prf.pk <== pk;
    prf.rho <== rho;
    signal prfx;
    prfx <== prf.outx;

    component mul1 = BabyPbkGH(0);
    component mul2 = BabyPbkGH(1);

    mul1.in <== prfx;
    mul2.in <== v;

    component adder = BabyAdd();
    adder.x1 <== mul1.Ax;
    adder.y1 <== mul1.Ay;
    adder.x2 <== mul2.Ax;
    adder.y2 <== mul2.Ay;

    outx <== adder.xout;
    outy <== adder.yout;
}

template cmListGen(num){
    signal input rhoList[num];
    signal input pkList[num];
    signal input vList[num];
    signal output outList[num];
    component cmc[num];

    for(var i=0; i<num; i++) {
        cmc[i] = cmGenerate();
        cmc[i].rho <== rhoList[i];
        cmc[i].pk <== pkList[i];
        cmc[i].v <== vList[i];
        outList[i] <== cmc[i].outx;
    }
}

template Y2Gen(){
    signal input r4;
    signal input pkrx;
    signal input pkry;

    signal output outx;
    signal output outy;

    component mul = BabyPbkGH(2);

    mul.in <== r4;

    component adder = BabyAdd();
    adder.x1 <== pkrx;
    adder.y1 <== pkry;
    adder.x2 <== mul.Ax;
    adder.y2 <== mul.Ay;

    outx <== adder.xout;
    outy <== adder.yout;
}

template XY2ListGen(num){
    signal input r4List[num];
    signal input pkrxList[num];
    signal input pkryList[num];

    signal output X2outxList[num];
    signal output Y2outxList[num];
    component y2c[num];
    component x2c[num];

    for(var i=0; i<num; i++) {
        y2c[i] = Y2Gen();
        y2c[i].r4 <== r4List[i];
        y2c[i].pkrx <== pkrxList[i];
        y2c[i].pkry <== pkryList[i];
        Y2outxList[i] <== y2c[i].outx;

        x2c[i] = BabyPbkGH(0);
        x2c[i].in <== r4List[i];
        X2outxList[i] <== x2c[i].Ax;
    }
}


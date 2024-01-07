pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/babyjub.circom";
include "basic_tool.circom";
include "merkle.circom";

template testMyHash() {

    signal input a;
    signal input b;

    signal input resultHash;

    component hashV = Poseidon(2);

    hashV.inputs[0] <== a;
    hashV.inputs[1] <== b;

    log(hashV.out);

    resultHash === hashV.out;
}

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


template testSchemeWithoutAudit(inputNum,outputNum,nLevels){
    signal input sk_s;
    signal input pkList_r[outputNum][2];
    signal input key[inputNum];
    signal input root[inputNum];
    signal input siblings[inputNum][nLevels];
    signal input vInput[inputNum];
    signal input vOutput[outputNum];
    signal input rho_old[inputNum];
    signal input rho_new[outputNum];

    signal output cmList_r[outputNum];
    signal output snList_s[inputNum];

    component cmList_old = cmListGen(inputNum);
    component cmList_new = cmListGen(outputNum);
    component snList[inputNum];
    component treeVerify[inputNum];

    signal pkx_s;
    signal pky_s;
    component mulPk = BabyPbkGH(0);
    mulPk.in <== sk_s;
    pkx_s <== mulPk.Ax;
    pky_s <== mulPk.Ay;

    for(var i=0;i<inputNum;i++){
        cmList_old.rhoList[i] <== rho_old[i];
        cmList_old.vList[i] <== vInput[i];
        cmList_old.pkList[i] <== pkx_s;
        treeVerify[i] = Mkt2Verifier(nLevels);
        treeVerify[i].key <== key[i];
        treeVerify[i].root <== root[i];
        for(var j=0;j<nLevels;j++){
            treeVerify[i].siblings[j] <== siblings[i][j];
        }

        snList[i] = PRFsn();
        snList[i].rho <== rho_old[i];
        snList[i].pkx <== pkx_s;
        snList[i].pky <== pky_s;
        snList_s[i] <== snList[i].out;
    }
    for(var i=0;i<inputNum;i++){
        treeVerify[i].value <== cmList_old.outList[i];
    }

    for(var i=0;i<outputNum;i++){
        cmList_new.rhoList[i] <== rho_new[i];
        cmList_new.vList[i] <== vOutput[i];
        cmList_new.pkList[i] <== pkList_r[i][0];
    }
    for(var i=0;i<outputNum;i++){
        cmList_r[i] <== cmList_new.outList[i];
    }

//    var vInputSum = 0;
//    var vOutputSum = 0;
//    signal zeroSum;
//    zeroSum <-- 0;
//    for(var i=0;i<inputNum;i++){
//        vInputSum = vInputSum + vInput[i];
//    }
//    for(var i=0;i<outputNum;i++){
//        vOutputSum = vOutputSum + vOutput[i];
//    }
//    zeroSum === vInputSum - vOutputSum;
}

template testScheme(inputNum,outputNum,nLevels){
    signal input sk_s;
    signal input pkList_r[outputNum][2];
    signal input key[inputNum];
    signal input root[inputNum];
    signal input siblings[inputNum][nLevels];
    signal input vInput[inputNum];
    signal input vOutput[outputNum];
    signal input rho_old[inputNum];
    signal input rho_new[outputNum];
    signal input r4[outputNum];

    signal output cmList_r[outputNum];
    signal output snList_s[inputNum];
    signal output X2[outputNum];
    signal output Y2[outputNum];

    component cmList_old = cmListGen(inputNum);
    component cmList_new = cmListGen(outputNum);
    component XY2List = XY2ListGen(outputNum);
    component snList[inputNum];
    component treeVerify[inputNum];

    signal pkx_s;
    signal pky_s;
    component mulPk = BabyPbkGH(0);
    mulPk.in <== sk_s;
    pkx_s <== mulPk.Ax;
    pky_s <== mulPk.Ay;

    for(var i=0;i<inputNum;i++){
        cmList_old.rhoList[i] <== rho_old[i];
        cmList_old.vList[i] <== vInput[i];
        cmList_old.pkList[i] <== pkx_s;
        treeVerify[i] = Mkt2Verifier(nLevels);
        treeVerify[i].key <== key[i];
        treeVerify[i].root <== root[i];
        for(var j=0;j<nLevels;j++){
            treeVerify[i].siblings[j] <== siblings[i][j];
        }

        snList[i] = PRFsn();
        snList[i].rho <== rho_old[i];
        snList[i].pkx <== pkx_s;
        snList[i].pky <== pky_s;
        snList_s[i] <== snList[i].out;
    }
    for(var i=0;i<inputNum;i++){
        treeVerify[i].value <== cmList_old.outList[i];
    }

    for(var i=0;i<outputNum;i++){
        cmList_new.rhoList[i] <== rho_new[i];
        cmList_new.vList[i] <== vOutput[i];
        cmList_new.pkList[i] <== pkList_r[i][0];

        XY2List.r4List[i] <== r4[i];
        XY2List.pkrxList[i] <== pkList_r[i][0];
        XY2List.pkryList[i] <== pkList_r[i][1];
    }
    for(var i=0;i<outputNum;i++){
        cmList_r[i] <== cmList_new.outList[i];
        X2[i] <== XY2List.X2outxList[i];
        Y2[i] <== XY2List.Y2outxList[i];
    }

//    var vInputSum = 0;
//    var vOutputSum = 0;
//    signal zeroSum;
//    zeroSum <-- 0;
//    for(var i=0;i<inputNum;i++){
//        vInputSum = vInputSum + vInput[i];
//    }
//    for(var i=0;i<outputNum;i++){
//        vOutputSum = vOutputSum + vOutput[i];
//    }
//    zeroSum === vInputSum - vOutputSum;
}

// component main = testMyHash();
// component main = isOdd();
// component main = PRFk();
// component main = testAdd();
// component main = cmListGen(2);
// component main = testScheme(2,2,32);

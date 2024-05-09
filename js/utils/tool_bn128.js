const bn128 = require('rustbn.js')

class BN128Tool{
    constructor(PBASE){
        this.PBASE = PBASE;
        this.p = 21888242871839275222246405745257275088696311157297823662689037894645226208583n
        // this.p = "0000000000000029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";
        this.order = 21888242871839275222246405745257275088548364400416034343698204186575808495617n
        // this.order = "0000000000000029b85045b68181585d2833e84879b9709143e1f593f0000001";
    }
    add(inputPoint_1, inputPoint_2) {
        let input;
        if(typeof inputPoint_1[0] === 'bigint' && typeof inputPoint_2[0] === 'bigint') {
            input = this.bigintToHexStr(inputPoint_1[0]) + this.bigintToHexStr(inputPoint_1[1])
                + this.bigintToHexStr(inputPoint_2[0]) + this.bigintToHexStr(inputPoint_2[1]);
        }else if(typeof inputPoint_1[0] === 'string' && typeof inputPoint_2[0] === 'string'){
            input = inputPoint_1[0] + inputPoint_1[1] + inputPoint_2[0] + inputPoint_2[1];
            //判断是否为int类型
        }else if(typeof inputPoint_1[0] === 'number' && typeof inputPoint_2[0] === 'number'){
            input = this.bigintToHexStr(BigInt(inputPoint_1[0])) + this.bigintToHexStr(BigInt(inputPoint_1[1]))
                + this.bigintToHexStr(BigInt(inputPoint_2[0])) + this.bigintToHexStr(BigInt(inputPoint_2[1]));
        }else{
            throw new Error('Invalid input type'+ typeof inputPoint_1[0]);
        }
        let output = bn128.add(input);
        return [output.slice(0, 64), output.slice(64)];
    }

    mul(inputPoint, inputScalar) {
        let input;
        let inputScaler_2;
        if(typeof inputScalar === 'bigint') {
            inputScaler_2 = this.bigintToHexStr(inputScalar);
        }else if(typeof inputScalar === 'string'){
            inputScaler_2 = inputScalar;
        }else if(typeof inputScalar === 'number'){
            inputScaler_2 = this.bigintToHexStr(BigInt(inputScalar));
        }else{
            throw new Error('Invalid input type of input scalar' + typeof inputScalar);
        }

        if(typeof inputPoint[0] === 'bigint') {
            input = this.bigintToHexStr(inputPoint[0]) + this.bigintToHexStr(inputPoint[1]) + inputScaler_2;
        }else if(typeof inputPoint[0] === 'string'){
            input = inputPoint[0] + inputPoint[1] + inputScaler_2;
        }else if(typeof inputPoint[0] === 'number'){
            input = this.bigintToHexStr(BigInt(inputPoint[0])) + this.bigintToHexStr(BigInt(inputPoint[1])) + inputScaler_2;
        }else{
            throw new Error('Invalid input type of input point'+ typeof inputPoint[0]);
        }
        let output = bn128.mul(input);
        return [output.slice(0, 64), output.slice(64)];
    }

    bigintToHexStr(num) {
        if(typeof num !== 'bigint') {
            num = BigInt(num);
        }
        num = num % this.order;

        let hex = num.toString(16);
        while(hex.length < 64) {
            hex = '0' + hex;
        }
        return hex;
    }

    hexStrToBigInt(hexStr) {
        if (typeof hexStr === 'bigint') {
            return hexStr;
        }else if(typeof hexStr === 'number'){
            return BigInt(hexStr);
        }else{
            return BigInt('0x' + hexStr);
        }

    }

    hexStrAddInPField(hexStr1, hexStr2) {
        return this.bigintToHexStr((this.hexStrToBigInt(hexStr1) + this.hexStrToBigInt(hexStr2)) % this.order);
    }

    hexStrMulInPField(hexStr1, hexStr2) {
        return this.bigintToHexStr((this.hexStrToBigInt(hexStr1) * this.hexStrToBigInt(hexStr2)) % this.order);
    }

    // array equal
    arrayEqual(arr1, arr2){
        if(arr1.length !== arr2.length){
            return false;
        }
        for(let i=0;i<arr1.length;i++){
            if(arr1[i] !== arr2[i]){
                return false;
            }
        }
        return true;
    }

    // get a random point from a random value. In another word, get a public key from a private key
    randomPointGenerator(randomValue){
        return this.mul(this.PBASE[0], randomValue);
    }

    // calculate cm list
    cmListCalculator(rhoList, pkList, vList){
        // check length
        if(rhoList.length !== pkList.length || pkList.length !== vList.length){
            throw new Error("rhoList, pkList, vList should have the same length");
        }
        // check length > 0
        if(rhoList.length === 0){
            throw new Error("rhoList, pkList, vList should have length > 0");
        }
        let cmList = [];

        for(let i=0;i<rhoList.length;i++){
            cmList[i] = this.cmCalculator(
                pkList[i],
                rhoList[i],
                vList[i]);
        }

        return cmList;
    }

    // calculate signle cm
    cmCalculator(pk, rho, v){
        return this.add(
            this.mul(this.PBASE[0], this.PRF_k(pk, rho)[0]),
            this.mul(this.PBASE[1], v)
        );
    }

    // a pesudorandom function, see paper for details
    PRF_k(pk, rho){
        return this.add(
            this.mul(this.PBASE[0], pk[0]),
            this.mul(this.PBASE[1], rho)
        );
    }

    // calculate sn list
    snListCalculator(rhoList, sk){
        // check length > 0
        if(rhoList.length === 0){
            throw new Error("rhoList should have length > 0");
        }
        let snList = [];
        for(let i=0;i<rhoList.length;i++){
            snList[i] = this.PRF_sn(rhoList[i], sk);
        }
        return snList;
    }

    // sn generator function, see paper for details
    PRF_sn(rho, sk){
        let p = this.add(
            this.mul(this.PBASE[0], sk),
            this.mul(this.PBASE[1], rho)
        );
        // let a = this.point2BigInt(p[0]);
        // let b = hash.F.e(a);
        return p;
    }

    auditCiphertextValue(upk, r2){
        let X = this.mul(upk, r2);

        return {X: X};
    }

    auditDecryptionValue(X, Y, usk){
        // decrypt with Twist ElGamal
        // Since this part is not required for the experiment in the paper, it will not be implemented temporarily
    }

    auditCiphertextPks(upk, r3, pk_s){
        let X1 = this.mul(this.PBASE[0], r3);
        let Y1 = this.add(
            this.mul(upk, r3),
            pk_s
        );

        return {
            X1: X1,
            Y1: Y1
        };
    }

    auditDecryptionPks(X, Y, usk){
        // decrypt with ElGamal
        // Since this part is not required for the experiment in the paper, it will not be implemented temporarily
    }

    auditCiphertextPkr(upk, r4, pk_r){
        let X2 = this.mul(this.PBASE[0], r4);
        let Y2 = this.add(
            this.mul(upk, r4),
            pk_r
        );

        return {
            X2: X2,
            Y2: Y2
        };
    }

    auditDecryptionPkr(X, Y, usk){
        // decrypt with ElGamal
        // Since this part is not required for the experiment in the paper, it will not be implemented temporarily
    }
}

module.exports = {
    BN128Tool
}
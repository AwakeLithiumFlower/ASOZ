const assert = require('assert');

class CryptoTool{
    constructor(curve, PBASE) {
        this.curve = curve;
        this.field = curve.F;
        this.PBASE = PBASE;
    }

    // elliptic curve subtraction
    subtractionPoint(a, b) {
        // Get the additive inverse of Q
        let minusB = [b[0], this.field.e(this.curve.p.sub(b[1]))];
        // Perform the addition
        return this.curve.add(a, minusB);
    }

    // a pesudorandom function, see paper for details
    PRF_k(pk, rho){
        if(typeof pk !== "bigint"){
            pk = this.point2BigInt(pk[0]);
        }
        return this.addPoint(
            this.mulPointEscalar(this.PBASE[0], pk),
            this.mulPointEscalar(this.PBASE[1], rho)
        );
    }

    // public key generator function, see paper for details
    PRF_pk(sk){
        return this.mulPointEscalar(this.PBASE[0], sk);
    }

    // sn generator function, see paper for details
    PRF_sn(rho, sk){
        let p = this.addPoint(
            this.mulPointEscalar(this.PBASE[0], sk),
            this.mulPointEscalar(this.PBASE[1], rho)
        );
        // let a = this.point2BigInt(p[0]);
        // let b = hash.F.e(a);
        return p;
    }

    // calculate signle cm
    cmCalculator(pk, rho, v){
        if(typeof pk !== "bigint"){
            pk = this.point2BigInt(pk[0]);
        }
        return this.addPoint(
            this.mulPointEscalar(this.PBASE[0], this.point2BigInt(this.PRF_k(pk, rho)[0])),
            this.mulPointEscalar(this.PBASE[1], v)
        );
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

        if(typeof pkList[0] === "bigint"){
            for(let i=0;i<rhoList.length;i++){
                cmList[i] = this.cmCalculator(
                        pkList[i],
                        rhoList[i],
                        vList[i]);
            }
        }else{
            for(let i=0;i<rhoList.length;i++){
                cmList[i] = this.cmCalculator(
                        this.point2BigInt(pkList[i][0]),
                        rhoList[i],
                        vList[i]);
            }
        }

        return cmList;
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

    // calculate r_equation, see paper for details
    r_equationCalculator(rhoListOld, rhoListNew, pk_s, pk_rList){
        //check length
        if(pk_rList.length !== rhoListNew.length){
            throw new Error("pk_rList, rhoListNew should have the same length");
        }
        // check length > 0
        if(pk_rList.length === 0){
            throw new Error("pk_rList, rhoListNew should have length > 0");
        }
        let positivePoint = [0n, 0n];
        let negativePoint = [0n, 0n];
        for(let i=0;i<rhoListNew.length;i++){
            positivePoint = this.addPoint(
                positivePoint,
                this.PRF_k(pk_rList[i], rhoListNew[i])
            );
        }
        for(let i=0;i<rhoListOld.length;i++){
            negativePoint = this.addPoint(
                negativePoint,
                this.PRF_k(pk_s, rhoListOld[i])
            );
        }
        return this.subtractionPoint(positivePoint, negativePoint);
    }

    // get a random point from a random value. In another word, get a public key from a private key
    randomPointGenerator(randomValue){
        return this.mulPointEscalar(this.PBASE[0], randomValue);
    }

    // get a random point from a random value. In another word, get a public key from a private key
    pointGenerator(value){
        return this.mulPointEscalar(this.PBASE[2], value);
    }

    // sigma proof of value
    sigmaProofOfValueGenerator(upk, rListNew, vListNew, hash, randomList) {
        // check length
        if (rListNew.length !== vListNew.length) {
            throw new Error("rListNew, vListNew should have the same length");
        }
        // check length > 0
        if (rListNew.length === 0) {
            throw new Error("rListNew, vListNew should have length > 0");
        }
        let A = [];
        let B = [];
        for (let i = 0; i < randomList.length; i++) {
            A.push(this.mulPointEscalar(upk, randomList[i][0]));
            B.push(this.addPoint(
                this.mulPointEscalar(this.PBASE[0], randomList[i][0]),
                this.mulPointEscalar(this.PBASE[1], randomList[i][1])
                )
            );
        }

        let hashInput = (this.sumPointArray(A)
            + this.sumPointArray(B)).toString();
        let e = hash(hashInput);
        let e_BigInt = BigInt("0x"+e);
        let zList_1 = [];
        let zList_2 = [];
        for (let i = 0; i < randomList.length; i++) {
            // let js = (randomList[0] + e_BigInt * rListNew[i])%this.field.p;
            // let test2 = this.point2BigInt(this.field.e(BigInt(randomList[0] + e_BigInt * rListNew[i])));
            zList_1[i]=(randomList[i][0] + e_BigInt * rListNew[i])%this.curve.order;
            zList_2[i]=(randomList[i][1] + e_BigInt * BigInt(vListNew[i]))%this.curve.order;
        }

        return {
            A: A,
            B: B,
            zList_1: zList_1,
            zList_2: zList_2,
            sol_input:{
                A: this.array2FField16(A),
                B: this.array2FField16(B),
                zList_1: this.array216(zList_1),
                zList_2: this.array216(zList_2)
            }
        }
    }

    // js valid of sigma proof of value
    sigmaProofOfValueVerifier(A, B, zList_1, zList_2, upk, XList, YList, hash){
        // check length
        if (A.length !== B.length || B.length !== zList_1.length || zList_1.length !== zList_2.length) {
            throw new Error("A, B, zList_1, zList_2 should have the same length");
        }
        // check length > 0
        if (A.length === 0) {
            throw new Error("A, B, zList_1, zList_2 should have length > 0");
        }
        let hashInput = (this.sumPointArray(A)
            + this.sumPointArray(B)).toString();
        let e = hash(hashInput);
        let e_BigInt = BigInt("0x"+e);
        for(let i=0;i<A.length;i++){
            let upkz_1 = this.mulPointEscalar(upk, zList_1[i]);
            let AXe = this.addPoint(
                A[i],
                this.mulPointEscalar(XList[i], e_BigInt)
            );
            let gz_1hz_2 = this.addPoint(
                this.mulPointEscalar(this.PBASE[0], zList_1[i]),
                this.mulPointEscalar(this.PBASE[1], zList_2[i])
            );
            let BYe = this.addPoint(
                B[i],
                this.mulPointEscalar(YList[i], e_BigInt)
            );
            if(!this.deepEqual(upkz_1, AXe) ||
                !this.deepEqual(gz_1hz_2, BYe)){
                assert.fail();
                return false;
            }
        }
        return true;
    }

    // sigma proof of sks
    sigmaProofOfSkGenerator(upk, rListNew, vListNew, hash, randomList) {
        // check length
        if (rListNew.length !== vListNew.length) {
            throw new Error("rListNew, vListNew should have the same length");
        }
        // check length > 0
        if (rListNew.length === 0) {
            throw new Error("rListNew, vListNew should have length > 0");
        }
        let A = [];
        let B = [];
        for (let i = 0; i < randomList.length; i++) {
            A.push(this.mulPointEscalar(this.PBASE[0], randomList[i][0]));
            B.push(this.addPoint(
                    this.mulPointEscalar(upk, randomList[i][0]),
                    this.mulPointEscalar(this.PBASE[0], randomList[i][1])
                )
            );
        }

        let hashInput = (this.sumPointArray(A)
            + this.sumPointArray(B)).toString();
        let e = hash(hashInput);
        let e_BigInt = BigInt("0x"+e);
        let zList_1 = [];
        let zList_2 = [];
        for (let i = 0; i < randomList.length; i++) {
            // let js = (randomList[0] + e_BigInt * rListNew[i])%this.field.p;
            // let test2 = this.point2BigInt(this.field.e(BigInt(randomList[0] + e_BigInt * rListNew[i])));
            zList_1[i]=(randomList[i][0] + e_BigInt * rListNew[i])%this.curve.order;
            zList_2[i]=(randomList[i][1] + e_BigInt * BigInt(vListNew[i]))%this.curve.order;
        }

        return {
            A: A,
            B: B,
            zList_1: zList_1,
            zList_2: zList_2,
            sol_input:{
                A: this.array2FField16(A),
                B: this.array2FField16(B),
                zList_1: this.array216(zList_1),
                zList_2: this.array216(zList_2)
            }
        }
    }

    // js valid of sigma proof of value
    sigmaProofOfSkVerifier(A, B, zList_1, zList_2, upk, XList, YList, hash){
        // check length
        if (A.length !== B.length || B.length !== zList_1.length || zList_1.length !== zList_2.length) {
            throw new Error("A, B, zList_1, zList_2 should have the same length");
        }
        // check length > 0
        if (A.length === 0) {
            throw new Error("A, B, zList_1, zList_2 should have length > 0");
        }
        let hashInput = (this.sumPointArray(A)
            + this.sumPointArray(B)).toString();
        let e = hash(hashInput);
        let e_BigInt = BigInt("0x"+e);
        for(let i=0;i<A.length;i++){
            let upkz_1 = this.mulPointEscalar(this.PBASE[0], zList_1[i]);
            let AXe = this.addPoint(
                A[i],
                this.mulPointEscalar(XList[i], e_BigInt)
            );
            let gz_1hz_2 = this.addPoint(
                this.mulPointEscalar(upk, zList_1[i]),
                this.mulPointEscalar(this.PBASE[0], zList_2[i])
            );
            let BYe = this.addPoint(
                B[i],
                this.mulPointEscalar(YList[i], e_BigInt)
            );
            if(!this.deepEqual(upkz_1, AXe) ||
                !this.deepEqual(gz_1hz_2, BYe)){
                assert.fail();
                return false;
            }
        }
        return true;
    }

    // sigma proof of key
    sigmaProofOfKeyGenerator(upk, r, sks, rhoList, hash, randomList){
        // check length
        if (rhoList.length !== randomList.length - 2) {
            throw new Error("rhoListOld, (randomList-2) should have the same length");
        }
        // check length > 0
        if (rhoList.length === 0) {
            throw new Error("rhoListOld should have length > 0");
        }

        let A = this.mulPointEscalar(this.PBASE[0], randomList[0]);
        let A_2 = this.mulPointEscalar(upk, randomList[1]);
        let B = [];
        for (let i = 2; i < randomList.length; i++) {
            B.push(this.mulPointEscalar(this.PBASE[1], randomList[i]));
        }

        let hashInput = (this.point2BigInt(A[0])
            + this.point2BigInt(A_2[0])
            + this.sumPointArray(B)).toString();
        let e = hash(hashInput);
        let e_BigInt = BigInt("0x"+e);

        let zList = [];
        let y = (randomList[0] + e_BigInt * sks)%this.curve.order;
        let y_2 = (randomList[1] + e_BigInt * r)%this.curve.order;
        for (let i = 2; i < randomList.length; i++) {
            zList.push((randomList[i] + e_BigInt * rhoList[i-2])%this.curve.order);
        }

        return {
            A: A,
            A_2: A_2,
            B: B,
            zList: zList,
            y: y,
            y_2: y_2
        }
    }

    // js valid of sigma proof of key
    sigmaProofOfKeyVerifier(A, A_2, B, zList, y, y_2, upk, XList, Y, hash){
        // check length
        if (B.length !== zList.length) {
            throw new Error("B, zList should have the same length");
        }
        // check length > 0
        if (B.length === 0) {
            throw new Error("B, zList should have length > 0");
        }
        
        let hashInput = (this.point2BigInt(A[0])
            + this.point2BigInt(A_2[0])
            + this.sumPointArray(B)).toString();
        let e = hash(hashInput);
        let e_BigInt = BigInt("0x"+e);
        
        let g_yupk_y2 = this.addPoint(
            this.mulPointEscalar(this.PBASE[0], y),
            this.mulPointEscalar(upk, y_2)
        )
        let AY1_eA2 = this.addPoint(
            A,
            this.addPoint(
                A_2,
                this.mulPointEscalar(Y, e_BigInt)
            )
        )
        if(!this.deepEqual(g_yupk_y2, AY1_eA2)){
            assert.fail();
            return false;
        }

        for(let i=0;i<B.length;i++){
            let g_yh_z = this.addPoint(
                this.mulPointEscalar(this.PBASE[0], y),
                this.mulPointEscalar(this.PBASE[1], zList[i])
            );
            let AX_eB = this.addPoint(
                A,
                this.addPoint(
                    B[i],
                    this.mulPointEscalar(XList[i], e_BigInt)
                )
            );
            if(!this.deepEqual(g_yh_z, AX_eB)){
                assert.fail();
                return false;
            }
        }

        return true;
    }

    auditCiphertextValue(upk, r2){
        let X = this.mulPointEscalar(upk, r2);

        return {X: X};
    }

    auditDecryptionValue(X, Y, usk){
        // decrypt with Twist ElGamal
        // Since this part is not required for the experiment in the paper, it will not be implemented temporarily
    }

    auditCiphertextPks(upk, r3, pk_s){
        let X1 = this.mulPointEscalar(this.PBASE[0], r3);
        let Y1 = this.addPoint(
            this.mulPointEscalar(upk, r3),
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
        let X2 = this.mulPointEscalar(this.PBASE[0], r4);
        let Y2 = this.addPoint(
            this.mulPointEscalar(upk, r4),
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

    deepEqual(a, b) {
        if (a === b) return true;

        if (a == null || typeof a != "object" ||
            b == null || typeof b != "object") return false;

        let keysA = Object.keys(a), keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (let key of keysA) {
            if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) return false;
        }

        return true;
    }

    sumPointArray(arr) {
        return arr.reduce((acc, val) => acc + this.point2BigInt(val[0]), BigInt(0));
    }

    // array element array[32] bytes to 16 hex
    array2FField16(arr){
        return arr.map(val => ['0x'+this.point2BigInt(val[0]).toString(16),
            '0x'+this.point2BigInt(val[1]).toString(16)]);
    }

    // array element array[32] bytes to bigint
    array2FField(arr){
        return arr.map(val => [this.point2BigInt(val[0]),
            this.point2BigInt(val[1])]);
    }

    // array element array[32] bytes to bigint
    array2BigIntList(arr){
        return arr.map(val => this.point2BigInt(val[0]));
    }

    // array element bigint to 16 hex
    array216(arr){
        return arr.map(val => '0x'+val.toString(16));
    }

    // point array[32] bytes to 16 hex
    point2FField16(point){
        return ['0x'+this.point2BigInt(point[0]).toString(16),
            '0x'+this.point2BigInt(point[1]).toString(16)];
    }
    
    addPoint(point1, point2){
        return this.curve.addPoint(point1,point2);
    }
    
    mulPointEscalar(point, escalar){
        return this.curve.mulPointEscalar(point,escalar);
    }

    // array[32] bytes to bigint
    point2BigInt(v){
        return this.field.toObject(v);
    }

    // point to bigint[2]
    point2Field(point){
        return [
            this.field.toObject(point[0]),
            this.field.toObject(point[1])
        ];
    }
}


module.exports = {
    CryptoTool
}
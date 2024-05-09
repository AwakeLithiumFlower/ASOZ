const path = require("path");
// const bn128 = require('rustbn.js')
const {BN128Tool} = require('./tool_bn128.js');
const assert = require("assert");
const seedrandom = require('seedrandom');

class SigmaProtocol{
    constructor(){
        this.PBASE = [
            [
                '0f78c039ea845faac0b305dcf194db2b79e0f8b044e3c7ff351e637e55167432',
                '03b64027e9356059d14bc4ac1690986ac502997573599dc3194fd7bc9730bf27'
            ],
            [
                '2f33733fb7d2e2cdfbe0f15173eb965409e04ae392cae5bae85ae00f3554022e',
                '087ad2aad8f6a4d5d096446071c00d048cd9583c9ea2bcfd1df8b86749828cef'
            ],
            [
                '0cca332e2b808916c4f4c17c480e18617063365489173a0f69c6b75e19c0011f',
                '29df45b288b9356d1b992c1883b1e7961d2f2bea54fdd0c618e36dc630aee8cf'
            ]
        ]
        this.bn128Tool = new BN128Tool(this.PBASE);
        // suppose usk is 0xa916871ca8d3c208c16bc4ac1690986ac502997573599dc3194fd7bc9730bf27
        // upk is ['18a05f628ad2d79429e47a4cfbaa3296eeb6148e679e8e68701f86cb447e42a3','2ff837f7ae7c1894d222edbe0044a4a0856a08d6533d6b18180502c356cbe8ec']
        this.upk = this.bn128Tool.mul(this.PBASE[2], "a916871ca8d3c208c16bc4ac1690986ac502997573599dc3194fd7bc9730bf27");
    }

    async test() {
        // let input_1 = ['0000000000000000000000000000000000000000000000000000000000000001','0000000000000000000000000000000000000000000000000000000000000002'];
        // let input_2 = ['0000000000000000000000000000000000000000000000000000000000000001','0000000000000000000000000000000000000000000000000000000000000002'];
        let input_1 = [1,2];
        let input_2 = [1,2];
        let output = '030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd315ed738c0e0a7c92e7845f96b2ae9c0a68a6a449e3538fc7ff3ebf7a5a18a2c4';
        console.log(this.bn128Tool.add([0,0], input_2));
        console.log(this.bn128Tool.mul(this.PBASE[2], "a916871ca8d3c208c16bc4ac1690986ac502997573599dc3194fd7bc9730bf27"))
    }

    async generateSigmaProof(in_num, out_num){
        // random generate rhoList of the old commitment
        let rhoList_old = this.generateRandomArray(in_num, 128);
        // random generate old commitments' value from [128,256)
        let vList_old = this.generateRandomArray(in_num, 7).map(x => x + BigInt(128));
        let sum = vList_old.reduce((a, b) => a + b, BigInt(0));
        // generate value output that equal to the sum of old commitments' value
        let vList_new = [...Array(out_num - 1)
            .fill(BigInt(1)), sum - BigInt(out_num - 1)];
        // generate sender's pk
        let sk_s = this.generateRandomArray(1, 128)[0];
        let pk_s = this.bn128Tool.randomPointGenerator(sk_s);
        // generate receivers' pk
        let skList_r = this.generateRandomArray(out_num, 128);
        let pkList_r = Array.from({length: out_num},
            (_, k) => this.bn128Tool.randomPointGenerator(skList_r[k]));
        // generate old commitments
        let cmList_old = this.bn128Tool.cmListCalculator(rhoList_old, Array(in_num).fill(pk_s), vList_old);
        // generate new commitments
        let rhoList_new = this.generateRandomArray(out_num, 128);
        let cmList_new = this.bn128Tool.cmListCalculator(rhoList_new, pkList_r, vList_new);
        // let hash = await buildPoseidon();
        // generate nullifier
        let snList = this.bn128Tool.snListCalculator(rhoList_old, sk_s);
        // generate audit ciphertext
        let r2 = Array.from({length: out_num},
            (_, k) => this.bn128Tool.PRF_k(pkList_r[k], rhoList_new[k])[0]);
        let r3 = this.generateRandomArray(1, 128)[0];
        let r4 = this.generateRandomArray(out_num, 128);
        let in_audit_enc = this.bn128Tool.auditCiphertextPks(this.upk,r3,pk_s);
        let out_audit_dicts = [];
        for(let i=0;i<out_num;i++){
            out_audit_dicts.push(
                this.bn128Tool.auditCiphertextPkr(this.upk,r4[i],pkList_r[i]),
                this.bn128Tool.auditCiphertextValue(this.upk,r2[i],vList_new[i]));
        }
        let out_audit_enc = this.mergeDicts(out_audit_dicts);

        return {
            sk_s: sk_s,
            pk_s: pk_s,
            pkList_r: pkList_r,
            vInput: vList_old,
            vOutput: vList_new,
            rhoList_old: rhoList_old,
            rhoList_new: rhoList_new,
            cmList_new: cmList_new,
            cmList_old: cmList_old,
            snList: snList,
            in_audit_enc: in_audit_enc,
            out_audit_enc: out_audit_enc,
            r2:r2,
            r3:r3,
            r4:r4
        }
    }

    sigmaProofGenerator(in_num, out_num, verify_dict, upk, hash){
        console.time("time point: generate sigma proof");
        let randomList = this.generateRandomArray(2,128);
        let randomList_2 = this.generateRandomArray(2,128);
        let randomList_3 = this.generateRandomArray(in_num+2,128);


        // sigma proof of value witness
        let A = this.bn128Tool.mul(upk, randomList[0]);
        let B = this.bn128Tool.add(this.bn128Tool.mul(this.PBASE[0], randomList[0]),
            this.bn128Tool.mul(this.PBASE[1], randomList[1]));
        // sigma proof of sk witness
        let A_2 = this.bn128Tool.mul(this.PBASE[0], randomList_2[0]);
        let B_2 = this.bn128Tool.add(this.bn128Tool.mul(upk, randomList_2[0]),
            this.bn128Tool.mul(this.PBASE[0], randomList_2[1]));
        // sigma proof of key witness
        let A_3 = this.bn128Tool.mul(this.PBASE[0], randomList_3[0]);
        let A_3_2 = this.bn128Tool.mul(upk, randomList_3[1]);
        let B_3 = [];
        for (let i = 2; i < randomList_3.length; i++) {
            B_3.push(this.bn128Tool.mul(this.PBASE[1], randomList_3[i]));
        }

        // public key in schnorr signature
        let X = verify_dict.out_audit_enc.X.reduce((a, b) => this.bn128Tool.add(a, b));
        let Y = verify_dict.cmList_new.reduce((a, b) => this.bn128Tool.add(a, b));
        let X_2 = verify_dict.in_audit_enc.X1;
        let Y_2 = verify_dict.in_audit_enc.Y1;
        let X_3 = verify_dict.snList.reduce((a, b) => this.bn128Tool.add(a, b));
        let Y_3 = verify_dict.in_audit_enc.Y1;

        // challenge e in Fair-Shamir heuristic
        console.log("e hash",A[0]+B[0]+A_2[0]+B_2[0]+A_3[0]+A_3_2[0]+X[0]+Y[0]+X_2[0]+Y_2[0]+X_3[0]);
        let e = hash(A[0]+B[0]+A_2[0]+B_2[0]+A_3[0]+A_3_2[0]+X[0]+Y[0]+X_2[0]+Y_2[0]+X_3[0]);
        let e_BigInt = BigInt("0x"+e);

        // schnorr signature
        let zList_1 = this.bn128Tool.hexStrAddInPField(
            this.bn128Tool.hexStrMulInPField(
                verify_dict.r2.reduce((a, b) => this.bn128Tool.hexStrAddInPField(a, b)),
                this.bn128Tool.bigintToHexStr(e_BigInt)),
            this.bn128Tool.bigintToHexStr(randomList[0])
        );
        let zList_2 = this.bn128Tool.hexStrAddInPField(
            this.bn128Tool.hexStrMulInPField(
                verify_dict.vOutput.reduce((a, b) => this.bn128Tool.hexStrAddInPField(
                    this.bn128Tool.bigintToHexStr(a),
                    this.bn128Tool.bigintToHexStr(b))),
                this.bn128Tool.bigintToHexStr(e_BigInt)),
            this.bn128Tool.bigintToHexStr(randomList[1])
        );

        let zList_1_2 = this.bn128Tool.hexStrAddInPField(
            this.bn128Tool.hexStrMulInPField(
                verify_dict.r3,
                this.bn128Tool.bigintToHexStr(e_BigInt)),
            this.bn128Tool.bigintToHexStr(randomList_2[0])
        );
        let zList_2_2 = this.bn128Tool.hexStrAddInPField(
            this.bn128Tool.hexStrMulInPField(
                verify_dict.sk_s,
                this.bn128Tool.bigintToHexStr(e_BigInt)),
            this.bn128Tool.bigintToHexStr(randomList_2[1])
        );

        let zList_0_3 = this.bn128Tool.hexStrAddInPField(
            this.bn128Tool.hexStrMulInPField(
                verify_dict.sk_s,
                this.bn128Tool.bigintToHexStr(e_BigInt)),
            this.bn128Tool.bigintToHexStr(randomList_3[0])
        );
        let zList_1_3 = this.bn128Tool.hexStrAddInPField(
            this.bn128Tool.hexStrMulInPField(
                verify_dict.r3,
                this.bn128Tool.bigintToHexStr(e_BigInt)),
            this.bn128Tool.bigintToHexStr(randomList_3[1])
        );
        let zList_2_3 = [];
        for(let i=0;i<in_num;i++){
            zList_2_3.push(this.bn128Tool.hexStrAddInPField(
                this.bn128Tool.hexStrMulInPField(
                    this.bn128Tool.bigintToHexStr(verify_dict.rhoList_old[i]),
                    this.bn128Tool.bigintToHexStr(e_BigInt)),
                this.bn128Tool.bigintToHexStr(randomList_3[i+2])
            ));
        }
        console.timeEnd("time point: generate sigma proof");

        return {
            A:A,
            B:B,
            zList_1:zList_1,
            zList_2:zList_2,
            A_2:A_2,
            B_2:B_2,
            zList_1_2:zList_1_2,
            zList_2_2:zList_2_2,
            A_3:A_3,
            A_3_2:A_3_2,
            B_3:B_3,
            zList_0_3:zList_0_3,
            zList_1_3:zList_1_3,
            zList_2_3:zList_2_3,
            X: verify_dict.out_audit_enc.X,
            Y: verify_dict.cmList_new,
            X_2: verify_dict.in_audit_enc.X1,
            Y_2: verify_dict.in_audit_enc.Y1,
            X_3: verify_dict.snList,
            Y_3: verify_dict.in_audit_enc.Y1
        }
    }

    sigmaProofVerifier(upk, proof_dict, verify_dict, hash){
        console.time("time point: verify sigma proof");
        // public key in schnorr signature
        let X = verify_dict.out_audit_enc.X.reduce((a, b) => this.bn128Tool.add(a, b));
        let Y = verify_dict.cmList_new.reduce((a, b) => this.bn128Tool.add(a, b));
        let X_2 = verify_dict.in_audit_enc.X1;
        let Y_2 = verify_dict.in_audit_enc.Y1;
        let X_3 = verify_dict.snList.reduce((a, b) => this.bn128Tool.add(a, b));
        let Y_3 = verify_dict.in_audit_enc.Y1;

        // challenge e in Fair-Shamir heuristic
        let e = hash(proof_dict.A[0]+proof_dict.B[0]+proof_dict.A_2[0]+proof_dict.B_2[0]+
            proof_dict.A_3[0]+proof_dict.A_3_2[0]+
            X[0]+Y[0]+X_2[0]+Y_2[0]+X_3[0]);
        let e_BigInt = BigInt("0x"+e);

        // verify value proof
        let upk_z1 = this.bn128Tool.mul(upk, proof_dict.zList_1);
        let AXe = this.bn128Tool.add(
            proof_dict.A,
            this.bn128Tool.mul(X, this.bn128Tool.bigintToHexStr(e_BigInt))
        );
        if(!this.bn128Tool.arrayEqual(upk_z1, AXe)){
            assert.fail();
            return false;
        }
        let gz_1hz_2 = this.bn128Tool.add(
            this.bn128Tool.mul(this.bn128Tool.PBASE[0], proof_dict.zList_1),
            this.bn128Tool.mul(this.bn128Tool.PBASE[1], proof_dict.zList_2)
        );
        let BYe = this.bn128Tool.add(
            proof_dict.B,
            this.bn128Tool.mul(Y, this.bn128Tool.bigintToHexStr(e_BigInt))
        );
        if (!this.bn128Tool.arrayEqual(gz_1hz_2, BYe)){
            assert.fail();
            return false;
        }
        //verify sk proof
        let gz_1 = this.bn128Tool.mul(this.bn128Tool.PBASE[0], proof_dict.zList_1_2);
        let A_2X_2e = this.bn128Tool.add(
            proof_dict.A_2,
            this.bn128Tool.mul(X_2, this.bn128Tool.bigintToHexStr(e_BigInt))
        )
        if(!this.bn128Tool.arrayEqual(gz_1, A_2X_2e)){
            assert.fail();
            return false;
        }
        let upkz_1gz_2 = this.bn128Tool.add(
            this.bn128Tool.mul(upk, proof_dict.zList_1_2),
            this.bn128Tool.mul(this.bn128Tool.PBASE[0], proof_dict.zList_2_2)
        );
        let B_2Y_2e = this.bn128Tool.add(
            proof_dict.B_2,
            this.bn128Tool.mul(Y_2, this.bn128Tool.bigintToHexStr(e_BigInt))
        );
        if(!this.bn128Tool.arrayEqual(upkz_1gz_2, B_2Y_2e)){
            assert.fail();
            return false;
        }
        let gzupkz_1 = this.bn128Tool.add(
            this.bn128Tool.mul(this.bn128Tool.PBASE[0], proof_dict.zList_0_3),
            this.bn128Tool.mul(upk, proof_dict.zList_1_3)
        );
        let AY_1EB_1 = this.bn128Tool.add(
            this.bn128Tool.add(
                proof_dict.A_3,
                this.bn128Tool.mul(Y_3, this.bn128Tool.bigintToHexStr(e_BigInt))
            ),
            proof_dict.A_3_2
        );
        if(!this.bn128Tool.arrayEqual(gzupkz_1, AY_1EB_1)){
            assert.fail();
            return false;
        }
        for(let i=0;i<verify_dict.snList.length;i++){
            let gzhz_i = this.bn128Tool.add(
                this.bn128Tool.mul(this.bn128Tool.PBASE[0], proof_dict.zList_0_3),
                this.bn128Tool.mul(this.bn128Tool.PBASE[1], proof_dict.zList_2_3[i])
            );
            let Asn_1eB_i = this.bn128Tool.add(
                this.bn128Tool.add(
                    proof_dict.A_3,
                    this.bn128Tool.mul(verify_dict.snList[i], this.bn128Tool.bigintToHexStr(e_BigInt))
                ),
                proof_dict.B_3[i]
            );
            if(!this.bn128Tool.arrayEqual(gzhz_i, Asn_1eB_i)){
                assert.fail();
                return false;
            }
        }
        console.timeEnd("time point: verify sigma proof");
        return true;
    }
    
    generateRandomArray(length, strength){
        let rng = seedrandom(0); // 使用种子创建随机数生成器
        let output = [];
        for(let i = 0; i < length; i++) {
            // 使用rng()代替Math.random()
            output.push(BigInt(Math.floor(rng() * 2 ** strength)));
        }
        return output;
        // let output = [];
        // for(let i=0;i<length;i++){
        //     output.push(BigInt(Math.floor(Math.random() * 2 ** strength)));
        // }
        // return output;
    }

    mergeDicts(dicts){
        let output = {};
        for(let i=0;i<dicts.length;i++){
            for(let key in dicts[i]){
                if(output[key] == undefined){
                    output[key] = [];
                }
                output[key].push(dicts[i][key]);
            }
        }
        return output;
    }
}


module.exports = {
    SigmaProtocol
}
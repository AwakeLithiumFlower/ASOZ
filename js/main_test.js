const path = require("path");
const { assert } = require("chai");
const wasm_tester = require("circom_tester").wasm;
const { buildEddsa, buildBabyjub} = require("circomlibjs");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const { createMerkleTree, generateMerkleProof, generateMerklePath, createSimulatedMerkleTree } = require("./utils/merkle.js");
const fs = require("fs");
const createBlakeHash = require("blake-hash");
const {buildBabyjub: buildBabyJub, buildPedersenHash} = require("circomlibjs");
const utils = require("ffjavascript").utils;
const Scalar = require("ffjavascript").Scalar;
const crypto = require("crypto");
const {CryptoTool} = require("./utils/tool.js");
const keccak256 = require("js-sha3").keccak256;
const {fromBigIntLike} = require("hardhat/internal/util/bigint");
const sizeof = require('object-sizeof');

randomArray = (length) =>
    [...new Array(length)].map(() => BigInt(Math.random() * 2 ** 256));

describe("test", function () {
    let field, hash;
    let circuit;
    let babyJub;
    this.timeout(3600000);
    let Fr;
    let PBASE;
    let BASE8;
    let cryptoTool;

    before(async () => {
        hash = await buildPoseidon();
        field = hash.F;
        babyJub = await buildBabyjub();
        Fr = babyJub.F;
        PBASE =
            [
                [Fr.e("10457101036533406547632367118273992217979173478358440826365724437999023779287"),Fr.e("19824078218392094440610104313265183977899662750282163392862422243483260492317")],
                [Fr.e("2671756056509184035029146175565761955751135805354291559563293617232983272177"),Fr.e("2663205510731142763556352975002641716101654201788071096152948830924149045094")],
                [Fr.e("5802099305472655231388284418920769829666717045250560929368476121199858275951"),Fr.e("5980429700218124965372158798884772646841287887664001482443826541541529227896")],
                [Fr.e("7107336197374528537877327281242680114152313102022415488494307685842428166594"),Fr.e("2857869773864086953506483169737724679646433914307247183624878062391496185654")],
                [Fr.e("20265828622013100949498132415626198973119240347465898028410217039057588424236"),Fr.e("1160461593266035632937973507065134938065359936056410650153315956301179689506")]
            ];
        BASE8 =
            [
                [Fr.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),Fr.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")]
            ];
        cryptoTool = new CryptoTool(babyJub,PBASE);
    });

    it("test", async () => {
        if(field === Fr){
            console.log("field === Fr");
        }else{
            console.log("field !== Fr");
        }
    });

    it("part1: js Merkle Tree proof", async () => {
        circuit = await wasm_tester(path.resolve("zk/circuits/test_merkle.circom"));
        let depth = 32;    // merkle tree depth

        /*
        this is a way to generate a full merkle tree, but it cannot support 8 gb memory when depth is 32,
        actually when a node is 256bit, a 32 depth merkle tree will cost about 256gb to store
         */
        // let input = generateMerkleTreeAndWitness(depth);

        /*
        create simulate merkle tree, do not generate all nodes, only the path to validate
         */
        let input = createSimulatedMerkleTreeAndWitness(depth);

        let json = JSON.stringify(input, null, 2);

        fs.writeFile('zk/input.json', json, (err) => {
            if (err) throw err;
            // console.log('Data written to file');
        });

        // console.log("input", input);
        // console.log("merkle_path", list2ObjectArray(merkle_path));
        // console.log("merkle_tree", list2ObjectArray(merkle_tree));
        const witness = await circuit.calculateWitness(input);
        await circuit.assertOut(witness, {});
    });

    it("part2: js Pedersen Commitment in BabyJub elliptic curve", async () => {
        circuit = await wasm_tester(path.resolve("zk/circuits/test_pedersen.circom"));

        let w;
        let randomValue = BigInt(Math.random() * 2 ** 256);
        let coinValue = BigInt(20);

        let powerPoint = babyJub.addPoint(
            babyJub.mulPointEscalar(PBASE[0], randomValue),
            babyJub.mulPointEscalar(PBASE[1], coinValue)
        );

        let powerValue = Fr.toObject(babyJub.packPoint(powerPoint.slice(0,30)));

        w = await circuit.calculateWitness({ in: [3n, powerValue]}, true);

        const r = babyJub.addPoint(
            babyJub.mulPointEscalar(PBASE[0], 3n),
            babyJub.mulPointEscalar(PBASE[1], powerValue)
        );

        await circuit.assertOut(w, {out: [Fr.toObject(r[0]), Fr.toObject(r[1])]});
    });

    it("js babyjub sub", async () => {
        let input = {
            x1: Fr.toObject(PBASE[0][0]),
            y1: Fr.toObject(PBASE[0][1]),
            x2: Fr.toObject(PBASE[1][0]),
            y2: -Fr.toObject(PBASE[1][1])
        }

        circuit = await wasm_tester(path.resolve("zk/circuits/test_Babyjub.circom"));
        let w = await circuit.calculateWitness(input, true);
        console.log(babyJub.F.p)
        let r = babyJub.addPoint([PBASE[0][0],PBASE[0][1]],
            [PBASE[1][0],Fr.e(-Fr.toObject(PBASE[1][1]))]);
        await circuit.assertOut(w, {xout: Fr.toObject(r[0]), yout: Fr.toObject(r[1])});
    });

    it("js PRF_k", async () => {
        let pk = BigInt(Math.random() * 2 ** 253);
        let rho = BigInt(Math.random() * 2 ** 253);
        console.log("pk", pk);
        console.log("rho", rho);

        let prf_k = cryptoTool.PRF_k(pk, rho);
        console.log("prf_k", {out: [Fr.toObject(prf_k[0]), Fr.toObject(prf_k[1])]});

        circuit = await wasm_tester(path.resolve("zk/circuits/test_PRF_k.circom"));

        let w = await circuit.calculateWitness({ 'pk': pk,'rho': rho}, true);
        await circuit.assertOut(w, {outx: Fr.toObject(prf_k[0]), outy: Fr.toObject(prf_k[1])});
    });

    it("js PRF_cm", async () => {
        let v_1_new = 3;
        let v_2_new = 9;
        let pkList_r = [BigInt(Math.random() * 2 ** 128), BigInt(Math.random() * 2 ** 128)];
        let rhoList = [BigInt(Math.random() * 2 ** 128), BigInt(Math.random() * 2 ** 128)];
        let cmList_new = cryptoTool.array2BigIntList(
            cryptoTool.cmListCalculator(rhoList,pkList_r,[v_1_new,v_2_new]));
        let input = {
            rhoList: rhoList,
            pkList: pkList_r,
            vList: [v_1_new,v_2_new]
        }

        circuit = await wasm_tester(path.resolve("zk/circuits/test_PRF_cm.circom"));

        let w = await circuit.calculateWitness(input, true);
        await circuit.assertOut(w, {outList: cmList_new});
    });

    it("js 2 dimension array", async () => {
        // circuit = await wasm_tester(path.resolve("zk/circuits/js.circom"));
        //
        // let w = await circuit.calculateWitness({ in: [[1,2],[3,4]]}, true);
        // await circuit.assertOut(w, {out: [[1,2],[3,4]]});
        let t = createSimulatedMerkleTreeAndWitness(3);
        let t2 = createSimulatedMerkleTreeAndWitness(3);
        console.log(mergeDicts([t,t2]));
    });

    // assume in UTXO model, the sender combine two old records and send to two new receivers
    it("part4: js 2 input 2 output zk-SNARK proof generate and valid", async () => {
        // generate upk, assume all upk are the same(key agreement scheme is better, but we do not consider in here)
        // so we assume usk = 15841103015534172323098042064091785275182938422861005572878585484163854252324n
        let t = BigInt(15841103015534172323098042064091785275182938422861005572878585484163854252324);
        // so upk = [
        //   6331850395537585927290680390752447884532794188697923556312761505688747217175n,
        //   2462143816122748060390620296277376383273414174303403200944239221836425025776n
        // ]
        let upk = cryptoTool.pointGenerator(t);

        await generateTransaction(2, 2, upk);
    });

    // js verifier of sigma protocol
    it("part5: js verifier of sigma protocol", async () => {
        // two new commitments' value
        let v_1_new = 3;
        let v_2_new = 9;
        // generate receivers' pk
        let pkList_r = generateRandomArray(2, 253);
        // generate audit key
        let t = generateRandomArray(1,253)[0];
        let upk = cryptoTool.randomPointGenerator(t);
        // generate new coin's rho
        let rhoList_new = generateRandomArray(2, 253);
        // generate new commitments, also called Y
        let cmList_new = [cryptoTool.cmCalculator(pkList_r[0], rhoList_new[0], v_1_new),
            cryptoTool.cmCalculator(pkList_r[1], rhoList_new[1], v_2_new)];

        let rList = [Fr.toObject(cryptoTool.PRF_k(pkList_r[0], rhoList_new[0])[0]),
            Fr.toObject(cryptoTool.PRF_k(pkList_r[1], rhoList_new[1])[0])];
        let hash_e = keccak256;
        let randomList = [generateRandomArray(2,253),
            generateRandomArray(2,253)];

        let result = cryptoTool.sigmaProofOfValueGenerator(upk, rList, [v_1_new,v_2_new], hash_e, randomList);
        let A = result.A;
        let B = result.B;
        let zList_1 = result.zList_1;
        let zList_2 = result.zList_2;
        let XList = [
            babyJub.mulPointEscalar(upk, rList[0]),
            babyJub.mulPointEscalar(upk, rList[1])
        ]
        let sol_input = result.sol_input;
        sol_input['upk'] = cryptoTool.point2FField16(upk);
        sol_input['XList'] = cryptoTool.array2FField16(XList);
        sol_input['YList'] = cryptoTool.array2FField16(cmList_new);
        console.log(sol_input);
        console.log(cryptoTool.sigmaProofOfValueVerifier(A, B, zList_1, zList_2, upk, XList, cmList_new, hash_e));
    });

    // js verifier of sigma protocol
    it("part6: js verifier of sigma protocol2", async () => {
        // random r on upk exponential position
        let r = generateRandomArray(1, 253)[0];
        // generate sender's pk,sk
        let sks = generateRandomArray(1, 253)[0];
        let pks = cryptoTool.randomPointGenerator(sks);
        // generate audit key
        let t = generateRandomArray(1,253)[0];
        let upk = cryptoTool.randomPointGenerator(t);
        // generate old coin's rho
        let rhoList_old = generateRandomArray(2, 253);
        // generate old coin's nullifier
        let snList_old = cryptoTool.snListCalculator(rhoList_old, sks);

        let hash_e = keccak256;
        let randomList = generateRandomArray(4,253);

        let result = cryptoTool.sigmaProofOfKeyGenerator(upk, r, sks, rhoList_old, hash_e, randomList);
        let A = result.A;
        let A_2 = result.A_2;
        let B = result.B;
        let zList = result.zList;
        let y = result.y;
        let y_2 = result.y_2;
        let Y = cryptoTool.addPoint(
            cryptoTool.mulPointEscalar(upk, r),
            cryptoTool.mulPointEscalar(PBASE[0], sks)
        );


        console.log(cryptoTool.sigmaProofOfKeyVerifier(A, A_2, B, zList, y, y_2, upk, snList_old, Y, hash_e));
    });

    // js verifier of sigma protocol
    it("part7: js n input n output ZKP proof and valid", async () => {
        // generate upk, assume all upk are the same(key agreement scheme is better, but we do not consider in here)
        // so we assume usk = 15841103015534172323098042064091785275182938422861005572878585484163854252324n
        let t = BigInt(15841103015534172323098042064091785275182938422861005572878585484163854252324);
        // so upk = [
        //   6331850395537585927290680390752447884532794188697923556312761505688747217175n,
        //   2462143816122748060390620296277376383273414174303403200944239221836425025776n
        // ]
        let upk = cryptoTool.pointGenerator(t);

        console.log("1-1");
        let transaction_info1_1 = await generateTransaction(1, 1, upk);
        await simgaVerify(1, 1, transaction_info1_1, upk);
        console.log("1-2");
        let transaction_info1_2 = await generateTransaction(1, 2, upk);
        await simgaVerify(1, 2, transaction_info1_2, upk);
        console.log("1-3");
        let transaction_info1_3 = await generateTransaction(1, 3, upk);
        await simgaVerify(1, 3, transaction_info1_3, upk);
        console.log("1-4");
        let transaction_info1_4 = await generateTransaction(1, 4, upk);
        await simgaVerify(1, 4, transaction_info1_4, upk);
        console.log("1-5");
        let transaction_info1_5 = await generateTransaction(1, 5, upk);
        await simgaVerify(1, 5, transaction_info1_5, upk);
        console.log("1-6");
        let transaction_info1_6 = await generateTransaction(1, 6, upk);
        await simgaVerify(1, 6, transaction_info1_6, upk);
    });

    it('part 8: js test transaction without audit', async () => {
        console.log("1-1");
        await generateTransactionWithoutAudit(1, 1);
        console.log("1-2");
        await generateTransactionWithoutAudit(1, 2);
        console.log("1-3");
        await generateTransactionWithoutAudit(1, 3);
        console.log("1-4");
        await generateTransactionWithoutAudit(1, 4);
        console.log("1-5");
        await generateTransactionWithoutAudit(1, 5);
        console.log("1-6");
        await generateTransactionWithoutAudit(1, 6);
    });

    it("how to convert between BigInt and Array[32]", async () => {
        // this is a point in Array[2][32]
        let p1 = PBASE[0];
        console.log(p1);
        // convert to BigInt
        let t1 = [Fr.toObject(p1[0]),Fr.toObject(p1[1])];
        console.log(t1);
        // convert back
        let p2 = [Fr.e(t1[0].toString()),Fr.e(t1[1].toString())];
        console.log(p2);

        console.log(":-)");
    });

    it("test2", async () => {
        let vList_old = [1,2,3,4,5];
        let sum = vList_old.reduce((a, b) => a + b, 0);
        console.log([...Array(vList_old.length - 1).fill(1), sum - vList_old.length + 1]);
    });

    function list2ObjectArray(l){
        let output = [];
        for(let i=0;i<l.length;i++){
            output[i] = field.toObject(l[i]);
        }
        return output;
    }

    /*
        this is a way to generate a full merkle tree, but it cannot support 8 gb memory when depth is 32,
        actually when a node is 256bit, a 32 depth merkle tree will cost about 256gb to store
    */
    function generateMerkleTreeAndWitness(depth){
        let secret_keys = randomArray(2 ** depth);
        let chosen_key = secret_keys[Math.floor(Math.random() * secret_keys.length)];
        let chosen_key_index = secret_keys.indexOf(chosen_key);
        let merkle_tree = createMerkleTree(field, hash, secret_keys, depth);
        let merkle_root = field.toObject(merkle_tree[0]);
        let merkle_proof = list2ObjectArray(generateMerkleProof(
            merkle_tree,
            chosen_key_index,
            depth
        ));

        return {
            key: chosen_key_index,
            value: chosen_key,
            root: merkle_root,
            siblings: merkle_proof
        };
    }

    /*
        create simulate merkle tree, do not generate all nodes, only the path to validate
    */
    function createSimulatedMerkleTreeAndWitness(depth){
        let proof_path = randomArray(depth);
        for (let i = 0; i < proof_path.length; i++) proof_path[i] = field.toObject(hash(field.e(proof_path[i])));
        let chosen_key_index = Math.floor(Math.random() * 2 ** depth);
        let chosen_key = BigInt(Math.random() * 2 ** 256);
        // console.log(proof_path);
        let merkle_root = createSimulatedMerkleTree(proof_path, chosen_key, field, hash, depth, chosen_key_index);

        return {
            key: chosen_key_index,
            value: chosen_key,
            root: merkle_root,
            siblings: proof_path
        };
    }

    /*
        create simulate merkle tree, do not generate all nodes, only the path to validate
    */
    function createSimulatedMerkleTreeAndWitness2(depth, proof_value){
        // console.log("proof_value", proof_value);
        if (typeof proof_value !== "bigint"){
            throw new Error("proof_value must be BigInt");
        }
        let proof_path = randomArray(depth);
        for (let i = 0; i < proof_path.length; i++) proof_path[i] = field.toObject(hash(field.e(proof_path[i])));
        let chosen_key_index = Math.floor(Math.random() * 2 ** depth);
        // let chosen_key = proof_value;
        // console.log(proof_path);
        let merkle_root = createSimulatedMerkleTree(proof_path, proof_value, field, hash, depth, chosen_key_index);

        return {
            key: chosen_key_index,
            // value: chosen_key,
            root: merkle_root,
            siblings: proof_path
        };
    }

    /*
        merge two witness input dict, to satisfy the structure of circom
     */
    function mergeDicts(dicts){
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

    function generateRandomArray(length, strength){
        let output = [];
        for(let i=0;i<length;i++){
            output.push(BigInt(Math.floor(Math.random() * 2 ** strength)));
        }
        return output;
    }

    // generate a transaction and proof
    async function generateTransaction(in_num, out_num, upk) {
        console.time("time point: generate zk-SANRK proof part 1");

        // random generate rhoList of the old commitment
        let rhoList_old = generateRandomArray(in_num, 253);
        // random generate old commitments' value from [128,256)
        let vList_old = generateRandomArray(in_num, 7).map(x => x + BigInt(128));
        let sum = vList_old.reduce((a, b) => a + b, BigInt(0));
        // generate value output that equal to the sum of old commitments' value
        let vList_new = [...Array(out_num - 1)
            .fill(BigInt(1)), sum - BigInt(out_num - 1)];
        // generate sender's pk
        let sk_s = generateRandomArray(1, 253)[0];
        let pk_s = cryptoTool.randomPointGenerator(sk_s);
        // generate receivers' pk
        let skList_r = generateRandomArray(out_num, 253);
        let pkList_r = Array.from({length: out_num},
            (_, k) => cryptoTool.randomPointGenerator(skList_r[k]));
        // generate old commitments
        let cmList_old = cryptoTool.cmListCalculator(rhoList_old, Array(in_num).fill(pk_s), vList_old);
        // generate new commitments
        let rhoList_new = generateRandomArray(out_num, 253);
        let cmList_new = cryptoTool.cmListCalculator(rhoList_new, pkList_r, vList_new);
        // let hash = await buildPoseidon();
        // generate nullifier
        let snList = cryptoTool.snListCalculator(rhoList_old, sk_s);
        // generate audit ciphertext
        let r2 = Array.from({length: out_num},
            (_, k) => cryptoTool.point2BigInt(
                cryptoTool.PRF_k(pkList_r[k], rhoList_new[k])[0]));
        let r3 = generateRandomArray(1, 253)[0];
        let r4 = generateRandomArray(out_num, 253);
        let in_audit_enc = cryptoTool.auditCiphertextPks(upk,r3,pk_s);
        let out_audit_dicts = [];
        for(let i=0;i<out_num;i++){
            out_audit_dicts.push(Object.assign(
                cryptoTool.auditCiphertextPkr(upk,r4[i],pkList_r[i]),
                cryptoTool.auditCiphertextValue(upk,r2[i],vList_new[i])));
        }
        let out_audit_enc = mergeDicts(out_audit_dicts);

        let input = {
            sk_s: sk_s,
            pkList_r: cryptoTool.array2FField(pkList_r),
            vInput: vList_old,
            vOutput: vList_new,
            rho_old: rhoList_old,
            rho_new: rhoList_new,
            r4: r4
        };

        let output = {
            cmList_r: cryptoTool.array2BigIntList(cmList_new),
            snList_s: cryptoTool.array2BigIntList(snList),
            X2: cryptoTool.array2BigIntList(mergeDicts(out_audit_dicts)['X2']),
            Y2: cryptoTool.array2BigIntList(mergeDicts(out_audit_dicts)['Y2'])
        }


        // suppose the old value is on two merkle tree on chain
        let merkle_dict = Array.from({length: in_num},
            (_, i) =>
                createSimulatedMerkleTreeAndWitness2(32, cryptoTool.array2BigIntList(cmList_old)[i]));
        let old_merkle_tree = mergeDicts(merkle_dict);

        input = Object.assign(input, old_merkle_tree);

        // console.log('input', input);
        // console.log('output', output);

        // output json file
        let json = JSON.stringify(input, null, 2);
        fs.writeFile('zk/experiment/'+in_num.toString()+'-'+out_num.toString()+'input.json', json, (err) => {
            if (err) throw err;
            // console.log('Data written to file zk/experiment/2-2input.json');
        });
        // json = JSON.stringify(output, null, 2);
        // fs.writeFile('zk/experiment/'+in_num.toString()+'-'+out_num.toString()+'output.json', json, (err) => {
        //     if (err) throw err;
        //     // console.log('Data written to file zk/experiment/2-2output.json');
        // });

        changeCircomFile("component main = testScheme("+in_num.toString()+","+out_num.toString()+",32);");

        // console.time("time point 2: generate witness");
        circuit = await wasm_tester(path.resolve("zk/circuits/main_test.circom"));
        let w = await circuit.calculateWitness(input, true);
        // console.timeEnd("time point 2: generate witness");

        // console.log('witness size',sizeof(w));
        // console.time("time point 3: verify proof on zk-SNARK");
        // // await circuit.checkConstraints(w);
        // await circuit.assertOut(w, output);
        // console.timeEnd("time point 3: verify proof on zk-SNARK");

        console.timeEnd("time point: generate zk-SANRK proof part 1");

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

    // generate a transaction and proof without audit
    async function generateTransactionWithoutAudit(in_num, out_num) {
        console.log("transaction without audit");
        console.time("time point: generate zk-SANRK proof part 1");
        // random generate rhoList of the old commitment
        let rhoList_old = generateRandomArray(in_num, 253);
        // random generate old commitments' value from [128,256)
        let vList_old = generateRandomArray(in_num, 7).map(x => x + BigInt(128));
        let sum = vList_old.reduce((a, b) => a + b, BigInt(0));
        // generate value output that equal to the sum of old commitments' value
        let vList_new = [...Array(out_num - 1)
            .fill(BigInt(1)), sum - BigInt(out_num - 1)];
        // generate sender's pk
        let sk_s = generateRandomArray(1, 253)[0];
        let pk_s = cryptoTool.randomPointGenerator(sk_s);
        // generate receivers' pk
        let skList_r = generateRandomArray(out_num, 253);
        let pkList_r = Array.from({length: out_num},
            (_, k) => cryptoTool.randomPointGenerator(skList_r[k]));
        // generate old commitments
        let cmList_old = cryptoTool.cmListCalculator(rhoList_old, Array(in_num).fill(pk_s), vList_old);
        // generate new commitments
        let rhoList_new = generateRandomArray(out_num, 253);
        let cmList_new = cryptoTool.cmListCalculator(rhoList_new, pkList_r, vList_new);
        // let hash = await buildPoseidon();
        // generate nullifier
        let snList = cryptoTool.snListCalculator(rhoList_old, sk_s);

        let input = {
            sk_s: sk_s,
            pkList_r: cryptoTool.array2FField(pkList_r),
            vInput: vList_old,
            vOutput: vList_new,
            rho_old: rhoList_old,
            rho_new: rhoList_new
        };

        let output = {
            cmList_r: cryptoTool.array2BigIntList(cmList_new),
            snList_s: cryptoTool.array2BigIntList(snList)
        }


        // suppose the old value is on two merkle tree on chain
        let merkle_dict = Array.from({length: in_num},
            (_, i) =>
                createSimulatedMerkleTreeAndWitness2(32, cryptoTool.array2BigIntList(cmList_old)[i]));
        let old_merkle_tree = mergeDicts(merkle_dict);

        input = Object.assign(input, old_merkle_tree);

        // console.log('input', input);
        // console.log('output', output);

        // output json file
        let json = JSON.stringify(input, null, 2);
        fs.writeFile('zk/experiment/'+in_num.toString()+'-'+out_num.toString()+'input_without_audit.json', json, (err) => {
            if (err) throw err;
            // console.log('Data written to file zk/experiment/2-2input.json');
        });
        // json = JSON.stringify(output, null, 2);
        // fs.writeFile('zk/experiment/'+in_num.toString()+'-'+out_num.toString()+'output_without_audit.json', json, (err) => {
        //     if (err) throw err;
        //     // console.log('Data written to file zk/experiment/2-2output.json');
        // });

        changeCircomFile("component main = testSchemeWithoutAudit("+in_num.toString()+","+out_num.toString()+",32);");

        // console.time("time point 2: generate witness");
        circuit = await wasm_tester(path.resolve("zk/circuits/main_test.circom"));
        let w = await circuit.calculateWitness(input, true);
        // console.timeEnd("time point 2: generate witness");

        // console.log('witness size',sizeof(w));
        // console.time("time point 3: verify proof on zk-SNARK");
        // await circuit.checkConstraints(w);
        // await circuit.assertOut(w, output);
        // console.timeEnd("time point 3: verify proof on zk-SNARK");

        console.timeEnd("time point: generate zk-SANRK proof part 1");

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
            snList: snList
        }
    }

    async function simgaVerify(in_num, out_num, verify_dict, upk){
        console.time("time point: generate sigma proof");
        let randomList = Array.from({length: out_num},
            (_, i) => generateRandomArray(2,253));
        let result_key = cryptoTool.sigmaProofOfValueGenerator(upk, verify_dict.r2,
            verify_dict.vOutput,keccak256,randomList);
        let randomList2 = generateRandomArray(in_num+2,253);
        let result_key2 = cryptoTool.sigmaProofOfKeyGenerator(upk, verify_dict.r3,
            verify_dict.sk_s,verify_dict.rhoList_old,keccak256,randomList2);
        let randomList_3 = Array.from({length: in_num},
            (_, i) => generateRandomArray(2,253));
        let result_key3 = cryptoTool.sigmaProofOfSkGenerator(upk, [verify_dict.r3],
            [verify_dict.sk_s], keccak256, randomList_3);
        console.timeEnd("time point: generate sigma proof");

        let sigma_params_size = sizeof(result_key.A) + sizeof(result_key.B) +
            sizeof(result_key.zList_1) + sizeof(result_key.zList_2) +
            sizeof(verify_dict.in_audit_enc.X) + sizeof(verify_dict.cmList_new) +
            sizeof(result_key2.A) + sizeof(result_key2.A_2) +
            sizeof(result_key2.B) + sizeof(result_key2.zList) +
            sizeof(result_key2.y) + sizeof(result_key2.y_2) +
            sizeof(verify_dict.snList) + sizeof(verify_dict.in_audit_enc.Y1) +
            sizeof(result_key3.A) + sizeof(result_key3.B) +
            sizeof(result_key3.zList_1) + sizeof(result_key3.zList_2) +
            sizeof(verify_dict.in_audit_enc.X1) + sizeof(verify_dict.sk_s);
        console.log('sigma proof size', sigma_params_size);

        console.time("time point: verify sigma proof");
        cryptoTool.sigmaProofOfValueVerifier(result_key.A, result_key.B,
            result_key.zList_1, result_key.zList_2, upk, verify_dict.out_audit_enc.X,
            verify_dict.cmList_new, keccak256);

        cryptoTool.sigmaProofOfKeyVerifier(result_key2.A, result_key2.A_2,
            result_key2.B,result_key2.zList, result_key2.y, result_key2.y_2,
            upk, verify_dict.snList, verify_dict.in_audit_enc.Y1, keccak256);

        cryptoTool.sigmaProofOfSkVerifier(result_key3.A, result_key3.B,
            result_key3.zList_1, result_key3.zList_2, upk, [verify_dict.in_audit_enc.X1],
            [verify_dict.in_audit_enc.Y1], keccak256);
        console.timeEnd("time point: verify sigma proof");
    }

    function changeCircomFile(s){
        let file_path = "zk/circuits/main_test.circom";
        try {
            let data = fs.readFileSync(file_path, 'utf8');
            let lines = data.split('\n');
            lines[lines.length - 2] = s;  // 替换最后一行
            let output = lines.join('\n');
            fs.writeFileSync(file_path, output, 'utf8');
        } catch (err) {
            console.log(err);
        }
    }
});

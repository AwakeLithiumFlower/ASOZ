const path = require("path");
const { assert } = require("chai");
// const { wasm: wasm_tester, wasm } = require("circom_tester");
const wasm_tester = require("circom_tester").wasm;
const { buildEddsa } = require("circomlibjs");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const { createMerkleTree, generateMerkleProof, generateMerklePath } = require("./utils/merkle.js");
const fs = require("fs");

const depth = 24;
randomArray = (length) =>
  [...new Array(length)].map(() => BigInt(Math.random() * 10 ** 50));
const secret_keys = randomArray(2 ** depth);
const chosen_key = secret_keys[Math.floor(Math.random() * secret_keys.length)];
const chosen_key_index = secret_keys.indexOf(chosen_key);
// console.log(chosen_key_index);

function uint8ArrayToBigInt(uint8Array) {
  // 大端序
  let hex = Array.from(uint8Array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  // 小端序
  // let hex = Array.from(uint8Array.reverse(), byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  let bigint = BigInt('0x' + hex);
  return bigint;
}

function reverseBinary(n) {
  // 将整数转换为二进制字符串
  let binary = n.toString(depth);

  // 将二进制字符串逆序排列
  let reversedBinary = binary.split('').reverse().join('');

  // 将逆序后的二进制字符串转换回整数
  let reversedInt = parseInt(reversedBinary, depth);

  return reversedInt;
}


function list2BigIntArray(l){
    let output = [];
    for(let i=0;i<l.length;i++){
        output[i] = uint8ArrayToBigInt(l[i]);
    }
    return output;
}

describe("Circom circuit js", async () => {
  let field, hash;
  let circuit;

  function list2ObjectArray(l){
    let output = [];
    for(let i=0;i<l.length;i++){
      output[i] = field.toObject(l[i]);
    }
    return output;
  }

  before(async () => {
    hash = await buildPoseidon();
    field = hash.F;
    // field = (await buildEddsa()).babyJub.F;
    // hash = (await buildEddsa()).poseidon;
  });

  it("Inclusion in Merkle Tree proof", async () => {
    // console.log("chosen_key_index", chosen_key_index.toString(2).padStart(2,'0'));
    const merkle_tree = createMerkleTree(field, hash, secret_keys, depth);
    const merkle_root = merkle_tree[0];
    const merkle_proof = generateMerkleProof(
      merkle_tree,
      chosen_key_index,
      depth
    );
    const merkle_path = generateMerklePath(
        merkle_tree,
        chosen_key_index,
        depth
    );

    const input = {
      key: chosen_key_index,
      value: chosen_key,
      root: field.toObject(merkle_root),
      siblings: (list2ObjectArray(merkle_proof))
    };

    let json = JSON.stringify(input, null, 2);

    fs.writeFile('zk/input.json', json, (err) => {
      if (err) throw err;
      // console.log('Data written to file');
    });

    // console.log("input", input);
    // console.log("merkle_path", list2ObjectArray(merkle_path));
    // console.log("merkle_tree", list2ObjectArray(merkle_tree));
    circuit = await wasm_tester(path.resolve("zk/circuits/test_merkle.circom"));
    const witness = await circuit.calculateWitness(input);
    await circuit.assertOut(witness, {});
  });
});

describe("test2", async () => {
  let field, hash;
  let circuit;

  before(async () => {
    hash = await buildPoseidon();
    field = hash.F;
    // field = (await buildEddsa()).babyJub.F;
    // hash = (await buildEddsa()).poseidon;
  });

  it("Inclusion in Merkle Tree proof", async () => {

    // 从json文件中读取input
    let rawData = fs.readFileSync('zk/input.json');
    let input = JSON.parse(rawData);
    // 遍历json文件中的键值并将类型替换为BigInt
    for(let key in input){
        if(key == "siblings"){
          for(let key2 in input[key]){
            input[key][key2] = BigInt(input[key][key2]);
          }
        }else{
            input[key] = BigInt(input[key]);
        }
    }
    console.log("input", input);

    circuit = await wasm_tester(path.resolve("zk/circuits/merkle.circom"));
    const witness = await circuit.calculateWitness(input);
    await circuit.assertOut(witness, {});
  });
});

describe ("test3", async () => {
  let field, hash;
  let circuit;

  before(async () => {
    hash = await buildPoseidon();
    field = hash.F;
    // field = (await buildEddsa()).babyJub.F;
    // hash = (await buildEddsa()).poseidon;
  });

  it("js hash result", async () => {
    // let input= {
    //   "a": 7983799632551695655744652835454855528319845414514797803556162664238141148940n,
    //   "b": 81840372779693036141005308749271554830686964678656n,
    //   "resultHash": 5207871254036000583718631273441941096170887392463954522478529781434059981378n
    // };
    let input= {
        "in": 7983799632551695655744652835454855528319845414514797803556162664238141148940n,
    }
    circuit = await wasm_tester(path.resolve("zk/circuits/js.circom"));
    const witness = await circuit.calculateWitness(input);
    await circuit.assertOut(witness, {"out":0});
  })

});
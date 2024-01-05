const { assert } = require("chai");
const path = require("path");
const { buildEddsa } = require("circomlibjs");
const {
  createMerkleTree,
  generateMerkleProof,
  validateMerkleProof,
} = require("./utils/merkle.js");

let field, hash;

const depth = 3;
randomArray = (length, max) =>
  [...new Array(length)].map(() => Math.round(Math.random() * max));
const keys = randomArray(2 ** depth, 100);
const chosen_key = keys[Math.floor(Math.random() * keys.length)];
const siblings = keys.indexOf(chosen_key);

function uint8ArrayToDecimal(uint8Array) {
  let hex = Array.from(uint8Array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  let bigint = BigInt('0x' + hex);
  return bigint.toString(10);
}

function decimalToUint8Array(decimalStr) {
  let bigint = BigInt(decimalStr);
  let hex = bigint.toString(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  let len = hex.length / 2;
  let uint8Array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    uint8Array[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return uint8Array;
}

function getTreeListStr(merkleTree){
  let output = [];
  for(let i=0;i<merkleTree.length;i++){
    output[i] = uint8ArrayToDecimal(merkleTree[i]);
  }
  return output;
}

describe("Javascript functions js", async () => {
  before(async () => {
    field = (await buildEddsa()).babyJub.F;
    hash = (await buildEddsa()).poseidon;
  });

  it(`Create a level ${depth} Merkle tree, generate a Merkle proof and validate it`, async () => {
    const merkle_tree = createMerkleTree(field, hash, keys, depth);
    const merkle_root = merkle_tree[0];
    const merkle_proof = generateMerkleProof(merkle_tree, siblings, depth);

    let buff = Buffer.from(merkle_tree[0]); // 你的32字节数据
    let decimal = buff.readUIntBE(0, 4);
    // console.log(typeof merkle_tree)
    // console.log(merkle_tree[0])
    console.log(getTreeListStr(merkle_tree));
    console.log(uint8ArrayToDecimal(merkle_root));
    console.log(keys);
    console.log(chosen_key);
    console.log(getTreeListStr(siblings));
    assert(
      validateMerkleProof(
        field,
        hash,
        siblings,
        chosen_key,
        merkle_root,
        merkle_proof
      )
    );
  });
});


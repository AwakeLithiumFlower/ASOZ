function createMerkleTree(F, hash, arr, nLevels) {
  const extendedLen = 1 << nLevels;

  const hArr = [];
  for (let i = 0; i < extendedLen; i++) {
    if (i < arr.length) {
      hArr.push(hash([F.e(arr[i])]));
    } else {
      hArr.push(F.zero);
    }
  }
  return __merkelize(hash, hArr);
}

// create simulate merkle tree, do not generate all nodes, only the path to validate
function createSimulatedMerkleTree(proof_path, target_node, F, hash, nLevels, chosen_key_index) {
  // console.log(proof_path);
  let key = chosen_key_index.toString(2).padStart(proof_path.length, '0');
  let root = F.toObject(hash([F.e(target_node)]));
  for (let i = key.length-1; i >= 0; i--) {
    // console.log(root);
    // console.log(proof_path[i]);
    if(key[i]==="0"){
      // console.log(root);
      // console.log(proof_path[i]);
      let mid = hash([root, proof_path[i]]);
      root = F.toObject(mid);
    }else{
      // console.log(proof_path[i]);
      // console.log(root);
      let mid = hash([proof_path[i], root]);
      root = F.toObject(mid);
    }
    // console.log(root);
  }

  return root;
}

function __merkelize(hash, arr) {
  if (arr.length == 1) return arr;
  const hArr = [];
  for (i = 0; i < arr.length / 2; i++) {
    hArr.push(hash([arr[2 * i], arr[2 * i + 1]]));
  }
  const m = __merkelize(hash, hArr);
  return [...m, ...arr];
}

function generateMerkleProof(m, key, nLevels) {
  if (nLevels == 0) return [];
  const extendedLen = 1 << nLevels;
  topSiblings = generateMerkleProof(m, key >> 1, nLevels - 1);
  curSibling = m[extendedLen - 1 + (key ^ 1)];
  return [...topSiblings, curSibling];
}

function generateMerklePath(m, key, nLevels) {
  if (nLevels == 0) return [m[key]];
  const extendedLen = 1 << nLevels;
  const curNode = m[extendedLen - 1 + key];
  const pathToParent = generateMerklePath(m, key >> 1, nLevels - 1);
  return [...pathToParent, curNode];
}

function validateMerkleProof(F, hash, key, value, root, mp) {
  let h = hash([value]);
  for (let i = mp.length - 1; i >= 0; i--) {
    if ((1 << (mp.length - 1 - i)) & key) {
      h = hash([mp[i], h]);
    } else {
      h = hash([h, mp[i]]);
    }
  }
  return F.eq(root, h);
}

module.exports = {
  createMerkleTree,
  generateMerkleProof,
  validateMerkleProof,
  generateMerklePath,
  createSimulatedMerkleTree
};

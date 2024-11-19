function circuit_merkleroot(numRows) {
    const depth = Math.ceil(Math.log2(numRows));
    const numLeaves = 2 ** depth; // Ensure complete binary tree
    return `
pragma circom 2.1.9;
include "../../node_modules/circomlib/circuits/poseidon.circom";

template MerkleRoot() {
    signal input leaves_original[${numLeaves}];   // Original dataset (real data + padded)
    signal input leaves_sorted[${numLeaves}];     // Sorted dataset (real data + padded)
    signal input expectedRoot_original;           // Expected Merkle root for original dataset
    signal input expectedRoot_sorted;             // Expected Merkle root for sorted dataset

    // Outputs
    signal output root_original;                  // Root of the original dataset Merkle Tree
    signal output root_sorted;                    // Root of the sorted dataset Merkle Tree

    // Components for Poseidon hashers
    component hashers_original[${numLeaves - 1}];
    component hashers_sorted[${numLeaves - 1}];

    // Generate Merkle Tree for Original Dataset
    for (var i = 0; i < ${Math.floor(numLeaves / 2)}; i++) {
        hashers_original[i] = Poseidon(2);
        hashers_original[i].inputs[0] <== leaves_original[2 * i];
        hashers_original[i].inputs[1] <== leaves_original[2 * i + 1];
    }
    for (var i = ${Math.floor(numLeaves / 2)}; i < ${numLeaves - 2}; i++) {
        hashers_original[i] = Poseidon(2);
        hashers_original[i].inputs[0] <== hashers_original[2 * (i - ${Math.floor(numLeaves / 2)})].out;
        hashers_original[i].inputs[1] <== hashers_original[2 * (i - ${Math.floor(numLeaves / 2)}) + 1].out;
    }
    hashers_original[${numLeaves - 2}] = Poseidon(2);
    hashers_original[${numLeaves - 2}].inputs[0] <== hashers_original[${numLeaves - 4}].out;
    hashers_original[${numLeaves - 2}].inputs[1] <== hashers_original[${numLeaves - 3}].out;
    root_original <== hashers_original[${numLeaves - 2}].out;

    // Generate Merkle Tree for Sorted Dataset
    for (var i = 0; i < ${Math.floor(numLeaves / 2)}; i++) {
        hashers_sorted[i] = Poseidon(2);
        hashers_sorted[i].inputs[0] <== leaves_sorted[2 * i];
        hashers_sorted[i].inputs[1] <== leaves_sorted[2 * i + 1];
    }
    for (var i = ${Math.floor(numLeaves / 2)}; i < ${numLeaves - 2}; i++) {
        hashers_sorted[i] = Poseidon(2);
        hashers_sorted[i].inputs[0] <== hashers_sorted[2 * (i - ${Math.floor(numLeaves / 2)})].out;
        hashers_sorted[i].inputs[1] <== hashers_sorted[2 * (i - ${Math.floor(numLeaves / 2)}) + 1].out;
    }
    hashers_sorted[${numLeaves - 2}] = Poseidon(2);
    hashers_sorted[${numLeaves - 2}].inputs[0] <== hashers_sorted[${numLeaves - 4}].out;
    hashers_sorted[${numLeaves - 2}].inputs[1] <== hashers_sorted[${numLeaves - 3}].out;
    root_sorted <== hashers_sorted[${numLeaves - 2}].out;
}
`;
}
module.exports = { circuit_merkleroot };

const fs = require("fs");
const path = require("path");

// Function to generate the dynamic Circom file for any dataset size
function generateDynamicCircuit(numRows) {
    const depth = Math.ceil(Math.log2(numRows));
    const numLeaves = 2 ** depth;  // Ensure complete binary tree

    return `
pragma circom 2.1.9;
include "../../node_modules/circomlib/circuits/poseidon.circom"; 

template PoseidonMerkleTree${numLeaves}() {
    signal input leaves[${numLeaves}];   // Leaves (real data + padded)
    signal input expectedRoot;           // Expected Merkle root (for comparison)

    // Merkle Tree Definition
    signal output root;        // Root of the Merkle Tree
    signal output root_matches; // Flag if root matches expectedRoot

    component hashers[${numLeaves - 1}]; // We will need numLeaves - 1 Poseidon hashers

    // Create the first level of the tree (pairwise hashing of leaves)
    for (var i = 0; i < ${Math.floor(numLeaves / 2)}; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== leaves[2 * i];
        hashers[i].inputs[1] <== leaves[2 * i + 1];
    }

    // Continue hashing up the tree
    for (var i = ${Math.floor(numLeaves / 2)}; i < ${numLeaves - 2}; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== hashers[2 * (i - ${Math.floor(numLeaves / 2)})].out;
        hashers[i].inputs[1] <== hashers[2 * (i - ${Math.floor(numLeaves / 2)}) + 1].out;
    }

    // Final root calculation
    hashers[${numLeaves - 2}] = Poseidon(2);
    hashers[${numLeaves - 2}].inputs[0] <== hashers[${numLeaves - 4}].out;
    hashers[${numLeaves - 2}].inputs[1] <== hashers[${numLeaves - 3}].out;

    root <== hashers[${numLeaves - 2}].out;

    // Comparison of the root with expectedRoot
    signal diff;
    diff <== root - expectedRoot;

    signal is_zero;
    // If diff is 0, is_zero will be 0; otherwise non-zero
    is_zero <== diff * diff; 
    // 1 if root matches expectedRoot, 0 otherwise
    root_matches <== 1 - is_zero; 

    // Uniqueness Check Logic
    component uniqueness_check[${numRows * (numRows - 1) / 2}];  // Components for uniqueness check
    signal uniqueness_flags[${numRows * (numRows - 1) / 2}];     // Signals for uniqueness comparison

    var index = 0;
    // Compare only the first ${numRows} rows, ignoring the padded rows
    for (var i = 0; i < ${numRows}; i++) {
        for (var j = i + 1; j < ${numRows}; j++) {
            uniqueness_check[index] = IsEqual();   // Reuse IsEqual template
            uniqueness_check[index].a <== leaves[i];
            uniqueness_check[index].b <== leaves[j];
            uniqueness_flags[index] <== 1 - uniqueness_check[index].is_equal;  // 1 if not equal
            index++;
        }
    }

    // Accumulator pattern for uniqueness
    signal intermediate[${(numRows * (numRows - 1) / 2) + 1}];  // Hold intermediate values

    intermediate[0] <== 1;  // Start with 1

    for (var i = 0; i < ${numRows * (numRows - 1) / 2}; i++) {
        intermediate[i + 1] <== intermediate[i] * uniqueness_flags[i];  // Accumulate product
    }

    // Set the output
    signal output is_unique;
    is_unique <== intermediate[${numRows * (numRows - 1) / 2}];  // Final result
}

// Equality check component to compare two signals
template IsEqual() {
    signal input a;
    signal input b;
    signal output is_equal;

    signal diff;
    diff <== a - b;

    signal is_zero;
    is_zero <== diff * diff; // If diff is 0, is_zero will be 0; otherwise it will be non-zero

    is_equal <== 1 - is_zero;  // Output 1 if equal, 0 otherwise
}

component main = PoseidonMerkleTree${numLeaves}();
`;
}

// Function to save the generated Circom file
function saveGeneratedCircomFile(filePath, numRows) {
    const circuitCode = generateDynamicCircuit(numRows);
    fs.writeFileSync(filePath, circuitCode);
    console.log(`Generated Circom file saved at ${filePath}`);
}

// Function to calculate the Merkle Tree depth and padded number of leaves
function calculateTreeDepthAndLeaves(numRows) {
    const depth = Math.ceil(Math.log2(numRows));
    const numLeaves = 2 ** depth;  // Ensure it is a complete binary tree
    return { depth, numLeaves };
}

// Export the functions for external usage
module.exports = {
    saveGeneratedCircomFile,
    calculateTreeDepthAndLeaves
};
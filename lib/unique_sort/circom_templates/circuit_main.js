function circuit_main(numRows) {
    const depth = Math.ceil(Math.log2(numRows));
    const numLeaves = 2 ** depth; // Ensure complete binary tree
    return `
pragma circom 2.1.9;
include "./circuit_merkleroot.circom";
include "./circuit_unique.circom";

template Main() {
    // Constants
    signal input leaves_original[${numLeaves}];  // Input array of leaves for original dataset (real data + padded)
    signal input leaves_sorted[${numLeaves}];    // Input array of leaves for sorted dataset (real data + padded)
    signal input expectedRoot_original;          // Expected Merkle root for original dataset
    signal input expectedRoot_sorted;            // Expected Merkle root for sorted dataset

    // Outputs
    signal output root_original;                 // Calculated Merkle root for original dataset
    signal output root_sorted;                   // Calculated Merkle root for sorted dataset
    signal output is_unique;                     // Flag if all rows are unique

    // Components
    component merkle = MerkleRoot();
    component uniqueness = UniquenessChecker();

    // Pass inputs to Merkle Root component
    for (var i = 0; i < ${numLeaves}; i++) {
        merkle.leaves_original[i] <== leaves_original[i];
        merkle.leaves_sorted[i] <== leaves_sorted[i];
    }
    merkle.expectedRoot_original <== expectedRoot_original;
    merkle.expectedRoot_sorted <== expectedRoot_sorted;

    // Pass sorted rows to UniquenessChecker
    for (var i = 0; i < ${numRows}; i++) {
        uniqueness.rows[i] <== leaves_sorted[i]; // Uniqueness only checks sorted rows
    }

    // Assign outputs
    root_original <== merkle.root_original;
    root_sorted <== merkle.root_sorted;
    is_unique <== uniqueness.is_unique;
}
component main = Main();
`;
};
module.exports = { circuit_main };

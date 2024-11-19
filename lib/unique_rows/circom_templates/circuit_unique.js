function circuit_unique(numRows) {
    return `
pragma circom 2.1.9;
include "../../../node_modules/circomlib/circuits/comparators.circom";

template UniquenessChecker() {
    signal input rows[${numRows}];       // Input: sorted dataset rows
    signal output is_unique;            // Output: 1 if all rows are unique, 0 otherwise

    component isZero[${numRows - 1}];
    signal uniqueCheck[${numRows - 1}];
    signal intermediate[${numRows - 1}];

    // Check for uniqueness by comparing adjacent rows
    for (var i = 0; i < ${numRows - 1}; i++) {
        isZero[i] = IsZero();
        isZero[i].in <== rows[i + 1] - rows[i];  // Check if adjacent rows are equal
        uniqueCheck[i] <== 1 - isZero[i].out;   // uniqueCheck[i] is 1 if rows are different, 0 otherwise
        intermediate[i] <== (i == 0) ? uniqueCheck[i] : intermediate[i - 1] * uniqueCheck[i];
    }

    // Final output: is_unique is 1 if all uniqueCheck values are 1, 0 otherwise
    is_unique <== intermediate[${numRows - 2}];
}
`;
};
module.exports = { circuit_unique };

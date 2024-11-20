function circuit_unique(numRows, thresholdPercentage) {
    return `
pragma circom 2.1.9;
include "../../../node_modules/circomlib/circuits/comparators.circom";

template UniquenessChecker(numRows, thresholdPercentage) {
    signal input rows[numRows];       // Input: sorted dataset rows
    signal output is_unique;          // Output: 1 if all rows are unique, 0 otherwise
    signal output is_below_threshold; // Output: 1 if duplicates are below threshold, 0 otherwise

    // Components for checking duplicates
    component isZero[numRows - 1];
    signal duplicateFlags[numRows - 1];
    signal duplicateCount[numRows - 1];

    // Check for duplicates by comparing adjacent rows
    for (var i = 0; i < numRows - 1; i++) {
        isZero[i] = IsZero();
        isZero[i].in <== rows[i + 1] - rows[i];  // Check if adjacent rows are equal
        duplicateFlags[i] <== isZero[i].out;     // 1 if rows are equal, 0 otherwise
        if (i == 0) {
            duplicateCount[i] <== duplicateFlags[i];
        } else {
            duplicateCount[i] <== duplicateCount[i - 1] + duplicateFlags[i];
        }
    }

    // Determine if all rows are unique
    component isZeroCheck = IsZero();
    isZeroCheck.in <== duplicateCount[numRows - 2];
    is_unique <== isZeroCheck.out;

    // Calculate the threshold number of duplicates allowed
    signal threshold;
    threshold <== (thresholdPercentage * numRows) / 100;

    // Compare duplicateCount to threshold using LessThan component
    component lessThan = LessThan(32); // Adjust bit-width as needed
    lessThan.in[0] <== duplicateCount[numRows - 2];
    lessThan.in[1] <== threshold;
    is_below_threshold <== lessThan.out;
}
`;
}
module.exports = { circuit_unique };

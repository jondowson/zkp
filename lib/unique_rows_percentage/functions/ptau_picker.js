// How to get number of circuits and wires.
// $ node --max-old-space-size=12192 $(which snarkjs) r1cs info generated/circom/zkp_unique_rows.r1cs

// How to calculate the size of the power of tau file.
// Above we see the number of constraints is 1,571,839. 
// So find the smallest k such that 2^k is greater than or equal to 1,571,839.
// 2^k > number of constraints
// 2^20 = 1,048,576  (too small)
// 2^21 = 2,097,152  (this is sufficient)

const fs = require('fs');
const path = require('path');

function getPowersOfTauFileForConstraints(ptauDir, numConstraints) {
    const files = fs.readdirSync(ptauDir).filter(file => file.endsWith('.ptau'));

    // Extract the exponent from the PTAU file names
    const ptauFiles = files.map(file => {
        const match = file.match(/powersOfTau(\d+)_hez_final_(\d+)\.ptau/);
        if (match) {
            const exponent = parseInt(match[2], 10);
            const power = 2 ** exponent;
            return { file, exponent, power };
        }
        return null;
    }).filter(Boolean);

    // Sort PTAU files by power
    ptauFiles.sort((a, b) => a.power - b.power);

    // Find the smallest file where 2^exponent is greater than or equal to numConstraints
    for (const ptau of ptauFiles) {
        if (ptau.power >= numConstraints) {
            return path.join(ptauDir, ptau.file);
        }
    }

    throw new Error(`No suitable PTAU file found for ${numConstraints} constraints.`);
}

module.exports = {
    getPowersOfTauFileForConstraints
};

const fs = require("fs");
const path = require("path");
const { execCommand } = require("./execCommand");
const { saveGeneratedCircomFile } = require("./circom_circuit");
const { getPowersOfTauFileForConstraints } = require("./ptau_picker");
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir, circomLibPath, ptauDir } = require('./config');

const { exec } = require("child_process");

// Function to calculate the Merkle Tree depth and padded number of leaves
function calculateTreeDepthAndLeaves(numRows) {
    const depth = Math.ceil(Math.log2(numRows));
    const numLeaves = 2 ** depth;  // Ensure it is a complete binary tree
    return { depth, numLeaves };
}

async function generateZKProof(generatedScriptDir, numRows, depth) {
    try {

        console.log();
        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 1/7");
        console.log("--> Generating the circom file...");

        // Generate the Circom file before compiling
        const circomFilePath = path.join(generatedScriptDir, "zkp_complete_rows.circom");
        saveGeneratedCircomFile(circomFilePath, numRows, depth);

        // Compile the Circom file
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 2/7");
        console.log("--> Compiling the circom file...");
        await execCommand(`circom ${circomFilePath} --r1cs --wasm --sym --c --output ${generatedCircomDir}`);

        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 3/7");
        console.log("--> Generating witness...");
        const wasmPath = path.join(generatedCircomDir, "zkp_complete_rows_js/zkp_complete_rows.wasm");
        const witnessPath = path.join(generatedSnarkjsDir, "witness.wtns");
        await execCommand(`node ${generatedCircomDir}/zkp_complete_rows_js/generate_witness.js ${wasmPath} ${generatedScriptDir}/input.json ${witnessPath}`);

        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 4/7");
        console.log("--> Performing trusted setup...");
        const zkeyPath = path.join(generatedSnarkjsDir, "zkp_complete_rows.zkey");
        await execCommand(`snarkjs groth16 setup ${generatedSnarkjsDir}/zkp_complete_rows.r1cs ptau/powersOfTau28_hez_final_22.ptau ${zkeyPath}`);

        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 5/7");
        console.log("--> Exporting the verification key...");
        const vKeyPath = path.join(generatedSnarkjsDir, "verification_key.json");
        await execCommand(`snarkjs zkey export verificationkey ${zkeyPath} ${vKeyPath}`);

        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 6/7");
        console.log("--> Generating proof...");
        const proofPath = path.join(generatedSnarkjsDir, "proof.json");
        const publicSignalsPath = path.join(generatedSnarkjsDir, "public.json");
        await execCommand(`snarkjs groth16 prove ${zkeyPath} ${witnessPath} ${proofPath} ${publicSignalsPath}`);

        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 7/7");
        console.log("--> Verifying proof...");
        const verificationOutput = await execCommand(`snarkjs groth16 verify ${vKeyPath} ${publicSignalsPath} ${proofPath}`);
        console.log(`Verification result: ${verificationOutput}`);

    } catch (error) {
        console.error("Proof Error:", error);
        throw error;
    }
}

module.exports = { generateZKProof,calculateTreeDepthAndLeaves };

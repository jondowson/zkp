const fs = require("fs");
const path = require("path");
const { exec_command } = require("./functions/exec_command");
const { circuit_main } = require("./circom_templates/circuit_main");
const { circuit_merkleroot } = require("./circom_templates/circuit_merkleroot");
const { circuit_unique } = require("./circom_templates/circuit_unique");
const { write_dynamic_circuit } = require("./functions/write_dynamic_circuit");
const { getPowersOfTauFileForConstraints } = require("./functions/ptau_picker");
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir, circomLibPath, ptauDir, thresholdPercentage } = require("./config");

async function generateZKProof(inputFilePath, datasetName, numRows, depth, numLeaves, originalRoot, sortedRoot) {
    try {
        console.log();
        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 1/9");
        console.log("--> Generating the circom files...");

        // Generate the Circom files dynamically before compiling.
        const filePath_main = path.join(generatedScriptDir, "circuit_main.circom");
        const circuitFileMain = circuit_main(numRows, numLeaves, thresholdPercentage);
        write_dynamic_circuit(filePath_main, circuitFileMain);

        const filePath_merkle = path.join(generatedScriptDir, "circuit_merkleroot.circom");
        const circuitFileMerkle = circuit_merkleroot(numLeaves);
        write_dynamic_circuit(filePath_merkle, circuitFileMerkle);

        const filePath_unique = path.join(generatedScriptDir, "circuit_unique.circom");
        const circuitFileUnique = circuit_unique(numRows, thresholdPercentage);
        write_dynamic_circuit(filePath_unique, circuitFileUnique);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 2/9");
        console.log("--> Compiling the circom files into folder...");
        await exec_command(`circom ${filePath_main} --r1cs --wasm --sym --O0 --output ${generatedCircomDir} -l ${circomLibPath}`);
        console.log(`--> ${generatedCircomDir}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 3/9");
        console.log("--> Generating witness file...");
        const wasmPath = path.join(generatedCircomDir, "circuit_main_js/circuit_main.wasm");
        const witnessPath = path.join(generatedSnarkjsDir, "witness.wtns");
        await exec_command(`node ${generatedCircomDir}/circuit_main_js/generate_witness.js ${wasmPath} ${inputFilePath} ${witnessPath}`);
        console.log(`--> ${witnessPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 4/9");
        console.log("--> Trusted Setup...");
        const r1csInfo = await exec_command(`node --max-old-space-size=12192 $(which snarkjs) r1cs info ${path.join(generatedCircomDir, "circuit_main.r1cs")}`);
        const numConstraints = r1csInfo.match(/# of Constraints:\s+(\d+)/)[1];
        console.log(r1csInfo);

        const ptauFile = getPowersOfTauFileForConstraints(ptauDir, numConstraints);
        console.log(`--> Selected ptau file: ${ptauFile}`);
        const zkeyPath = path.join(generatedCircomDir, "circuit_main.zkey");
        await exec_command(`snarkjs groth16 setup ${generatedCircomDir}/circuit_main.r1cs ${ptauFile} ${zkeyPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 5/9");
        console.log("--> Exporting the verification key...");
        const vKeyPath = path.join(generatedSnarkjsDir, "verification_key.json");
        await exec_command(`snarkjs zkey export verificationkey ${zkeyPath} ${vKeyPath}`);
        console.log(`--> ${vKeyPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 6/9");
        console.log("--> Generating the proof...");
        const proofPath = path.join(generatedSnarkjsDir, "proof.json");
        const publicSignalsPath = path.join(generatedSnarkjsDir, "public.json");
        await exec_command(`snarkjs groth16 prove ${zkeyPath} ${witnessPath} ${proofPath} ${publicSignalsPath}`);
        console.log(`--> ${proofPath}`);
        console.log(`--> ${publicSignalsPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 7/9");
        console.log("--> Generate file for debugging...");
        await exec_command(`snarkjs wtns export json ${witnessPath} ${generatedSnarkjsDir}/witness.json`);
        console.log(`--> ${generatedSnarkjsDir}/witness.json`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 8/9");
        console.log("--> Verifying the proof...");
        const verificationOutput = await exec_command(`snarkjs groth16 verify ${vKeyPath} ${publicSignalsPath} ${proofPath}`);
        console.log(`--> Verification Result: ${verificationOutput}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 9/9");
        console.log(`--> Verification summary for dataset: ${datasetName}`);
        
        const witnessData = JSON.parse(fs.readFileSync(`${generatedSnarkjsDir}/witness.json`, 'utf8'));

        // Check the witness.json for matching merkle tree root.
        const rootMatch = witnessData[1];
        console.log("--------------------------");
        console.log(`--> Proof of original dataset authenticity`); 
        if (String(rootMatch) === String(originalRoot)) {
            console.log('\x1b[32m%s\x1b[0m', `--> Merkle root hash matches that of the supplied dataset!`);
            console.log('\x1b[32m%s\x1b[0m', `--> circuit_calculated: ${rootMatch}`);
            console.log('\x1b[32m%s\x1b[0m', `--> supplied:           ${originalRoot}`);
        } else {
            console.log('\x1b[31m%s\x1b[0m', `--> Merkle root hash does not match that of the supplied dataset!`);
            console.log('\x1b[31m%s\x1b[0m', `--> circuit_calculated: ${rootMatch}`);
            console.log('\x1b[31m%s\x1b[0m', `--> supplied:           ${originalRoot}`);
        }

        // Check the witness.json for matching merkle tree root.
        const rootMatchSorted = witnessData[2];
        console.log("--------------------------");
        console.log(`--> Proof of sorted original dataset authenticity`); 
        if (String(rootMatchSorted) === String(sortedRoot)) {
            console.log('\x1b[32m%s\x1b[0m', `--> Merkle root hash matches that of the supplied dataset!`);
            console.log('\x1b[32m%s\x1b[0m', `--> circuit_calculated: ${rootMatchSorted}`);
            console.log('\x1b[32m%s\x1b[0m', `--> supplied:           ${sortedRoot}`);
        } else {
            console.log('\x1b[31m%s\x1b[0m', `--> Merkle root hash does not match that of the supplied dataset!`);
            console.log('\x1b[31m%s\x1b[0m', `--> circuit_calculated: ${rootMatchSorted}`);
            console.log('\x1b[31m%s\x1b[0m', `--> supplied:           ${sortedRoot}`);
        }

        // Check the witness.json for duplicates
        console.log();
        console.log("--------------------------");
        console.log(`--> Proof of dataset rows uniqueness`);
        const hasDuplicates = witnessData[3]; 
        if (hasDuplicates.toString() === "0") {
            console.log('\x1b[31m%s\x1b[0m', `--> Uniqueness has failed with at least one duplicate row found!\n`);
        } else {
            console.log('\x1b[32m%s\x1b[0m', `--> Uniqueness has passed with no duplicate rows found!\n`);
        }

        // Check the witness.json for duplicates
        console.log("--------------------------");
        console.log(`--> Proof of dataset duplicate rows threshold`);
        const belowThreshold = witnessData[4]; 
        if (belowThreshold.toString() === "0") {
            console.log('\x1b[31m%s\x1b[0m', `--> The number of duplicate rows exceeds the threshold of ${thresholdPercentage}%!\n`);
        } else {
            console.log('\x1b[32m%s\x1b[0m', `--> The number of duplicate rows is below the threshold of ${thresholdPercentage}%!\n`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
};
module.exports = { generateZKProof };

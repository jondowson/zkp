const fs = require("fs");
const path = require("path");
const { execCommand } = require("./execCommand");
const { saveGeneratedCircomFile } = require("./circom_circuit");
const { getPowersOfTauFileForConstraints } = require("./ptau_picker");
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir, circomLibPath, ptauDir } = require('./config');

async function generateZKProof(inputFilePath, datasetName, numRows, depth, expectedRoot) {

    try {

        console.log();
        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 1/9");
        console.log("--> Generating the circom file...");

        // Generate the Circom file before compiling
        const circomFilePath = path.join(generatedScriptDir, "zkp_unique_rows.circom");
        saveGeneratedCircomFile(circomFilePath, numRows, depth);
        
        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 2/9");
        console.log("--> Compiling the circom files into folder...");
        await execCommand(`circom ${circomFilePath} --r1cs --wasm --sym --c --output ${generatedCircomDir} -l ${circomLibPath}`);
        console.log(`--> ${generatedCircomDir}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 3/9");
        console.log("--> Generating witness file...");
        const wasmPath = path.join(generatedCircomDir, "zkp_unique_rows_js/zkp_unique_rows.wasm");
        const witnessPath = path.join(generatedSnarkjsDir, "witness.wtns");
        await execCommand(`node ${generatedCircomDir}/zkp_unique_rows_js/generate_witness.js ${wasmPath} ${inputFilePath} ${witnessPath}`);
        console.log(`--> ${witnessPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 4/9");
        console.log("--> Trusted Setup...");
        console.log("--> Get circuit info:");
        
        const r1csInfo = await execCommand(`node --max-old-space-size=12192 $(which snarkjs) r1cs info ${path.join(generatedCircomDir, "zkp_unique_rows.r1cs")}`);
        const numConstraints = r1csInfo.match(/# of Constraints:\s+(\d+)/)[1];
        console.log(r1csInfo);

        // Select the smallest ptau file based on the number of constraints
        const ptauFile = getPowersOfTauFileForConstraints(ptauDir, numConstraints);

        console.log(`--> Calculate smallest power of tau file to use.`);
        console.log(`--> ${ptauFile}`);
        console.log(`--> Note: larger ptau files require more ram and time to process.`);
        const zkeyPath = path.join(generatedCircomDir, "zkp_unique_rows.zkey");
        await execCommand(`snarkjs groth16 setup ${generatedCircomDir}/zkp_unique_rows.r1cs ${ptauFile} ${zkeyPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 5/9");
        console.log("--> Export the verification key...");
        const vKeyPath = path.join(generatedSnarkjsDir, "verification_key.json");
        await execCommand(`snarkjs zkey export verificationkey ${zkeyPath} ${vKeyPath}`);
        console.log(`--> ${vKeyPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 6/9");
        console.log("--> Generate the files for proof and public signals...");
        const proofPath = path.join(generatedSnarkjsDir, "proof.json");
        const publicSignalsPath = path.join(generatedSnarkjsDir, "public.json");
        await execCommand(`snarkjs groth16 prove ${zkeyPath} ${witnessPath} ${proofPath} ${publicSignalsPath}`);
        console.log(`--> ${proofPath}`);
        console.log(`--> ${publicSignalsPath}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 7/9");
        console.log("--> Generate file for debugging...");
        await execCommand(`snarkjs wtns export json ${witnessPath} ${generatedSnarkjsDir}/witness.json`);
        console.log(`--> ${generatedSnarkjsDir}/witness.json`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 8/9");
        console.log("--> Verify proof is well constructed...");
        const verificationOutput = await execCommand(`snarkjs groth16 verify ${vKeyPath} ${publicSignalsPath} ${proofPath}`);
        console.log(`--> Result: ${verificationOutput}`);

        console.log("--------------------------");
        console.log("\x1b[33m%s\x1b[0m", "Proof Stage: 9/9");
        console.log(`--> Interpret results..`);
        console.log(`--> ${datasetName}`);

        // Read the json.
        const witnessData = JSON.parse(fs.readFileSync(`${generatedSnarkjsDir}/witness.json`, 'utf8'));

        // Check the witness.json for matching merkle tree root.
        const rootMatch = witnessData[1];
        console.log("--------------------------");
        console.log(`--> Proof of dataset authenticity`); 
        if (String(rootMatch) === String(expectedRoot)) {
            console.log('\x1b[32m%s\x1b[0m', `--> Merkle root hash matches that of the supplied dataset!`);
            console.log('\x1b[32m%s\x1b[0m', `--> circuit_calculated: ${rootMatch}`);
            console.log('\x1b[32m%s\x1b[0m', `--> supplied:           ${expectedRoot}`);
        } else {
            console.log('\x1b[31m%s\x1b[0m', `--> Merkle root hash does not match that of the supplied dataset!`);
            console.log('\x1b[31m%s\x1b[0m', `--> circuit_calculated: ${rootMatch}`);
            console.log('\x1b[31m%s\x1b[0m', `--> supplied:           ${expectedRoot}`);
        }

        // Check the witness.json for duplicates
        console.log();
        console.log("--------------------------");
        console.log(`--> Proof of dataset rows uniqueness`);
        const hasDuplicates = witnessData[3]; 
        if (hasDuplicates === "0") {
            console.log('\x1b[31m%s\x1b[0m', `--> Uniqueness has failed with duplicate rows found!\n`);
        } else {
            console.log('\x1b[32m%s\x1b[0m', `--> Uniqueness has passed with no duplicate rows found!\n`);
        }



    } catch (error) {
        console.error("Error:", error);
    }

}

module.exports = { generateZKProof };
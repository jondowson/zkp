const fs = require("fs");
const path = require("path");
const crypto = require('crypto-browserify');
const csv = require("csv-parser");
const circomlibjs = require("circomlibjs");
const merkle_functions = require("./functions/merkle_functions");
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir } = require("./config");

// Initialize Poseidon globally once
let poseidon;

async function setup(csvFile) {
    try {
        // Initialize Poseidon hash function
        if (!poseidon) {
            poseidon = await circomlibjs.buildPoseidon();
        }

        // Ensure necessary directories exist and are clean
        [generatedCircomDir, generatedSnarkjsDir, generatedScriptDir].forEach((dir) => {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
            fs.mkdirSync(dir, { recursive: true });
        });

        console.log("--------------------------");
        console.log("\x1b[35m%s\x1b[0m", "Setup Stage 1/3");
        console.log("--> Remove existing folders and re-create..");
        console.log(`--> ${generatedCircomDir}`);
        console.log(`--> ${generatedSnarkjsDir}`);
        console.log(`--> ${generatedScriptDir}\n`);

        const dataset = [];
        const inputFilePath = path.join(generatedScriptDir, "input.json");

        // Read CSV file and store rows
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFile)
                .pipe(csv())
                .on("data", (row) => {
                    dataset.push(Object.values(row));
                })
                .on('end', () => {
                    console.log("--------------------------");
                    console.log("\x1b[35m%s\x1b[0m", "Setup Stage: 2/3");
                    console.log(`--> Read CSV file..`);
                    console.log(`--> ${csvFile}\n`);
                    resolve();
                })
                .on("error", reject);
        });

        // Hash dataset rows using Poseidon
        const rowHashes = dataset.map((row) => {
            // Concatenate all elements of the row into a single string
            const rowString = row.join("");
        
            // Compute the SHA-256 hash of the concatenated string
            const hashHex = crypto.createHash("sha256").update(rowString).digest("hex");
            console.log("Row data:", row);
            console.log("Generated hash:", hashHex.toString());
            // Convert the hexadecimal hash to a BigInt
            return BigInt(`0x${hashHex}`);
        });

        // Sort hashes externally
        const sortedHashes = [...rowHashes].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));

        // Prepare Merkle trees for both datasets
        const { root: originalRoot, paddedLeaves: originalLeaves } = await merkle_functions.buildMerkleTree(rowHashes);
        const { root: sortedRoot, paddedLeaves: sortedLeaves } = await merkle_functions.buildMerkleTree(sortedHashes);

        // Prepare the input JSON for Circom
        const input = {
            leaves_original: originalLeaves.map((leaf) => leaf.toString()),
            leaves_sorted: sortedLeaves.map((leaf) => leaf.toString()),
            expectedRoot_original: originalRoot.toString(),
            expectedRoot_sorted: sortedRoot.toString(),
        };

        fs.writeFileSync(inputFilePath, JSON.stringify(input, null, 2));
        console.log();
        console.log("--------------------------");
        console.log("\x1b[35m%s\x1b[0m", "Setup Stage: 3/3");
        console.log("--> Creating proof input file..");
        console.log(`--> ${generatedScriptDir}/input.json`);

        // Log the input.json file for debugging
        try {
            const data = fs.readFileSync(`${generatedScriptDir}/input.json`, 'utf8');
            console.log(data);
        } catch (err) {
            console.error(err);
        }

        return {
            inputFilePath,
            numRows: rowHashes.length,
            depth: Math.ceil(Math.log2(rowHashes.length)),
            originalRoot,
            sortedRoot,
        };
    } catch (error) {
        console.error("Error in setup:", error);
        throw error;
    }
};
module.exports = { setup };

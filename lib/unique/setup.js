const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const csv = require("csv-parser");
const { calculateTreeDepthAndLeaves } = require("./circom_circuit");
const circomlibjs = require('circomlibjs');
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir, circomLibPath, ptauDir } = require('./config');

// Initialize Poseidon globally once
let poseidon;
async function buildPoseidon() {
    const poseidonBuilder = await circomlibjs.buildPoseidon();
    poseidon = (inputs) => poseidonBuilder.F.toObject(poseidonBuilder(inputs));
}

// Calculate the Merkle Root using Poseidon Hash
async function calculateMerkleRoot(hashes) {
    // Ensure poseidon is initialized
    if (!poseidon) {
        await buildPoseidon();
    }

    while (hashes.length > 1) {
        let newLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = BigInt(hashes[i]);
            const right = BigInt(hashes[i + 1] || 0n);  // Handle uneven number of nodes by padding
            const hash = poseidon([left, right]);
            newLevel.push(hash);
        }
        hashes = newLevel;
    }
    return hashes[0];
}

// Main function to set up and prepare input data
async function setup(csvFile) {
    try {
        // Ensure poseidon is initialized
        if (!poseidon) {
            await buildPoseidon();
        }

        // Ensure the generated directories exist or create them
        [generatedCircomDir, generatedSnarkjsDir, generatedScriptDir].forEach(dir => {
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
        console.log(`--> ${generatedScriptDir}`);

        const dataset = [];
        const inputFilePath = path.join(generatedScriptDir, "input.json");

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFile)
                .pipe(csv())
                .on('data', (row) => {
                    const rowData = Object.values(row);
                    dataset.push(rowData);
                })
                .on('end', () => {
                    console.log("--------------------------");
                    console.log("\x1b[35m%s\x1b[0m", "Setup Stage: 2/3");
                    console.log(`--> Read CSV file..`);
                    console.log(`--> ${csvFile}\n`);
                    resolve();
                })
                .on('error', reject);
        });

        // Hash the dataset rows using SHA256
        const hashes = dataset.map(row => {
            const hash = BigInt('0x' + crypto.createHash('sha256').update(row.join('')).digest('hex'));
            console.log("Row data:", row);
            console.log("Generated hash:", hash.toString());
            return hash;  // Leave as BigInt for now, we'll convert later
        });

        // Calculate the depth and expected number of leaves for the Merkle Tree
        const numRows = hashes.length;
        const { depth, numLeaves } = calculateTreeDepthAndLeaves(numRows);

        // Pad the hashes with zeros if necessary
        while (hashes.length < numLeaves) {
            hashes.push(0n);  // Adding zero BigInt hashes to pad the array
        }

        // Calculate the Merkle Root from the hashes
        const expectedRoot = await calculateMerkleRoot(hashes);
        //const expectedRoot = "0x1234569870abcdef"; // Test.

        // Prepare the input for the circuit
        const input = {
            leaves: hashes.map(h => h.toString()),  // Convert BigInt to string for JSON
            expectedRoot: expectedRoot.toString()   // Convert BigInt to string for JSON
        };

        // Save input.json
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

        return { inputFilePath, numRows, depth, expectedRoot };
    } catch (error) {
        console.log("--------------------------");
        console.log("\x1b[31m%s\x1b[0m", "Setup Stage: ERROR");
        console.error("--> Error in setup:", error);
        throw error;
    }
}

module.exports = {
    calculateMerkleRoot,
    setup
};

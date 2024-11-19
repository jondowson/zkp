const fs = require("fs");
const { exec } = require("child_process");
const crypto = require("crypto");
const path = require("path");
const csv = require("csv-parser");

// Import the config
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir, circomLibPath, ptauDir } = require('./config');

// Import the generateCircomFile function and calculateTreeDepthAndLeaves
const { saveGeneratedCircomFile, calculateTreeDepthAndLeaves } = require('./proof');

// Function to execute shell commands
function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
            } else if (stderr) {
                reject(`stderr: ${stderr}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

async function setup(csvFile) {
    try {
        // Ensure the directories exist
        [generatedCircomDir, generatedSnarkjsDir, generatedScriptDir].forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
            fs.mkdirSync(dir, { recursive: true });
        });

        console.log("--------------------------");
        console.log("\x1b[35m%s\x1b[0m", "Setup Stage 1/5");
        console.log("--> Cleaned and created directories");

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
                    console.log("\x1b[35m%s\x1b[0m", "Setup Stage 2/5");
                    console.log(`--> Read CSV file..`);
                    console.log(`--> ${csvFile}\n`);
                    resolve();
                })
                .on('error', reject);
        });

        // Hash the dataset rows
        const hashes = dataset.map(row => {
            const hash = BigInt('0x' + crypto.createHash('sha256').update(row.join('')).digest('hex'));
            console.log("Row data:", row);
            console.log("Generated hash:", hash.toString());
            return hash.toString();
        });

        // Calculate the depth and expected number of leaves
        const numRows = hashes.length;
        const { depth, numLeaves } = calculateTreeDepthAndLeaves(numRows);

        // Pad the hashes with zeros if necessary
        while (hashes.length < numLeaves) {
            hashes.push("0");  // Adding zero hashes to pad the array
        }

        // Prepare input for the circuit
        const input = { leaves: hashes.slice(0, numLeaves) };
        fs.writeFileSync(inputFilePath, JSON.stringify(input, null, 2));
        console.log("\x1b[35m%s\x1b[0m", "Setup Stage 4/5");
        console.log("--> Created input.json for proof");
        console.log(inputFilePath)

        return { generatedScriptDir, inputFilePath, numRows, depth };
    } catch (error) {
        console.error("Setup Error:", error);
        throw error;
    }
}

module.exports = { setup };

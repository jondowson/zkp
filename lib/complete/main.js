const path = require('path');
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir, circomLibPath, ptauDir } = require('./config');
const { setup } = require("./setup");
const { generateZKProof } = require("./proof");

const csvFilePath = path.join(__dirname, '../../data', process.argv[2]);
const datasetName = path.basename(csvFilePath); 

async function main() {
    try {
        // Ensure a CSV file is passed as an argument
        if (process.argv.length < 3) {
            console.error("Please provide a CSV file path as an argument.");
            process.exit(1);
        }

        // Step 1: Setup and prepare the input
        const { generatedScriptDir, inputFilePath, numRows, depth } = await setup(csvFilePath);

        // Step 2: Generate the Zero-Knowledge Proof
        await generateZKProof(generatedScriptDir, numRows, depth);

    } catch (error) {
        console.error("Main Error:", error);
    }
}

main();


const path = require('path');
const csvFilePath = path.join(__dirname, '../../data/', process.argv[2]);
const datasetName = path.basename(csvFilePath);
const { generatedCircomDir, generatedSnarkjsDir, generatedScriptDir, circomLibPath, ptauDir } = require('./config');
const { setup } = require('./setup');
const { generateZKProof } = require('./generateZKProof');

(async () => {
    try {
        console.time("Execution Time");

        // Call setupAndPrepareInput here
        const { inputFilePath, numRows, depth, expectedRoot } = await setup(csvFilePath);
        await generateZKProof(inputFilePath, datasetName, numRows, depth, expectedRoot);

        console.timeEnd("Execution Time");
    } catch (error) {
        console.error("Error:", error);
    }
})();

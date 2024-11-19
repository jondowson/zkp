const path = require('path');
const csvFilePath = path.join(__dirname, '../../data/', process.argv[2]);
const datasetName = path.basename(csvFilePath);
const { setup } = require('./setup');
const { generateZKProof } = require('./generateZKProof');

(async () => {
    try {
        console.time("Execution Time");

        // Call setupAndPrepareInput here
        const { inputFilePath, numRows, depth, originalRoot, sortedRoot } = await setup(csvFilePath);
        
        // Call the script that dynamically generates the circuits and creates the proofs.
        await generateZKProof(inputFilePath, datasetName, numRows, depth, originalRoot, sortedRoot);

        console.timeEnd("Execution Time");
    } catch (error) {
        console.error("Error:", error);
    }
})();

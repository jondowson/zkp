// Function to save the generated Circom file
const fs = require('fs');
function write_dynamic_circuit(filePath, circuitCode) {
    fs.writeFileSync(filePath, circuitCode);
    console.log(`Generated Circom file saved at ${filePath}`);
};
module.exports = { write_dynamic_circuit };
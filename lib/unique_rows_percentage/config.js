const path = require('path');
const generatedCircomDir = path.join(__dirname, '../..', 'generated/circom');
const generatedSnarkjsDir = path.join(__dirname, '../..', 'generated/snarkjs');
const generatedScriptDir = path.join(__dirname, '../..', 'generated/script');
const circomLibPath = path.join(__dirname, '../..', 'node_modules/circomlib/circuits');
const ptauDir = path.join(__dirname, '../..', 'ptau');
const thresholdPercentage = 9;

module.exports = {
    generatedCircomDir,
    generatedSnarkjsDir,
    generatedScriptDir,
    circomLibPath,
    ptauDir,
    thresholdPercentage
};

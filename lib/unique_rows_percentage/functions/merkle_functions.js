const circomlibjs = require('circomlibjs');
let poseidon;
// Instantiate the poseiden object for Merkle trees.
async function buildPoseidon() {
    const poseidonBuilder = await circomlibjs.buildPoseidon();
    poseidon = (inputs) => poseidonBuilder.F.toObject(poseidonBuilder(inputs));
};

// Calculate the Merkle Root using Poseidon Hash
async function calculateMerkleRoot(hashes) {
    // Ensure Poseidon is initialized
    if (!poseidon) {
        await buildPoseidon();
    }

    while (hashes.length > 1) {
        let newLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = BigInt(hashes[i]);
            const right = BigInt(hashes[i + 1] || 0n); // Handle uneven number of nodes by padding
            const hash = poseidon([left, right]);
            newLevel.push(hash);
        }
        hashes = newLevel;
    }
    return hashes[0];
}

// Build the complete Merkle Tree structure (for debugging or reuse)
async function buildMerkleTree(hashes) {
    // Ensure Poseidon is initialized
    if (!poseidon) {
        await buildPoseidon();
    }

    const { depth, numLeaves } = calculateTreeDepthAndLeaves(hashes.length);

    // Pad leaves to the nearest power of 2
    const paddedLeaves = [...hashes, ...Array(numLeaves - hashes.length).fill(BigInt(0))];

    const levels = [paddedLeaves]; // Store all levels for debugging or reuse

    let currentLevel = paddedLeaves;
    while (currentLevel.length > 1) {
        let nextLevel = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || 0n; // Handle uneven nodes at any level
            const hash = poseidon([left, right]);
            nextLevel.push(hash);
        }
        levels.push(nextLevel);
        currentLevel = nextLevel;
    }

    return {
        root: currentLevel[0], // The last level contains only the root
        paddedLeaves,
        levels,
    };
}

// Function to calculate the Merkle Tree depth and padded number of leaves
function calculateTreeDepthAndLeaves(numRows) {
    const depth = Math.ceil(Math.log2(numRows));
    // Ensure it is a complete binary tree
    const numLeaves = 2 ** depth;
    return { depth, numLeaves };
};
module.exports = {
    buildPoseidon,
    calculateMerkleRoot,
    calculateTreeDepthAndLeaves,
    buildMerkleTree, // Export the new function
};

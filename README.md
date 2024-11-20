<p align="center"><img src="./ZKP_logo.png" alt="ZKP Logo" width="150" height="auto"></p>

# Zero-Knowledge Proof Project

This project demonstrates the implementation of Zero-Knowledge Proofs (ZKPs) to verify the uniqueness and sorted order of data entries without revealing the actual data. By leveraging cryptographic techniques, we ensure data integrity and privacy.

## Project Overview

The primary objective is to process a dataset, compute cryptographic hashes for each entry, and construct Merkle Trees to represent both the original and sorted datasets. We then generate and verify ZKPs to confirm that the data entries are unique and correctly sorted, all without exposing the underlying data.

## Features

- **Data Hashing:** Utilizes cryptographic hash functions to represent data entries securely.
- **Merkle Tree Construction:** Builds Merkle Trees for both original and sorted datasets to facilitate efficient and secure data verification.
- **Zero-Knowledge Proof Generation:** Generates proofs to verify data properties without revealing the data itself.
- **Proof Verification:** Verifies the generated proofs to ensure data integrity and correctness.

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/)

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/zkp-project.git
   ```

2. **Navigate to the Project Directory:**

   ```bash
   cd zkp-project
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

## Usage

1. **Prepare Your Dataset:**
   Ensure your dataset is in CSV format. Place it in the `data` directory of the project.

2. **Run the Setup Script:**
   This script processes the dataset, computes hashes, and constructs Merkle Trees.

   ```bash
   node lib/unique_sort2/main.js data/your_dataset.csv
   ```

3. **Generate Zero-Knowledge Proofs:**
   After setting up, generate the proofs:

   ```bash
   node lib/unique_sort2/generateZKProof.js
   ```

4. **Verify the Proofs:**
   Finally, verify the generated proofs:

   ```bash
   node lib/unique_sort2/verifyZKProof.js
   ```

## Project Structure

```
zkp-project/
data
├── complete
│   ├── c10.csv
│   └── nc10.csv
└── unique_rows
    ├── d10.csv
    ├── d100.csv
    ├── d1000.csv
    ├── u10.csv
    ├── u100.csv
    └── u1000.csv
lib
├── unique_rows
│   ├── circom_templates
│   │   ├── circuit_main.js
│   │   ├── circuit_merkleroot.js
│   │   └── circuit_unique.js
│   ├── config.js
│   ├── functions
│   │   ├── exec_command.js
│   │   ├── merkle_functions.js
│   │   ├── ptau_picker.js
│   │   └── write_dynamic_circuit.js
│   ├── generateZKProof.js
│   ├── main.js
│   └── setup.js
└── utils
    └── generate_csv.js
├── generated/
│   ├── circom/
│   ├── snarkjs/
│   └── scripts/
├── config.js
├── package.json
└── README.md
```

- `data/`: Contains the input datasets in CSV format.
- `lib/unique_rows/`: Houses the main scripts for setup, proof generation, and verification.
- `lib/unique_rows/functions/`: Includes utility functions for Merkle Tree construction and dynamically writing the circom circuits.
- `generated/`: Stores generated files such as Circom circuits, SnarkJS outputs, and scripts.
- `config.js`: Configuration file specifying directory paths and other settings.

## Dependencies

- Node.js
- npm
- circomlibjs
- crypto-browserifys
- csv-parser
- snarkjs

## Contributing

We welcome contributions! Please fork the repository and submit a pull request with your changes. Ensure that your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Special thanks to the developers and contributors of the open-source libraries and tools utilized in this project, including circomlibjs and snarkjs.

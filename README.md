<p align="center"><img src="./ZKP_logo.png" alt="ZKP Logo" width="200" height="auto"></p>

# Zero-Knowledge-Proof Data Quality

This project demonstrates the implementation of Zero-Knowledge Proofs (ZKPs) to verify qualitative aspects of data sets. For example, the uniqueness and sorted order of data entries without revealing the actual data. By leveraging cryptographic techniques, we ensure data integrity and privacy.

## Project Overview

The primary objective is to process a dataset, compute cryptographic hashes for each entry, and construct Merkle Trees to represent both the original and sorted datasets. We then generate and verify ZKPs to confirm that the data entries are unique and correctly sorted, all without exposing the underlying data. This approach also ensures data provenance as the root hash of the original dataset as well as the root hash of its sorted entries are themselves part of the proof.

## Features

- **Data Hashing:** Utilizes cryptographic hash functions to represent data entries securely.
- **Merkle Tree Construction:** Builds Merkle Trees for both original and sorted datasets to facilitate efficient and secure data verification.
- **Zero-Knowledge Proof Generation:** Generates proofs to verify data properties without revealing the data itself.
- **Proof Verification:** Verifies the generated proofs to ensure data integrity and correctness.

## Installation

You can set up the project natively or more easily using docker.

### 1. Native Installation
To run the project natively without Docker, follow these steps to install the necessary software dependencies:

- Node.js
- npm
- Rust ad Cargo 
- circomlibjs
- crypto-browserifys
- csv-parser
- snarkjs

1. **Install Node.js and npm:**
   
   Ensure that Node.js (version 14 or higher) and npm are installed on your system. You can download them from the [official Node.js website](https://nodejs.org/).
   
   To verify the installation, run:
   ```bash
   node -v
   npm -v
   ```
   These commands should display the installed versions of Node.js and npm, respectively.

2. **Install Rust and Cargo:**
   The project requires Rust and its package manager, Cargo. Install them using rustup:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
   Follow the on-screen instructions to complete the installation. After installation, ensure that the Cargo bin directory is in your system's PATH.

   Verify the installation by running:
   ```bash
   rustc --version
   cargo --version
   ```

3. **Install Circom:**
   Circom is a circuit compiler for zkSNARKs. Clone the Circom repository and build it:
   ```bash
   git clone https://github.com/iden3/circom.git
   cd circom
   cargo build --release
   cargo install --path circom
   ```
   After installation, verify by running:
   ```bash
   circom --version
   ```

4. **Install SnarkJS:**
   SnarkJS is a JavaScript library for zkSNARKs. Install it globally using npm:
   ```bash
   npm install -g snarkjs
   ```
   Verify the installation:
   ```bash
   snarkjs --version
   ```

5. **Install Additional Node.js Packages:**
   Navigate to the project directory and install the required Node.js packages:
   ```bash
   cd path/to/zkp-project
   npm install
   ```
   This command installs the dependencies specified in the package.json file.

6. **Install Python 3 and Pip:**
   Some scripts may require Python 3. Install Python 3 and its package manager, pip, from the official Python website.

   Verify the installation:
   ```bash
   python3 --version
   pip3 --version
   ```

7. **Install Python Packages:**
   If the project includes a requirements.txt file, install the necessary Python packages:
   ```bash
   pip3 install -r requirements.txt
   ```

By completing these steps, you will have all the necessary software dependencies installed to run the project natively on your system.


### 2. Installation Using Docker

To streamline the setup process, you can utilize Docker to run the project without installing Node.js or npm locally. See the Dockerfile and entrypoint.sh files for more details.  
Note that for the Docker installation the container mounts the host machines file system to access the project itself.

1. **Install Docker:**

   If not already installed, you can download it from the [official Docker website](https://www.docker.com/get-started/).

2. **Pull or build the Docker Image:**

   To retrieve the pre-built Docker image from Docker Hub:

   ```bash
   docker pull namenottaken/zkp-environment:latest
   ```

   To build the Dockerfile locally:

   ```bash
   cd zkp
   docker build -t namenottaken/zkp-environment:latest .
   ```

## Usage

1. **Clone the project repo:**

   For both native and docker usage, retrieve this project and enter the folder. In addition retrieve the powers of tau files used in the zksnark setup ceremony.

   ```bash
   git clone https://github.com/jondowson/zkp.git
   cd zkp
   mkdir ptau
   wget -P ptau/ https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau
   wget -P ptau/ https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau
   ```

2. **Run the application:**
   Each subfolder of the lib folder creates a proof for a certain dataset attribute, e.g. uniqueness of rows.  
   See the lib folder for a list of proofs.

   ```bash
   // To run natively use this command.
   node lib/<lib_folder>/main.js <lib_folder>/your_dataset.csv
   // Example:
   node lib/unique_rows/main.js unique_rows/d100.csv

   // To run with the docker container use this command.
   docker run --rm -v "$(pwd)":/app namenottaken/zkp-environment:latest <lib_folder> <data_file>
   // Example - note that main.js is assumed:
   docker run --rm -v "$(pwd)":/app namenottaken/zkp-environment:latest unique_rows unique_rows/d100.csv
   ```

## Project Structure

This tree shows the general structure of the project.

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
- `generated/`: Stores generated files such as Circom circuits, SnarkJS outputs, and scripts. Cleared after every run.
- `config.js`: Configuration file specifying directory paths and other settings.

## Contributing

We welcome contributions! Please fork the repository and submit a pull request with your changes. Ensure that your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Special thanks to the developers and contributors of the open-source libraries and tools utilized in this project, including circomlibjs and snarkjs.

#!/bin/bash

# Ensure the correct number of arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <lib_folder> <data_file>"
    exit 1
fi

LIB_FOLDER=$1
DATA_FILE=$2

# Navigate to the specified library folder
cd "lib/$LIB_FOLDER" || { echo "Library folder not found"; exit 1; }

# Execute the main.js script with the provided data file
node main.js "../data/$DATA_FILE"

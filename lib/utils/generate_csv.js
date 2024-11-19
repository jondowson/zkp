const fs = require('fs');
const path = require('path');

function generateUniqueData(numRows) {
  const names = [
    "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah", "Ivy", "Jack",
    "Katherine", "Liam", "Michael", "Nina", "Oscar", "Paul", "Quincy", "Rachel", "Sam", "Tina",
    "Uma", "Victor", "Wendy", "Xander", "Yara", "Zack", "Aaron", "Bella", "Cameron", "Daisy",
    "Edward", "Fiona", "George", "Helena", "Isaac", "Julia", "Karl", "Lily", "Martin", "Nora",
    "Oliver", "Penelope", "Quinn", "Robert", "Sara", "Thomas", "Ursula", "Violet", "Walter", 
    "Xenia", "Yvonne", "Zane", "Arthur", "Beatrice", "Chris", "Diana", "Ethan", "Frances", 
    "Gregory", "Harriet", "Ian", "Jessie", "Kevin", "Laura", "Miles", "Natalie", "Omar", 
    "Phoebe", "Quentin", "Riley", "Shane", "Talia", "Umar", "Vivian", "Wyatt", "Xavier", 
    "Yasmine", "Zara", "Adrian", "Beth", "Caleb", "Denise", "Eric", "Faith", "Gareth", "Heather", 
    "Isaiah", "Jenny", "Kurt", "Leah", "Marcus", "Nadine", "Owen", "Paula", "Quinton", "Ruth", 
    "Simon", "Tamara", "Ulysses", "Valerie"
  ];
  
  let data = [];
  
  for (let i = 0; i < numRows; i++) {
    const name = names[i % names.length]; // Cycles through the names array
    const age = 25 + (i * 5); // Start from 25, increase by 5 each time
    data.push({ name, age });
  }
  
  return data;
}

function generateCSV(filePath, numRows) {
  const data = generateUniqueData(numRows);
  const csvHeaders = "Name,Age\n";
  const csvRows = data.map(row => `${row.name},${row.age}`).join("\n");
  
  fs.writeFileSync(filePath, csvHeaders + csvRows);
  console.log(`Generated CSV file with ${numRows} unique rows at ${filePath}`);
}

// Define the output file path
const outputFilePath = path.join(__dirname, 'unique_data.csv');

// Generate a CSV file with 1000 unique rows
generateCSV(outputFilePath, 1000);

const { exec } = require("child_process");

function exec_command(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
            } else if (stderr) {
                reject(`stderr: ${stderr}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

module.exports = { exec_command };

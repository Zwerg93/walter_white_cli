#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Einfacher Router für Subkommandos
const command = process.argv[2];
const projectName = process.argv[3];

if (command === 'new' && projectName) {
    const projectPath = path.join(process.cwd(), projectName);

    // Ordner erstellen
    fs.mkdirSync(projectPath, { recursive: true });

    // index.js erstellen und ausführen
    const indexPath = path.join(projectPath, 'index.js');
    fs.writeFileSync(indexPath, `console.log("Hello from ${projectName}");`);

    exec(`node ${indexPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(stdout);
    });

    console.log(`Project '${projectName}' created at ${projectPath}`);
} else {
    console.log('Usage: ww new "projectname"');
}

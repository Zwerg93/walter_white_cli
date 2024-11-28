#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// Utility-Funktion: Ordner erstellen
function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Ordner "${folderPath}" wurde erstellt.`);
    }
}

// Utility-Funktion: Datei erstellen
function createFile(filePath, content = '') {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Datei "${filePath}" wurde erstellt.`);
    }
}

// Frage an den Nutzer: Routing gewünscht?
function askUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

// Projekt-Setup
async function setupProject(basePath) {
    // Basisstruktur erstellen
    const folders = [
        path.join(basePath, 'src'),
        path.join(basePath, 'src', 'app'),
        path.join(basePath, 'src', 'app', 'components'),
        path.join(basePath, 'src', 'app', 'model'),
        path.join(basePath, 'src', 'app', 'service'),
    ];

    const files = {
        [path.join(basePath, 'webpack.config.js')]: `const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = env => ({
    entry: './src/index.ts',
    mode: "development",
    module: {
        rules: [
            {
                test: /\\.ts$/, // Testet auf TypeScript-Dateien
                use: [
                    {
                        loader: "ts-loader"
                    }
                ],
                exclude: /node_modules/,
            },
            { test:/\\.css$/, use:'css-loader' }
        ]
    },
    devtool: "cheap-source-map",
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle-[fullhash].js',
        path: path.resolve(__dirname, './dist'),
        publicPath: '/',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html"
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, '/'),
        },
        compress: true,
        historyApiFallback: {
            rewrites: [
                { from: /^\\/[^.]*$/, to: '/index.html' },
            ],
        },
        proxy: {
            '/api': 'http://localhost:8080',
        },
        port: 4200,
    },
})`,
        [path.join(basePath, 'tsconfig.json')]: `{
    "compilerOptions": {
      "outDir": "dist",
      "module": "esnext",
      "target": "es2018",
      "lib": ["es2017", "dom"],
      "moduleResolution": "node",
      "esModuleInterop": false,
      "allowSyntheticDefaultImports": true,
      "experimentalDecorators": true,
      "importHelpers": true,
      "sourceMap": true,
      "inlineSources": true,
      "rootDir": "./"
    },
    "exclude": [],
    "include": ["**/*.ts"]
}`,
        [path.join(basePath, 'README.md')]: '# Projekt README',
        [path.join(basePath, 'index.html')]: `<!DOCTYPE html>
<html lang="en">
<head>
    <script>
        document.write(\`<base href="${location.pathname}${location.pathname.endsWith('/') ? '' : '/'}"/>\`);
    </script>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Title</title>
</head>
<body>
    <app-component></app-component>
</body>
</html>`,
        [path.join(basePath, '.gitignore')]: `node_modules/
/src/app/components/
.DS_Store
Thumbs.db
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.env.*.local
package-lock.json
yarn.lock
dist/
build/
.vscode/
.idea/
*.iml
*.tmp
*.swp
*.bak
*.log
*.out
coverage/`,
        [path.join(basePath, 'src', 'index.ts')]: `import "./app/app-component";`,
        [path.join(basePath, 'src', 'app', 'app-component.ts')]: `import { html, render } from 'lit-html';
import './router-outlet';

class AppComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const template = html\`<router-outlet></router-outlet>\`;
        render(template, this.shadowRoot!);
    }
}

customElements.define('app-component', AppComponent);`,
    };

    // Ordner erstellen
    folders.forEach(createFolder);

    // Dateien erstellen
    for (const [filePath, content] of Object.entries(files)) {
        createFile(filePath, content);
    }

    console.log('Projektstruktur erfolgreich generiert!');
}

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
} else if (command === 'setup') {
    const basePath = process.cwd();
    setupProject(basePath).catch((error) => console.error('Fehler:', error));
} else {
    console.log('Usage: ww new "projectname" | ww setup');
}

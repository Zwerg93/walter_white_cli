#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// Utility-Funktion: Ordner erstellen
function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, {recursive: true});
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
        input: process.stdin, output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
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
async function setupProject() {
    const basePath = process.cwd();

    // Basisstruktur erstellen
    const folders = [path.join(basePath, 'src'), path.join(basePath, 'src', 'app'), path.join(basePath, 'src', 'app', 'components'), path.join(basePath, 'src', 'app', 'model'), path.join(basePath, 'src', 'app', 'service'),];


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
            {test:/\\.css$/, use:'css-loader'}
        ]
    },
    devtool: "cheap-source-map",
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle-[fullhash].js',
        path: path.resolve(__dirname, './dist'),
        publicPath: '/', // Wichtig: Root-Path setzen
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
                { from: /^\\/[^.]*$/, to: '/index.html' }, // Nur "clean URLs" an index.html umleiten
            ],
        },
        proxy: {
            '/api': 'http://localhost:8080',
        },
        port: 4200,
    },
})`, [path.join(basePath, 'tsconfig.json')]: `{
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
    }`, [path.join(basePath, 'register.js')]: `/**
 * Overrides the tsconfig used for the app.
 * In the test environment we need some tweaks.
 */

const tsNode = require('ts-node')
const testTSConfig = require('./test/tsconfig.json')

tsNode.register({
  files: true,
  transpileOnly: true,
  project: './test/tsconfig.json'
})
`, [path.join(basePath, 'README.md')]: '# Projekt README', [path.join(basePath, 'index.html')]: `<!DOCTYPE html>
<html lang="en">
<head>
    <script>
        document.write(\`<base href="\${location.pathname}\${location.pathname.endsWith('/') ? '' : '/'}"/>\`);
    </script>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Title</title>
</head>
<body>
    <app-component></app-component>
</body>
</html>`, [path.join(basePath, 'generate-component.js')]: `const fs = require('fs');
const path = require('path');

const componentName = process.argv[2];

if (!componentName) {
    console.error('Usage: npm run generate <componentName>');
    process.exit(1);
}

const componentFolderPath = path.join(__dirname, 'src', 'app', 'components', componentName);

try {
    // Erstelle den Ordner für die Komponente
    fs.mkdirSync(componentFolderPath +  "-component");

    // Erstelle die Dateien in der Komponente
    const indexContent = \`import "./\${componentName}-component";\`;
    fs.writeFileSync(path.join(componentFolderPath +  "-component", 'index.ts'), indexContent);

    const cssContent = \`/* Styles for \${componentName} component */\`;
    fs.writeFileSync(path.join(componentFolderPath +  "-component", 'style.css'), cssContent);

    const componentContent = \\\`
    import { html, render } from "lit-html";
    import style from './style.css'
    
    const template = html\`
        <div class="\${componentName}">
            <!-- Content -->
        </div>
    \\\`;
    
    class \${capitalizeFirstLetter(componentName)} extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({mode: "open"});
        }
        connectedCallback() {
            this.render();
        }
        private render() {
            const styleTag = document.createElement('style');
            styleTag.textContent = style; // Hier wird der CSS-Inhalt eingefügt
            this.shadowRoot.appendChild(styleTag);
            
            render(template, this.shadowRoot);
        }
    }
    customElements.define("\${componentName}-component", \${capitalizeFirstLetter(componentName)});
    \`;

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    fs.writeFileSync(path.join(componentFolderPath +  "-component", \`\${componentName}-component.ts\`), componentContent);

    console.log(\`Komponente \${componentName} wurde erfolgreich generiert.\`);
} catch (error) {
    console.error('Fehler beim Generieren der Komponente:', error);
}
`, [path.join(basePath, '.gitignore')]: `# Node modules
        node_modules/
        
        # Alles unter ./src/app/components/
        /src/app/components/
        
        # Betriebssystem-spezifische Dateien
        .DS_Store
        Thumbs.db
        
        # Log-Dateien
        npm-debug.log*
        yarn-debug.log*
        yarn-error.log*
        
        # Umgebungskonfigurationsdateien
        .env
        .env.local
        .env.*.local
        
        # Abhängigkeiten für den Paketmanager
        package-lock.json
        yarn.lock
        
        # Build-Ordner
        dist/
        build/
        
        # IDE-/Editor-spezifische Dateien
        .vscode/
        .idea/
        *.iml
        
        # Temporäre Dateien
        *.tmp
        *.swp
        *.bak
        *.log
        *.out
        
        # Sonstige Dateien
        coverage/
        `, [path.join(basePath, 'src', 'index.ts')]: `
import "./app/app-component"

`, [path.join(basePath, 'src', 'app', 'app-component.ts')]: `import {html, render} from 'lit-html';
import './router-outlet';

class AppComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        const template = html\`<router-outlet></router-outlet>\`;
        render(template, this.shadowRoot!);
    }
}

customElements.define('app-component', AppComponent);
`,
    };

    // Ordner erstellen
    folders.forEach(createFolder);

    // Dateien erstellen
    for (const [filePath, content] of Object.entries(files)) {
        createFile(filePath, content);
    }

    // Optional: Routing-Dateien hinzufügen
    const useRouting = await askUser('Möchtest du Routing hinzufügen? (y/n): ');

    if (useRouting) {
        createFile(path.join(basePath, 'src', 'app', 'global.d.ts'), `declare module '*.css' {
    const content: string;
    export default content;
}
`);
        createFile(path.join(basePath, 'src', 'app', 'router-outlet.ts'), `import {LitElement, html} from 'lit';
import {property} from 'lit/decorators.js';

interface Route {
    path: string;
    component: string;
}


class RouterOutlet extends LitElement {
    @property({type: String}) currentRoute: string = window.location.pathname;

    static routes: Route[] = [
        {path: '/seli', component: 'seli-component'},
        {path: '/mazzl', component: 'mazzl-component'},
       
    ];

    constructor() {
        super();
        this.setupInitialRoute();
        window.addEventListener('popstate', () => {
            this.currentRoute = window.location.pathname;
            this.requestUpdate();
        });
    }


    private setupInitialRoute() {
        const initialPath = window.location.pathname;
        const route = RouterOutlet.routes.find(r => r.path === initialPath);

        if (!route) {
            this.navigate('/'); // Zurück zur Startseite, wenn Route nicht existiert
        } else {
            this.currentRoute = initialPath; // Korrekte Initialroute setzen
        }
    }

    navigate(path: string) {
        if (this.currentRoute !== path) {
            window.history.pushState({}, '', path);
            this.currentRoute = path;
            this.requestUpdate();
        }

        // Scrollen auf den Anfang der Seite, falls gewünscht
        window.scrollTo(0, 0);
    }

    private onNavigate(event: Event) {
        event.preventDefault();
        const target = event.target as HTMLElement;

        // Suche den \`href\`-Link in A-Tag oder Parent-Nodes
        const link = target.closest('a');
        const path = link?.getAttribute('href');

        if (path) {
            this.navigate(path);
        }
    }

    render() {
        const route = RouterOutlet.routes.find(r => r.path === this.currentRoute);
        const ComponentTag = route ? route.component : 'not-found-component';

        return html\`
            <nav @click=\${this.onNavigate}>
                <a href="/seli">Say my name</a>
                <a href="/mazzl">Marcel</a>
            </nav>
            <div id="outlet"></div>
        \`;
    }

    updated() {
        const outlet = this.shadowRoot?.querySelector('#outlet');
        if (outlet) {
            outlet.innerHTML = '';

            const route = RouterOutlet.routes.find(r => r.path === this.currentRoute);
            const ComponentTag = route ? route.component : 'not-found-component';

            if (!customElements.get(ComponentTag)) {
                import(\`./components/\${ComponentTag}\`)
                    .then(() => {
                        const element = document.createElement(ComponentTag);
                        outlet.appendChild(element);
                    })
                    .catch(err => console.error(\`Failed to load component \${ComponentTag}\`, err));
            } else {
                const element = document.createElement(ComponentTag);
                outlet.appendChild(element);
            }
        }
    }
}

customElements.define('router-outlet', RouterOutlet);
`);
    }

    console.log('Projektstruktur erfolgreich generiert!');
}

// Einfacher Router für Subkommandos
const command = process.argv[2];
const projectName = process.argv[3];

if (command === 'new' && projectName) {

    const basePath = process.cwd();
    setupProject(basePath).catch((error) => console.error('Fehler:', error));
   
} else if (command === 'setup') {
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
    console.log('Usage: ww new "projectname" | ww setup');
}

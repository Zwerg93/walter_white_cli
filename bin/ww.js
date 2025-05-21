#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { log } = require('console');

// Utility-Funktion: create dir
function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

// Utility-Funktion: create data
function createFile(filePath, content = '') {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`created "${filePath}" `);
    }
}

// wanna use routing?
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


// project-setup
async function setupProject() {
    const basePath = path.join(process.cwd(), projectName);
    // create base structur
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
})`,
        [path.join(basePath, 'package.json')]: `
{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "generate": "node generate-component.js",
    "start": "webpack serve",
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "build": "webpack build && gulp optimize"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@istanbuljs/nyc-config-typescript": "^1.0.2",
    "@testdeck/mocha": "^0.3.3",
    "@types/chai": "^4.3.4",
    "chai": "^4.3.7",
    "file-loader": "^6.2.0",
    "gulp": "^5.0.0",
    "gulp-clean-css": "^4.3.0",
    "gulp-cssnano": "^2.1.3",
    "gulp-htmlmin": "^5.0.1",
    "gulp-imagemin": "^9.1.0",
    "gulp-terser": "^2.1.0",
    "gulp-uglify": "^3.0.2",
    "html-webpack-plugin": "^5.5.0",
    "htmlmin": "^0.0.7",
    "mocha": "^10.2.0",
    "nyc": "^15.1.0",
    "sass": "^1.81.0",
    "sass-loader": "^16.0.3",
    "ts-loader": "^9.4.1",
    "ts-mockito": "^2.6.1",
    "ts-node": "^10.9.1",
    "typescript": "^4.8.4",
    "web-cli": "^1.0.0-prealpha",
    "webpack": "^5.96.1",
    "webpack-cli": "^4.10.0",
    "webpack-dev-server": "^4.11.1"
  },
  "bin": {
    "ww": "./bin/ww.js"
  },
  "dependencies": {
    "css-loader": "^7.1.2",
    "immer": "^9.0.16",
    "lit": "^3.2.1",
    "lit-html": "^2.4.0",
    "rxjs": "^7.5.7",
    "style-loader": "^4.0.0"
  }
}
`,
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
        [path.join(basePath, 'register.js')]: `/**
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
`,
        [path.join(basePath, 'README.md')]: '# Projekt README',
        [path.join(basePath, 'index.html')]: `<!DOCTYPE html>
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
</html>`,
        [path.join(basePath, 'generate-component.js')]: `const fs = require('fs');
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

    const componentContent = \`
    import { html, render } from "lit-html";
    import style from './style.css'
    
    const template = html\\\`
        <div class="\${componentName}">
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

    console.log(\`\${componentName} was generated successfully.\`);
} catch (error) {
    console.error('Error generating the component:', error);
}
`,
        [path.join(basePath, '.gitignore')]: `# Node modules
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
        www/
        
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
        `,
        [path.join(basePath, 'src', 'index.ts')]: `
import "./app/app-component"

`,
        [path.join(basePath, 'gulpfile.js')]: `const gulp = require('gulp');

async function optimizeImages() {
    const imagemin = await import('gulp-imagemin');
    return gulp.src('dist/*.{jpg,jpeg,png,webp}')
        .pipe(imagemin.default())
        .pipe(gulp.dest('www'));
}

async function optimizeJS() {
    const terser = require('gulp-terser');
    try {
        return gulp.src('dist/*.js')
            .pipe(terser())
            .pipe(gulp.dest('www'));
    } catch (error) {
        console.error("Error optimizing JS:", error);
        // Optional: Force a stream to end
        return Promise.resolve();
    }
}

async function optimizeCSS() {
    const cleanCSS = await import('gulp-clean-css');
    return gulp.src('dist/*.css')
        .pipe(cleanCSS.default())
        .pipe(gulp.dest('www')); // Zielordner bleibt www
}

async function optimizeHTML() {
    const htmlmin = await import('gulp-htmlmin');
    return gulp.src('dist/index.html') // Index-HTML-Datei aus dist
        .pipe(htmlmin.default({ collapseWhitespace: true, removeComments: true })) // HTML optimieren
        .pipe(gulp.dest('www')); // Zielordner bleibt www
}

// Optimierungs-Aufgabe
gulp.task('optimize', gulp.series(optimizeJS, optimizeCSS, optimizeHTML, optimizeImages)); // optimizeImages hinzugefügt

// Watch-Task
gulp.task('watch', () => {
    gulp.watch('dist/*.js', optimizeJS);
    gulp.watch('dist/*.css', optimizeCSS);
    gulp.watch('dist/index.html', optimizeHTML); // HTML überwachen
    gulp.watch('dist/*.{jpg,jpeg,png,webp}', optimizeImages); // Bilder überwachen
});

// Standard-Task
gulp.task('default', gulp.series('optimize', 'watch'));
`,
        [path.join(basePath, 'robots.txt')]: `User-agent: *
Disallow:

Sitemap: https://deinehandwerker.net/sitemap.xml
`,
        [path.join(basePath, 'sitemap.xml')]: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://deinehandwerker.net/</loc>
        <lastmod>2025-02-13</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://deinehandwerker.net/gartenpflege</loc>
        <lastmod>2025-02-13</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://deinehandwerker.net/reinigung</loc>
        <lastmod>2025-02-13</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://deinehandwerker.net/hausmeisterdienst</loc>
        <lastmod>2025-02-13</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://deinehandwerker.net/kontakt</loc>
        <lastmod>2025-02-13</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://deinehandwerker.net/impressum</loc>
        <lastmod>2025-02-13</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.6</priority>
    </url>
</urlset>
`
    };


    // create directory
    folders.forEach(createFolder);

    // create files
    for (const [filePath, content] of Object.entries(files)) {
        createFile(filePath, content);
    }

    // optional: add Routing-files
    const useRouting = await askUser('Do you wannt to add routing? (y/n): ');

    if (useRouting) {

        createFile(path.join(basePath, 'src', 'app', 'app-component.ts'), `import {html, render} from 'lit-html';
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
        {path: '/', component: 'home-component'},
       
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
            // Wenn die initiale Route nicht "/" ist und nicht existiert, navigiere zu "/"
            if (initialPath !== '/') {
                this.navigate('/'); 
            } else {
                 // Wenn es "/" ist und nicht explizit definiert, aber eine home-component erwartet wird.
                this.currentRoute = initialPath; // Korrekte Initialroute setzen
            }
        } else {
            this.currentRoute = initialPath; // Korrekte Initialroute setzen
        }
    }

    navigate(path: string) {
        if (this.currentRoute !== path) {
            window.history.pushState({}, '', path);
            this.currentRoute = path;
            this.requestUpdate(); // Fordert ein Update an, updated() wird aufgerufen
        }
        window.scrollTo(0, 0);
    }

    private onNavigate(event: Event) {
        event.preventDefault();
        const target = event.target as HTMLElement;
        const link = target.closest('a');
        const path = link?.getAttribute('href');

        if (path) {
            this.navigate(path);
        }
    }

    render() {
        // Die Navigationslogik ist jetzt in onNavigate, hier wird nur das Menü gerendert.
        // Das dynamische Laden des Inhalts geschieht in updated().
        return html\`
            <nav @click=\${this.onNavigate}>
                <a href="/">Home</a>
                </nav>
            <div id="outlet"></div>
        \`;
    }

    updated(changedProperties) { // changedProperties ist ein Map-Objekt
        super.updated(changedProperties); // Wichtig für Lifecycle-Hooks von LitElement

        // Prüfen, ob sich currentRoute geändert hat oder es das erste Rendering ist
        if (changedProperties.has('currentRoute') || !this.shadowRoot?.querySelector('#outlet')?.hasChildNodes()) {
            const outlet = this.shadowRoot?.querySelector('#outlet');
            if (outlet) {
                outlet.innerHTML = ''; // Alten Inhalt leeren

                const route = RouterOutlet.routes.find(r => r.path === this.currentRoute);
                const ComponentTag = route ? route.component : 'notfound-component'; // Fallback zu not-found

                // Dynamischer Import und Erstellung der Komponente
                if (!customElements.get(ComponentTag)) {
                    // Wichtig: Der Pfad zum Komponenten-Bundle muss korrekt sein.
                    // Annahme: Komponenten liegen in './components/' und werden als 'component-name.ts' oder ähnlich gebündelt.
                    // Der Import-Pfad muss ggf. angepasst werden, je nachdem wie Webpack die Komponenten bündelt.
                    // Normalerweise würde man hier direkt den Dateinamen importieren, z.B. './components/home-component.js'
                    // Da generate-component.js Ordner mit "-component" am Ende erstellt, muss dies berücksichtigt werden.
                    import(\`./components/\${ComponentTag}/\${ComponentTag}.js\`) // Pfad anpassen, falls nötig
                        .then(() => {
                            const element = document.createElement(ComponentTag);
                            outlet.appendChild(element);
                        })
                        .catch(err => {
                            console.error(\`Failed to load component \${ComponentTag} for route \${this.currentRoute}\`, err);
                            // Fallback, wenn Komponente nicht geladen werden kann
                            if (ComponentTag !== 'notfound-component' && customElements.get('notfound-component')) {
                                const notFoundElement = document.createElement('notfound-component');
                                outlet.appendChild(notFoundElement);
                            } else if (ComponentTag !== 'notfound-component') {
                                outlet.innerHTML = '<p>Error loading page content. Not found component is also missing.</p>';
                            }
                        });
                } else {
                    const element = document.createElement(ComponentTag);
                    outlet.appendChild(element);
                }
            }
        }
    }
}

customElements.define('router-outlet', RouterOutlet);
`);

    } else {
        console.log("creating with no routing")

        createFile(path.join(basePath, 'src', 'app', 'app-component.ts'), `import {html, render} from "lit-html"

// Stellen Sie sicher, dass home-component einen Standardexport hat oder hier korrekt importiert wird
// z.B. wenn home-component.ts dies exportiert: export class HomeComponent extends HTMLElement { ... }
// und in src/app/components/home-component/index.ts steht: import './home-component';
import "./components/home-component/index"; // Korrekter Import basierend auf der Struktur von generate-component.js

const template = html\`
    <home-component></home-component>
\`

class AppComponent extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: "open"})
    }

    connectedCallback() {
        console.log("app component connected")
        this.render()
    }

    private render() {
        render(template, this.shadowRoot)
    }
}

customElements.define("app-component", AppComponent)`);


    }
    createFile(path.join(basePath, 'src', 'app', 'global.d.ts'), `declare module '*.css' {
        const content: string;
        export default content;
    }
    `);

    console.log('Done creating project structure');
    console.log('To get started:');
    console.log(`cd ${projectName}`);
    console.log('npm install');
    console.log('npm start');
    console.log('To generate a new component: npm run generate your-component-name');

}

//
const command = process.argv[2];
const projectName = process.argv[3];

if (command === 'new' && projectName) {

    const basePath = process.cwd();
    setupProject(basePath).catch((error) => console.error('Fehler:', error));

} else {
    console.log('Usage: ww new "projectname"');
}
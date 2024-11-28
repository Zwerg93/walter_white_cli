# Web Project CLI Tool

This CLI tool simplifies the setup and management of web projects by automating the creation of project structures, files, and configurations. The tool is globally installable and provides commands similar to Angular's CLI.

## Features

- **Project Initialization**: Quickly create a new project with a pre-configured structure.
- **Component Generation**: Add new components with a single command.
- **Routing Support**: Optional routing setup based on Lit-HTML.
- **Webpack Integration**: Development server and build configuration included.
- **Customizable**: Adjust the generated files to suit your needs.

## Installation

To use this tool globally, install it via npm:

```bash
npm install -g @codingcat2202/walter_white_cli
```

## Commands

### Create a New Project

```bash
ww new {projectnam}
```

- Creates a new project with the specified name.
- Generates the following folder structure:
  ```plaintext
  projectname/
  |-- src/
  |   |-- app/
  |       |-- components/
  |       |-- model/
  |       |-- service/
  |   |-- index.ts
  |-- package.json
  |-- webpack.config.js
  |-- tsconfig.json
  |-- index.html
  |-- .gitignore
  |-- README.md
  ```

### Add Routing

During project creation, you will be prompted:

```
Do you want to add routing? (y/n):
```

- Selecting `y` will add routing support with predefined files, including `router-outlet.ts` and `global.d.ts`.

### Generate a Component

```bash
npm run generate {componentName}
```

- Creates a new component in the `src/app/components` folder.
- Example:
  ```bash
  npm run generate my-component
  ```
  This generates:
  ```plaintext
  my-component-component/
  |-- index.ts
  |-- style.css
  |-- my-component-component.ts
  ```


## Development

The generated project comes with:

- **Development Server**: Start the server with:
  ```bash
  npm start
  ```
- **Build Script**: Bundle the project with:
  ```bash
  npm run build
  ```
- **TypeScript Configuration**: A `tsconfig.json` file tailored for the project.
- **Testing Support**: Includes Mocha, Chai, and related dependencies.

## File Overview

### Key Files

- **webpack.config.js**: Configures Webpack for development and production.
- **tsconfig.json**: TypeScript compiler settings.
- **generate-component.js**: Script for generating new components.
- **index.html**: Base HTML file.

### .gitignore

Predefined to exclude:

- `node_modules/`
- Build files (`dist/`, `build/`)
- IDE-specific files (e.g., `.vscode/`, `.idea/`)

## Dependencies

### Development Dependencies

- Webpack and Webpack Dev Server
- TypeScript and ts-loader
- Mocha and Chai for testing

### Runtime Dependencies

- `lit` and `lit-html` for UI components
- `rxjs` for reactive programming

## License

This project is licensed under ISC.
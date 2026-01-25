# Meshtastic powered Vue

 Alternative Meshtastic powered web client based on Vue web framework.

## Disclaimer

This monorepo does not represent the official [Meshtastic](https://meshtastic.org) [web interface](https://github.com/meshtastic/meshtastic-web).

## Technology

This monorepo leverages the following technologies:

- **Runtime:** pnpm
- **Javascript Framework:** Vue + Vueuse + Primevue
- **Styling:** Tailwind CSS
- **Bundling:** Vite
- **Language:** TypeScript

## Getting Started

### Prerequisites

You'll need to have [pnpm](https://pnpm.io/) installed to work with this monorepo. Follow the installation instructions on their home page.

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mictronics/meshtastic-powered-vue.git
   cd meshtastic-powered-vue
   ```
2. **Install dependencies for all packages:**
   ```bash
   pnpm install
   ```
   This command installs all necessary dependencies for all packages within the
   monorepo.
3. **Install the Buf CLI**
    Required for building `packages/protobufs`
    [Install the Buf CLI](https://buf.build/docs/cli/installation/#install-the-buf-cli)
4. **Build all packages**
   ```bash
   pnpm run build:all
   ```
   This command will build all included packages.

### Web application development

1. **Change into the web package**
   ```bash
   cd packages/web
   ```
2. **Build the web package**
   ```bash
   pnpm run build
   ```
3. **Run the development server**
   ```bash
   pnpm run dev
   ```
## Demo

A first [demo](https://www.mictronics.de/webclient/), based on release v0.5.1, is available for testing.

Preview and screenshots at [mictronics.de](https://www.mictronics.de/posts/Meshtastic-Powered-Vue/).

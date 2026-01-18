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
   git clone https://github.com/meshtastic/meshtastic-web.git
   cd meshtastic-web
   ```
2. **Install dependencies for all packages:**
   ```bash
   pnpm install
   ```
   This command installs all necessary dependencies for all packages within the
   monorepo.
3. **Install the Buf CLI**
    Required for building `packages/protobufs`
    https://buf.build/docs/cli/installation/


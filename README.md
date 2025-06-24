# Dressipi SDK

A TypeScript SDK for integrating Dressipi services into React Native and Expo applications.

## Installation

```bash
npm install dressipi-sdk
```

or

```bash
yarn add dressipi-sdk
```

## Usage

```typescript
import DressipiSDK from 'dressipi-sdk';

// Initialize the SDK
const sdk = new DressipiSDK();
sdk.initialize();
```

## Features

- 🔧 TypeScript support
- 📱 React Native and Expo compatible
- 🚀 Modern ES6+ syntax
- 📦 Tree-shakable exports
- 🔍 Full type definitions

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Scripts

- `npm run build` - Build the package
- `npm run dev` - Build in watch mode
- `npm run lint` - Run ESLint with auto-fix
- `npm run lint:check` - Run ESLint without auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Clean build directory

### Code Quality

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Automatic import sorting** and formatting on save

## License

MIT

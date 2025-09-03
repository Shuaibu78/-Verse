# πVerse Monorepo

A procedural infinite world exploration game built with React, Three.js, and advanced AI systems.

## 🏗️ Monorepo Structure

```
piverse-monorepo/
├── packages/
│   ├── game-engine/          # Core game logic and systems
│   │   ├── src/
│   │   │   ├── logic/        # Game logic (AI, terrain, survival, etc.)
│   │   │   ├── store/        # State management (Zustand stores)
│   │   │   └── index.ts      # Main exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web-app/              # React web application
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── assets/       # Static assets
│   │   │   └── main.tsx      # App entry point
│   │   ├── public/           # Public assets
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── shared/               # Shared utilities and types
│       ├── src/
│       │   └── index.ts      # Common utilities
│       ├── package.json
│       └── tsconfig.json
│
├── package.json              # Root workspace configuration
└── README.md
```

## 🎮 Features

### Game Engine (`@piverse/game-engine`)
- **Procedural Generation**: π-based terrain and world generation
- **AI Systems**: Advanced creature behavior with emergent patterns
- **Survival Mechanics**: Weather, shelter, food systems
- **Multiplayer**: Real-time collaboration and world sharing
- **Research Tools**: Performance benchmarking and algorithm testing

### Web App (`@piverse/web-app`)
- **3D Rendering**: Three.js with React Three Fiber
- **UI/UX**: Framer Motion animations and responsive design
- **Game Modes**: Exploration, survival, research, photo, multiplayer
- **Performance**: Chunked terrain, instanced rendering, adaptive resolution

### Shared (`@piverse/shared`)
- **Utilities**: Common math, color, and helper functions
- **Types**: Shared TypeScript interfaces
- **Constants**: Game-wide constants and configurations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Yarn 1.22+

### Installation
```bash
# Install all dependencies
yarn install

# Build all packages
yarn build

# Start development server
yarn dev
```

### Development Commands

```bash
# Start web app development server
yarn dev

# Build specific packages
yarn build:engine    # Build game engine
yarn build:shared    # Build shared utilities
yarn build:web       # Build web app

# Watch mode for packages
yarn dev:engine      # Watch game engine changes
yarn dev:shared      # Watch shared utilities

# Clean all builds
yarn clean

# Lint all packages
yarn lint
```

## 📦 Package Details

### Game Engine
The core game logic package containing:
- **Terrain Generation**: Chunked LOD system with π-based seeds
- **AI Behavior**: Creature interactions and emergent patterns
- **Survival Systems**: Weather effects, shelter, food mechanics
- **Multiplayer**: Session management and world sharing
- **State Management**: Zustand stores for game state

### Web App
The React application featuring:
- **3D Scene**: Three.js rendering with React Three Fiber
- **UI Components**: Game HUD, menus, and controls
- **Performance**: Optimized rendering and memory management
- **Responsive**: Mobile and desktop support

### Shared
Common utilities and types:
- **Math Functions**: Vector operations, interpolation, clamping
- **Color Utilities**: Hex/RGB conversion and manipulation
- **Constants**: Game-wide values and configurations

## 🎯 Game Modes

1. **Exploration**: Free roam with collectibles and objectives
2. **Survival**: Weather effects, hunger, shelter mechanics
3. **Research**: Performance monitoring and algorithm testing
4. **Photo**: High-resolution screenshot capture with effects
5. **Multiplayer**: Real-time collaboration and world sharing

## 🔧 Architecture

- **Monorepo**: Yarn workspaces for package management
- **TypeScript**: Full type safety across all packages
- **Modular**: Clean separation of concerns
- **Scalable**: Easy to add new packages and features
- **Performance**: Optimized for 60fps rendering

## 📚 Documentation

Each package contains its own documentation:
- `packages/game-engine/README.md` - Game engine API
- `packages/web-app/README.md` - Web app setup
- `packages/shared/README.md` - Shared utilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
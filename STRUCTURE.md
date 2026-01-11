# AI Assistant — Project Structure

## Overview

This document outlines the complete project structure for the AI Assistant platform.

## Root Structure

```
ai-assistant/
├── frontend/              # 3D Orchestrator (React + Three.js)
├── guardian-ai/           # Fall Detection System
├── visualky/              # Visual Intelligence Assistant
├── docker-compose.yml     # Container orchestration
├── nginx.conf            # Reverse proxy configuration
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

## Frontend Structure (Detailed)

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── AICore.tsx       # Central 3D brain component
│   │   ├── FeatureNode.tsx  # Orbiting AI module nodes
│   │   ├── ParticleRing.tsx # Particle system effects
│   │   ├── Scene.tsx        # Three.js scene orchestrator
│   │   └── VoiceCommand.tsx # Voice navigation component
│   │
│   ├── pages/               # Route pages
│   │   ├── Landing.tsx      # 3D landing experience
│   │   └── SystemProxy.tsx  # AI system iframe integration
│   │
│   ├── shaders/             # GLSL shaders
│   │   ├── coreGlow.frag    # Core glow fragment shader
│   │   └── nodeParticles.vert # Node particle vertex shader
│   │
│   ├── store/               # State management
│   │   └── appStore.ts      # Zustand global store
│   │
│   ├── utils/               # Utilities
│   │   ├── constants.ts     # Configuration constants
│   │   └── helpers.ts       # Helper functions
│   │
│   ├── styles/              # Global styles
│   │   └── global.css       # CSS variables and base styles
│   │
│   ├── App.tsx              # Root application component
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts        # Vite type definitions
│
├── public/                  # Static assets
│   └── (assets)
│
├── Dockerfile               # Production container
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Component Hierarchy

```
App
├── Router
│   ├── Landing (/)
│   │   ├── Scene
│   │   │   ├── AICore
│   │   │   ├── FeatureNode (Guardian)
│   │   │   └── FeatureNode (Visualky)
│   │   └── VoiceCommand
│   │
│   ├── SystemProxy (/guardian)
│   │   └── iframe → Guardian AI
│   │
│   └── SystemProxy (/visualky)
│       └── iframe → Visualky
```

## Data Flow

```
User Interaction
    ↓
Voice Command / Click
    ↓
Zustand Store (appStore)
    ↓
React Router Navigation
    ↓
GSAP Camera Animation
    ↓
Page Transition
    ↓
System Loaded (iframe/proxy)
```

## State Management

### Global State (Zustand)

- `currentSystem`: Current active AI system
- `isTransitioning`: Navigation transition state
- `voiceEnabled`: Voice command status
- `lastCommand`: Last recognized voice command
- `cameraAnimating`: 3D camera animation state
- `hoveredNode`: Currently hovered feature node

## Configuration Files

### constants.ts
- System definitions (Guardian, Visualky)
- Animation timings and easing
- Performance settings
- Voice command mappings

### helpers.ts
- Math utilities (lerp, clamp, mapRange)
- 3D helpers (orbital positions, random points)
- Performance utilities (debounce, WebGL detection)

## Styling Architecture

### CSS Variables (global.css)
- Color palette
- Spacing system
- Typography
- Transitions
- Shadows
- Z-index layers

### Component Styles
- Inline styles for Three.js materials
- CSS classes for UI overlays
- Responsive breakpoints

## Build & Deployment

### Development
```bash
npm run dev  # Port 5174
```

### Production
```bash
npm run build  # Creates optimized dist/
```

### Docker
```bash
docker-compose up  # Full platform
```

## Integration Points

### Guardian AI
- Port: 5001
- Protocol: HTTP/REST
- Integration: iframe or API proxy

### Visualky
- Port: 5173
- Protocol: HTTP/REST
- Integration: iframe or API proxy

## Performance Optimizations

1. **Code Splitting**: Vendor chunks separated
2. **Tree Shaking**: Unused code removed
3. **Lazy Loading**: Routes loaded on demand
4. **Instanced Rendering**: Particles use instancing
5. **Post-processing**: Conditional based on device tier

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- Reduced motion support
- High contrast mode ready

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Naming Conventions

- **Components**: PascalCase (e.g., `AICore.tsx`)
- **Utilities**: camelCase (e.g., `helpers.ts`)
- **Styles**: kebab-case (e.g., `global.css`)
- **Constants**: UPPER_SNAKE_CASE in files

## Next Steps

1. ✅ Project structure created
2. ⏳ Implement 3D components
3. ⏳ Add routing and navigation
4. ⏳ Integrate AI systems
5. ⏳ Add voice commands
6. ⏳ Polish and optimize

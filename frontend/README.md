# CAR COLLECTORS Frontend

Premium Die-Cast Model Car E-Commerce Platform - React Frontend

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

## Installation

### 1. Install Node.js

Download and install Node.js from: https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- **State Management**: Zustand
- **Styling**: Tailwind CSS with custom CAR COLLECTORS theme
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with JWT interceptors
- **Testing**: Vitest, React Testing Library, Cypress, fast-check

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
VITE_API_BASE_URL=http://localhost:8000/v1
VITE_ENV=development
```

### Tailwind CSS Theme

The custom CAR COLLECTORS theme is configured in `tailwind.config.js`:

- **Deep Navy**: `#0f172a` (navy-900), `#1e293b` (navy-800), `#334155` (navy-700)
- **Electric Blue**: `#2563eb` (blue-600), `#3b82f6` (blue-500), `#60a5fa` (blue-400)
- **KTM Orange**: `#ea580c` (orange-500), `#c2410c` (orange-600)
- **Fonts**: Inter (body), Rajdhani (display)

## Development

### Start Development Server

```bash
npm run dev
```

Runs on http://localhost:3000

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Testing

### Unit Tests (Vitest)

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Cypress)

```bash
# Open Cypress UI
npm run cypress

# Run Cypress headless
npm run cypress:headless
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and axios config
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── test/             # Test setup and utilities
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles with Tailwind
├── cypress/              # E2E tests
├── public/               # Static assets
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── vitest.config.ts      # Vitest configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Key Features

### Axios Configuration (`src/api/axios.config.ts`)

- Automatic JWT token injection via request interceptor
- Automatic logout on 401 responses via response interceptor
- Configurable base URL via environment variables

### TypeScript Types

All API entities have complete type definitions:
- `user.types.ts`: User, Auth, Login, Register
- `product.types.ts`: Product, Category, Filters, Pagination
- `cart.types.ts`: Cart, CartItem
- `order.types.ts`: Order, OrderItem, DeliveryAddress, OrderStatus

### State Management Setup

Zustand stores will be created in `src/store/`:
- `authStore.ts`: Authentication and user state
- `cartStore.ts`: Shopping cart management
- `uiStore.ts`: UI state (modals, toasts, loading)

## Scripts Reference

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking
- `npm run test`: Run unit tests
- `npm run test:ui`: Run unit tests with UI
- `npm run test:coverage`: Run tests with coverage report
- `npm run cypress`: Open Cypress test runner
- `npm run cypress:headless`: Run Cypress tests headless

## Next Steps

1. Install dependencies: `npm install`
2. Start backend API on http://localhost:8000
3. Start frontend: `npm run dev`
4. Begin implementing pages and components per design spec

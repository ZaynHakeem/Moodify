# Moodify - Emotion-Based Playlist Generator

## Overview

Moodify is a full-stack web application that analyzes user mood through text input and generates personalized music playlists. Users describe how they're feeling in natural language, and the app uses machine learning to detect their emotional state (happy, sad, energetic, or calm), then recommends matching Spotify playlists. The application includes mood history tracking with visual charts to help users understand their emotional patterns over time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: Shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS using a "New York" theme variant. The design follows a dark-mode-first approach with mood-responsive theming that dynamically adjusts colors based on detected emotions.

**State Management**: TanStack Query (React Query) for server state management with optimistic updates and background refetching disabled to reduce API calls. Local component state managed with React hooks.

**Routing**: Wouter for lightweight client-side routing (single-page application with minimal routes)

**Typography**: Custom font configuration using Google Fonts (Outfit for headings, Inter for body text) to achieve a modern, music-focused aesthetic

**Design System Principles**:
- Mood-responsive interface that changes visual theming based on detected emotions
- Music-first hierarchy with album artwork and playlists as visual focal points
- Four distinct mood-based accent colors (Happy: amber/gold, Sad: deep blue, Energetic: coral-red, Calm: teal-green)
- Frictionless conversational text input rather than traditional form design

### Backend Architecture

**Runtime**: Node.js with Express.js server

**Language**: TypeScript with ES modules

**API Design**: RESTful endpoints with JSON payloads

**Key Endpoints**:
- `POST /api/mood/detect` - Accepts text input, returns mood prediction with confidence scores
- `GET /api/mood/playlists/:mood` - Returns curated playlists for a specific mood
- `GET /api/mood/history` - Retrieves historical mood sessions with optional date range and limit parameters

**ML Integration**: Python-based mood classifier executed via Node.js `child_process.execFile()`. The backend spawns a Python process that loads a pre-trained scikit-learn model and returns predictions as JSON.

**Session Management**: Mood detection results are stored with timestamps to enable historical tracking and trend visualization.

### Data Storage

**ORM**: Drizzle ORM for type-safe database operations

**Database**: PostgreSQL (configured via `@neondatabase/serverless` for Neon Database compatibility)

**Schema Design**:
- `users` table: Basic user authentication (id, username, password)
- `mood_sessions` table: Stores mood detection history (id, text, mood, confidence, alternative_moods array, created_at timestamp)

**Storage Abstraction**: `IStorage` interface with in-memory implementation (`MemStorage`) for development and testing. Production uses PostgreSQL with Drizzle ORM.

**Migration Strategy**: Drizzle Kit for schema migrations with `drizzle.config.ts` configuration pointing to `shared/schema.ts`

### Machine Learning Architecture

**Model Type**: Text classification using scikit-learn's Multinomial Naive Bayes with TF-IDF vectorization

**Training Pipeline** (`ml/train_model.py`):
- Hardcoded training dataset with labeled mood examples (expandable to external datasets)
- Preprocessing with NLTK (tokenization, stopword removal)
- TF-IDF feature extraction
- Multinomial Naive Bayes classifier
- Model serialization using joblib to `mood_classifier.pkl`

**Prediction Service** (`ml/predict.py`):
- Standalone Python script that loads the trained model
- Accepts text via command-line argument
- Returns JSON with primary mood, confidence score, and ranked alternative predictions
- Designed to be called from Node.js backend via subprocess execution

**Mood Categories**: Four emotions (happy, sad, energetic, calm) chosen to map clearly to music genres and energy levels

### Authentication & Session Management

**Current State**: Basic user schema exists but authentication flow is not fully implemented in the codebase

**Session Storage**: Connect-pg-simple for PostgreSQL-backed sessions (dependency installed but implementation pending)

## External Dependencies

### Spotify Integration

**SDK**: `@spotify/web-api-ts-sdk` for official TypeScript Spotify API client

**Authentication Flow**: OAuth 2.0 via Replit Connectors system
- Token management handled through Replit's connector API (`REPLIT_CONNECTORS_HOSTNAME`)
- Automatic token refresh using stored refresh tokens
- Client credentials retrieved from connector settings

**API Usage**:
- Search for playlists by mood-related keywords
- Retrieve playlist metadata (name, description, track count, cover images)
- Rate limiting considerations built into the client (SDK handles retry logic)

**Connector Requirements**:
- Requires Spotify connector to be configured in Replit environment
- Uses `REPL_IDENTITY` or `WEB_REPL_RENEWAL` tokens for authentication
- Retrieves access tokens, refresh tokens, and client IDs dynamically

### Third-Party Services

**Replit-Specific Integrations**:
- `@replit/vite-plugin-runtime-error-modal` - Development error overlay
- `@replit/vite-plugin-cartographer` - Code navigation assistance (dev only)
- `@replit/vite-plugin-dev-banner` - Development environment indicator

**Google Fonts**: Web fonts loaded from Google Fonts CDN (Architects Daughter, DM Sans, Fira Code, Geist Mono, Inter, Outfit)

**Recharts**: Data visualization library for mood history charts with responsive containers and customizable theming

### Build & Development Tools

**Package Manager**: npm with package-lock.json for deterministic builds

**Build Pipeline**:
- Client: Vite for fast HMR and optimized production builds
- Server: esbuild for bundling Node.js backend with ESM output
- TypeScript compilation checking via `tsc --noEmit`

**Development Server**: Vite dev server in middleware mode with HMR over HTTP server, allowing Express to handle API routes while Vite serves the frontend

**Production Build**: 
- Client assets compiled to `dist/public`
- Server bundle compiled to `dist/index.js`
- Static serving of client build in production mode

### Python Dependencies

**ML Libraries**:
- `scikit-learn` - Core machine learning (TF-IDF, Naive Bayes)
- `nltk` - Natural language processing (tokenization, stopwords)
- `pandas` - Data manipulation for training data (optional)
- `joblib` - Model serialization

**Execution Context**: Python scripts executed as subprocesses from Node.js with 10-second timeout and 512KB output buffer limits
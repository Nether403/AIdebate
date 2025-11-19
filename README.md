# AI Debate Arena

A cutting-edge platform for watching AI models engage in intellectually stimulating debates on diverse topics. Currently a beautifully designed interactive UI showcasing AI personas debating with dynamic scoring and real-time transcripts.

## Current Features

- **Interactive Debate Setup**: Select from multiple AI personas (Cleopatra, Sherlock Holmes, Yoda, Albert Einstein, Marie Curie) to set up debates
- **Dynamic Topic Selection**: Browse curated debate topics across categories (Humor, Lifestyle, Tech)
- **Real-Time Timer**: Track debate progress with visual time indicators and round-based timing
- **Live Scoring**: View debate scores for each participant with animated score gauges
- **Debate Transcript**: Watch message-by-message transcript of debates with export to markdown
- **Dark Mode**: Full dark mode support with seamless theme switching
- **Responsive Design**: Works across desktop and tablet devices
- **Customizable Settings**: Adjust temperature, enable/disable moderator, and toggle sudden death mode

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Validation**: AJV (JSON Schema Validation)
- **Build Tool**: Vite
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint

## Project Structure

```
src/
├── components/           # React components
│   ├── DebateOrchestrator.tsx    # Main orchestration component
│   ├── DebateTimer.tsx           # Timer display and controls
│   ├── DebateTranscript.tsx      # Message transcript display
│   ├── PersonaCard.tsx           # Persona selection card
│   ├── ScoreGauge.tsx            # Score visualization
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       ├── Select.tsx
│       ├── Slider.tsx
│       └── Toggle.tsx
├── hooks/               # Custom React hooks
│   ├── useDebateConfig.ts       # Load and validate configuration
│   ├── useDebateTimer.ts        # Timer state management
│   └── useLocalStorage.ts       # Persistent local storage
├── types/              # TypeScript type definitions
│   └── debate.ts       # Core debate-related types
├── utils/              # Utility functions
│   └── configValidator.ts       # JSON schema validation
├── config/             # Configuration files
│   └── debate_config.json       # Personas, topics, and settings
├── schemas/            # JSON schemas
│   └── debate_config.schema.json # Validation schema
└── __tests__/          # Test files
```

## Configuration

The app is configured via `src/config/debate_config.json` which includes:

- **Personas**: Define AI persona characteristics, points of view, voice settings, and debate templates
- **Topics**: Organize debate topics by category with multiple questions per category
- **Global Settings**: Configure voice provider, model provider, temperature ranges, and debate rules
- **Rounds**: Define debate structure (opening, rebuttal, closing) with time and word limits

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Testing

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Current Limitations

This is currently a **UI prototype** without live AI integration. The following are planned for future versions:

- No actual LLM API integration (debates don't generate real AI responses)
- Debates are simulated UI-only experience
- No data persistence (all settings stored in browser localStorage)
- No user authentication or accounts
- No debate history or analytics
- Transcript export is available but debates aren't saved
- Settings don't affect debate generation (no actual model selection)

## Next Steps

See [ROADMAP.md](./ROADMAP.md) for a detailed 4-phase plan to transform this into a fully functional LLM benchmarking platform with real AI debates, persistent storage, analytics, and research capabilities.

## Environment Variables

The app requires Supabase configuration (for future versions):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Contributing

This project is in active development. Check the roadmap for upcoming features and opportunities to contribute.

## License

All rights reserved.

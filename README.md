# PlantPulse

A production-ready web application for plant health monitoring using AI-powered image analysis.

## Features

- Capture or upload 3 images of a plant (Day 1, Day 3, Day 7)
- AI-powered plant health analysis
- Diagnosis with short-term prognosis
- 5-step care plan generation
- Health score (0-100%)
- Status indicators (healthy, warning, critical)
- Multi-language support (English/Spanish)
- Dark/light mode (auto-detect system preference)

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI Service**: Python + FastAPI
- **Database**: PostgreSQL + Prisma ORM

## Getting Started

See individual service READMEs for detailed setup instructions.

## Project Structure

```
PlantPulse/
├── frontend/          # React application
├── backend/           # Express API server
├── ai-service/        # Python AI microservice
└── docs/             # Documentation
```

## License

MIT

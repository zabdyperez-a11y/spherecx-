# SphereCX — Quality Assurance Platform for Call Centers

Open source QA management tool for call center teams. Score calls, track agent performance, and identify coaching opportunities.

## Features

- **Scorecard Builder** — Create custom evaluation criteria per team or campaign
- **Call Evaluations** — Score calls against scorecards, attach recordings or transcripts
- **Agent Profiles** — Track performance trends over time
- **Team Dashboards** — Pass rates, score trends, calibration reports
- **Role-Based Access** — QA Analyst, Team Lead, Agent (read-only)

## Tech Stack

- [Next.js 14](https://nextjs.org/) — App router, SSR
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Prisma](https://www.prisma.io/) + PostgreSQL — Database
- [NextAuth.js](https://next-auth.js.org/) — Authentication
- [Supabase Storage](https://supabase.com/) — Call recordings

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) Supabase account for file storage

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/spherecx.git
cd spherecx
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Database Setup

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
/app               # Next.js app router pages
  /dashboard       # Main dashboard
  /evaluations     # Call evaluation forms
  /scorecards      # Scorecard management
  /agents          # Agent profiles
  /reports         # Analytics & exports
/components        # Shared UI components
/lib               # DB client, auth config, utilities
/prisma            # Database schema & migrations
```

## Roadmap

- [ ] Scorecard builder UI
- [ ] Evaluation form with scoring
- [ ] Agent performance dashboard
- [ ] Export to PDF/CSV
- [ ] AI auto-scoring via Whisper + Claude
- [ ] Dispute/appeal workflow

## Contributing

Pull requests welcome. Please open an issue first to discuss significant changes.

## License

MIT

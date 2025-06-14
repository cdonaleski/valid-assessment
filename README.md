# VALID Assessment Platform

A web-based assessment platform for evaluating decision-making styles and providing personalized feedback. Built with Node.js, Express, and Supabase, it offers interactive assessments, real-time scoring, and robust reporting features.

---

## Features

- **Interactive Assessment Interface**: User-friendly, step-by-step assessment flow.
- **Real-Time Scoring & Analysis**: Instant feedback and persona calculation.
- **PDF Report Generation**: Downloadable, professional reports.
- **Offline Support**: Local storage for in-progress assessments.
- **Secure Data Handling**: Supabase integration for secure storage.
- **Dev Mode**: Toggleable debug panel and test data generation for developers.

---

## Directory Structure

```
valid-assessment/
├── css/                # Stylesheets (main, components, debug, layout, etc.)
├── img/                # Image assets
├── js/                 # JavaScript source files
│   ├── assessment-controller.js   # Main assessment logic and UI control
│   ├── scoring.js                # Scoring and persona calculation
│   ├── reports.js                # PDF report generation
│   ├── logger.js                 # Debug panel and logging
│   ├── supabase-client.js        # Supabase integration
│   ├── ...                       # Other modules (state, utils, etc.)
├── supabase/           # Supabase config and migrations
│   ├── migrations/              # SQL migration scripts
│   └── config.toml              # Supabase project config
├── index.html          # Main assessment page
├── results.html        # Results/report page
├── admin.html          # Admin dashboard
├── dev-server.js       # Development server (with live reload)
├── simple-server.js    # Simple static server
├── package.json        # Project metadata and scripts
├── vercel.json         # Vercel deployment config
└── README.md           # Project documentation
```

---

## Setup & Usage

### 1. Clone the repository
```bash
git clone https://github.com/cdonaleski/valid-assessment.git
cd valid-assessment
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VALID_ENV=development
```

### 4. Start the development server
```bash
npm run dev
```
Visit [http://localhost:8000](http://localhost:8000) in your browser.

---

## Deployment

### Vercel
- Install Vercel CLI: `npm i -g vercel`
- Deploy: `vercel`
- Set environment variables in the Vercel dashboard:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `VALID_ENV=production`

### Supabase
- Create a project at [supabase.com](https://supabase.com/)
- Run the SQL scripts in `supabase/migrations/` to set up your database schema
- Copy your Supabase URL and anon key to your `.env` and Vercel settings

### GitHub
- Push your code to a GitHub repository
- Connect your repo to Vercel for automatic deployments

---

## Developer Guide

- **Dev Mode**: Use the toggle switch at the bottom left of the results page to enable the debug panel and test data generation.
- **Testing**: (Coming soon) Unit and integration tests will be in `js/__tests__/`.
- **Contributing**: Fork the repo, create a feature branch, submit a pull request.
- **Scripts**:
  - `npm run dev` – Start dev server
  - `npm start` – Start simple server
  - `npm run build` – (No build step required)

---

## API & Integration

- **Supabase**: Used for authentication, data storage, and retrieval.
- **Endpoints**: (If you add custom endpoints, document them here.)
- **Environment Variables**:
  - `SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_ANON_KEY`: Your Supabase anon key
  - `VALID_ENV`: `development` or `production`

---

## Troubleshooting & FAQ

- **Supabase errors**: Check your environment variables and Supabase project status.
- **Port in use**: Change the `PORT` in your `.env` or stop other servers.
- **Debug panel not visible**: Use the Dev Mode toggle switch.
- **PDF not generating**: Ensure jsPDF is loaded and browser supports downloads.

---

## License

MIT

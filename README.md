# VALID Assessment Platform

A web-based assessment platform for evaluating decision-making styles and providing personalized feedback.

## Features

- Interactive assessment interface
- Real-time scoring and analysis
- PDF report generation
- Offline support with local storage
- Secure data handling with Supabase

## Development

1. Clone the repository:
```bash
git clone https://github.com/cdonaleski/valid-assessment.git
cd valid-assessment
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your environment variables:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VALID_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set up environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VALID_ENV=production`

### Supabase Setup

1. Create a new project in Supabase
2. Set up the database schema
3. Configure environment variables in Vercel with your Supabase credentials

### GitHub Integration

1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/valid-assessment.git
git push -u origin main
```

3. Connect your GitHub repository to Vercel for automatic deployments

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VALID_ENV`: Environment (development/production)

## License

MIT

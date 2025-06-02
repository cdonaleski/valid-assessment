# VALID Assessment Tool

A web-based implementation of the VALID (Verity, Association, Lived Experience, Institutional Knowledge, Desire) decision-making style assessment.

## Features

- Complete VALID assessment questionnaire
- Real-time scoring and progress tracking
- Automatic result calculation and interpretation
- PDF report generation
- Email notifications
- Offline support with local storage
- Admin dashboard for result analysis

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account for database functionality
- An EmailJS account for email notifications

## Installation

1. Clone the repository:
```bash
git clone https://github.com/cdonaleski/valid-assessment.git
cd valid-assessment
```

2. Copy the example environment file and update with your credentials:
```bash
cp .env.example .env
```

3. Update the `.env` file with your credentials:
- Supabase URL and anonymous key
- EmailJS configuration
- Other environment-specific settings

4. Install dependencies:
```bash
npm install
```

5. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:8080`

## Project Structure

```
valid-assessment/
├── js/
│   ├── questions-data.js   # Core assessment questions
│   ├── questions.js        # Question management logic
│   ├── database.js         # Database operations
│   ├── config.js          # Configuration management
│   └── ...
├── css/
│   └── styles.css
├── index.html
├── supabase/
│   └── migrations/        # Database schema and migrations
└── ...
```

## Development

### Environment Setup

The project uses environment variables for configuration. Copy `.env.example` to `.env` and update the values:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
...
```

### Database Setup

1. Install Supabase CLI
2. Initialize the database:
```bash
supabase init
supabase db reset
```

### Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- VALID Assessment methodology creators
- Supabase for database functionality
- EmailJS for email services

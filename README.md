# Math Master PDF API

API for generating PDF files for Math Master tests.

## Installation
```bash
npm install
```

## Start
```bash
npm start
```

Server runs on http://localhost:3000

## API Endpoints

### GET /health

Check server status.

### POST /api/generate-pdf

Generate a PDF from test questions.

**Request:**
```json
{
  "questions": [
    {
      "text": "2 + 2 = ?",
      "answer": "4",
      "options": ["2", "3", "4", "5"]
    }
  ],
  "level": "A",
  "lang": "ar"
}
```

**Response:** PDF file (application/pdf)

## Deployment

Deploy on Railway:
1. Push code to GitHub
2. Connect GitHub to Railway
3. Railway auto-deploys
4. Get your domain

## Author

Hadeel

## License

MIT

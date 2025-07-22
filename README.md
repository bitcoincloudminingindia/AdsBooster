# AdsBooster Production Setup

## Features
- AI Resume, Cover Letter, Blog, Meme, Grammar, Plagiarism, Background Remover, Crypto Tax, Stock Portfolio, Secure File Sharing, Ad Tools, Proxy System, Google OAuth2 Auth, and more.

## Setup
1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in all required values
4. Run `npm run dev` (development) or `npm start` (production)

## Environment Variables
See `.env.example` for all required variables:
- MongoDB, Groq, Hugging Face, remove.bg, Alpha Vantage, Google OAuth2, Proxy providers, Session secret, etc.

## Security & Best Practices
- Never commit your real `.env` file
- Use strong secrets and API keys
- Restrict CORS in production
- Use HTTPS and a reverse proxy (Nginx/Apache)
- Regularly update dependencies

## Monitoring & Logging
- Use `/proxy-status` for proxy health
- Integrate Sentry or similar for error monitoring
- Use Winston or Pino for centralized logging

## Testing
- Add automated tests for critical endpoints
- Manual end-to-end tests recommended

## Deployment
- Use process managers (PM2, systemd)
- Enable HTTPS
- Set up regular backups

---
For more details, see individual tool documentation and code comments. 
# Setup Instructions

## Quick Start

### 1. Server Setup
```bash
cd server
pnpm install
cp .env.example .env
# Edit .env with your configuration
pnpm dev
```

### 2. Environment Configuration
All environment variables are documented in `.env.example`

See detailed guide: [ENV_SETUP_GUIDE.md](./docs/ENV_SETUP_GUIDE.md)

## Key Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | Yes | development | Application environment |
| PORT | No | 9000 | Server port |
| MONGO_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret |
| JWT_ACCESS_EXPIRATION | No | 15m | Access token expiration |
| JWT_REFRESH_EXPIRATION | No | 7d | Refresh token expiration |
| CORS_ORIGIN | No | * | CORS allowed origins |

## Documentation

- [ENV_SETUP_GUIDE.md](./docs/ENV_SETUP_GUIDE.md) - Detailed environment setup guide
- [COOKIE_AUTH_GUIDE.md](./docs/COOKIE_AUTH_GUIDE.md) - Cookie-based authentication
- [LIVE_SOCKET_FEATURES.md](./docs/LIVE_SOCKET_FEATURES.md) - Real-time socket features
- [MASTER_GUIDE.md](./docs/MASTER_GUIDE.md) - Complete implementation guide

## First Time Setup

1. **Install pnpm** (if not installed)
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**
   ```bash
   cd server && pnpm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Update .env values**
   - Add MongoDB connection string
   - Generate strong JWT_SECRET
   - Update CORS_ORIGIN if needed

5. **Start server**
   ```bash
   pnpm dev
   ```

6. **Verify connection**
   - Server should log: "Server running on port 9000"
   - Should log: "MongoDB Connected Successfully"
   - Check: http://localhost:9000/api/health (if endpoint exists)

## Production Deployment

See [ENV_SETUP_GUIDE.md - Production Setup](./docs/ENV_SETUP_GUIDE.md#production-setup)

---
**Created**: February 22, 2026

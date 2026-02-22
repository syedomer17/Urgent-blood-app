# Environment Setup Guide

## Quick Start

### 1. Copy .env.example to .env
```bash
cd server
cp .env.example .env
```

### 2. Update .env values
Edit the `.env` file with your own configuration values (see details below).

### 3. Never commit .env
The `.env` file is already in `.gitignore` and should NEVER be committed to version control.

---

## Environment Variables Reference

### Core Application Settings

#### NODE_ENV
- **Default**: `development`
- **Valid Values**: `development`, `production`, `test`
- **Purpose**: Controls application behavior, logging level, and security settings
- **Example**: `NODE_ENV=production`

#### PORT
- **Default**: `9000`
- **Purpose**: Server listening port
- **Note**: Make sure the port is available and not blocked by firewall
- **Example**: `PORT=3001`

---

### Database Configuration

#### MONGO_URI
- **Required**: Yes
- **Format**: MongoDB connection string
- **Examples**:
  - Local: `mongodb://localhost:27017/blood-app`
  - Cloud (MongoDB Atlas): `mongodb+srv://username:password@cluster0.mongodb.net/blood-app`
  - Local with auth: `mongodb://user:pass@localhost:27017/blood-app?authSource=admin`

- **How to get MongoDB Atlas connection string**:
  1. Go to https://www.mongodb.com/cloud/atlas
  2. Create a free cluster
  3. Create a database user (username/password)
  4. Add your IP to whitelist
  5. Click "Connect" and copy the connection string
  6. Replace `<username>`, `<password>`, and `<dbname>` placeholders

---

### JWT Authentication

#### JWT_SECRET
- **Required**: Yes
- **MinLength**: 32 characters recommended
- **Purpose**: Secret key for signing JWT tokens
- **Security**: Use a strong, random string in production
- **Generate Random Secret**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Example**: `JWT_SECRET=5f7b8e9a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e`

#### JWT_ACCESS_EXPIRATION
- **Default**: `15m`
- **Format**: JWT time format (number + unit)
- **Valid Units**: `s` (seconds), `m` (minutes), `h` (hours), `d` (days)
- **Examples**:
  - `5m` - 5 minutes
  - `1h` - 1 hour
  - `7d` - 7 days
- **Recommended Production**: `15m`

#### JWT_REFRESH_EXPIRATION
- **Default**: `7d`
- **Format**: JWT time format
- **Purpose**: Refresh token expiration (longer than access token)
- **Examples**:
  - `7d` - 7 days
  - `30d` - 30 days
  - `90d` - 90 days
- **Recommended Production**: `7d`

---

### CORS Configuration

#### CORS_ORIGIN
- **Default**: `*` (allow all origins - not recommended for production)
- **Purpose**: Control which domains can access the API
- **Examples**:
  - `*` - Allow all origins (development only)
  - `http://localhost:3000` - Single origin
  - `https://yourdomain.com` - Production domain
  - `http://localhost:3000,https://yourdomain.com` - Multiple origins (comma-separated)
  - `https://*.yourdomain.com` - Subdomains wildcard

- **Production Setup**:
  ```
  CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
  ```

---

## Development Setup

### 1. Install Dependencies
```bash
cd server
pnpm install
```

### 2. Configure .env for Development
```bash
cp .env.example .env
```

Edit `.env`:
```
NODE_ENV=development
PORT=9000
MONGO_URI=mongodb://localhost:27017/blood-app
JWT_SECRET=dev-secret-key-not-for-production-change-this
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Development Server
```bash
pnpm dev
# or
npm run dev
```

Server will run at: `http://localhost:9000`

---

## Production Setup

### 1. Generate Strong Secrets
```bash
# Generate JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate Session Secret (if needed)
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure .env for Production
```
NODE_ENV=production
PORT=9000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/blood-app?retryWrites=true&w=majority
JWT_SECRET=<generated-random-secret-here>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

### 3. Security Checklist
- [ ] NODE_ENV set to `production`
- [ ] JWT_SECRET is strong and random (32+ characters)
- [ ] CORS_ORIGIN set to specific domain(s), not `*`
- [ ] MONGO_URI uses SSL/TLS connection
- [ ] MONGO_URI has strong username/password
- [ ] MongoDB whitelist includes only production server IP
- [ ] .env file is in .gitignore
- [ ] HTTPS/SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Logging level set to `warn` or `error`

---

## Docker Deployment

### Using Environment Variables with Docker

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install

COPY src ./src
COPY tsconfig.json ./

EXPOSE 9000

CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "9000:9000"
    environment:
      - NODE_ENV=production
      - PORT=9000
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ACCESS_EXPIRATION=15m
      - JWT_REFRESH_EXPIRATION=7d
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

volumes:
  mongo_data:
```

**Run with .env**:
```bash
docker-compose --env-file .env up
```

---

## Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Cause**: MONGO_URI incorrect or database not accessible

**Solution**:
1. Verify MongoDB connection string format
2. Check MongoDB is running (local) or accessible (cloud)
3. Verify credentials are correct
4. Check IP whitelist (if using MongoDB Atlas)
5. Test connection:
   ```bash
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/blood-app"
   ```

### Issue: Port Already in Use
**Cause**: PORT is already occupied by another process

**Solution**:
```bash
# Find process using port 9000
lsof -i :9000

# Kill process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Issue: JWT Token Invalid
**Cause**: JWT_SECRET changed or token generated with different secret

**Solution**:
1. Restart server if JWT_SECRET changed
2. Regenerate tokens by logging in again
3. Don't change JWT_SECRET in production without planning token rotation

### Issue: CORS Errors
**Cause**: Frontend domain not in CORS_ORIGIN

**Solution**:
1. Add frontend domain to CORS_ORIGIN in .env
2. Restart server
3. Check browser console for exact error message
4. Ensure frontend includes credentials in requests

### Issue: API Timeout
**Cause**: Database connection too slow or slow query

**Solution**:
1. Check MongoDB connection
2. Monitor database performance
3. Add indexes to frequently queried fields
4. Increase timeouts if needed

---

## Environment Variables by Feature

### Authentication
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRATION`
- `JWT_REFRESH_EXPIRATION`

### Database
- `MONGO_URI`

### API Access
- `CORS_ORIGIN`

### Server
- `NODE_ENV`
- `PORT`

### Optional (For Future Features)
- `LOG_LEVEL` - Logging verbosity
- `FIREBASE_KEY` - Push notifications
- `STRIPE_KEY` - Payments
- `SMTP_*` - Email sending

---

## Verification

### Verify Setup is Correct
```bash
# Check .env file exists and is readable
test -f .env && echo "✅ .env file exists"

# Test MongoDB connection
mongodb="mongodb://localhost:27017"
mongosh "$mongodb" --eval "db.adminCommand('ping')" && echo "✅ MongoDB connected"

# Test server starts
npm run dev
# Look for: "Server running on port 9000"
# Look for: "MongoDB Connected Successfully"
```

### Check .env Validation
The application will fail to start if required variables are missing:
- `MONGO_URI` (required)
- `JWT_SECRET` (required)

If either is missing, you'll see:
```
Config validation error: "MONGO_URI" is required
```

---

## Best Practices

1. **Never share secrets**
   - Don't share .env files via email, Slack, or GitHub
   - Use secure secret management tools (AWS Secrets Manager, HashiCorp Vault)

2. **Use different secrets per environment**
   - Development, staging, and production should have different secrets

3. **Rotate secrets regularly**
   - Change JWT_SECRET periodically
   - Update database passwords

4. **Use strong passwords**
   - MongoDB: Min 16 characters, mixed case, numbers, symbols
   - JWT_SECRET: At least 32 random characters

5. **Document your setup**
   - Keep notes of any custom configuration
   - Document special environment-specific settings

6. **Use environment-specific files** (optional)
   - Create `.env.development`, `.env.production` for clarity
   - Source appropriate file in deployment

7. **Automate secret management**
   - Use CI/CD platform secret management
   - GitHub Actions: Secrets tab
   - GitLab: CI/CD Variables

---

## Support

For issues or questions:
1. Check the Common Issues & Solutions section above
2. Review the API documentation
3. Check server logs: `npm run dev` shows detailed output
4. Verify all required environment variables are set

---

**Last Updated**: February 22, 2026

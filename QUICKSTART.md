# 🚀 Quick Start Guide

Get AI Study Assistant running in **5 minutes** using Docker!

## ⚡ Fastest Setup (Recommended)

### Prerequisites
- Docker & Docker Compose installed
- Node.js v20+
- Git

### Step 1: Clone & Setup
```bash
git clone https://github.com/prudhvi-1618/AI-Study-Assistant.git
cd AI-Study-Assistant
```

### Step 2: Configure Environment
```bash
# Backend setup
cd backend
cp .env.example .env

# Edit .env and add your API keys:
# - GEMINI_API_KEY or OPENAI_API_KEY (required)
# Keep other defaults as-is for local development
nano .env  # or use your editor

# Frontend setup
cd ../frontend
cp .env.example .env.local
# Leave defaults (API_URL already set to localhost:3001)
```

### Step 3: Start All Services
```bash
# From backend directory
cd backend
docker-compose up -d

# Wait for services to be healthy (~30 seconds)
# Check: docker-compose ps
```

### Step 4: Initialize Database
```bash
cd backend
npm install
npm run db:migrate
```

### Step 5: Start Backend & Frontend
```bash
# Terminal 1 - Backend (from backend/)
npm run dev

# Terminal 2 - Frontend (from frontend/)
cd ../frontend
npm install
npm run dev
```

### Step 6: Open Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/v1
- **Database Admin:** http://localhost:8080 (user: root, password: root)

---

## 🛑 Stop Services
```bash
# Stop all Docker containers
cd backend
docker-compose down

# Or stop with data wipe
docker-compose down -v
```

---

## ✅ Verify Setup

### Check Backend Health
```bash
curl http://localhost:3001/api/v1/health
# Should return: {"status":"ok"}
```

### Check Redis
```bash
docker exec study-assistant-redis redis-cli ping
# Should return: PONG
```

### Check MySQL
```bash
docker exec study-assistant-mysql mysqladmin ping -u root -proot
# Should return: mysqld is alive
```

### Check Qdrant
```bash
curl http://localhost:6333/health
# Should return: {"status":"ok"}
```

---

## 🔑 Getting API Keys

### Google Gemini (Recommended)
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key"
3. Create new API key
4. Copy and paste in `.env` file as `GEMINI_API_KEY`

### OpenAI (Alternative)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy and paste in `.env` file as `OPENAI_API_KEY`

---

## 📝 First Time Usage

### 1. Sign Up
- Go to http://localhost:3000
- Click "Sign Up"
- Create account with email & password

### 2. Upload Materials
- Click "Upload Document"
- Select PDF, DOCX, PPT, or TXT file
- Wait for processing (watch backend logs)

### 3. Try Features
- **Chat:** Ask questions about uploaded materials
- **Summary:** Generate study notes
- **Flashcards:** Create review cards
- **Quiz:** Test your knowledge

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Linux/Mac - Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Docker Service Won't Start
```bash
# Check logs
docker-compose logs mysql

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### "Cannot connect to MySQL"
```bash
# Ensure MySQL is healthy
docker-compose ps

# If not healthy, restart
docker-compose restart mysql

# Check MySQL logs
docker-compose logs mysql
```

### API Key Errors
- Verify API key is correct in `.env`
- Check API key has proper permissions
- Verify key hasn't reached quota limits

---

## 📚 Next Steps

- Read [README.md](./README.md) for complete documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [API_SPECIFICATION.md](./API_SPECIFICATION.md) for API docs
- Explore [backend/AGENTS.md](./backend/AGENTS.md) for AI agents

---

## 💡 Tips

- **Auto-reload:** Both backend and frontend have auto-reload enabled
- **Database UI:** Use Adminer at http://localhost:8080
- **Redis CLI:** Run `redis-cli` commands via Docker Exec
- **Logs:** Check `docker-compose logs -f <service>` for live logs

---

Need help? Open an issue on [GitHub](https://github.com/prudhvi-1618/AI-Study-Assistant/issues)!

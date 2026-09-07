# CivicConnect - AI-Powered Smart Public Complaint Management System
## Complete Setup & Installation Guide

---

## 📋 Prerequisites

Before you start, ensure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### Verify Installation
```bash
node --version
npm --version
psql --version
mongosh --version
```

---

## 🚀 Quick Start (5 minutes)

### Step 1: Clone & Navigate
```bash
# Navigate to project directory
cd civicconnect

# Install dependencies for all workspaces
npm install
```

### Step 2: Environment Setup

#### Backend (.env)
Create a file `backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=civicconnect_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# MongoDB
MONGO_URI=mongodb://localhost:27017/civicconnect

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# GROQ AI API
GROQ_API_KEY=your_groq_api_key_here
```

#### Frontend (.env)
Create a file `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Database Setup

#### PostgreSQL
```bash
# Connect to PostgreSQL
psql -U postgres

# Run SQL initialization
\i backend/db-postgres-init.sql

# Exit
\q
```

Or using psql directly:
```bash
psql -U postgres -h localhost < backend/db-postgres-init.sql
```

#### MongoDB
MongoDB will auto-create collections when needed. Just ensure it's running:
```bash
# If not running as a service, start MongoDB manually
mongod
```

### Step 4: Get GROQ API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up (free tier available)
3. Create an API key
4. Add it to `backend/.env` as `GROQ_API_KEY`

### Step 5: Start Development Servers

```bash
# From project root, start both frontend and backend
npm run dev

# Backend runs on: http://localhost:5000
# Frontend runs on: http://localhost:3000
```

Alternatively, start separately:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```

### Step 6: Access the Application

- **Landing Page**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **API Health**: http://localhost:5000/api/health

---

## 🔐 Demo Credentials

### Citizen Account
- **Email**: citizen@demo.com
- **Password**: password123
- **Access**: Report issues, track complaints, provide feedback

### Authority Account
- **Email**: authority@demo.com
- **Password**: password123
- **Access**: Dashboard, complaint management, analytics

### Admin Account
- **Email**: admin@demo.com
- **Password**: password123
- **Access**: Full system access, user management, configuration

---

## 📁 Project Structure

```
civicconnect/
├── frontend/                      # React application
│   ├── src/
│   │   ├── pages/                # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── CitizenDashboard.jsx
│   │   │   ├── ReportIssuePage.jsx
│   │   │   ├── AuthorityDashboard.jsx
│   │   │   └── ...
│   │   ├── store/                # Zustand stores
│   │   │   └── authStore.js
│   │   ├── components/           # Reusable components
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                       # Node.js/Express API
│   ├── server.js                 # Main server file
│   ├── models-mongodb.js         # Mongoose schemas
│   ├── services-ai.js            # AI service (GROQ)
│   ├── db-postgres-init.sql      # SQL initialization
│   ├── middleware/               # Auth, validation
│   ├── routes/                   # API routes
│   ├── public/uploads/           # User uploads
│   └── package.json
│
└── README.md
```

---

## 🛠️ Detailed Installation

### PostgreSQL Setup (Detailed)

#### Windows
1. Download PostgreSQL installer
2. Run installer, set password for postgres user
3. Add PostgreSQL to system PATH
4. Open PowerShell:
   ```powershell
   psql -U postgres -h localhost < backend\db-postgres-init.sql
   ```

#### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Initialize database
psql -U postgres < backend/db-postgres-init.sql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo service postgresql start

# Initialize
sudo -u postgres psql < backend/db-postgres-init.sql
```

### MongoDB Setup (Detailed)

#### Windows
1. Download Community Edition installer
2. Run installer with default options
3. MongoDB will run as a Windows Service
4. Verify: `mongosh` should connect automatically

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/auth/register/citizen` - Register citizen
- `POST /api/auth/login` - Login any user type

### Complaints
- `POST /api/complaints/submit` - Submit new complaint
- `GET /api/complaints/:complaintId` - Get complaint details
- `GET /api/complaints/user/list` - Get user's complaints (Citizen)
- `GET /api/complaints/authority/list` - Get department complaints (Authority)
- `PATCH /api/complaints/:complaintId/status` - Update status (Authority)
- `POST /api/complaints/:complaintId/assign` - Assign complaint (Authority)
- `POST /api/complaints/:complaintId/resolve` - Mark resolved (Authority)
- `POST /api/complaints/:complaintId/feedback` - Submit feedback (Citizen)

### Authority
- `GET /api/dashboard/authority` - Dashboard statistics

### AI & Insights
- `GET /api/insights/ai` - AI-generated insights

### Notifications
- `GET /api/notifications` - User's notifications
- `PATCH /api/notifications/:id/read` - Mark as read

---

## 🐛 Troubleshooting

### "Cannot connect to PostgreSQL"
```bash
# Check PostgreSQL is running
# macOS: brew services list
# Windows: Services app
# Linux: sudo service postgresql status

# Test connection
psql -U postgres -h localhost
```

### "MongoDB connection failed"
```bash
# Check MongoDB is running
mongosh

# If mongod is not running
# macOS: brew services start mongodb-community
# Windows: Start MongoDB service from Services
# Linux: sudo systemctl start mongod
```

### "GROQ_API_KEY not found"
- Ensure `.env` file is in backend directory
- Verify key is correct from console.groq.com
- Restart backend server after adding key

### "Port 5000 or 3000 already in use"
```bash
# Find and kill process
# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

---

## 📊 Sample Data

The application includes realistic demo data:
- **20+ sample complaints** with various statuses
- **Multiple departments** (Roads, Sanitation, Water, Electrical)
- **Different priority levels** and categories
- **User feedback and ratings**
- **AI analysis samples**

Auto-populate on first run by adding sample data in `backend/seeder.js`

---

## 🎯 Key Features Implemented

✅ **Citizen Portal**
- Register & login
- Report issues with photos/videos
- Real-time tracking
- Provide feedback and ratings

✅ **Authority Dashboard**
- Complaint management
- Priority-based filtering
- Assignment system
- Analytics & charts
- AI insights

✅ **AI Integration**
- Automatic categorization (GROQ)
- Severity assessment
- Priority calculation
- Duplicate detection
- Actionable insights

✅ **Database**
- PostgreSQL: Users, departments, SLAs, audit logs
- MongoDB: Complaints, notifications, analytics

✅ **Security**
- JWT authentication
- Role-based access control
- Password hashing (bcrypt)
- Input validation
- Protected routes

---

## 📱 Mobile Optimization

The application is fully responsive:
- Mobile-first design
- Touch-friendly buttons
- GPS geolocation
- Camera access for photo upload
- Optimized for slow networks

Test on mobile:
```bash
# Find your machine IP
ipconfig getifaddr en0  # macOS
ipconfig               # Windows

# Access from phone
http://<YOUR_IP>:3000
```

---

## 🚢 Deployment

### Frontend (Netlify/Vercel)
```bash
cd frontend
npm run build
# Upload 'build' folder to Netlify/Vercel
```

### Backend (Heroku/Railway)
```bash
# Add Procfile
echo "web: node backend/server.js" > Procfile

# Deploy to Heroku
heroku create civicconnect-api
git push heroku main
```

---

## 📚 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Leaflet.js, Chart.js |
| **Backend** | Node.js, Express, JWT |
| **Database** | PostgreSQL (auth), MongoDB (data) |
| **AI** | GROQ API (Mixtral 8x7B) |
| **Storage** | Multer (file upload) |
| **State** | Zustand |

---

## 🔄 Common Workflows

### Submit Complaint (Citizen)
1. Click "Report Issue"
2. Fill form with title, description, location
3. Upload photos
4. Preview AI analysis
5. Submit
6. Receive complaint ID
7. Track progress in dashboard

### Manage Complaint (Authority)
1. View dashboard with all complaints
2. Filter by priority/status
3. Click "Manage" to view details
4. Assign to officer
5. Update status as work progresses
6. Upload resolution photos
7. Mark resolved
8. Citizen provides feedback

### View Insights (Admin)
1. Access admin panel
2. View system-wide analytics
3. Check department performance
4. Review AI insights
5. Generate reports
6. Configure SLAs

---

## 📞 Support & Contact

For issues or questions:
- Check troubleshooting section
- Review API documentation
- Check application logs: `backend.log`
- Create issue on GitHub (if using Git)

---

## 📄 License

This project is part of CivicConnect - an educational and demonstration project.

---

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack MERN development
- PostgreSQL + MongoDB integration
- AI/ML API integration (GROQ)
- Role-based access control
- Real-time notifications
- Analytics dashboards
- Geolocation & mapping
- File upload handling
- JWT authentication
- Production-ready architecture

---

**Ready to improve your community? Let's make cities smarter! 🚀**

For detailed API documentation, see `API.md`
For database schema details, see `DATABASE.md`

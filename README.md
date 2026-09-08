# 🏛️ CivicConnect – AI-Powered Smart Public Complaint Management System

A production-grade, full-stack municipal civic tech platform connecting citizens with local government departments to report, triage, track, and resolve public infrastructure issues with autonomous AI analysis and real-time GIS mapping.

---

##  Key Features

### 👤 Citizen Portal
- **Fast 1-Page Complaint Reporting**: File issues with title, description, category, and photo attachments.
- **Interactive Location Picker**: Pinpoint exact street coordinates on an interactive Leaflet map.
- **Autonomous AI Pre-Check**: Real-time GROQ AI analysis estimates priority, detects safety risks, and identifies nearby duplicate complaints before submission.
- **Live Status Timeline**: Track resolution stages (*Submitted ➡️ AI Triaged ➡️ Assigned ➡️ In Progress ➡️ Resolved*).
- **Citizen Verification & Feedback**: Verify work completion with 1–5 star ratings.

### 🛡️ Officer & Authority Operations Center
- **Dynamic Incident Queue**: Filter complaints by severity, department, status, and SLA urgency.
- **SLA Countdown & Tracking**: Real-time resolution timers to prevent departmental delays.
- **Workflow Management**: Update status, assign field engineers, attach work-completion photos, and add internal notes.
- **AI Municipal Insights**: Auto-generated alerts for recurring hazard hotspots and emerging civic issues.

### 👑 Municipal Admin Command Center
- **Citywide Oversight Dashboard**: Global complaint statistics, SLA compliance gauges, and citizen satisfaction ratings.
- **Department Scorecards**: Real-time resolution ratios and duration benchmarks across municipal agencies.
- **Personnel & Agency Management**: Manage municipal divisions, categories, and field officers.
- **One-Click Role Switcher**: Seamlessly test and switch between Citizen, Authority, and Admin roles directly from the interface.

### 🗺️ Geographic Triage & Transparency Portal
- **Interactive City Map**: All active civic complaints plotted with custom color-coded category and priority pins.
- **Public Transparency Dashboard**: Anonymized citywide performance metrics accessible to the public without login.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Mapping & Visuals** | Leaflet.js, React-Leaflet, Chart.js, React-Chartjs-2 |
| **Backend API** | Node.js, Express, CORS, Helmet, Multer |
| **Database** | SQLite via `better-sqlite3` *(Fast, zero-configuration local persistence)* |
| **Authentication** | JSON Web Tokens (JWT) & bcryptjs password hashing |
| **Artificial Intelligence** | GROQ SDK (Llama 3.3 / Mixtral for instant civic triaging & duplicate detection) |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher installed
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Hasika-10/Civic_Connect.git
cd Civic_Connect

# Install all root, backend, and frontend dependencies
npm run install-all
```

### 3. Environment Configuration
Create a `.env` file in the project root based on `.env.example`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=5000
JWT_SECRET=civicconnect_super_secret_key_2025
NODE_ENV=development
UPLOAD_DIR=./uploads
GROQ_API_KEY=your_groq_api_key_here
```
*(A working GROQ API key is already configured for live demo deployments.)*

### 4. Seed Database & Launch
```bash
# Seed the SQLite database with 25 realistic civic incidents across city zones
npm run seed

# Launch both Backend API (port 5000) and Frontend App (port 5173) concurrently
npm run dev
```

The application will be accessible at:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **City Complaint Map**: [http://localhost:5173/map](http://localhost:5173/map)

---

## 🔑 Pre-Seeded Demo Accounts

All test accounts use the password: **`password123`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Authority (Roads)** | `rajesh@roads.gov` | Road maintenance incident triage, officer assignment, status progression |
| **Authority (Sanitation)** | `priya@sanitation.gov` | Waste management & sanitation complaint operations |
| **Authority (Electrical)** | `vikram@electrical.gov` | Streetlight & electrical infrastructure operations |
| **Super Admin** | `admin@civicconnect.gov` | Citywide administration, department scorecards, officer management |
| **Citizen** | `arun@citizen.com` | Report public issues, view live status, rate completed repairs |
| **Citizen** | `meena@citizen.com` | Citizen portal & neighborhood tracking |

> **Tip**: The login page at `/login` provides **1-Click Demo Login Cards** for Authority, Admin, and Citizen accounts.

---

## 📁 Project Architecture

```
Civic_Connect/
├── client/                     # Vite + React 18 Frontend
│   ├── src/
│   │   ├── components/         # Reusable charts, maps, and layouts
│   │   │   ├── charts/         # Chart.js analytics components
│   │   │   ├── common/         # StatCard, StatusBadge, StatusTimeline
│   │   │   ├── layout/         # Executive Navbar & DashboardLayout
│   │   │   └── maps/           # Leaflet ComplaintMap & LocationPicker
│   │   ├── context/            # AuthContext, NotificationContext, LanguageContext
│   │   ├── pages/              # Landing, Login, Register, Dashboards
│   │   │   ├── admin/          # Admin Dashboard, Users, Departments
│   │   │   ├── authority/      # Authority Dashboard, Complaint Queue & Details
│   │   │   ├── citizen/        # Citizen Dashboard, New Complaint, Profile
│   │   │   └── public/         # City Map & Public Transparency Portal
│   │   └── services/           # Axios API client
│   └── tailwind.config.js      # Executive multi-tone color system
│
├── server/                     # Node.js + Express REST API
│   ├── database/               # SQLite database initialization & migrations
│   ├── middleware/             # JWT authentication, role guards, file upload
│   ├── routes/                 # API route handlers (auth, complaints, admin, etc.)
│   ├── services/               # AI triaging, automated assignment, notifications
│   ├── seed.js                 # Database seeder (departments, categories, users, 25 complaints)
│   └── index.js                # Express entrypoint
│
├── uploads/                    # Local media and photo attachments (.gitkeep)
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules (protects .env and DB)
└── package.json                # Project scripts & concurrently configuration
```

---
Teammates:
SHREE NITHI B
HASIKA B
NAKSHATHRA S

## 🛡️ License
Licensed under the [MIT License](LICENSE).

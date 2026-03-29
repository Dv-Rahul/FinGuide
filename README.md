# FinGuide 🚀

FinGuide is a production-ready, AI-powered full-stack Finance Tracking Web Application designed with a premium SaaS-level UI and advanced real-world features. 

## 🌟 Features
- **Modern SaaS UI**: Built with React, Tailwind CSS, and Framer Motion for smooth animations and glassmorphism.
- **Authentication & Security**: Secure JWT authentication, password hashing with bcrypt, and Helmet for HTTP headers.
- **Transaction & Budget System**: Add, edit, and track expenses/incomes. Set category-wise budget limits.
- **Data Analytics**: Interactive charts powered by Recharts (Income/Expense, Cash Flow).
- **AI Financial Advisor & Copilot Chat**: Get personalized insights, saving tips, and chat with an AI assistant about your spending trends.
- **Goal-Based Savings**: Set financial goals and monitor progress.
- **CI/CD pipeline Ready**: Automated testing and deployment with GitHub actions and fully dockerized frontend and backend. 

## 🛠️ Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion, Recharts, Context API, Lucide React (Icons).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB, Mongoose.
- **AI Integration**: OpenAI SDK (Currently holds mock interactions for demonstration if api key is absent).
- **DevOps**: Docker, Docker Compose, GitHub Actions.

## 📂 Project Structure
- `frontend/` - React frontend application.
- `backend/` - Node.js/Express backend APIs.
- `.github/workflows` - CI/CD pipeline configuration.
- `docker-compose.yml` - Container orchestration.

## 🚀 How to Run Locally

### Requirements
Ensure you have Node.js and MongoDB installed OR Docker & Docker-Compose.

### 1️⃣ Option: Using Docker (Recommended)
```bash
docker-compose up --build
```
*Frontend will run on port 80 and Backend on port 5001.*

### 2️⃣ Option: Running manually with npm
**Terminal 1: Backend**
```bash
cd backend
npm install
Configure your .env file with your MONGO_URI, JWT_SECRET, and OPENAI_API_KEY.
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to browse the app.

## 🛡️ Best Engineering Practices Used
- **MVC Architecture** for clean separation of concerns on the backend.
- **Context API** for robust state management.
- **Framer Motion** for elegant and subtle micro-interactions making the UI feel premium.
- **Security Middlewares** including custom auth validation and password management.

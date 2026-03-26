# Quizzify Full-Stack Application

Quizzify is a modern, comprehensive Quiz Management System built directly with **React + Vite** and **FastAPI**. It features robust Role-Based Access Control (RBAC), personalized user dashboards, global competitive leaderboards, and an administrative panel.

## 🚀 Features

### **Authentication & Security**
- **JWT-Based Authentication**: Secure login and signup flows using encrypted tokens stored locally.
- **Strict Role-Based Access (RBAC)**: Enforces boundaries between Admin (`/admin`) and standard Users (`/user`); 401/403 API responses are managed directly by backend interceptors.

### **Administrator Capabilities**
- **Live Admin Dashboard**: Access platform-wide metrics (total distinct users, quizzes, cumulative attempts, and average platform accuracy).
- **Activity Streams**: Real-time ticker of recent attempts across the platform alongside a top 3 global performer showcase.
- **Content Creation Framework**: Dedicated UI flows to create, publish, and delete quizzes grouped by custom Categories.

### **User Experience**
- **Personalized User Dashboard**: Dynamic greetings based on your historical `average_score`. Displays total attempts, best score, and your live platform rank.
- **Smart Recommendations**: Recommends recent active quizzes directly from the dashboard.
- **Interactive Quiz Player**: A smooth, pagination-based quiz playing experience with a live progress bar tracking each question.
- **Global Leaderboard**: Compete natively across the platform; ranking is powered by efficient MongoDB aggregation engines tracking total cumulative points.

### **Detailed Analytics**
- **Deep Quiz Review**: Once an attempt is wrapped up, users receive a highly detailed "Result Breakdown".
- **Question-by-Question Diagnostics**: Visualize exact option selections. Incorrect answers are bordered in red alongside the correctly highlighted green option, accelerating learning.
- **Persistent Historical Viewing**: Users can always step back into their `My Attempts` grid to open past detailed analysis cards.

---

## 🛠️ Technology Stack

**Frontend**
- React 18
- Vite
- TailwindCSS (Styling)
- Lucide React (Icons)
- React Router DOM (Navigation)
- Axios (API Client)

**Backend**
- Python 3.10+
- FastAPI
- Motor (Async MongoDB Driver)
- Pydantic (Schema Validation)
- PyJWT (Authentication)
- Uvicorn (ASGI Server)

**Database**
- MongoDB (NoSQL JSON object persistence)

---

## 💻 Getting Started

### 1. Starting the Database
Make sure you have MongoDB running locally natively or via Docker:
```bash
# Docker example
docker run -d -p 27017:27017 --name mongodb mongo
```

### 2. Starting the Backend (FastAPI)
Open a new terminal and navigate to the `fastapi-backend` folder:
```bash
cd fastapi-backend
pip install -r requirements.txt
# Run the FastAPI server
uvicorn main:app --reload --port 8000
```

### 3. Starting the Frontend (React)
Open a second terminal and navigate to the `Frontend` folder:
```bash
cd Frontend
npm install
# Spin up the Vite dev server
npm run dev
```
Navigate to `http://localhost:5173` to explore your fully functional application!

---

## 📝 Recent Implementation Updates

1. **RBAC Guarding**: Enhanced `utils/auth.py` and `ProtectedRoute.jsx` so unprivileged users trying to access `/admin` or vice versa explicitly throw a generic 401 instead of a loose 403 fallback.
2. **Aggregated Dashboards**: Swapped out the old dummy placeholders for both `/admin` and `/user` defaults with stunning grid-based analytic cards using dedicated robust backend API aggregations natively in MongoDB engines.
3. **Question Diagnostics Tracking**: Reconfigured `submit_attempt` schemas within `routes/user_routes.py` and MongoDB so it maps option indices securely at submission time tracking `user_answer`, `correct_answer`, and `is_correct` logic. This seamlessly integrates with the shiny new robust `/user/results/:attemptId` interface.

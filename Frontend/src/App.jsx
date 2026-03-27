import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLayout from './pages/AdminLayout';
import UserLayout from './pages/UserLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CreateQuiz from './pages/CreateQuiz';
import QuizList from './pages/QuizList';
import PlayQuiz from './pages/PlayQuiz';
import Result from './pages/Result';
import MyQuizzes from './pages/MyQuizzes';
import AdminLeaderboard from './pages/AdminLeaderboard';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import MyAttempts from './pages/MyAttempts';
import axios from 'axios';

// Global Axios Interceptor for Security (Auto-Logout on 401)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Routes>
        {/* Public routes with Navbar */}
        <Route path="/" element={<><Navbar /><main className="flex-grow flex flex-col"><Home /></main></>} />
        <Route path="/login" element={<><Navbar /><main className="flex-grow flex flex-col"><Login /></main></>} />
        <Route path="/signup" element={<><Navbar /><main className="flex-grow flex flex-col"><Signup /></main></>} />
        
        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="create-quiz" element={<CreateQuiz />} />
            <Route path="my-quizzes" element={<MyQuizzes />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
          </Route>
        </Route>

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute allowedRole="user" />}>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="quizzes" element={<QuizList />} />
            <Route path="play-quiz/:quizId" element={<PlayQuiz />} />
            <Route path="my-attempts" element={<MyAttempts />} />
            <Route path="results" element={<MyAttempts />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
          </Route>
          <Route element={<UserLayout />}>
             <Route path="/result/:attemptId" element={<Result />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;

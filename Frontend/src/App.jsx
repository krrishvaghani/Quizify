import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './pages/DashboardLayout';
import CreateQuiz from './pages/CreateQuiz';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Routes>
        {/* Public routes with Navbar */}
        <Route path="/" element={<><Navbar /><main className="flex-grow flex flex-col"><Home /></main></>} />
        <Route path="/login" element={<><Navbar /><main className="flex-grow flex flex-col"><Login /></main></>} />
        <Route path="/signup" element={<><Navbar /><main className="flex-grow flex flex-col"><Signup /></main></>} />
        
        {/* Protected Dashboard Routes (No Navbar) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div className="p-8"><h1 className="text-3xl font-bold text-gray-900">Dashboard</h1><p className="mt-2 text-gray-600">Select an option from the sidebar to continue.</p></div>} />
          <Route path="create-quiz" element={<CreateQuiz />} />
          <Route path="my-quizzes" element={<div className="p-8"><h1 className="text-3xl font-bold">My Quizzes</h1></div>} />
          <Route path="categories" element={<div className="p-8"><h1 className="text-3xl font-bold">Categories</h1></div>} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;

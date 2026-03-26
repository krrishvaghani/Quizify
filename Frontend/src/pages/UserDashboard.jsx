import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Activity, Target, Award, Clock, Star, PlayCircle, ArrowRight } from 'lucide-react';

const UserDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("User Dashboard - Token retrieved:", token);
      const res = await axios.get('http://127.0.0.1:8000/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("User Dashboard - Response status:", res.status);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      console.error(err);
      setError(`Error: ${err.response?.status} - ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGreetingMessage = () => {
    if (!data) return "Welcome back!";
    if (data.total_attempts === 0) return "Ready to take your first quiz?";
    if (data.average_score >= 80) return "Incredible accuracy! Keep up the great work.";
    if (data.average_score >= 50) return "Solid performance. You're making great progress.";
    return "Keep practicing! Every attempt makes you sharper.";
  };

  if (loading) return <div className="p-8 pb-32">Loading your personalized dashboard...</div>;
  if (error) return <div className="p-8 pb-32 text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Dashboard</h1>
        <p className="mt-2 text-gray-600 text-lg">{getGreetingMessage()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Attempts */}
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center transition-all hover:shadow-md">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Attempts</p>
            <p className="text-2xl font-bold text-gray-900">{data.total_attempts}</p>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center transition-all hover:shadow-md">
          <div className="p-3 rounded-full bg-orange-50 text-orange-600 mr-4">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Average Score</p>
            <p className="text-2xl font-bold text-gray-900">{data.average_score}%</p>
          </div>
        </div>

        {/* Best Score */}
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center transition-all hover:shadow-md">
          <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Best Score</p>
            <p className="text-2xl font-bold text-gray-900">{data.best_score}%</p>
          </div>
        </div>

        {/* Global Rank */}
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center transition-all hover:shadow-md">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Global Rank</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.rank > 0 ? `#${data.rank}` : 'Unranked'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Attempts Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock size={20} className="mr-2 text-primary-600" />
              Recent Attempts
            </h2>
            <Link to="/user/my-attempts" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center transition-colors">
              View History <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="flex-grow p-0">
            {data.recent_attempts && data.recent_attempts.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {data.recent_attempts.map((attempt, idx) => (
                  <li key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{attempt.quiz_title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(attempt.date).toLocaleString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${attempt.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {attempt.percentage}%
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                You haven't taken any quizzes yet. Check out the recommendations!
              </div>
            )}
          </div>
        </div>

        {/* Recommended Quizzes Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Award size={20} className="mr-2 text-primary-600" />
              Recommended Quizzes
            </h2>
          </div>
          <div className="flex-grow p-0">
            {data.recommended_quizzes && data.recommended_quizzes.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {data.recommended_quizzes.map((quiz, idx) => (
                  <li key={idx} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">{quiz.title}</p>
                      <p className="text-sm text-gray-500 mt-1">Duration: {quiz.duration} mins</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/user/play-quiz/${quiz.quiz_id}`)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 bg-opacity-90 transition-colors"
                    >
                      <PlayCircle size={16} className="mr-1.5" /> Start
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">No quizzes available right now.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

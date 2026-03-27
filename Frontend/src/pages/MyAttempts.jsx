import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const MyAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!userStr || !token) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(userStr);
      
      const res = await fetch(`http://127.0.0.1:8000/api/attempts/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load attempts');
      const data = await res.json();
      setAttempts(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load your attempts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading your attempts...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Attempts</h1>
      {attempts.length === 0 ? (
        <p className="text-gray-500">You haven't attempted any quizzes yet.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col pt-8 relative">
              <div className={`absolute top-0 left-0 w-full h-2 rounded-t-xl ${attempt.percentage >= 80 ? 'bg-green-500' : attempt.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <h2 className="text-xl font-semibold mb-2 pr-8">{attempt.quiz_title}</h2>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <span>{new Date(attempt.date).toLocaleDateString()}</span>
                <span className="font-semibold text-gray-700">
                  {attempt.score} / {attempt.total}
                </span>
              </div>
              <div className="mt-auto">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-sm font-medium text-gray-700">Score</span>
                   <span className="text-sm font-bold text-gray-900">{attempt.percentage}%</span>
                 </div>
                 <div className="flex justify-between items-center mb-1 mt-2">
                   <span className="text-sm font-medium text-gray-700">Status</span>
                   <span className={`text-sm font-bold ${attempt.percentage >= 80 ? 'text-green-600' : attempt.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                     {attempt.percentage >= 50 ? 'Pass' : 'Fail'}
                   </span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                   <div 
                      className={`h-2 rounded-full ${attempt.percentage >= 80 ? 'bg-green-500' : attempt.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${attempt.percentage}%` }}
                   ></div>
                 </div>
                 <Link 
                   to={`/result/${attempt.id}`}
                   className="block text-center w-full py-2 bg-gray-50 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors border border-gray-100"
                 >
                   View Detailed Result
                 </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAttempts;

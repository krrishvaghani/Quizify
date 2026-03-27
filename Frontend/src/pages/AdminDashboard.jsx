import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, FileText, Activity, BarChart2, ArrowRight, Clock, Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Admin Dashboard - Token retrieved:", token);
      const res = await axios.get('http://127.0.0.1:8000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Admin Dashboard - Response status:", res.status);
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

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy size={20} className="text-yellow-500 mr-2" />;
      case 1: return <Medal size={20} className="text-gray-400 mr-2" />;
      case 2: return <Award size={20} className="text-amber-600 mr-2" />;
      default: return <span className="w-5 mr-2 text-gray-400 font-bold">#{index + 1}</span>;
    }
  };

  if (loading) return <div className="p-8 pb-32">Loading Dashboard Analytics...</div>;
  if (error) return <div className="p-8 pb-32 text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back. Here's what's happening on your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Users */}
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center transition-all hover:shadow-md">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{data.total_users}</p>
          </div>
        </div>

        {/* Total Quizzes */}
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center transition-all hover:shadow-md">
          <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Quizzes</p>
            <p className="text-2xl font-bold text-gray-900">{data.total_quizzes}</p>
          </div>
        </div>

        {/* Total Attempts */}
        <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center transition-all hover:shadow-md">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4">
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
            <BarChart2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Avg Score (%)</p>
            <p className="text-2xl font-bold text-gray-900">{data.average_score}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Trophy size={20} className="mr-2 text-primary-600" />
              Top Performers
            </h2>
            <Link to="/admin/leaderboard" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center transition-colors">
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="flex-grow p-0">
            {data.top_performers && data.top_performers.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="h-64 w-full p-4 border-b border-gray-100 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.top_performers} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="username" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ fill: '#f3f4f6' }}
                      />
                      <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="divide-y divide-gray-100 overflow-y-auto max-h-64">
                  {data.top_performers.map((user, idx) => (
                    <li key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        {getRankIcon(idx)}
                        <span className="font-semibold text-gray-900 ml-1">{user.username}</span>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800">
                        {user.score} pts
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">No attempts yet.</div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock size={20} className="mr-2 text-primary-600" />
              Recent Activity
            </h2>
          </div>
          <div className="flex-grow p-0">
            {data.recent_attempts && data.recent_attempts.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {data.recent_attempts.map((attempt, idx) => (
                  <li key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{attempt.username}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Completed <span className="font-medium text-gray-700">"{attempt.quiz_title}"</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${attempt.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {attempt.percentage}%
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

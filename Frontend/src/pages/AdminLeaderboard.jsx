import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award } from 'lucide-react';

const AdminLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/leaderboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (index) => {
    switch(index) {
      case 0: return "bg-yellow-50 text-yellow-700 border-yellow-200 font-bold text-lg";
      case 1: return "bg-gray-100 text-gray-700 border-gray-300 font-semibold text-md";
      case 2: return "bg-amber-50 text-amber-700 border-amber-200 font-semibold text-md";
      default: return "bg-white text-gray-600 border-gray-100";
    }
  };

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy size={24} className="text-yellow-500 mr-3" />;
      case 1: return <Medal size={22} className="text-gray-400 mr-3" />;
      case 2: return <Award size={22} className="text-amber-600 mr-3" />;
      default: return <span className="w-8 mr-3 font-medium text-gray-400">#{index + 1}</span>;
    }
  };

  if (loading) return <div className="p-8">Loading Top Performers...</div>;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
          <Trophy className="mr-3 text-primary-600" size={32} />
          Top Performers
        </h1>
        <p className="text-gray-500 mt-2">Ranking of all users based on their total cumulative scores.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No attempts have been recorded yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total Score
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leaderboard.map((user, index) => (
                <tr key={user.user_id} className={`transition-colors hover:bg-gray-50 border-b ${getRankStyle(index)}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankIcon(index)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">{user.username}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 inline-flex text-md leading-5 font-bold rounded-full bg-primary-100 text-primary-800">
                      {user.total_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-medium">
                    {user.attempts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminLeaderboard;

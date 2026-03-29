import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award } from 'lucide-react';

const AdminLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [mode, setMode] = useState('global');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [loading, setLoading] = useState(true);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.user_id || currentUser.id;

  useEffect(() => {
    fetchQuizzes();
    fetchLeaderboard('global', '');
  }, []);

  const exportLeaderboard = () => {
    if (!leaderboard.length) {
      window.alert('No leaderboard data to export.');
      return;
    }

    const headers = ['rank', 'username', 'total_score', mode === 'quiz' ? 'best_percentage' : 'average_percentage', 'attempts'];
    const rows = leaderboard.map((item) => [
      item.rank,
      item.username || 'Unknown User',
      item.total_score ?? 0,
      mode === 'quiz' ? item.best_percentage ?? 0 : item.average_percentage ?? 0,
      item.attempts ?? 0,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'quiz' ? 'quiz_leaderboard_export.csv' : 'global_leaderboard_export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.role === 'admin';
      const url = isAdmin
        ? 'http://127.0.0.1:8000/api/quizzes/admin'
        : `http://127.0.0.1:8000/api/user/assigned-quizzes/${user.id}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      setQuizzes(data);
      if (data.length > 0) {
        setSelectedQuizId(data[0].quiz_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async (nextMode = mode, nextQuizId = selectedQuizId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (nextMode === 'quiz' && nextQuizId) {
        const res = await axios.get(`http://127.0.0.1:8000/api/leaderboard/quiz/${nextQuizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data?.rankings || []);
        setQuizTitle(res.data?.quiz_title || 'Selected Quiz');
      } else {
        const res = await axios.get('http://127.0.0.1:8000/api/leaderboard/global', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data || []);
        setQuizTitle('');
      }
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
      case 0: return <span className="text-3xl mr-3">🥇</span>;
      case 1: return <span className="text-3xl mr-3">🥈</span>;
      case 2: return <span className="text-3xl mr-3">🥉</span>;
      default: return <span className="w-8 mr-3 font-medium text-gray-400">#{index + 1}</span>;
    }
  };

  if (loading) return <div className="p-8">Loading Top Performers...</div>;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
          <Trophy className="mr-3 text-primary-600" size={32} />
          Leaderboard
        </h1>
        <p className="text-gray-500 mt-2">
          {mode === 'global'
            ? 'Global ranking based on cumulative score and average performance.'
            : `Quiz-wise ranking sorted by score percentage${quizTitle ? ` for ${quizTitle}` : ''}.`}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => {
                setMode('global');
                fetchLeaderboard('global', selectedQuizId);
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition ${mode === 'global' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Global
            </button>
            <button
              onClick={() => {
                setMode('quiz');
                if (selectedQuizId) {
                  fetchLeaderboard('quiz', selectedQuizId);
                } else {
                  setLeaderboard([]);
                }
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition ${mode === 'quiz' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Quiz-wise
            </button>
          </div>
          <button
            onClick={exportLeaderboard}
            className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
          >
            Export Leaderboard
          </button>
        </div>

        {mode === 'quiz' && (
          <select
            value={selectedQuizId}
            onChange={(e) => {
              const qid = e.target.value;
              setSelectedQuizId(qid);
              if (qid) {
                fetchLeaderboard('quiz', qid);
              }
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            {quizzes.length === 0 ? (
              <option value="">No quizzes available</option>
            ) : (
              quizzes.map((q) => (
                <option key={q.quiz_id} value={q.quiz_id}>{q.title}</option>
              ))
            )}
          </select>
        )}
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
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Avg %
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leaderboard.map((user, index) => {
                const isCurrentUser = String(user.user_id) === String(currentUserId);
                return (
                <tr key={user.user_id} className={`transition-colors border-b ${isCurrentUser ? 'bg-primary-50 hover:bg-primary-100 border-primary-200 shadow-inner' : 'hover:bg-gray-50 ' + getRankStyle(index)}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankIcon(index)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">{user.username}</span>
                    {isCurrentUser && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary-600 text-white">You</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 inline-flex text-md leading-5 font-bold rounded-full bg-primary-100 text-primary-800">
                      {user.total_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-700">
                    {mode === 'quiz' ? user.best_percentage : user.average_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-medium">
                    {user.attempts}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminLeaderboard;

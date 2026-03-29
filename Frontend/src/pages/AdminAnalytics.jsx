import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://127.0.0.1:8000/api/admin/quiz-analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnalytics(res.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load quiz analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const exportAnalytics = () => {
    if (!analytics.length) {
      window.alert('No analytics data to export.');
      return;
    }

    const headers = ['quiz_title', 'total_attempts', 'average_score', 'highest_score', 'hardest_question'];
    const rows = analytics.map((item) => [
      item.quiz_title || 'Untitled Quiz',
      String(item.total_attempts ?? 0),
      String(Number(item.average_score ?? 0).toFixed(2)),
      String(Number(item.highest_score ?? 0).toFixed(2)),
      item.hardest_question || 'N/A',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_analytics_export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8">Loading quiz analytics...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quiz Analytics</h1>
            <p className="mt-2 text-gray-600">Understand quiz performance and discover where learners struggle most.</p>
          </div>
          <button
            onClick={exportAnalytics}
            className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
          >
            Export Results
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Quiz Title</th>
                <th className="text-left px-4 py-3 font-semibold">Attempts</th>
                <th className="text-left px-4 py-3 font-semibold">Average Score</th>
                <th className="text-left px-4 py-3 font-semibold">Highest Score</th>
                <th className="text-left px-4 py-3 font-semibold">Hardest Question</th>
              </tr>
            </thead>
            <tbody>
              {analytics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-gray-500">No analytics data yet.</td>
                </tr>
              ) : (
                analytics.map((item) => (
                  <tr key={item.quiz_id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.quiz_title || 'Untitled Quiz'}</td>
                    <td className="px-4 py-3 text-gray-700">{item.total_attempts ?? 0}</td>
                    <td className="px-4 py-3 text-gray-700">{Number(item.average_score ?? 0).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-gray-700">{Number(item.highest_score ?? 0).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-gray-700 max-w-lg truncate" title={item.hardest_question || 'N/A'}>
                      {item.hardest_question || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

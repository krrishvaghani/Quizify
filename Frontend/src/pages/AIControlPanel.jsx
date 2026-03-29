import { useEffect, useState } from 'react';
import axios from 'axios';

const AIControlPanel = () => {
  const [enabled, setEnabled] = useState(true);
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionsLimit, setQuestionsLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://127.0.0.1:8000/api/admin/ai-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || {};
      setEnabled(Boolean(data.enabled));
      setDefaultPrompt(data.default_prompt || '');
      setDifficulty(data.difficulty || 'medium');
      setQuestionsLimit(data.questions_limit || 20);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to load AI settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(
        'http://127.0.0.1:8000/api/admin/ai-settings',
        {
          enabled,
          default_prompt: defaultPrompt,
          difficulty,
          questions_limit: Number(questionsLimit),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast('success', 'AI settings saved successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading AI settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-md text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Control Panel</h1>
        <p className="mt-2 text-gray-600">Manage AI generation behavior globally across admin tools.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <p className="font-semibold text-gray-900">AI Generation</p>
            <p className="text-sm text-gray-500">Enable or disable all AI-powered quiz generation.</p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Default Prompt</label>
          <textarea
            rows={6}
            value={defaultPrompt}
            onChange={(e) => setDefaultPrompt(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            placeholder="Enter base instruction for AI generation..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Questions Limit</label>
            <input
              type="number"
              min={1}
              max={50}
              value={questionsLimit}
              onChange={(e) => setQuestionsLimit(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AIControlPanel;

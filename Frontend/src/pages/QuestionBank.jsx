import { useEffect, useState } from 'react';
import axios from 'axios';

const QuestionBank = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://127.0.0.1:8000/api/admin/questions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(res.data || []);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to load question bank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const setOptionAt = (index, value) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const resetForm = () => {
    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setCategory('General');
    setDifficulty('medium');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || trimmedOptions.length < 2 || !correctAnswer.trim()) {
      showToast('error', 'Please complete question, options, and correct answer.');
      return;
    }

    if (!trimmedOptions.includes(correctAnswer.trim())) {
      showToast('error', 'Correct answer must match one of the options exactly.');
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        'http://127.0.0.1:8000/api/admin/questions',
        {
          question: question.trim(),
          options: trimmedOptions,
          correct_answer: correctAnswer.trim(),
          category: category.trim() || 'General',
          difficulty,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('success', 'Question added to bank.');
      resetForm();
      fetchQuestions();
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to add question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Question Bank</h1>
        <p className="mt-2 text-gray-600">Create reusable questions for future quizzes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add Question</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            {options.map((opt, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Option {idx + 1}</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={opt}
                  onChange={(e) => setOptionAt(idx, e.target.value)}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add To Bank'}
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Questions</h2>
          {loading ? (
            <div className="text-sm text-gray-500">Loading questions...</div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto">
              {questions.length === 0 ? (
                <p className="text-sm text-gray-500">No questions in bank yet.</p>
              ) : (
                questions.map((q) => (
                  <div key={q.question_id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <p className="font-semibold text-gray-800">{q.question}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Category: {q.category} | Difficulty: {q.difficulty}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {(q.options || []).map((opt, idx) => (
                        <li key={idx} className={`text-sm ${opt === q.correct_answer ? 'text-emerald-700 font-semibold' : 'text-gray-600'}`}>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;

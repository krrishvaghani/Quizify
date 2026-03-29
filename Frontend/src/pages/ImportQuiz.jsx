import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ImportQuiz = () => {
  const [file, setFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [source, setSource] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const handleImport = async () => {
    if (!file) {
      showToast('error', 'Please upload a file first.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('num_questions', String(numQuestions));

      const res = await axios.post('http://127.0.0.1:8000/api/admin/import-quiz', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setQuestions(res.data?.questions || []);
      setSource(res.data?.source || 'fallback');
      showToast('success', 'Quiz questions generated successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to import quiz.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQuiz = () => {
    if (!questions.length) {
      showToast('error', 'No generated questions to add.');
      return;
    }

    sessionStorage.setItem('importedQuizQuestions', JSON.stringify(questions));
    navigate('/admin/create-quiz');
  };

  return (
    <div className="max-w-5xl mx-auto">
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Import Quiz From File</h1>
        <p className="mt-2 text-gray-600">Upload PDF, DOCX, or PPTX and let AI generate quiz questions.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
          <input
            type="file"
            accept=".pdf,.docx,.pptx,.ppt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
          <input
            type="number"
            min={1}
            max={50}
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="w-48 px-4 py-2 border border-gray-200 rounded-xl"
          />
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Questions'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Preview</h2>
          {source ? <span className="text-xs text-gray-500">Source: {source}</span> : null}
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-gray-500">No generated questions yet.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <p className="font-semibold text-gray-800">Q{idx + 1}. {q.text}</p>
                <ul className="mt-2 space-y-1">
                  {(q.options || []).map((opt, oIdx) => (
                    <li key={oIdx} className={`text-sm ${opt === q.correct_answer ? 'text-emerald-700 font-semibold' : 'text-gray-600'}`}>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <button
              onClick={handleAddToQuiz}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              Add To Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportQuiz;

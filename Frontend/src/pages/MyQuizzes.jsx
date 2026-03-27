import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/quizzes/admin', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/quizzes/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setQuizzes(quizzes.filter(q => q.quiz_id !== id));
      alert("Quiz deleted successfully");
    } catch (err) {
      console.error(err);
      alert('Failed to delete quiz');
    }
  };

  if (loading) return <div className="p-8">Loading quizzes...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Quizzes</h1>
      {quizzes.length === 0 ? (
        <p className="text-gray-500">You haven't created any quizzes yet.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.quiz_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col relative group">
              <button 
                onClick={() => handleDelete(quiz.quiz_id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-md"
                title="Delete Quiz"
              >
                <Trash2 size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-2 pr-8">{quiz.title}</h2>
              <p className="text-gray-500 mb-4">Duration: {quiz.duration || 5} mins</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;

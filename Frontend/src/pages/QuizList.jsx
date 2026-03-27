import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const headers = { Authorization: 'Bearer ' + token };

    fetch('http://localhost:8000/api/quizzes/user', { headers }).then(r => r.json())
      .then((quizData) => {
        setQuizzes(quizData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);


  if (loading) return <div className="p-8">Loading quizzes...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Available Quizzes</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map(quiz => (
          <div key={quiz.quiz_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
            <p className="text-gray-400 text-sm mb-6 flex-grow">Duration: {quiz.duration || 5} mins</p>
            <button
              onClick={() => navigate(`/user/play-quiz/${quiz.quiz_id}`)}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Start Quiz
            </button>
          </div>
        ))}
        {quizzes.length === 0 && <p className="text-gray-500">No quizzes available yet.</p>}
      </div>
    </div>
  );
};

export default QuizList;

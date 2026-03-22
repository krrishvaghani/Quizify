import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, quizTitle } = location.state || {}; // Fallback if no state

  if (!result) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">No result found.</h2>
        <button onClick={() => navigate('/dashboard/quizzes')} className="mt-4 text-primary-600 hover:underline">
          Go back to Quizzes
        </button>
      </div>
    );
  }

  const { score, total_questions, percentage } = result;
  
  // Decide icon based on score
  const isSuccess = percentage >= 50;

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 w-full text-center">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner ${percentage === 100 ? 'bg-yellow-100' : isSuccess ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
          {percentage === 100 ? (
            <Trophy size={48} className="text-yellow-500" />
          ) : isSuccess ? (
            <CheckCircle size={48} />
          ) : (
             <XCircle size={48} />
          )}
        </div>
        
        <h1 className="text-4xl font-extrabold mb-3 text-gray-900">Quiz Completed!</h1>
        <p className="text-gray-500 mb-8 text-lg">{quizTitle || 'Your Result'}</p>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Score</p>
            <p className="text-4xl font-black text-gray-900">{score}</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total</p>
            <p className="text-4xl font-black text-gray-900">{total_questions}</p>
          </div>
          <div className="bg-primary-50 p-6 rounded-2xl border-2 border-primary-200">
            <p className="text-sm text-primary-600 font-bold uppercase tracking-wider mb-1">Percentage</p>
            <p className={`text-4xl font-black ${percentage >= 80 ? 'text-green-600' : 'text-primary-700'}`}>{percentage}%</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/quizzes')}
          className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition shadow-sm hover:shadow-md"
        >
          Back to Quizzes
        </button>
      </div>
    </div>
  );
};

export default Result;

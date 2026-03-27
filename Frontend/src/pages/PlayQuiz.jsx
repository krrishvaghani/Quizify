import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const PlayQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/quizzes/user/${quizId}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    })
      .then(res => res.json())
      .then(data => {
        if (data.questions) {
          data.questions = shuffleArray(data.questions);
        }
        setQuiz(data);
        if (data.question_timer && data.time_per_question) {
          setQuestionTimeLeft(data.time_per_question);
          setTimeLeft(null); // Explicitly disable Global framework
        } else if (data.duration) {
          setTimeLeft(data.duration * 60);
          setQuestionTimeLeft(null); // Explicitly disable Question framework
        } else {
          setTimeLeft(5 * 60); // Default 5 mins Global
          setQuestionTimeLeft(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [quizId]);

  useEffect(() => {
    if (loading || timeLeft === null || submitting) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timerInt = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerInt);
  }, [timeLeft, loading, submitting]);

  // Per-question timer tracker
  useEffect(() => {
    if (loading || submitting || questionTimeLeft === null) return;
    
    if (questionTimeLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timerInt = setInterval(() => {
      setQuestionTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerInt);
  }, [questionTimeLeft, loading, submitting, currentQuestionIndex]);

  const handleTimeUp = () => {
    const isLast = currentQuestionIndex === quiz?.questions?.length - 1;
    if (isLast) {
      handleSubmit();
    } else {
      handleNextQuestion();
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1));
    if (quiz?.question_timer && quiz?.time_per_question) {
      setQuestionTimeLeft(quiz.time_per_question);
    }
  };

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
    if (quiz?.question_timer && quiz?.time_per_question) {
      setQuestionTimeLeft(quiz.time_per_question);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const answersArray = Object.keys(answers).map(qId => ({
      question_id: qId,
      selected_option: answers[qId]
    }));

    try {
      const res = await fetch('http://localhost:8000/api/attempts/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ quiz_id: quizId, answers: answersArray })
      });
      if (!res.ok) throw new Error("Failed to submit");
      const result = await res.json();
      // Redirect directly to the detailed attempt page
      navigate(`/result/${result.attempt_id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading quiz...</div>;
  if (!quiz || !quiz.questions || quiz.questions.length === 0) return <div className="p-8">No questions found for this quiz.</div>;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8 relative py-2">
        <h1 className="text-3xl font-bold mb-4 pr-32">{quiz.title}</h1>
        
        {timeLeft !== null && (
          <div className={`absolute top-0 right-0 p-3 rounded-xl flex items-center shadow-sm border ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-gray-700 border-gray-200'}`}>
            <Clock size={20} className="mr-2" />
            <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
          </div>
        )}
        
        {questionTimeLeft !== null && (
          <div className={`absolute top-0 right-36 p-3 rounded-xl flex items-center shadow-sm border ${questionTimeLeft <= 10 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            <Clock size={20} className="mr-2" />
            <span className="font-mono text-xl font-bold">{questionTimeLeft}s</span>
          </div>
        )}

        <div className="flex justify-between text-gray-500 text-sm font-medium mt-4">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span>Progress: {Math.round(((currentQuestionIndex) / quiz.questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
          <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex) / quiz.questions.length) * 100}%` }}></div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-2xl font-medium mb-8 text-gray-800">{currentQuestion.question}</h2>
        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                answers[currentQuestion.question_id] === option
                  ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-sm'
                  : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.question_id}`}
                value={option}
                checked={answers[currentQuestion.question_id] === option}
                onChange={() => handleOptionSelect(currentQuestion.question_id, option)}
                className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500 mr-4"
              />
              <span className="flex-1 text-lg">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>
        
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < quiz.questions.length}
            className={`px-8 py-3 rounded-xl font-medium text-white transition shadow-sm ${
              Object.keys(answers).length < quiz.questions.length 
                ? 'bg-gray-400 cursor-not-allowed hidden' 
                : 'bg-green-600 hover:bg-green-700 hover:shadow-md'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="px-8 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 hover:shadow-md transition"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayQuiz;

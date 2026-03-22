import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import axios from 'axios';
import QuestionForm from '../components/QuestionForm';

const CreateQuiz = () => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [duration, setDuration] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddQuestion = (question) => {
    setQuestions([...questions, question]);
  };

  const handleRemoveQuestion = (index) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !categoryId) {
      alert('Please fill in quiz title and category');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    
    // Validations
    const invalidOptionCount = questions.some(q => !q.options || q.options.length !== 4);
    if (invalidOptionCount) {
      alert('Every question must have exactly 4 options.');
      return;
    }
    
    const missingCorrectAnswer = questions.some(q => !q.correct_answer);
    if (missingCorrectAnswer) {
      alert('Every question must have a correct answer selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        category_id: categoryId,
        duration: parseInt(duration),
        questions
      };

      await axios.post('http://127.0.0.1:8000/api/quizzes/create', payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('Quiz successfully created with ' + questions.length + ' questions!');
      
      // Reset form
      setTitle('');
      setCategoryId('');
      setDuration(5);
      setQuestions([]);

    } catch (error) {
      console.error(error);
      alert('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create a New Quiz</h1>
        <p className="text-gray-500 mt-2">Fill in the details below and add your questions.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 transition-all">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Quiz Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
              placeholder="e.g. Advanced React Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
              placeholder="e.g. react-advanced"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="180"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>
      </div>

      <QuestionForm onAddQuestion={handleAddQuestion} />

      {questions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Questions List</h2>
            <span className="bg-primary-50 text-primary-700 py-1 px-3 rounded-full text-sm font-semibold border border-primary-100">
              {questions.length} added
            </span>
          </div>
          
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="p-5 border border-gray-100 rounded-xl bg-gray-50 relative group transition-all">
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded-lg shadow-sm border border-gray-100"
                  title="Delete Question"
                >
                  <Trash2 size={18} />
                </button>
                <h4 className="font-bold text-gray-800 pr-12 text-lg"><span className="text-primary-600 mr-2">Q{idx + 1}.</span>{q.text}</h4>
                <ul className="mt-4 space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <li key={oIdx} className={`text-sm flex items-center p-2 rounded-lg ${opt === q.correct_answer ? 'bg-green-50 text-green-800 font-semibold border border-green-200' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full mr-3 ${opt === q.correct_answer ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 pb-12">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || questions.length === 0}
          className="px-8 py-3.5 bg-primary-600 text-white font-bold text-lg rounded-xl shadow-md hover:bg-primary-700 hover:shadow-lg transition-all focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving Quiz...' : 'Save Complete Quiz'}
        </button>
      </div>
    </div>
  );
};

export default CreateQuiz;

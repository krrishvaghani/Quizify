import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const QuestionForm = ({ onAddQuestion }) => {
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0); // index of correct option
  const [error, setError] = useState('');

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAdd = () => {
    // Validation
    if (!text.trim()) {
      setError('Question text is required');
      return;
    }
    
    const validOptions = options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    if (!options[correctAnswer].trim()) {
      setError('The selected correct answer cannot be empty');
      return;
    }

    onAddQuestion({
      text,
      options: validOptions,
      correct_answer: options[correctAnswer]
    });

    // Reset form
    setText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setError('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-fade-in-up transition-all">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Question</h3>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            placeholder="What is the capital of France?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Options & Correct Answer</label>
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="radio"
                name="correctAnswer"
                checked={correctAnswer === index}
                onChange={() => setCorrectAnswer(index)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                title="Mark as correct answer"
              />
              <input
                type="text"
                className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${correctAnswer === index ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}`}
                placeholder={`Option ${index + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold shadow-sm"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Question
        </button>
      </div>
    </div>
  );
};

export default QuestionForm;

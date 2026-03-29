import { useEffect, useState } from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import axios from 'axios';
import QuestionForm from '../components/QuestionForm';

const CreateQuiz = () => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(5);
  const [questionTimer, setQuestionTimer] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [questions, setQuestions] = useState([]);
  const [questionBank, setQuestionBank] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [loadingBank, setLoadingBank] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Modal States
  const [showAIModal, setShowAIModal] = useState(false);
  const [activeAITab, setActiveAITab] = useState('topic'); // 'topic' | 'document'
  const [aiTopic, setAiTopic] = useState('');
  const [aiFile, setAiFile] = useState(null);
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchQuestionBank();

    const imported = sessionStorage.getItem('importedQuizQuestions');
    if (imported) {
      try {
        const parsed = JSON.parse(imported);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions((prev) => [...prev, ...parsed]);
        }
      } catch (err) {
        console.error('Failed to parse imported quiz questions', err);
      }
      sessionStorage.removeItem('importedQuizQuestions');
    }
  }, []);

  const fetchQuestionBank = async () => {
    try {
      setLoadingBank(true);
      const res = await axios.get('http://127.0.0.1:8000/api/admin/questions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setQuestionBank(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load question bank: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingBank(false);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleAddQuestion = (question) => {
    setQuestions([...questions, question]);
  };

  const handleRemoveQuestion = (index) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
  };

  const handleAIGenerate = async () => {
    if (activeAITab === 'topic' && !aiTopic) return alert('Please enter a topic');
    if (activeAITab === 'document' && !aiFile) return alert('Please select a document');
    
    setIsGenerating(true);
    try {
      let res;
      if (activeAITab === 'topic') {
        res = await axios.post('http://127.0.0.1:8000/api/ai/generate-quiz', {
          topic: aiTopic,
          num_questions: parseInt(aiCount)
        }, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        const formData = new FormData();
        formData.append('file', aiFile);
        formData.append('num_questions', parseInt(aiCount));
        res = await axios.post('http://127.0.0.1:8000/api/ai/generate-from-file', formData, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      const generatedQuestions = res.data.questions;
      if (generatedQuestions && Array.isArray(generatedQuestions)) {
        setQuestions([...questions, ...generatedQuestions]);
        setShowAIModal(false);
        setAiTopic('');
        setAiFile(null);
      } else {
        alert('Unexpected format from AI generator.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate quiz: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      alert('Please fill in quiz title');
      return;
    }
    if (questions.length === 0 && selectedQuestionIds.length === 0) {
      alert('Please add at least one custom question or select one from question bank');
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
      const computedDuration = questionTimer 
        ? Math.max(1, Math.ceil((questions.length * parseInt(timePerQuestion)) / 60))
        : parseInt(duration);

      const payload = {
        title,
        duration: computedDuration,
        question_timer: questionTimer,
        time_per_question: questionTimer ? parseInt(timePerQuestion) : null,
        question_ids: selectedQuestionIds,
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
      setDuration(5);
      setQuestionTimer(false);
      setTimePerQuestion(15);
      setQuestions([]);
      setSelectedQuestionIds([]);

    } catch (error) {
      console.error(error);
      alert('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create a New Quiz</h1>
          <p className="text-gray-500 mt-2">Fill in the details below and add your questions.</p>
        </div>
        <button 
          onClick={() => setShowAIModal(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md transition font-semibold"
        >
          <Sparkles size={18} className="mr-2" /> Generate with AI
        </button>
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
            {!questionTimer ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Total Time</label>
                <div className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 font-medium">
                  {Math.ceil((questions.length * (parseInt(timePerQuestion) || 0)) / 60)} mins ({questions.length * (parseInt(timePerQuestion) || 0)}s)
                </div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center h-[28px] mb-1 leading-none mt-[6px]">
              <input
                type="checkbox"
                id="questionTimer"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 mr-2 border-gray-300"
                checked={questionTimer}
                onChange={(e) => setQuestionTimer(e.target.checked)}
              />
              <label htmlFor="questionTimer" className="text-sm font-bold text-gray-700 cursor-pointer">
                Enable Question Timer
              </label>
            </div>
            {questionTimer ? (
              <input
                type="number"
                min="5"
                max="300"
                placeholder="Seconds per question"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors mt-2"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(e.target.value)}
              />
            ) : (
              <div className="w-full px-4 py-3 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm mt-2">
                Questions have unlimited time
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Question Bank</h2>
          <span className="text-sm text-gray-500">Selected: {selectedQuestionIds.length}</span>
        </div>
        {loadingBank ? (
          <p className="text-sm text-gray-500">Loading question bank...</p>
        ) : questionBank.length === 0 ? (
          <p className="text-sm text-gray-500">No question bank entries yet. Add from Question Bank page.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-3">
            {questionBank.map((q) => (
              <label key={q.question_id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedQuestionIds.includes(q.question_id)}
                  onChange={() => toggleQuestionSelection(q.question_id)}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{q.question}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {q.category || 'General'} | {q.difficulty || 'medium'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
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
          disabled={isSubmitting || (questions.length === 0 && selectedQuestionIds.length === 0)}
          className="px-8 py-3.5 bg-primary-600 text-white font-bold text-lg rounded-xl shadow-md hover:bg-primary-700 hover:shadow-lg transition-all focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving Quiz...' : 'Save Complete Quiz'}
        </button>
      </div>

      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in-up shadow-xl border border-purple-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Sparkles className="text-purple-600 mr-2" /> AI Quiz Generator
            </h2>
            <p className="text-sm text-gray-500 mb-6">Enter a topic or upload material and let LLama3 generate multiple-choice questions for you instantly.</p>
            
            <div className="flex border-b border-gray-200 mb-6 font-medium">
              <button
                className={`py-2 px-4 focus:outline-none transition ${activeAITab === 'topic' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveAITab('topic')}
              >
                By Topic
              </button>
              <button
                className={`py-2 px-4 focus:outline-none transition ${activeAITab === 'document' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveAITab('document')}
              >
                By Document
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {activeAITab === 'topic' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Python AsyncIO"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Study Material (PDF, DOCX, PPTX)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx"
                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    onChange={(e) => setAiFile(e.target.files[0])}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions (Max 20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                  value={aiCount}
                  onChange={(e) => setAiCount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAIModal(false)}
                disabled={isGenerating}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || (activeAITab === 'topic' && !aiTopic) || (activeAITab === 'document' && !aiFile)}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isGenerating ? 'Generating...' : 'Generate Magic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuiz;

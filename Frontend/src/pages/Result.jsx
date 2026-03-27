import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Trophy, ArrowLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Result = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.username || user.name || 'Student';

  useEffect(() => {
    fetchAttemptDetails();
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load result details. It may not exist or you do not have permission.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading detailed results...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!result) return <div className="p-8 text-center">No result found.</div>;

  const { quiz_title, score, total, percentage, questions } = result;
  
  // Decide icon based on score
  const isSuccess = percentage >= 50;

  const downloadCertificate = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById('certificate-print');
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('landscape', 'px', [800, 600]);
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);
      pdf.save(`${quiz_title.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error("Failed to generate certificate", err);
      alert("Failed to generate certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-fade-in-up pb-24 relative">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/user/my-attempts')} 
          className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to Attempts
        </button>
        <div className="flex space-x-3">
          {isSuccess && (
            <button 
              onClick={downloadCertificate} 
              disabled={downloading}
              className={`flex items-center px-4 py-2 ${downloading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-white font-medium rounded-xl shadow-sm transition`}
            >
              <Download size={18} className="mr-2" />
              {downloading ? 'Generating...' : 'Certificate'}
            </button>
          )}
          <button 
            onClick={() => navigate(`/user/play-quiz/${result.quiz_id}`)} 
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-xl shadow-sm hover:bg-primary-700 transition"
          >
            Retake Quiz
          </button>
        </div>
      </div>

      {/* Header Summary Card */}
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 w-full text-center mb-8 relative overflow-hidden">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm ${percentage === 100 ? 'bg-yellow-100 text-yellow-500' : isSuccess ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
          {percentage === 100 ? <Trophy size={48} /> : isSuccess ? <CheckCircle size={48} /> : <XCircle size={48} />}
        </div>
        
        <h1 className="text-4xl font-extrabold mb-3 text-gray-900">Detailed Review</h1>
        <p className="text-gray-500 mb-8 text-lg font-medium">Quiz: <span className="text-gray-800">{quiz_title}</span></p>

        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <p className="text-sm text-green-700 font-bold uppercase tracking-wider mb-1">Correct Answers</p>
            <p className="text-4xl font-black text-green-700">{score}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <p className="text-sm text-red-700 font-bold uppercase tracking-wider mb-1">Wrong Answers</p>
            <p className="text-4xl font-black text-red-700">{total - score}</p>
          </div>
          <div className={`p-6 rounded-2xl border-2 ${percentage >= 80 ? 'bg-green-50 border-green-200' : isSuccess ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-sm font-bold uppercase tracking-wider mb-1 text-gray-600">Percentage</p>
            <p className={`text-4xl font-black ${percentage >= 80 ? 'text-green-700' : isSuccess ? 'text-yellow-700' : 'text-red-700'}`}>{percentage}%</p>
          </div>
        </div>
      </div>

      {/* Detailed Question Review */}
      {questions && questions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 px-2">Question Breakdown</h2>
          {questions.map((q, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${q.is_correct ? 'border-green-100' : 'border-red-100'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
                  <span className="text-gray-400 mr-2">{index + 1}.</span> 
                  {q.question}
                </h3>
                <div className="flex-shrink-0 mt-1">
                  {q.is_correct ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                      <CheckCircle size={16} className="mr-1.5" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                      <XCircle size={16} className="mr-1.5" /> Incorrect
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-5">
                {q.options.map((opt, optIdx) => {
                  let optStyle = "border-gray-100 bg-gray-50 text-gray-700";
                  let isSelected = (opt === q.user_answer);
                  let isCorrectOption = (opt === q.correct_answer);

                  if (isCorrectOption) {
                    optStyle = "border-green-500 bg-green-50 text-green-900 font-medium ring-1 ring-green-500";
                  } else if (isSelected && !q.is_correct) {
                    optStyle = "border-red-400 bg-red-50 text-red-900 ring-1 ring-red-400 opacity-90";
                  } else if (isSelected) {
                    // Fallback for an odd state
                    optStyle = "border-primary-500 bg-primary-50 text-primary-900";
                  }

                  return (
                     <div key={optIdx} className={`flex items-center p-4 border rounded-xl transition-all ${optStyle}`}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 ${
                            isCorrectOption ? 'border-green-500 bg-green-500' : 
                            (isSelected && !q.is_correct) ? 'border-red-500 bg-red-500' : 
                            'border-gray-300'
                        }`}>
                            {isCorrectOption && <CheckCircle size={14} className="text-white" />}
                            {(isSelected && !q.is_correct) && <XCircle size={14} className="text-white" />}
                        </div>
                        <span className="flex-1">{opt}</span>
                        {isSelected && !isCorrectOption && <span className="text-xs font-bold text-red-600 ml-3 bg-white px-2 py-1 rounded-md shadow-sm border border-red-100">Your Answer</span>}
                        {isCorrectOption && <span className="text-xs font-bold text-green-600 ml-3 bg-white px-2 py-1 rounded-md shadow-sm border border-green-100">Correct Answer</span>}
                     </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Certificate */}
      {isSuccess && (
        <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
          <div 
            id="certificate-print"
            style={{
              width: '800px',
              height: '600px',
              padding: '40px',
              backgroundColor: '#fff',
              border: '20px solid #10b981',
              boxSizing: 'border-box',
              fontFamily: 'sans-serif',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ border: '4px solid #10b981', padding: '40px', height: '100%', boxSizing: 'border-box' }}>
              <h1 style={{ fontSize: '42px', color: '#111827', margin: '0 0 10px 0' }}>Certificate of Completion</h1>
              <p style={{ fontSize: '20px', color: '#4b5563', margin: '0 0 30px 0' }}>This acknowledges that</p>
              <h2 style={{ fontSize: '36px', color: '#10b981', margin: '0 0 30px 0', borderBottom: '2px solid #e5e7eb', display: 'inline-block', paddingBottom: '10px', minWidth: '400px' }}>
                {userName}
              </h2>
              <p style={{ fontSize: '20px', color: '#4b5563', margin: '0 0 20px 0' }}>has successfully completed the quiz</p>
              <h3 style={{ fontSize: '28px', color: '#111827', margin: '0 0 30px 0' }}>{quiz_title}</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '30px' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Score</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{percentage}%</p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Date</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;

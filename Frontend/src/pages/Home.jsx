import { Link } from 'react-router-dom';
import { Brain, Users, BarChart3 } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex-grow flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6 animate-fade-in">
          Create and Take <span className="text-primary-600">Smart Quizzes</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-10">
          Build quizzes, manage groups, and analyze results with our powerful and intuitive platform.
        </p>
        <div className="flex justify-center">
          <Link 
            to="/signup" 
            className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-lg font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-lg text-gray-500">Powerful tools designed for educators, trainers, and teams.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="group bg-gray-50 rounded-2xl p-8 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl shadow-sm transition-all duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Quizzes</h3>
              <p className="text-gray-600 leading-relaxed">
                Easily craft engaging quizzes with multiple question types, automated grading, and customizable timers.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="group bg-gray-50 rounded-2xl p-8 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl shadow-sm transition-all duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Group Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Organize participants into groups, assign specific quizzes, and manage permissions with ease.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="group bg-gray-50 rounded-2xl p-8 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl shadow-sm transition-all duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Track performance instantly with comprehensive analytics, detailed reports, and actionable insights.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

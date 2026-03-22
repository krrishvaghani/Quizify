import { useState } from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirmation is required';
    else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Please correct the errors before submitting');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Signup successful! You can now log in.');
        // Optional: clear form or redirect to login
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        alert('Signup failed: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during signup:', error);
      alert('Network error. Please make sure the backend is running.');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Join Quizify to start building smart quizzes
          </p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={`appearance-none block w-full px-4 py-3 border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-primary-500'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-primary-500'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-primary-500'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`appearance-none block w-full px-4 py-3 border ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-primary-500'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
              Select Role
            </label>
            <select
              id="role"
              name="role"
              className="appearance-none block w-full px-4 py-3 border border-gray-200 focus:ring-primary-500 rounded-xl shadow-sm placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 sm:text-sm transition-colors"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.98] mt-2"
          >
            Create account
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

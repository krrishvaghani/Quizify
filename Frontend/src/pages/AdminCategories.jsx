import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Tag } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/categories/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      alert('Please enter a category name');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/api/categories/create',
        { name: newCategory.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories([...categories, { category_id: res.data.category_id, name: res.data.name }]);
      setNewCategory('');
      alert('Category created successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Categories</h1>
        <p className="text-gray-500 mt-2">Manage quiz categories for your platform.</p>
      </div>

      {/* Add Category Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Category</h2>
        <form onSubmit={handleAddCategory} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
              placeholder="e.g. Science, History, Technology..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              maxLength={50}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-sm hover:bg-primary-700 hover:shadow-md transition-all focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={20} />
            {submitting ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">All Categories</h2>
          <span className="bg-primary-50 text-primary-700 py-1 px-3 rounded-full text-sm font-semibold border border-primary-100">
            {categories.length} total
          </span>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-500">No categories created yet. Add one above!</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div
                key={cat.category_id}
                className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-primary-50 hover:border-primary-200 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Tag size={20} />
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-primary-700 transition-colors">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;

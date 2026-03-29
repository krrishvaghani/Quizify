import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminSettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tokenExpiryMinutes, setTokenExpiryMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://127.0.0.1:8000/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTokenExpiryMinutes(res.data?.token_expiry_minutes || 60);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to load admin settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('error', 'Please fill both password fields.');
      return;
    }

    try {
      setSavingPassword(true);
      await axios.post(
        'http://127.0.0.1:8000/api/admin/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentPassword('');
      setNewPassword('');
      showToast('success', 'Password changed successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveTokenExpiry = async () => {
    try {
      setSavingSettings(true);
      await axios.put(
        'http://127.0.0.1:8000/api/admin/settings',
        { token_expiry_minutes: Number(tokenExpiryMinutes) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('success', 'Token expiry updated successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to update token expiry.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-md text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Settings</h1>
        <p className="mt-2 text-gray-600">Manage password security and token expiry configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {savingPassword ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Token Expiry</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Token Expiry Minutes</label>
              <input
                type="number"
                min={5}
                max={1440}
                value={tokenExpiryMinutes}
                onChange={(e) => setTokenExpiryMinutes(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveTokenExpiry}
              disabled={savingSettings}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Token Expiry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

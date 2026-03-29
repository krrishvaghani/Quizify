import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [busyUserId, setBusyUserId] = useState('');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const downloadUsersExport = async (type) => {
    const token = localStorage.getItem('token');
    const endpoint =
      type === 'csv'
        ? 'http://127.0.0.1:8000/api/admin/export/users/csv'
        : 'http://127.0.0.1:8000/api/admin/export/users/excel';
    const extension = type === 'csv' ? 'csv' : 'xlsx';

    try {
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', `${type.toUpperCase()} exported successfully.`);
    } catch (err) {
      showToast('error', err.response?.data?.detail || `Failed to export ${type.toUpperCase()}.`);
    }
  };

  const handleDelete = async (userId, username) => {
    const shouldDelete = window.confirm(`Delete ${username}? This will soft-delete the account and preserve analytics data.`);
    if (!shouldDelete) {
      return;
    }

    try {
      setBusyUserId(userId);
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? {
                ...u,
                is_deleted: true,
              }
            : u
        )
      );
      showToast('success', 'User soft-deleted successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setBusyUserId('');
    }
  };

  const handleToggleBlock = async (userId, currentBlocked, isDeleted) => {
    if (isDeleted) {
      showToast('error', 'Deleted users cannot be blocked or unblocked.');
      return;
    }

    try {
      setBusyUserId(userId);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://127.0.0.1:8000/api/admin/user/${userId}/block`,
        { is_blocked: !currentBlocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? {
                ...u,
                is_blocked: !currentBlocked,
              }
            : u
        )
      );

      showToast('success', `User ${currentBlocked ? 'unblocked' : 'blocked'} successfully.`);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to update user status.');
    } finally {
      setBusyUserId('');
    }
  };

  const handleRoleChange = async (userId, nextRole) => {
    try {
      setBusyUserId(userId);
      const token = localStorage.getItem('token');
      await axios.put(
        `http://127.0.0.1:8000/api/admin/user/${userId}/role`,
        { role: nextRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: nextRole } : u))
      );
      showToast('success', 'User role updated successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to update role.');
    } finally {
      setBusyUserId('');
    }
  };

  if (loading) {
    return <div className="p-8">Loading users...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
            <p className="mt-2 text-gray-600">Manage user accounts, block misuse, and keep your platform healthy.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadUsersExport('csv')}
              className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => downloadUsersExport('excel')}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Username</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Attempts</th>
                <th className="text-left px-4 py-3 font-semibold">Avg Score</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map((item) => {
                  const isBusy = busyUserId === item.user_id;
                  const isAdminRole = (item.role || 'user') === 'admin';
                  const statusLabel = item.is_deleted ? 'Deleted' : item.is_blocked ? 'Blocked' : 'Active';
                  const statusClass = item.is_deleted
                    ? 'bg-gray-200 text-gray-700'
                    : item.is_blocked
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700';
                  return (
                    <tr
                      key={item.user_id}
                      className={`border-t border-gray-100 ${item.is_deleted ? 'bg-gray-100/80' : item.is_blocked ? 'bg-red-50/60' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{item.username || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-700">{item.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{item.total_attempts ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{Number(item.average_score ?? 0).toFixed(2)}%</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.role || 'user'}
                          onChange={(e) => handleRoleChange(item.user_id, e.target.value)}
                          disabled={isBusy || item.is_deleted}
                          className="px-2 py-1 border border-gray-200 rounded-md text-xs font-semibold bg-white disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBlock(item.user_id, item.is_blocked, item.is_deleted)}
                            disabled={isBusy || item.is_deleted || isAdminRole}
                            className={`px-3 py-1.5 rounded-md text-white text-xs font-semibold transition-colors disabled:opacity-50 ${
                              item.is_blocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                          >
                            {item.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDelete(item.user_id, item.username || 'this user')}
                            disabled={isBusy || item.is_deleted || isAdminRole}
                            className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

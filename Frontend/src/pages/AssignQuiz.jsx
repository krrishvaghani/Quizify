import { useEffect, useState } from 'react';
import axios from 'axios';

const AssignQuiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupUsers, setNewGroupUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizRes, userRes, groupRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/quizzes/admin', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://127.0.0.1:8000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://127.0.0.1:8000/api/admin/groups', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const quizData = quizRes.data || [];
      setQuizzes(quizData);
      setUsers((userRes.data || []).filter((u) => !u.is_deleted && (u.role || 'user') === 'user'));
      setGroups(groupRes.data || []);
      if (quizData.length > 0) {
        setSelectedQuiz((prev) => prev || quizData[0].quiz_id);
      }
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to load assignment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeQuiz = quizzes.find((q) => q.quiz_id === selectedQuiz);

  useEffect(() => {
    if (!activeQuiz) {
      setSelectedUsers([]);
      setSelectedGroups([]);
      return;
    }
    setSelectedUsers(activeQuiz.assigned_users || []);
    setSelectedGroups(activeQuiz.assigned_groups || []);
  }, [selectedQuiz, activeQuiz?.quiz_id]);

  const toggleValue = (value, setter) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showToast('error', 'Please enter a group name.');
      return;
    }

    try {
      setIsCreatingGroup(true);
      const res = await axios.post(
        'http://127.0.0.1:8000/api/admin/groups',
        {
          name: newGroupName.trim(),
          users: newGroupUsers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const created = res.data;
      setGroups((prev) => [
        ...prev,
        {
          group_id: created.group_id,
          name: created.name,
          users: created.users || [],
          user_count: (created.users || []).length,
        },
      ]);
      setNewGroupName('');
      setNewGroupUsers([]);
      showToast('success', 'Group created successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to create group.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedQuiz) {
      showToast('error', 'Please select a quiz first.');
      return;
    }

    try {
      setIsSavingAssignment(true);
      await axios.put(
        `http://127.0.0.1:8000/api/admin/quiz/${selectedQuiz}/assign`,
        {
          assigned_users: selectedUsers,
          assigned_groups: selectedGroups,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuizzes((prev) =>
        prev.map((q) =>
          q.quiz_id === selectedQuiz
            ? {
                ...q,
                assigned_users: selectedUsers,
                assigned_groups: selectedGroups,
              }
            : q
        )
      );

      showToast('success', 'Quiz assignment updated successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to update assignment.');
    } finally {
      setIsSavingAssignment(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading assignment panel...</div>;
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Assignment Management</h1>
        <p className="mt-2 text-gray-600">Centralize quiz assignment and group management in one place.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Quiz</label>
        <select
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
          value={selectedQuiz}
          onChange={(e) => setSelectedQuiz(e.target.value)}
        >
          {quizzes.length === 0 ? (
            <option value="">No quizzes found</option>
          ) : (
            quizzes.map((q) => (
              <option key={q.quiz_id} value={q.quiz_id}>
                {q.title}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Assign Users</h2>
          <div className="max-h-[360px] overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-gray-500">No users available.</p>
            ) : (
              users.map((u) => (
                <label key={u.user_id} className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.user_id)}
                    onChange={() => toggleValue(u.user_id, setSelectedUsers)}
                  />
                  <span>{u.username} ({u.email})</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Groups</h2>
          <div className="max-h-[360px] overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-500">No groups available.</p>
            ) : (
              groups.map((g) => (
                <label key={g.group_id} className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(g.group_id)}
                    onChange={() => toggleValue(g.group_id, setSelectedGroups)}
                  />
                  <span>{g.name} ({g.user_count ?? g.users?.length ?? 0} users)</span>
                </label>
              ))
            )}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <h3 className="text-base font-bold text-gray-900">Create Group</h3>
            <p className="text-sm text-gray-500 mt-1">Create a group without leaving this page.</p>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Group Name</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. CS-Section-A"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />

            <p className="text-sm font-medium text-gray-700 mt-4 mb-2">Group Users</p>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500">No users available.</p>
              ) : (
                users.map((u) => (
                  <label key={`new-${u.user_id}`} className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={newGroupUsers.includes(u.user_id)}
                      onChange={() => toggleValue(u.user_id, setNewGroupUsers)}
                    />
                    <span>{u.username} ({u.email})</span>
                  </label>
                ))
              )}
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={isCreatingGroup}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isCreatingGroup ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleAssign}
          disabled={!selectedQuiz || isSavingAssignment}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {isSavingAssignment ? 'Saving...' : 'Save Assignment'}
        </button>
      </div>
    </div>
  );
};

export default AssignQuiz;

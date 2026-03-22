import { Link, useLocation } from 'react-router-dom';
import { Home, PlayCircle, List, CheckSquare, LogOut } from 'lucide-react';

const UserSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { name: 'Dashboard', path: '/user', icon: <Home size={20} /> },
    { name: 'Take Quiz', path: '/user/quizzes', icon: <PlayCircle size={20} /> },
    { name: 'My Attempts', path: '/user/my-attempts', icon: <List size={20} /> },
    { name: 'Results', path: '/user/results', icon: <CheckSquare size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = '/login';
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-primary-600">Quizify</h1>
      </div>
      
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  currentPath === item.path || (item.path !== '/user' && currentPath.startsWith(item.path))
                    ? 'text-primary-700 bg-primary-50 border-r-4 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;

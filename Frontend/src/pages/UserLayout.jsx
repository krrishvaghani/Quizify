import { Outlet } from 'react-router-dom';
import UserSidebar from '../components/UserSidebar';

const UserLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto max-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default UserLayout;

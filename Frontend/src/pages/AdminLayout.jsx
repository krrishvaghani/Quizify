import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto max-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

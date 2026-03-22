import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (!userStr || !token) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    if (user.role !== allowedRole) {
      // Redirect based on role
      return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />;
    }
  } catch (error) {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

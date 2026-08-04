import MainLayout from './MainLayout';

/**
 * ProtectedLayout — Auth guard wrapper for protected application routes.
 * In this phase (no backend auth yet), it renders MainLayout directly.
 * TODO: Connect to AuthContext / JWT check when ASP.NET Core Web API is active.
 */
export const ProtectedLayout = () => {
  return <MainLayout />;
};

export default ProtectedLayout;

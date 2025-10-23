import { useAuth } from '../context/AuthContext';

export default function Roles() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Ultimate Werewolf</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Roles</h2>
        <p className="text-gray-600">Roles management coming soon...</p>
      </div>
    </div>
  );
}
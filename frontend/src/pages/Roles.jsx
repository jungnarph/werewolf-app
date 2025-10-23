import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RoleList from '../components/RoleList';
import RoleForm from '../components/RoleForm';

export default function Roles() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setEditingRole(null);
    setShowForm(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingRole(null);
    setRefreshKey(prev => prev + 1); // Trigger re-render
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRole(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-blue-600">Ultimate Werewolf</h1>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/roles')}
                  className="px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
                >
                  Roles
                </button>
                <button
                  onClick={() => navigate('/decks')}
                  className="px-4 py-2 text-gray-600 hover:text-blue-600"
                >
                  Deck Builder
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <RoleList
          key={refreshKey}
          onEdit={handleEdit}
          onCreateNew={handleCreateNew}
        />
      </div>

      {/* Modal Form */}
      {showForm && (
        <RoleForm
          role={editingRole}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
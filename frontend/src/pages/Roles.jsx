import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import RoleList from '../components/RoleList';
import RoleForm from '../components/RoleForm';

export default function Roles() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
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
    showToast('success', editingRole ? 'Role updated successfully!' : 'Role created successfully!');
    setShowForm(false);
    setEditingRole(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRole(null);
  };

  const handleLogout = async () => {
    await logout();
    showToast('success', 'Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation - keep as is */}
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
                  className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Deck Builder
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, <span className="font-semibold">{user?.username}</span></span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
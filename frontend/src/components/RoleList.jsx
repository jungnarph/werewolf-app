import { useEffect, useState } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';

export default function RoleList({ onEdit, onCreateNew }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data);
      showToast('success', `Loaded ${data.length} roles`, 2000);
    } catch (error) {
      console.error('Failed to load roles:', error);
      showToast('error', 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await api.delete(`/roles/${deleteConfirm.id}`);
      setRoles(roles.filter(r => r.id !== deleteConfirm.id));
      showToast('success', `Deleted "${deleteConfirm.name}"`);
    } catch (error) {
      showToast('error', 'Failed to delete role');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesFilter = filter === 'all' || role.team === filter;
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTeamColor = (team) => {
    const colors = {
      'Villager': 'bg-blue-100 text-blue-800',
      'Werewolf': 'bg-red-100 text-red-800',
      'Village/Werewolf': 'bg-purple-100 text-purple-800',
      'Neutral': 'bg-gray-100 text-gray-800'
    };
    return colors[team] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" text="Loading roles..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header with filters and search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({roles.length})
            </button>
            <button
              onClick={() => setFilter('Villager')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'Villager' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Villagers ({roles.filter(r => r.team === 'Villager').length})
            </button>
            <button
              onClick={() => setFilter('Werewolf')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'Werewolf' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Werewolves ({roles.filter(r => r.team === 'Werewolf').length})
            </button>
            <button
              onClick={() => setFilter('Neutral')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'Neutral' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Neutral ({roles.filter(r => r.team === 'Neutral').length})
            </button>
          </div>

          <button
            onClick={onCreateNew}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-md transition-all hover:shadow-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Create Role
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Roles Grid */}
      {filteredRoles.length === 0 ? (
        <div className="bg-white rounded-lg shadow">
          <EmptyState
            icon={Plus}
            title={searchTerm ? "No roles found" : "No roles yet"}
            description={searchTerm ? `No roles match "${searchTerm}"` : "Create your first role to get started"}
            actionText={!searchTerm && "Create Your First Role"}
            onAction={!searchTerm && onCreateNew}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {filteredRoles.map(role => (
            <div 
              key={role.id} 
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              {/* Role Image */}
              {role.image_url ? (
                <div className="relative w-full" style={{ paddingBottom: '135.7%' }}>
                  <img
                    src={role.image_url}
                    alt={role.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              ) : (
                <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center" style={{ paddingBottom: '150%' }}>
                  <span className="absolute text-gray-400 text-5xl font-bold">?</span>
                </div>
              )}

              {/* Role Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{role.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getTeamColor(role.team)}`}>
                    {role.team}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[40px]">
                  {role.description || 'No description'}
                </p>

                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xl font-bold ${role.score >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {role.score > 0 ? '+' : ''}{role.score}
                  </span>
                  <span className="text-xs text-gray-500">Score</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(role)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(role)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Role"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
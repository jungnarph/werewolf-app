import { useEffect, useState } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function RoleList({ onEdit, onCreateNew }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await api.delete(`/roles/${id}`);
      setRoles(roles.filter(r => r.id !== id));
    } catch (error) {
      alert('Failed to delete role');
    }
  };

  const filteredRoles = filter === 'all' 
    ? roles 
    : roles.filter(r => r.team === filter);

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
    return <div className="text-center py-8">Loading roles...</div>;
  }

  return (
    <div>
      {/* Header with filters */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            All ({roles.length})
          </button>
          <button
            onClick={() => setFilter('Villager')}
            className={`px-4 py-2 rounded ${filter === 'Villager' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Villagers
          </button>
          <button
            onClick={() => setFilter('Werewolf')}
            className={`px-4 py-2 rounded ${filter === 'Werewolf' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Werewolves
          </button>
          <button
            onClick={() => setFilter('Neutral')}
            className={`px-4 py-2 rounded ${filter === 'Neutral' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Neutral
          </button>
        </div>

        <button
          onClick={onCreateNew}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      {filteredRoles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No roles found</p>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Create Your First Role
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRoles.map(role => (
            <div key={role.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Role Image */}
              {role.image_url ? (
                <img
                  src={role.image_url}
                  alt={role.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">?</span>
                </div>
              )}

              {/* Role Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{role.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getTeamColor(role.team)}`}>
                    {role.team}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {role.description || 'No description'}
                </p>

                <div className="flex justify-between items-center mb-3">
                  <span className={`text-lg font-bold ${role.score >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    Score: {role.score > 0 ? '+' : ''}{role.score}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(role)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
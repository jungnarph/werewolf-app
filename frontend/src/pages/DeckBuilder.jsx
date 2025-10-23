import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Minus, Save, Trash2 } from 'lucide-react';

export default function DeckBuilder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(new Map());
  const [deckName, setDeckName] = useState('');
  const [savedDecks, setSavedDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, decksRes] = await Promise.all([
        api.get('/roles'),
        api.get('/decks')
      ]);
      setRoles(rolesRes.data);
      setSavedDecks(decksRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRole = (roleId) => {
    setSelectedRoles(prev => {
      const newMap = new Map(prev);
      newMap.set(roleId, (newMap.get(roleId) || 0) + 1);
      return newMap;
    });
  };

  const removeRole = (roleId) => {
    setSelectedRoles(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roleId) || 0;
      if (current > 1) {
        newMap.set(roleId, current - 1);
      } else {
        newMap.delete(roleId);
      }
      return newMap;
    });
  };

  const setQuantity = (roleId, quantity) => {
    setSelectedRoles(prev => {
      const newMap = new Map(prev);
      if (quantity <= 0) {
        newMap.delete(roleId);
      } else {
        newMap.set(roleId, quantity);
      }
      return newMap;
    });
  };

  const totalPlayers = useMemo(() => {
    return Array.from(selectedRoles.values()).reduce((sum, qty) => sum + qty, 0);
  }, [selectedRoles]);

  const totalScore = useMemo(() => {
    return Array.from(selectedRoles.entries()).reduce((sum, [roleId, qty]) => {
      const role = roles.find(r => r.id === parseInt(roleId));
      return sum + (role ? role.score * qty : 0);
    }, 0);
  }, [selectedRoles, roles]);

  const teamDistribution = useMemo(() => {
    const distribution = { Villager: 0, Werewolf: 0, 'Village/Werewolf': 0, Neutral: 0 };
    selectedRoles.forEach((qty, roleId) => {
      const role = roles.find(r => r.id === parseInt(roleId));
      if (role) {
        distribution[role.team] += qty;
      }
    });
    return distribution;
  }, [selectedRoles, roles]);

  const balanceStatus = useMemo(() => {
    if (totalScore > 5) return { text: 'Werewolf Heavy', color: 'text-red-600' };
    if (totalScore < -5) return { text: 'Villager Heavy', color: 'text-blue-600' };
    return { text: 'Balanced', color: 'text-green-600' };
  }, [totalScore]);

  const saveDeck = async () => {
    if (!deckName.trim()) {
      alert('Please enter a deck name');
      return;
    }

    if (selectedRoles.size === 0) {
      alert('Please add at least one role to the deck');
      return;
    }

    try {
      const deckRoles = Array.from(selectedRoles.entries()).map(([roleId, quantity]) => ({
        role_id: parseInt(roleId),
        quantity
      }));

      await api.post('/decks', {
        name: deckName,
        roles: deckRoles
      });

      alert('Deck saved successfully!');
      setDeckName('');
      setSelectedRoles(new Map());
      loadData();
    } catch (error) {
      alert('Failed to save deck');
    }
  };

  const loadDeck = (deck) => {
    setDeckName(deck.name);
    const roleMap = new Map();
    deck.DeckRoles?.forEach(dr => {
      roleMap.set(dr.role_id, dr.quantity);
    });
    setSelectedRoles(roleMap);
  };

  const deleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    try {
      await api.delete(`/decks/${deckId}`);
      setSavedDecks(savedDecks.filter(d => d.id !== deckId));
    } catch (error) {
      alert('Failed to delete deck');
    }
  };

  const clearDeck = () => {
    if (selectedRoles.size > 0 && !confirm('Clear current deck?')) return;
    setSelectedRoles(new Map());
    setDeckName('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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
                  className="px-4 py-2 text-gray-600 hover:text-blue-600"
                >
                  Roles
                </button>
                <button
                  onClick={() => navigate('/decks')}
                  className="px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Roles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Available Roles</h2>
              
              {roles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No roles available. Create some roles first!</p>
                  <button
                    onClick={() => navigate('/roles')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Go to Roles
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {roles.map(role => (
                    <div
                      key={role.id}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => addRole(role.id)}
                    >
                      {role.image_url ? (
                        <div className="relative w-full" style={{ paddingBottom: '135.7%' }}>
                            <img
                            src={role.image_url}
                            alt={role.name}
                            className="absolute inset-0 w-full h-full object-cover rounded mb-2"
                            />
                        </div>
                        ) : (
                        <div className="relative w-full bg-gray-200 rounded mb-2 flex items-center justify-center" style={{ paddingBottom: '150%' }}>
                            <span className="absolute text-gray-400 text-2xl">?</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-sm">{role.name}</h3>
                      <p className="text-xs text-gray-600">{role.team}</p>
                      <p className="text-xs font-bold text-blue-600">Score: {role.score}</p>
                      {selectedRoles.has(role.id) && (
                        <div className="mt-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded text-center">
                          Selected: {selectedRoles.get(role.id)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Decks */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Saved Decks</h2>
              {savedDecks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No saved decks yet</p>
              ) : (
                <div className="space-y-2">
                  {savedDecks.map(deck => (
                    <div key={deck.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                      <div>
                        <h3 className="font-semibold">{deck.name}</h3>
                        <p className="text-sm text-gray-600">
                          {deck.DeckRoles?.reduce((sum, dr) => sum + dr.quantity, 0) || 0} roles
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadDeck(deck)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteDeck(deck.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Current Deck */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Current Deck</h2>

              {/* Stats */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-sm text-gray-600">Total Players</p>
                    <p className="text-2xl font-bold">{totalPlayers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Score</p>
                    <p className={`text-2xl font-bold ${totalScore >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {totalScore > 0 ? '+' : ''}{totalScore}
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">Balance: <span className={`font-bold ${balanceStatus.color}`}>{balanceStatus.text}</span></p>
                </div>
              </div>

              {/* Team Distribution */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2 text-sm">Team Distribution</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Villagers:</span>
                    <span className="font-bold text-blue-600">{teamDistribution.Villager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Werewolves:</span>
                    <span className="font-bold text-red-600">{teamDistribution.Werewolf}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Neutral:</span>
                    <span className="font-bold text-gray-600">{teamDistribution.Neutral}</span>
                  </div>
                </div>
              </div>

              {/* Selected Roles */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Selected Roles</h3>
                {selectedRoles.size === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No roles selected</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Array.from(selectedRoles.entries()).map(([roleId, quantity]) => {
                      const role = roles.find(r => r.id === parseInt(roleId));
                      if (!role) return null;
                      
                      return (
                        <div key={roleId} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{role.name}</p>
                            <p className="text-xs text-gray-600">Score: {role.score * quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeRole(roleId)}
                              className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(roleId, parseInt(e.target.value) || 0)}
                              className="w-12 text-center border rounded py-1"
                              min="0"
                            />
                            <button
                              onClick={() => addRole(roleId)}
                              className="bg-green-100 text-green-600 p-1 rounded hover:bg-green-200"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Deck Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Deck Name</label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="My Awesome Deck"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={saveDeck}
                  disabled={selectedRoles.size === 0 || !deckName.trim()}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Deck
                </button>
                <button
                  onClick={clearDeck}
                  disabled={selectedRoles.size === 0}
                  className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 disabled:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
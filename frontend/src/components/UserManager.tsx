import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Eye, EyeOff, Shield, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  created_at: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/v1/users', {
        username: newUsername,
        password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewUsername('');
      setNewPassword('');
      setShowCreateForm(false);
      await fetchUsers();
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      setDeleting(userId);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setDeleting(null);
    }
  };



  if (loading) {
    return (
      <div className="fade-in">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-slate-400">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="card-enhanced p-6 rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
              <Users className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gradient-primary">User Management</h2>
              <p className="text-slate-400 text-lg font-medium">Manage system users and permissions</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass p-4 rounded-2xl border border-red-500/30 bg-red-500/10 animate-shake">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div className="card-enhanced animate-slide-up">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <UserCheck className="w-6 h-6 mr-3 text-green-400" />
            Create New User
          </h3>
          <form onSubmit={createUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-modern"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-modern pr-12"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors duration-200 hover:scale-110"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1"
              >
                {creating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Create User</span>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewUsername('');
                  setNewPassword('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="card-enhanced">
        <h3 className="text-2xl font-bold text-gradient-primary mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-3 text-blue-400" />
          System Users ({users.length})
        </h3>
        
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">No users found</p>
            <p className="text-slate-500 text-sm">Create your first user to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((user, index) => (
              <div 
                key={user.id} 
                className="glass p-6 rounded-2xl hover-lift border border-slate-700/30 hover:border-purple-500/30 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{user.username}</h4>
                      <p className="text-sm text-slate-400">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-lg">
                      <span className="text-green-400 text-sm font-medium">Active</span>
                    </div>
                    <button
                      onClick={() => deleteUser(user.id, user.username)}
                      disabled={deleting === user.id}
                      className="btn-icon text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:border-red-400/30"
                    >
                      {deleting === user.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Folder, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff,
  Server,
  Shield,
  HardDrive,
  Network,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Globe,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Play,
  Square
} from 'lucide-react';
import axios from 'axios';

interface SambaShare {
  name: string;
  path: string;
  comment: string;
  readonly: boolean;
  browseable: boolean;
  guest_ok: boolean;
  valid_users: string[];
}

interface SambaConfig {
  workgroup: string;
  server_string: string;
  shares: SambaShare[];
}

interface SambaStatus {
  installed: boolean;
  running: boolean;
  version: string;
  shares: number;
}

const SambaManager: React.FC = () => {
  const [config, setConfig] = useState<SambaConfig>({
    workgroup: 'WORKGROUP',
    server_string: 'NAS Server',
    shares: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewShare, setShowNewShare] = useState(false);
  const [status, setStatus] = useState<SambaStatus>({
    installed: false,
    running: false,
    version: 'Unknown',
    shares: 0
  });
  const [newShare, setNewShare] = useState({
    name: '',
    path: '',
    comment: '',
    readonly: false,
    guest_ok: false
  });

  useEffect(() => {
    fetchConfig();
    checkSambaStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/samba/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
    } catch (err) {
      setError('Failed to fetch Samba configuration');
      console.error('Error fetching Samba config:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSambaStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/samba/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
    } catch (err) {
      setStatus(prev => ({ ...prev, running: false, installed: false }));
      console.error('Error checking Samba status:', err);
    }
  };

  const handleStartService = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/v1/samba/start', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await checkSambaStatus();
    } catch (err) {
      setError('Failed to start Samba service');
      console.error('Error starting Samba service:', err);
    }
  };

  const handleStopService = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/v1/samba/stop', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await checkSambaStatus();
    } catch (err) {
      setError('Failed to stop Samba service');
      console.error('Error stopping Samba service:', err);
    }
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShare.name.trim() || !newShare.path.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const shareData = {
        name: newShare.name,
        path: newShare.path,
        comment: newShare.comment,
        readonly: newShare.readonly,
        browseable: true,
        guest_ok: newShare.guest_ok,
        valid_users: []
      };
      
      await axios.post('/api/v1/samba/shares', shareData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewShare({
        name: '',
        path: '',
        comment: '',
        readonly: false,
        guest_ok: false
      });
      setShowNewShare(false);
      await fetchConfig();
    } catch (err) {
      setError('Failed to create share');
      console.error('Error creating share:', err);
    }
  };

  const handleDeleteShare = async (shareName: string) => {
    if (!confirm(`Are you sure you want to delete the share "${shareName}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/samba/shares/${shareName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchConfig();
    } catch (err) {
      setError('Failed to delete share');
      console.error('Error deleting share:', err);
    }
  };

  const getStatusIcon = (running: boolean) => {
    return running ? (
      <CheckCircle className="h-5 w-5 text-green-400" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-400" />
    );
  };

  const getStatusColor = (running: boolean) => {
    return running 
      ? 'text-green-400 bg-green-500/20 border-green-500/30'
      : 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-slate-400">Loading Samba configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Share2 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold gradient-text">Samba Sharing</h2>
              <p className="text-slate-400">Manage network file shares</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusColor(status.running)}`}>
              {getStatusIcon(status.running)}
              <span className="font-medium">{status.running ? 'Running' : 'Stopped'}</span>
            </div>
            <button
              onClick={status.running ? handleStopService : handleStartService}
              className={`glass-button flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                status.running 
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
              }`}
            >
              {status.running ? (
                <>
                  <UserX className="h-4 w-4" />
                  <span>Stop Service</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Start Service</span>
                </>
              )}
            </button>
            <button
              onClick={fetchConfig}
              className="glass-button p-2 rounded-lg transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3 backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Service Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Server className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Service Status</h3>
          </div>
          <div className="flex items-center space-x-2">
            {status.installed ? (
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${getStatusColor(status.running)}`}>
                  {getStatusIcon(status.running)}
                  <span className="font-medium">
                    {status.running ? 'Running' : 'Stopped'}
                  </span>
                </div>
                {status.running ? (
                  <button
                    onClick={handleStopService}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartService}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-yellow-400 text-sm">
                Samba not installed. Run: brew install samba
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Version:</span>
            <span className="ml-2 text-white">{status.version}</span>
          </div>
          <div>
            <span className="text-gray-400">Shares:</span>
            <span className="ml-2 text-white">{config.shares.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Installed:</span>
            <span className={`ml-2 ${status.installed ? 'text-green-400' : 'text-red-400'}`}>
              {status.installed ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowNewShare(!showNewShare)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Share</span>
        </button>
      </div>

      {/* New Share Form */}
      {showNewShare && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white">Create New Share</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Share Name</label>
              <input
                type="text"
                value={newShare.name}
                onChange={(e) => setNewShare({ ...newShare, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="e.g., public, media"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Path</label>
              <input
                type="text"
                value={newShare.path}
                onChange={(e) => setNewShare({ ...newShare, path: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="/Users/Shared/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comment</label>
            <input
              type="text"
              value={newShare.comment}
              onChange={(e) => setNewShare({ ...newShare, comment: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Description of this share"
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newShare.readonly}
                onChange={(e) => setNewShare({ ...newShare, readonly: e.target.checked })}
                className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Read Only</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newShare.guest_ok}
                onChange={(e) => setNewShare({ ...newShare, guest_ok: e.target.checked })}
                className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Guest Access</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateShare}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Create Share
            </button>
            <button
              onClick={() => setShowNewShare(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shares List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Active Shares</h3>
          <span className="text-sm text-slate-400">{config.shares.length} shares configured</span>
        </div>

        {config.shares.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No shares configured</p>
            <p className="text-sm text-slate-500">Create your first share to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config.shares.map((share) => (
              <div key={share.name} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Folder className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{share.name}</h4>
                      <p className="text-sm text-slate-400">{share.path}</p>
                      {share.comment && (
                        <p className="text-xs text-slate-500">{share.comment}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        {share.readonly ? (
                          <Lock className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-400" />
                        )}
                        <span className="text-slate-400">
                          {share.readonly ? 'Read-only' : 'Read-write'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {share.guest_ok ? (
                          <Globe className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Shield className="h-4 w-4 text-purple-400" />
                        )}
                        <span className="text-slate-400">
                          {share.guest_ok ? 'Guest access' : 'Auth required'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-400">
                          {share.valid_users.length || 'All'} users
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteShare(share.name)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
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

export default SambaManager;
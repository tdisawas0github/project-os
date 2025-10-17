import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Users, 
  Lock,
  Unlock,
  RefreshCw,
  Server,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';

interface SambaShare {
  name: string;
  path: string;
  comment: string;
  readOnly: boolean;
  guestAccess: boolean;
  users: string[];
}

interface SambaConfig {
  shares: SambaShare[];
  status: string;
}

interface SambaStatus {
  installed: boolean;
  running: boolean;
  version: string;
  shares: number;
}

const SambaManager: React.FC = () => {
  const [config, setConfig] = useState<SambaConfig>({ shares: [], status: 'stopped' });
  const [status, setStatus] = useState<SambaStatus>({ installed: false, running: false, version: 'unknown', shares: 0 });
  const [loading, setLoading] = useState(false);
  const [showNewShare, setShowNewShare] = useState(false);
  const [newShare, setNewShare] = useState<SambaShare>({
    name: '',
    path: '/Users/Shared',
    comment: '',
    readOnly: false,
    guestAccess: true,
    users: []
  });

  useEffect(() => {
    loadSambaConfig();
    loadSambaStatus();
  }, []);

  const loadSambaConfig = async () => {
    try {
      const response = await axios.get<SambaConfig>('http://localhost:8080/api/v1/samba/shares');
      setConfig(response.data);
    } catch (error) {
      console.error('Error loading Samba config:', error);
    }
  };

  const loadSambaStatus = async () => {
    try {
      const response = await axios.get<SambaStatus>('http://localhost:8080/api/v1/samba/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error loading Samba status:', error);
    }
  };

  const handleStartService = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/v1/samba/start');
      setTimeout(() => {
        loadSambaStatus();
        loadSambaConfig();
      }, 1000);
    } catch (error) {
      console.error('Error starting Samba service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopService = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/v1/samba/stop');
      setTimeout(() => {
        loadSambaStatus();
        loadSambaConfig();
      }, 1000);
    } catch (error) {
      console.error('Error stopping Samba service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    if (!newShare.name.trim() || !newShare.path.trim()) return;

    try {
      await axios.post('http://localhost:8080/api/v1/samba/shares', newShare);
      setNewShare({
        name: '',
        path: '/Users/Shared',
        comment: '',
        readOnly: false,
        guestAccess: true,
        users: []
      });
      setShowNewShare(false);
      loadSambaConfig();
    } catch (error) {
      console.error('Error creating share:', error);
    }
  };

  const handleDeleteShare = async (shareName: string) => {
    if (!confirm(`Are you sure you want to delete the share "${shareName}"?`)) return;

    try {
      await axios.delete(`http://localhost:8080/api/v1/samba/shares/${shareName}`);
      loadSambaConfig();
    } catch (error) {
      console.error('Error deleting share:', error);
    }
  };

  const getStatusColor = (running: boolean) => {
    return running ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (running: boolean) => {
    return running ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Share2 className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Samba File Sharing</h2>
        </div>
        <button
          onClick={() => {
            loadSambaConfig();
            loadSambaStatus();
          }}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Service Status */}
      <div className="bg-slate-800 rounded-lg p-6">
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
        <div className="bg-slate-800 rounded-lg p-6 space-y-4">
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
                checked={newShare.readOnly}
                onChange={(e) => setNewShare({ ...newShare, readOnly: e.target.checked })}
                className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Read Only</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newShare.guestAccess}
                onChange={(e) => setNewShare({ ...newShare, guestAccess: e.target.checked })}
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
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Active Shares</h3>
        </div>
        
        {config.shares.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Share2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No shares configured</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {config.shares.map((share, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Share2 className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-medium text-white">{share.name}</h4>
                      <div className="flex items-center space-x-2">
                        {share.readOnly ? (
                          <div title="Read Only">
                            <Lock className="w-4 h-4 text-yellow-400" />
                          </div>
                        ) : (
                          <div title="Read/Write">
                            <Unlock className="w-4 h-4 text-green-400" />
                          </div>
                        )}
                        {share.guestAccess ? (
                          <div title="Guest Access">
                            <Users className="w-4 h-4 text-blue-400" />
                          </div>
                        ) : (
                          <div title="Authenticated Only">
                            <Users className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{share.comment}</p>
                    <p className="text-sm font-mono text-gray-500">{share.path}</p>
                    {share.users.length > 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        Users: {share.users.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteShare(share.name)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete Share"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
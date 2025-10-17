import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Globe, 
  Router, 
  Shield, 
  Activity,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Network
} from 'lucide-react';
import axios from 'axios';

interface NetworkInterface {
  name: string;
  ip: string;
  mac: string;
  status: 'up' | 'down';
  type: 'ethernet' | 'wifi' | 'loopback';
  speed?: string;
  rx_bytes: number;
  tx_bytes: number;
}

interface NetworkConfig {
  hostname: string;
  dns_servers: string[];
  gateway: string;
  interfaces: NetworkInterface[];
}

const NetworkManager: React.FC = () => {
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'interfaces' | 'settings'>('overview');

  useEffect(() => {
    fetchNetworkConfig();
    const interval = setInterval(fetchNetworkConfig, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/network', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setNetworkConfig(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch network configuration');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case 'wifi':
        return <Wifi className="w-5 h-5 text-blue-500" />;
      case 'ethernet':
        return <Network className="w-5 h-5 text-green-500" />;
      default:
        return <Router className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'up' ? 'text-green-500' : 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading network configuration... 🔄</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Globe className="w-8 h-8 mr-3 text-blue-500" />
            Network Configuration 🌐
          </h2>
          <p className="text-gray-400 mt-1">Monitor and configure network settings</p>
        </div>
        <button
          onClick={fetchNetworkConfig}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('interfaces')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'interfaces' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Interfaces</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Network Info */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-500" />
              System Network
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Hostname:</span>
                <span className="text-white">{networkConfig?.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gateway:</span>
                <span className="text-white">{networkConfig?.gateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DNS Servers:</span>
                <div className="text-right">
                  {networkConfig?.dns_servers.map((dns, index) => (
                    <div key={index} className="text-white">{dns}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Interfaces */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Network className="w-5 h-5 mr-2 text-green-500" />
              Active Interfaces
            </h3>
            <div className="space-y-3">
              {networkConfig?.interfaces
                .filter(iface => iface.status === 'up' && iface.type !== 'loopback')
                .map((iface, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getInterfaceIcon(iface.type)}
                      <div>
                        <div className="text-white font-medium">{iface.name}</div>
                        <div className="text-gray-400 text-sm">{iface.ip}</div>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Interfaces Tab */}
      {activeTab === 'interfaces' && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Network className="w-5 h-5 mr-2 text-blue-500" />
            Network Interfaces
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-400">Interface</th>
                  <th className="text-left py-3 px-4 text-gray-400">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400">IP Address</th>
                  <th className="text-left py-3 px-4 text-gray-400">MAC Address</th>
                  <th className="text-left py-3 px-4 text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400">RX/TX</th>
                </tr>
              </thead>
              <tbody>
                {networkConfig?.interfaces.map((iface, index) => (
                  <tr key={index} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getInterfaceIcon(iface.type)}
                        <span className="text-white font-medium">{iface.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300 capitalize">{iface.type}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.ip || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-sm">{iface.mac}</td>
                    <td className="py-3 px-4">
                      <span className={`capitalize ${getStatusColor(iface.status)}`}>
                        {iface.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      <div>↓ {formatBytes(iface.rx_bytes)}</div>
                      <div>↑ {formatBytes(iface.tx_bytes)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-500" />
            Network Settings
          </h3>
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h4 className="text-xl font-bold text-white mb-2">Advanced Configuration</h4>
            <p className="text-gray-400 mb-4">Network settings configuration coming soon! 🚧</p>
            <p className="text-gray-500 text-sm">
              Features will include: Static IP configuration, DNS settings, 
              firewall rules, and network security options.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkManager;
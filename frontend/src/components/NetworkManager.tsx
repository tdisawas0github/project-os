import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Wifi, 
  Globe, 
  Server, 
  Activity, 
  Settings, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Router,
  Cable,
  Signal
} from 'lucide-react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';

interface NetworkInterface {
  name: string;
  ip: string;
  mac: string;
  status: string;
  type: string;
  speed: string;
  rx_bytes: number;
  tx_bytes: number;
}

interface NetworkConfig {
  hostname: string;
  dns_servers: string[];
  default_gateway: string;
  interfaces: NetworkInterface[];
}

const NetworkManager: React.FC = () => {
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNetworkConfig();
  }, []);

  const fetchNetworkConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/network', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNetworkConfig(response.data);
    } catch (err) {
      setError('Failed to fetch network configuration');
      console.error('Error fetching network config:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshNetworkConfig = async () => {
    setRefreshing(true);
    await fetchNetworkConfig();
    setRefreshing(false);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'up':
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'down':
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getInterfaceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wifi':
      case 'wireless':
        return <Wifi className="h-5 w-5 text-blue-400" />;
      case 'ethernet':
      case 'wired':
        return <Cable className="h-5 w-5 text-green-400" />;
      case 'loopback':
        return <Router className="h-5 w-5 text-purple-400" />;
      default:
        return <Network className="h-5 w-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-slate-400">Loading network configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="card">
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchNetworkConfig}
                className="glass-button px-4 py-2 rounded-lg transition-all duration-300"
              >
                Try Again
              </button>
            </div>
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
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Network className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold gradient-text">Network Configuration</h2>
              <p className="text-slate-400">Monitor and configure network settings</p>
            </div>
          </div>
          <button
            onClick={refreshNetworkConfig}
            disabled={refreshing}
            className="glass-button flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card slide-up">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Server className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Hostname</p>
              <p className="text-xl font-semibold text-white">{networkConfig?.hostname || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="metric-card slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Globe className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Default Gateway</p>
              <p className="text-xl font-semibold text-white">{networkConfig?.default_gateway || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="metric-card slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Signal className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Interfaces</p>
              <p className="text-xl font-semibold text-white">
                {networkConfig?.interfaces?.filter(iface => iface.status.toLowerCase() === 'up').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DNS Servers */}
      <div className="card slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Globe className="h-5 w-5 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">DNS Servers</h3>
        </div>
        
        {networkConfig?.dns_servers && networkConfig.dns_servers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {networkConfig.dns_servers.map((dns, index) => (
              <div
                key={index}
                className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-mono">{dns}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No DNS servers configured</p>
          </div>
        )}
      </div>

      {/* Network Interfaces */}
      <div className="card slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Activity className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Network Interfaces</h3>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
            {networkConfig?.interfaces?.length || 0} interfaces
          </span>
        </div>

        {networkConfig?.interfaces && networkConfig.interfaces.length > 0 ? (
          <div className="space-y-4">
            {networkConfig.interfaces.map((iface, index) => (
              <div
                key={iface.name}
                className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-6 backdrop-blur-sm hover:bg-slate-700/40 transition-all duration-300"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getInterfaceIcon(iface.type)}
                    <div>
                      <h4 className="text-lg font-semibold text-white">{iface.name}</h4>
                      <p className="text-sm text-slate-400 capitalize">{iface.type} Interface</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(iface.status)}
                    <Badge 
                      variant={iface.status.toLowerCase() === 'up' ? "default" : "secondary"}
                      className={iface.status.toLowerCase() === 'up' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}
                    >
                      {iface.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">IP Address</p>
                    <p className="text-white font-mono text-sm">{iface.ip || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">MAC Address</p>
                    <p className="text-white font-mono text-sm">{iface.mac || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Speed</p>
                    <p className="text-white font-mono text-sm">{iface.speed || 'Unknown'}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Traffic</p>
                    <div className="text-xs text-white">
                      <div className="flex items-center space-x-1">
                        <span className="text-green-400">↓</span>
                        <span>{formatBytes(iface.rx_bytes)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-blue-400">↑</span>
                        <span>{formatBytes(iface.tx_bytes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Network className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No network interfaces found</p>
          </div>
        )}
      </div>

      {/* Network Settings (Future) */}
      <div className="card slide-up" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Settings className="h-5 w-5 text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Network Settings</h3>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full border border-yellow-500/30">
            Coming Soon
          </span>
        </div>
        
        <div className="text-center py-8">
          <Settings className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Network configuration settings</p>
          <p className="text-sm text-slate-500">Configure static IPs, DNS, and routing settings</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkManager;
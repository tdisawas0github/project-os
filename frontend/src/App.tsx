import React, { useState, useEffect } from 'react';
import { 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Activity,
  Wifi,
  Settings,
  Users,
  FolderOpen,
  Files,
  Share2,
  LogOut,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import FileManager from './components/FileManager';
import SambaManager from './components/SambaManager';
import UserManager from './components/UserManager';
import LoginForm from './components/LoginForm';
import NetworkManager from './components/NetworkManager';
import { useAuth } from './hooks/useAuth';

interface SystemInfo {
  cpu: {
    usage: number
    cores: number
    model: string
  }
  memory: {
    total: number
    used: number
    available: number
    percent: number
  }
  disk: Array<{
    device: string
    mountpoint: string
    total: number
    used: number
    free: number
    percent: number
  }>
  host: {
    hostname: string
    os: string
    platform: string
    arch: string
  }
  uptime: number
}

function App() {
  const { user, isAuthenticated, loading: authLoading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      const fetchSystemInfo = async () => {
        try {
          const response = await axios.get('http://localhost:8080/api/v1/system/info');
          setSystemInfo(response.data);
        } catch (error) {
          console.error('Failed to fetch system info:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSystemInfo();
    }
  }, [isAuthenticated])

  const handleLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      await login(username, password);
    } catch (error: any) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('dashboard');
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading... 🔄</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900">
        <LoginForm 
          onLogin={handleLogin}
          error={loginError || undefined}
          loading={loginLoading}
        />
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getUsageColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500'
    if (percent < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-slate-300">Loading NAS OS Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Server className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-slate-400 text-sm">Make sure the backend server is running on port 8080</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="floating-header sticky top-0 z-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Server className="h-8 w-8 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-2xl font-bold gradient-text">NAS OS</h1>
            <span className="status-indicator text-xs text-green-400 font-medium">Online</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 rounded-lg backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-slate-300">Welcome, <span className="text-blue-400 font-medium">{user?.username}</span>!</span>
            </div>
            <button
              onClick={handleLogout}
              className="glass-button flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700/50">
          {[
             { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
             { id: 'files', label: 'Files', icon: FolderOpen },
             { id: 'samba', label: 'Sharing', icon: Share2 },
             { id: 'users', label: 'Users', icon: Users },
             { id: 'network', label: 'Network', icon: Wifi }
           ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 space-y-8">
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            {/* Welcome Section */}
            <div className="card mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold gradient-text mb-2">Welcome to NAS OS</h2>
                  <p className="text-slate-400">System: <span className="text-blue-400 font-medium">{systemInfo?.host.hostname}</span> • {systemInfo?.host.os} {systemInfo?.host.arch}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Uptime</p>
                    <p className="text-xl font-bold text-green-400">{formatUptime(systemInfo?.uptime || 0)}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Server className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* CPU Usage */}
              <div className="metric-card slide-up">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">CPU Usage</p>
                      <p className="text-xs text-slate-400">{systemInfo?.cpu.cores} cores</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{systemInfo?.cpu.usage.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getUsageColor(systemInfo?.cpu.usage || 0)}`}
                    style={{ width: `${systemInfo?.cpu.usage}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div className="metric-card slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <MemoryStick className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Memory</p>
                      <p className="text-xs text-slate-400">{formatBytes(systemInfo?.memory.total || 0)} total</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-400">{systemInfo?.memory.percent.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getUsageColor(systemInfo?.memory.percent || 0)}`}
                    style={{ width: `${systemInfo?.memory.percent}%` }}
                  />
                </div>
              </div>

              {/* Storage */}
              <div className="metric-card slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <HardDrive className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Storage</p>
                      <p className="text-xs text-slate-400">{formatBytes(systemInfo?.disk[0]?.free || 0)} free</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-400">
                    {systemInfo?.disk[0]?.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getUsageColor(systemInfo?.disk[0]?.percent || 0)}`}
                    style={{ width: `${systemInfo?.disk[0]?.percent}%` }}
                  />
                </div>
              </div>

              {/* Network Status */}
              <div className="metric-card slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Wifi className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Network</p>
                      <p className="text-xs text-slate-400">Connected</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-400">Online</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Status: Active</span>
                  <span>Latency: ~1ms</span>
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Information */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-blue-500" />
                  System Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hostname:</span>
                    <span>{systemInfo?.host.hostname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operating System:</span>
                    <span>{systemInfo?.host.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform:</span>
                    <span>{systemInfo?.host.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Architecture:</span>
                    <span>{systemInfo?.host.arch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CPU Model:</span>
                    <span className="text-right">{systemInfo?.cpu.model}</span>
                  </div>
                </div>
              </div>

              {/* Storage Details */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <HardDrive className="w-5 h-5 mr-2 text-purple-500" />
                  Storage Details
                </h3>
                <div className="space-y-4">
                  {systemInfo?.disk.map((disk, index) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{disk.device}</span>
                        <span className="text-sm text-slate-400">{disk.percent.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar mb-2">
                        <div 
                          className={`progress-fill ${getUsageColor(disk.percent)}`}
                          style={{ width: `${disk.percent}%` }}
                        />
                      </div>
                      <div className="text-sm text-slate-400">
                        <div>Mount: {disk.mountpoint}</div>
                        <div>
                          {formatBytes(disk.used)} used of {formatBytes(disk.total)} 
                          ({formatBytes(disk.free)} free)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && <FileManager />}
        {activeTab === 'sharing' && <SambaManager />}
        {activeTab === 'users' && <UserManager />}
        {activeTab === 'network' && <NetworkManager />}
      </main>
    </div>
  )
}

export default App

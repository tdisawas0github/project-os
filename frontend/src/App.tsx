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
  LogOut
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
    const fetchSystemInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/v1/system', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setSystemInfo(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to connect to NAS OS backend');
        console.error('Error fetching system info:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchSystemInfo()
      const interval = setInterval(fetchSystemInfo, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-white">NAS OS</h1>
              <p className="text-slate-400 text-sm">{systemInfo?.host.hostname}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <Activity className="w-4 h-4 text-green-500" />
              <span>Online</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <span>Welcome, {user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex space-x-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'files' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            <Files className="w-4 h-4" />
            <span>Files</span>
          </button>
          <button 
            onClick={() => setActiveTab('sharing')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'sharing' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Sharing</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('network')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'network' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Network</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && (
          <div>
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* CPU Usage */}
              <div className="metric-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">CPU Usage</span>
                  </div>
                  <span className="text-2xl font-bold">{systemInfo?.cpu.usage.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getUsageColor(systemInfo?.cpu.usage || 0)}`}
                    style={{ width: `${systemInfo?.cpu.usage}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">{systemInfo?.cpu.cores} cores</p>
              </div>

              {/* Memory Usage */}
              <div className="metric-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MemoryStick className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Memory</span>
                  </div>
                  <span className="text-2xl font-bold">{systemInfo?.memory.percent.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getUsageColor(systemInfo?.memory.percent || 0)}`}
                    style={{ width: `${systemInfo?.memory.percent}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {formatBytes(systemInfo?.memory.used || 0)} / {formatBytes(systemInfo?.memory.total || 0)}
                </p>
              </div>

              {/* Storage */}
              <div className="metric-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Storage</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {systemInfo?.disk[0]?.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getUsageColor(systemInfo?.disk[0]?.percent || 0)}`}
                    style={{ width: `${systemInfo?.disk[0]?.percent}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {formatBytes(systemInfo?.disk[0]?.free || 0)} free
                </p>
              </div>

              {/* Uptime */}
              <div className="metric-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Uptime</span>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-2">
                  {formatUptime(systemInfo?.uptime || 0)}
                </div>
                <p className="text-sm text-slate-400">System running</p>
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

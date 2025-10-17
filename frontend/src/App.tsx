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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:8080/api/v1/system', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          setSystemInfo(response.data);
        } catch (error) {
          console.error('Failed to fetch system info:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSystemInfo();
      // Set up interval to refresh system info every 5 seconds
      const interval = setInterval(fetchSystemInfo, 5000);
      
      return () => clearInterval(interval);
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
        {/* Modern Header */}
        <header className="glass-strong p-6 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-400/30">
                <Server className="w-8 h-8 text-gradient" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">NAS OS</h1>
                <p className="text-slate-300 font-medium">Network Attached Storage System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3 px-4 py-2 glass rounded-xl">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow"></div>
                  <span className="text-slate-200 font-medium">{user.username}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center space-x-2 hover-lift"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

      {/* Modern Navigation */}
      <nav className="px-6 py-4">
        <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700/50 animate-slide-in-right">
          {[
             { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
             { id: 'files', label: 'Files', icon: FolderOpen },
             { id: 'samba', label: 'Sharing', icon: Share2 },
             { id: 'users', label: 'Users', icon: Users },
             { id: 'network', label: 'Network', icon: Wifi }
           ].map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 active'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 space-y-8">
        {/* Modern Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Welcome Section */}
            <div className="glass-strong p-8 text-center">
              <h2 className="text-4xl font-bold text-gradient mb-4">
                Welcome to Your NAS
              </h2>
              <p className="text-xl text-slate-300 font-medium">
                Monitor and manage your network storage system
              </p>
            </div>

            {/* System Overview */}
            <div className="grid-modern">
              {/* CPU Card */}
              <Card className="group hover:scale-105 transition-transform duration-300 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 group-hover:scale-110 transition-transform duration-300">
                        <Cpu className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">CPU Usage</h3>
                        <p className="text-sm text-slate-400">{systemInfo?.cpu.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gradient">
                        {systemInfo?.cpu.usage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {systemInfo?.cpu.cores} cores
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getUsageColor(systemInfo?.cpu.usage || 0)}`}
                      style={{ width: `${systemInfo?.cpu.usage || 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Memory Card */}
              <Card className="group hover:scale-105 transition-transform duration-300 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 group-hover:scale-110 transition-transform duration-300">
                        <MemoryStick className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Memory</h3>
                        <p className="text-sm text-slate-400">System RAM</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gradient">
                        {systemInfo?.memory.percent.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatBytes(systemInfo?.memory.used || 0)} / {formatBytes(systemInfo?.memory.total || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getUsageColor(systemInfo?.memory.percent || 0)}`}
                      style={{ width: `${systemInfo?.memory.percent || 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Uptime Card */}
              <Card className="group hover:scale-105 transition-transform duration-300 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 group-hover:scale-110 transition-transform duration-300">
                        <Activity className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">System Uptime</h3>
                        <p className="text-sm text-slate-400">Continuous operation</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gradient">
                        {formatUptime(systemInfo?.uptime || 0)}
                      </div>
                      <div className="text-sm text-slate-400">
                        Running smoothly
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-slow"></div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      System Online
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Storage Details */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center text-gradient">
                  <HardDrive className="w-7 h-7 mr-3 text-purple-500" />
                  Storage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {systemInfo?.disk.map((disk, index) => (
                  <Card key={index} className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 transition-colors duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30">
                            <HardDrive className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <span className="font-bold text-lg text-white">{disk.device}</span>
                            <p className="text-sm text-slate-400">{disk.mountpoint}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-gradient">{disk.percent.toFixed(1)}%</span>
                          <Badge 
                            variant={disk.percent > 80 ? "destructive" : disk.percent > 60 ? "secondary" : "default"}
                            className="ml-2"
                          >
                            {disk.percent > 80 ? "High" : disk.percent > 60 ? "Medium" : "Low"} Usage
                          </Badge>
                        </div>
                      </div>
                      <div className="progress-bar mb-4">
                        <div 
                          className={`progress-fill ${getUsageColor(disk.percent)}`}
                          style={{ width: `${disk.percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>{formatBytes(disk.used)} used</span>
                        <span>{formatBytes(disk.free)} free</span>
                        <span>{formatBytes(disk.total)} total</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
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

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
  BarChart3,
  Menu,
  X,
  Home,
  Monitor,
  Shield,
  Bell,
  Search,
  Clock,
  Network,
  Database,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [loginLoading, setLoginLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed on mobile
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Auto-open on desktop
      } else {
        setSidebarOpen(false); // Auto-close on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  }, [isAuthenticated]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <div className="absolute inset-0 w-20 h-20 border-2 border-purple-500/20 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gradient-primary animate-pulse">
              Loading NAS OS
            </h2>
            <p className="text-slate-400 animate-fade-in-up">
              Initializing system dashboard...
            </p>
          </div>
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
    if (percent < 50) return 'bg-emerald-500'
    if (percent < 80) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getUsageBadgeVariant = (percent: number) => {
    if (percent < 50) return 'default'
    if (percent < 80) return 'secondary'
    return 'destructive'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-16 h-16 text-blue-500 animate-pulse mx-auto" />
          <p className="text-slate-300 text-lg">Loading NAS OS Dashboard... ⚡</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Server className="w-16 h-16 text-red-500 mx-auto" />
          <p className="text-red-400 text-lg font-medium">{error}</p>
          <p className="text-slate-400">Make sure the backend server is running on port 8080</p>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'System overview' },
    { id: 'files', label: 'File Manager', icon: FolderOpen, description: 'Browse files' },
    { id: 'samba', label: 'File Sharing', icon: Share2, description: 'Samba settings' },
    { id: 'users', label: 'User Management', icon: Users, description: 'Manage users' },
    { id: 'network', label: 'Network', icon: Wifi, description: 'Network config' },
  ];

  const handleNavClick = (tabId: string) => {
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(tabId);
      if (isMobile) setSidebarOpen(false);
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-72 glass-strong border-r border-slate-800/50 transform transition-all duration-300 ease-out ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gradient-primary">
                    NAS OS
                  </h1>
                  <p className="text-xs text-slate-400">v2.0.1</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden hover:bg-slate-700/50 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-800/50">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200" />
              <Input
                type="text"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-400 focus:border-blue-500/50 focus:bg-slate-800/70 transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
            {navigationItems
              .filter(item => 
                searchQuery === '' || 
                item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 group hover:translate-x-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'text-blue-400 scale-110' : 'text-slate-400 group-hover:text-blue-400 group-hover:scale-105'
                  }`} />
                  <div className="flex-1 text-left min-w-0">
                    <div className={`font-medium text-sm sm:text-base truncate ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-400 truncate">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-blue-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 sm:p-4 border-t border-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">{user?.username}</div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Online</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen && !isMobile ? 'lg:ml-72' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-400 hover:text-white p-2 flex-shrink-0"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white capitalize truncate">
                  {activeTab === 'dashboard' ? 'System Dashboard' : navigationItems.find(item => item.id === activeTab)?.label}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 truncate">
                  {activeTab === 'dashboard' ? 'Monitor your NAS system' : navigationItems.find(item => item.id === activeTab)?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1 sm:mr-2"></div>
                <span className="hidden sm:inline">System </span>Online
              </Badge>
              <div className="text-xs sm:text-sm text-slate-400 hidden md:block truncate max-w-32">
                {systemInfo?.host.hostname}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`p-3 sm:p-4 lg:p-6 transition-all duration-500 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {/* CPU Card */}
                <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/70 hover:scale-105 hover:shadow-xl transition-all duration-300 group animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 group-hover:scale-110 transition-transform duration-200">
                        <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 group-hover:animate-pulse" />
                      </div>
                      <Badge variant={getUsageBadgeVariant(systemInfo?.cpu.usage || 0)} className="text-xs animate-bounce-subtle">
                        {systemInfo?.cpu.usage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base group-hover:text-blue-300 transition-colors duration-200">CPU Usage</h3>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${getUsageColor(systemInfo?.cpu.usage || 0)} animate-progress-fill`}
                          style={{ width: `${systemInfo?.cpu.usage || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors duration-200">{systemInfo?.cpu.cores} cores • {systemInfo?.cpu.model}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Memory Card */}
                <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/70 hover:scale-105 hover:shadow-xl transition-all duration-300 group animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 group-hover:scale-110 transition-transform duration-200">
                        <MemoryStick className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 group-hover:animate-pulse" />
                      </div>
                      <Badge variant={getUsageBadgeVariant(systemInfo?.memory.percent || 0)} className="text-xs animate-bounce-subtle">
                        {systemInfo?.memory.percent.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base group-hover:text-green-300 transition-colors duration-200">Memory</h3>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${getUsageColor(systemInfo?.memory.percent || 0)} animate-progress-fill`}
                          style={{ width: `${systemInfo?.memory.percent || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                        {formatBytes(systemInfo?.memory.used || 0)} / {formatBytes(systemInfo?.memory.total || 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Uptime Card */}
                <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/70 hover:scale-105 hover:shadow-xl transition-all duration-300 group animate-slide-up" style={{ animationDelay: '300ms' }}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 group-hover:scale-110 transition-transform duration-200">
                        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 group-hover:animate-pulse" />
                      </div>
                      <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs animate-pulse">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base group-hover:text-purple-300 transition-colors duration-200">Uptime</h3>
                      <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-number-count">
                        {formatUptime(systemInfo?.uptime || 0)}
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-200">System running smoothly</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Summary */}
                <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/70 hover:scale-105 hover:shadow-xl transition-all duration-300 group animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 group-hover:scale-110 transition-transform duration-200">
                        <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 group-hover:animate-pulse" />
                      </div>
                      <Badge variant="secondary" className="text-xs animate-bounce-subtle">
                        <Database className="w-3 h-3 mr-1" />
                        {systemInfo?.disk.length || 0} Drives
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base group-hover:text-orange-300 transition-colors duration-200">Storage</h3>
                      <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent animate-number-count">
                        {formatBytes(systemInfo?.disk.reduce((total, disk) => total + disk.total, 0) || 0)}
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-200">Total capacity</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Storage Details */}
              <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/60 transition-all duration-300 animate-slide-up" style={{ animationDelay: '500ms' }}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg sm:text-xl font-bold text-white group">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-200">
                      <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                    </div>
                    Storage Overview
                    <TrendingUp className="w-4 h-4 ml-2 text-slate-400 group-hover:text-orange-400 transition-colors duration-200" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {systemInfo?.disk.map((disk, index) => (
                    <div key={index} className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50 hover:scale-[1.02] transition-all duration-300 group animate-slide-up" style={{ animationDelay: `${600 + index * 100}ms` }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                            <HardDrive className="w-4 h-4 text-orange-400 group-hover:animate-pulse" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-orange-300 transition-colors duration-200">{disk.device}</h4>
                            <p className="text-xs sm:text-sm text-slate-400 truncate group-hover:text-slate-300 transition-colors duration-200">{disk.mountpoint}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="text-lg font-bold text-white animate-number-count">{disk.percent.toFixed(1)}%</div>
                          <Badge variant={getUsageBadgeVariant(disk.percent)} className="text-xs animate-bounce-subtle">
                            {disk.percent > 80 ? (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                High
                              </>
                            ) : disk.percent > 60 ? (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Medium
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Low
                              </>
                            )} Usage
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${getUsageColor(disk.percent)} animate-progress-fill`}
                          style={{ width: `${disk.percent}%` }}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-400 space-y-1 sm:space-y-0">
                        <span>Used: {formatBytes(disk.used)}</span>
                        <span>Free: {formatBytes(disk.free)}</span>
                        <span>Total: {formatBytes(disk.total)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'files' && <FileManager />}
          {activeTab === 'samba' && <SambaManager />}
          {activeTab === 'users' && <UserManager />}
          {activeTab === 'network' && <NetworkManager />}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default App

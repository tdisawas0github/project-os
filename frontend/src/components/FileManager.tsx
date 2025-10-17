import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  Search, 
  Home, 
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  FolderPlus,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Code
} from 'lucide-react';
import axios from 'axios';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
}

const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/files?path=${encodeURIComponent(currentPath)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(response.data.files || []);
    } catch (err) {
      setError('Failed to fetch files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
  };

  const navigateUp = () => {
    if (currentPath !== '/') {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      navigateToPath(parentPath);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('path', currentPath);
      
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const token = localStorage.getItem('token');
      await axios.post('/api/v1/files/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      await fetchFiles();
    } catch (err) {
      setError('Failed to upload files');
      console.error('Error uploading files:', err);
    } finally {
      setUploading(false);
    }
  };



  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/v1/files/folder', {
        path: currentPath,
        name: newFolderName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewFolderName('');
      setShowCreateFolder(false);
      await fetchFiles();
    } catch (err) {
      setError('Failed to create folder');
      console.error('Error creating folder:', err);
    }
  };



  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (type === 'directory') {
      return <Folder className="h-5 w-5 text-blue-400" />;
    }

    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="h-5 w-5 text-green-400" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="h-5 w-5 text-purple-400" />;
      case 'mp4':
      case 'avi':
      case 'mkv':
        return <Video className="h-5 w-5 text-red-400" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Archive className="h-5 w-5 text-yellow-400" />;
      case 'js':
      case 'ts':
      case 'py':
      case 'go':
      case 'html':
      case 'css':
        return <Code className="h-5 w-5 text-cyan-400" />;
      case 'txt':
      case 'md':
      case 'log':
        return <FileText className="h-5 w-5 text-slate-400" />;
      default:
        return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fade-in">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-slate-400">Loading files...</span>
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
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Folder className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold gradient-text">File Manager</h2>
              <p className="text-slate-400">Browse and manage your files</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchFiles}
              className="glass-button p-2 rounded-lg transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="glass-button flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300"
            >
              <FolderPlus className="h-4 w-4" />
              <span>New Folder</span>
            </button>
            <label className="glass-button flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateToPath('/')}
              className="glass-button p-2 rounded-lg transition-all duration-300"
            >
              <Home className="h-4 w-4" />
            </button>
            {currentPath !== '/' && (
              <button
                onClick={navigateUp}
                className="glass-button p-2 rounded-lg transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="text-white font-mono">{currentPath}</span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
            />
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

      {/* Create Folder Form */}
      {showCreateFolder && (
        <div className="card slide-up">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FolderPlus className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Create New Folder</h3>
          </div>
          
          <form onSubmit={createFolder} className="flex space-x-3">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              autoFocus
            />
            <button
              type="submit"
              className="glass-button bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
              }}
              className="glass-button px-4 py-2 rounded-lg transition-all duration-300"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Files List */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <File className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Files & Folders</h3>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
            {filteredFiles.length} items
          </span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <Search className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No files found matching "{searchTerm}"</p>
              </>
            ) : (
              <>
                <Folder className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">This folder is empty</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file, index) => (
              <div
                key={file.name}
                className="metric-card slide-up flex items-center justify-between p-4 hover:bg-slate-700/40 cursor-pointer transition-all duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  if (file.type === 'directory') {
                    const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                    navigateToPath(newPath);
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.name, file.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-white truncate">{file.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span className="capitalize">{file.type}</span>
                      {file.type === 'file' && (
                        <span>{formatFileSize(file.size)}</span>
                      )}
                      <span>{formatDate(file.modified)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.type === 'file' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle download
                      }}
                      className="glass-button p-2 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-300"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle delete
                    }}
                    className="glass-button p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
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

export default FileManager;
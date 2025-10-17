import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Plus,
  ArrowLeft,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import axios from 'axios';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modTime: string;
  mimeType: string;
}

interface FileListResponse {
  currentPath: string;
  files: FileInfo[];
  totalSize: number;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentPath, setCurrentPath] = useState('/Users/Shared');
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get<FileListResponse>(`http://localhost:8080/api/v1/files?path=${encodeURIComponent(currentPath)}`);
      setFiles(response.data.files);
      setCurrentPath(response.data.currentPath);
      setTotalSize(response.data.totalSize);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: FileInfo) => {
    if (file.isDir) {
      setCurrentPath(file.path);
    } else {
      // Download file
      window.open(`http://localhost:8080/api/v1/files/download?path=${encodeURIComponent(file.path)}`, '_blank');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await axios.post(`http://localhost:8080/api/v1/files/upload?path=${encodeURIComponent(currentPath)}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadFile(null);
      loadFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await axios.delete(`http://localhost:8080/api/v1/files?path=${encodeURIComponent(filePath)}`);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await axios.post('http://localhost:8080/api/v1/files/folder', {
        path: currentPath,
        name: newFolderName,
      });
      setNewFolderName('');
      setShowNewFolder(false);
      loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const goBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileInfo) => {
    if (file.isDir) {
      return <Folder className="w-5 h-5 text-blue-400" />;
    }
    return <File className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <HardDrive className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">File Manager</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadFiles}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={goBack}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            disabled={currentPath === '/'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-300">Current Path:</span>
          <span className="font-mono text-sm bg-slate-700 px-2 py-1 rounded">
            {currentPath}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          Total: {formatFileSize(totalSize)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Upload */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Choose File</span>
          </label>
          {uploadFile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">{uploadFile.name}</span>
              <button
                onClick={handleUpload}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
              >
                Upload
              </button>
            </div>
          )}
        </div>

        {/* New Folder */}
        <button
          onClick={() => setShowNewFolder(!showNewFolder)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Folder</span>
        </button>
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="flex items-center space-x-2 bg-slate-800 p-4 rounded-lg">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName('');
            }}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* File List */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
            <p className="text-gray-400">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>This folder is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-slate-700 transition-colors"
              >
                <div
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  {getFileIcon(file)}
                  <div className="flex-1">
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {file.isDir ? 'Folder' : `${formatFileSize(file.size)} • ${file.mimeType}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!file.isDir && (
                    <button
                      onClick={() => window.open(`http://localhost:8080/api/v1/files/download?path=${encodeURIComponent(file.path)}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(file.path)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
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

export default FileManager;
package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type FileInfo struct {
	Name     string    `json:"name"`
	Path     string    `json:"path"`
	Size     int64     `json:"size"`
	IsDir    bool      `json:"isDir"`
	ModTime  time.Time `json:"modTime"`
	MimeType string    `json:"mimeType"`
}

type FileListResponse struct {
	CurrentPath string     `json:"currentPath"`
	Files       []FileInfo `json:"files"`
	TotalSize   int64      `json:"totalSize"`
}

// GetFiles returns list of files in a directory
func GetFiles(c *gin.Context) {
	path := c.DefaultQuery("path", "/Users/Shared")
	
	// Security check - prevent directory traversal
	cleanPath := filepath.Clean(path)
	if strings.Contains(cleanPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	files, err := os.ReadDir(cleanPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot read directory"})
		return
	}

	var fileList []FileInfo
	var totalSize int64

	for _, file := range files {
		info, err := file.Info()
		if err != nil {
			continue
		}

		fileInfo := FileInfo{
			Name:    file.Name(),
			Path:    filepath.Join(cleanPath, file.Name()),
			Size:    info.Size(),
			IsDir:   file.IsDir(),
			ModTime: info.ModTime(),
		}

		if !file.IsDir() {
			totalSize += info.Size()
			fileInfo.MimeType = getMimeType(file.Name())
		}

		fileList = append(fileList, fileInfo)
	}

	response := FileListResponse{
		CurrentPath: cleanPath,
		Files:       fileList,
		TotalSize:   totalSize,
	}

	c.JSON(http.StatusOK, response)
}

// UploadFile handles file uploads
func UploadFile(c *gin.Context) {
	uploadPath := c.DefaultQuery("path", "/Users/Shared")
	
	// Security check
	cleanPath := filepath.Clean(uploadPath)
	if strings.Contains(cleanPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Create destination file
	destPath := filepath.Join(cleanPath, header.Filename)
	dest, err := os.Create(destPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create file"})
		return
	}
	defer dest.Close()

	// Copy file content
	_, err = io.Copy(dest, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "File uploaded successfully",
		"filename": header.Filename,
		"size":     header.Size,
		"path":     destPath,
	})
}

// DownloadFile handles file downloads
func DownloadFile(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File path required"})
		return
	}

	// Security check
	cleanPath := filepath.Clean(filePath)
	if strings.Contains(cleanPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// Check if file exists
	if _, err := os.Stat(cleanPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.File(cleanPath)
}

// DeleteFile handles file deletion
func DeleteFile(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File path required"})
		return
	}

	// Security check
	cleanPath := filepath.Clean(filePath)
	if strings.Contains(cleanPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	err := os.Remove(cleanPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}

// CreateFolder handles folder creation
func CreateFolder(c *gin.Context) {
	var request struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Security check
	cleanPath := filepath.Clean(request.Path)
	if strings.Contains(cleanPath, "..") || strings.Contains(request.Name, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	folderPath := filepath.Join(cleanPath, request.Name)
	err := os.MkdirAll(folderPath, 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create folder"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Folder created successfully",
		"path":    folderPath,
	})
}

// getMimeType returns MIME type based on file extension
func getMimeType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".mp4":
		return "video/mp4"
	case ".mp3":
		return "audio/mpeg"
	case ".zip":
		return "application/zip"
	default:
		return "application/octet-stream"
	}
}
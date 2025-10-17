package handlers

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

type SambaShare struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Comment     string `json:"comment"`
	ReadOnly    bool   `json:"readOnly"`
	GuestAccess bool   `json:"guestAccess"`
	Users       []string `json:"users"`
}

type SambaConfig struct {
	Shares []SambaShare `json:"shares"`
	Status string       `json:"status"`
}

// GetSambaShares returns current Samba shares
func GetSambaShares(c *gin.Context) {
	shares := []SambaShare{
		{
			Name:        "public",
			Path:        "/Users/Shared/Public",
			Comment:     "Public shared folder",
			ReadOnly:    false,
			GuestAccess: true,
			Users:       []string{"guest"},
		},
		{
			Name:        "media",
			Path:        "/Users/Shared/Media",
			Comment:     "Media files",
			ReadOnly:    true,
			GuestAccess: false,
			Users:       []string{"admin"},
		},
	}

	status := "stopped"
	if isSambaRunning() {
		status = "running"
	}

	config := SambaConfig{
		Shares: shares,
		Status: status,
	}

	c.JSON(http.StatusOK, config)
}

// CreateSambaShare creates a new Samba share
func CreateSambaShare(c *gin.Context) {
	var share SambaShare
	if err := c.ShouldBindJSON(&share); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid share configuration"})
		return
	}

	// Validate share name
	if share.Name == "" || strings.Contains(share.Name, " ") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid share name"})
		return
	}

	// Validate path
	cleanPath := filepath.Clean(share.Path)
	if strings.Contains(cleanPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	// Create directory if it doesn't exist
	if err := os.MkdirAll(cleanPath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create share directory"})
		return
	}

	// Generate Samba configuration
	config := generateSambaConfig(share)
	
	// For demo purposes, we'll just return success
	// In a real implementation, you would write to smb.conf
	c.JSON(http.StatusOK, gin.H{
		"message": "Samba share created successfully",
		"share":   share,
		"config":  config,
	})
}

// DeleteSambaShare removes a Samba share
func DeleteSambaShare(c *gin.Context) {
	shareName := c.Param("name")
	if shareName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Share name required"})
		return
	}

	// For demo purposes, we'll just return success
	// In a real implementation, you would remove from smb.conf
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Samba share '%s' deleted successfully", shareName),
	})
}

// StartSambaService starts the Samba service
func StartSambaService(c *gin.Context) {
	// Check if Samba is installed
	if !isSambaInstalled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Samba is not installed. Please install it first.",
			"install_command": "brew install samba",
		})
		return
	}

	// For macOS, we'll simulate starting the service
	// In a real implementation, you would use launchctl or similar
	c.JSON(http.StatusOK, gin.H{
		"message": "Samba service start initiated",
		"status":  "starting",
		"note":    "On macOS, Samba needs to be configured manually",
	})
}

// StopSambaService stops the Samba service
func StopSambaService(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Samba service stop initiated",
		"status":  "stopping",
	})
}

// GetSambaStatus returns the current status of Samba service
func GetSambaStatus(c *gin.Context) {
	status := map[string]interface{}{
		"installed": isSambaInstalled(),
		"running":   isSambaRunning(),
		"version":   getSambaVersion(),
		"shares":    getSambaShareCount(),
	}

	c.JSON(http.StatusOK, status)
}

// Helper functions

func isSambaInstalled() bool {
	_, err := exec.LookPath("smbd")
	return err == nil
}

func isSambaRunning() bool {
	// Check if smbd process is running
	cmd := exec.Command("pgrep", "smbd")
	err := cmd.Run()
	return err == nil
}

func getSambaVersion() string {
	cmd := exec.Command("smbd", "--version")
	output, err := cmd.Output()
	if err != nil {
		return "unknown"
	}
	return strings.TrimSpace(string(output))
}

func getSambaShareCount() int {
	// In a real implementation, parse smb.conf
	return 2 // Demo value
}

func generateSambaConfig(share SambaShare) string {
	config := fmt.Sprintf(`[%s]
   comment = %s
   path = %s
   browseable = yes
   writable = %s
   guest ok = %s
   create mask = 0644
   directory mask = 0755
`,
		share.Name,
		share.Comment,
		share.Path,
		boolToYesNo(!share.ReadOnly),
		boolToYesNo(share.GuestAccess),
	)

	if len(share.Users) > 0 && !share.GuestAccess {
		config += fmt.Sprintf("   valid users = %s\n", strings.Join(share.Users, " "))
	}

	return config
}

func boolToYesNo(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}
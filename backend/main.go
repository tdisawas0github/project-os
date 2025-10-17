package main

import (
	"log"
	"nas-os/backend/handlers"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

type SystemInfo struct {
	CPU     CPUInfo     `json:"cpu"`
	Memory  MemoryInfo  `json:"memory"`
	Disk    []DiskInfo  `json:"disk"`
	Host    HostInfo    `json:"host"`
	Uptime  int64       `json:"uptime"`
}

type CPUInfo struct {
	Usage   float64 `json:"usage"`
	Cores   int     `json:"cores"`
	Model   string  `json:"model"`
}

type MemoryInfo struct {
	Total     uint64  `json:"total"`
	Used      uint64  `json:"used"`
	Available uint64  `json:"available"`
	Percent   float64 `json:"percent"`
}

type DiskInfo struct {
	Device     string  `json:"device"`
	Mountpoint string  `json:"mountpoint"`
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Free       uint64  `json:"free"`
	Percent    float64 `json:"percent"`
}

type HostInfo struct {
	Hostname string `json:"hostname"`
	OS       string `json:"os"`
	Platform string `json:"platform"`
	Arch     string `json:"arch"`
}

func main() {
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API routes
	api := r.Group("/api/v1")
	{
		// System monitoring
		api.GET("/system", getSystemInfo)
		api.GET("/health", healthCheck)
		
		// File management
		api.GET("/files", handlers.GetFiles)
		api.POST("/files/upload", handlers.UploadFile)
		api.GET("/files/download", handlers.DownloadFile)
		api.DELETE("/files", handlers.DeleteFile)
		api.POST("/files/folder", handlers.CreateFolder)
		
		// Samba file sharing
		api.GET("/samba/shares", handlers.GetSambaShares)
		api.POST("/samba/shares", handlers.CreateSambaShare)
		api.DELETE("/samba/shares/:name", handlers.DeleteSambaShare)
		api.POST("/samba/start", handlers.StartSambaService)
		api.POST("/samba/stop", handlers.StopSambaService)
		api.GET("/samba/status", handlers.GetSambaStatus)
	}

	log.Println("🚀 NAS OS Backend starting on :8080")
	r.Run(":8080")
}

func getSystemInfo(c *gin.Context) {
	// Get CPU info
	cpuPercent, _ := cpu.Percent(time.Second, false)
	cpuInfo, _ := cpu.Info()
	
	var cpuUsage float64
	if len(cpuPercent) > 0 {
		cpuUsage = cpuPercent[0]
	}
	
	var cpuModel string
	var cpuCores int
	if len(cpuInfo) > 0 {
		cpuModel = cpuInfo[0].ModelName
		cpuCores = int(cpuInfo[0].Cores)
	}

	// Get memory info
	memInfo, _ := mem.VirtualMemory()

	// Get disk info
	diskPartitions, _ := disk.Partitions(false)
	var diskInfos []DiskInfo
	
	for _, partition := range diskPartitions {
		diskUsage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			continue
		}
		
		diskInfos = append(diskInfos, DiskInfo{
			Device:     partition.Device,
			Mountpoint: partition.Mountpoint,
			Total:      diskUsage.Total,
			Used:       diskUsage.Used,
			Free:       diskUsage.Free,
			Percent:    diskUsage.UsedPercent,
		})
	}

	// Get host info
	hostInfo, _ := host.Info()
	
	systemInfo := SystemInfo{
		CPU: CPUInfo{
			Usage: cpuUsage,
			Cores: cpuCores,
			Model: cpuModel,
		},
		Memory: MemoryInfo{
			Total:     memInfo.Total,
			Used:      memInfo.Used,
			Available: memInfo.Available,
			Percent:   memInfo.UsedPercent,
		},
		Disk: diskInfos,
		Host: HostInfo{
			Hostname: hostInfo.Hostname,
			OS:       hostInfo.OS,
			Platform: hostInfo.Platform,
			Arch:     hostInfo.KernelArch,
		},
		Uptime: int64(hostInfo.Uptime),
	}

	c.JSON(http.StatusOK, systemInfo)
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().Unix(),
		"service":   "nas-os-backend",
	})
}
package handlers

import (
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type NetworkInterface struct {
	Name     string `json:"name"`
	IP       string `json:"ip"`
	MAC      string `json:"mac"`
	Status   string `json:"status"`
	Type     string `json:"type"`
	Speed    string `json:"speed,omitempty"`
	RxBytes  int64  `json:"rx_bytes"`
	TxBytes  int64  `json:"tx_bytes"`
}

type NetworkConfig struct {
	Hostname   string             `json:"hostname"`
	DNSServers []string           `json:"dns_servers"`
	Gateway    string             `json:"gateway"`
	Interfaces []NetworkInterface `json:"interfaces"`
}

func GetNetworkConfig(c *gin.Context) {
	config := NetworkConfig{
		Hostname:   getHostname(),
		DNSServers: getDNSServers(),
		Gateway:    getDefaultGateway(),
		Interfaces: getNetworkInterfaces(),
	}

	c.JSON(http.StatusOK, config)
}

func getHostname() string {
	hostname, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return hostname
}

func getDNSServers() []string {
	var dnsServers []string
	
	if runtime.GOOS == "darwin" {
		// macOS
		cmd := exec.Command("scutil", "--dns")
		output, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.Contains(line, "nameserver") {
					parts := strings.Fields(line)
					if len(parts) >= 3 {
						dnsServers = append(dnsServers, parts[2])
					}
				}
			}
		}
	} else {
		// Linux and others - read /etc/resolv.conf
		cmd := exec.Command("cat", "/etc/resolv.conf")
		output, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.HasPrefix(strings.TrimSpace(line), "nameserver") {
					parts := strings.Fields(line)
					if len(parts) >= 2 {
						dnsServers = append(dnsServers, parts[1])
					}
				}
			}
		}
	}
	
	if len(dnsServers) == 0 {
		dnsServers = []string{"8.8.8.8", "8.8.4.4"} // Fallback to Google DNS
	}
	
	return dnsServers
}

func getDefaultGateway() string {
	var gateway string
	
	if runtime.GOOS == "darwin" {
		// macOS
		cmd := exec.Command("route", "-n", "get", "default")
		output, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.Contains(line, "gateway:") {
					parts := strings.Fields(line)
					if len(parts) >= 2 {
						gateway = parts[1]
						break
					}
				}
			}
		}
	} else {
		// Linux
		cmd := exec.Command("ip", "route", "show", "default")
		output, err := cmd.Output()
		if err == nil {
			parts := strings.Fields(string(output))
			for i, part := range parts {
				if part == "via" && i+1 < len(parts) {
					gateway = parts[i+1]
					break
				}
			}
		}
	}
	
	if gateway == "" {
		gateway = "unknown"
	}
	
	return gateway
}

func getNetworkInterfaces() []NetworkInterface {
	var interfaces []NetworkInterface
	
	netInterfaces, err := net.Interfaces()
	if err != nil {
		return interfaces
	}
	
	for _, iface := range netInterfaces {
		netIface := NetworkInterface{
			Name:   iface.Name,
			MAC:    iface.HardwareAddr.String(),
			Status: "down",
			Type:   getInterfaceType(iface.Name),
		}
		
		// Check if interface is up
		if iface.Flags&net.FlagUp != 0 {
			netIface.Status = "up"
		}
		
		// Get IP addresses
		addrs, err := iface.Addrs()
		if err == nil {
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					if ipnet.IP.To4() != nil {
						netIface.IP = ipnet.IP.String()
						break
					}
				}
			}
		}
		
		// Get traffic statistics (platform-specific)
		rxBytes, txBytes := getInterfaceStats(iface.Name)
		netIface.RxBytes = rxBytes
		netIface.TxBytes = txBytes
		
		interfaces = append(interfaces, netIface)
	}
	
	return interfaces
}

func getInterfaceType(name string) string {
	name = strings.ToLower(name)
	
	if strings.Contains(name, "lo") {
		return "loopback"
	} else if strings.Contains(name, "wlan") || strings.Contains(name, "wifi") || strings.Contains(name, "en1") {
		return "wifi"
	} else if strings.Contains(name, "eth") || strings.Contains(name, "en0") || strings.Contains(name, "ens") {
		return "ethernet"
	}
	
	return "unknown"
}

func getInterfaceStats(interfaceName string) (int64, int64) {
	var rxBytes, txBytes int64
	
	if runtime.GOOS == "darwin" {
		// macOS - use netstat
		cmd := exec.Command("netstat", "-ibn")
		output, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				fields := strings.Fields(line)
				if len(fields) >= 10 && fields[0] == interfaceName {
					if rx, err := strconv.ParseInt(fields[6], 10, 64); err == nil {
						rxBytes = rx
					}
					if tx, err := strconv.ParseInt(fields[9], 10, 64); err == nil {
						txBytes = tx
					}
					break
				}
			}
		}
	} else {
		// Linux - read from /proc/net/dev
		cmd := exec.Command("cat", "/proc/net/dev")
		output, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.Contains(line, interfaceName+":") {
					fields := strings.Fields(strings.Replace(line, ":", " ", -1))
					if len(fields) >= 10 {
						if rx, err := strconv.ParseInt(fields[1], 10, 64); err == nil {
							rxBytes = rx
						}
						if tx, err := strconv.ParseInt(fields[9], 10, 64); err == nil {
							txBytes = tx
						}
					}
					break
				}
			}
		}
	}
	
	return rxBytes, txBytes
}
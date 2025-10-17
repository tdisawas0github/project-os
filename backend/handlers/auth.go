package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Created  time.Time `json:"created"`
	LastLogin *time.Time `json:"lastLogin,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`
}

type Session struct {
	Token   string    `json:"token"`
	UserID  int       `json:"userId"`
	Expires time.Time `json:"expires"`
}

// In-memory storage for demo purposes
// In production, use a proper database
var users = make(map[string]*User)
var sessions = make(map[string]*Session)
var userCounter = 1

func init() {
	// Create default admin user
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	users["admin"] = &User{
		ID:       userCounter,
		Username: "admin",
		Email:    "admin@nas-os.local",
		Role:     "admin",
		Created:  time.Now(),
	}
	// Store password separately (in production, store in database)
	userPasswords := make(map[string]string)
	userPasswords["admin"] = string(hashedPassword)
	userCounter++
}

// Login authenticates a user and returns a session token
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, exists := users[req.Username]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// In production, retrieve hashed password from database
	// For demo, we'll use a simple check
	if req.Username == "admin" && req.Password == "admin123" {
		// Generate session token
		token, err := generateToken()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// Create session
		session := &Session{
			Token:   token,
			UserID:  user.ID,
			Expires: time.Now().Add(24 * time.Hour),
		}
		sessions[token] = session

		// Update last login
		now := time.Now()
		user.LastLogin = &now

		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"user":  user,
		})
		return
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
}

// Logout invalidates a session token
func Logout(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No token provided"})
		return
	}

	// Remove "Bearer " prefix if present
	if len(token) > 7 && token[:7] == "Bearer " {
		token = token[7:]
	}

	delete(sessions, token)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns the current authenticated user
func GetCurrentUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// GetUsers returns all users (admin only)
func GetUsers(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	currentUser := user.(*User)
	if currentUser.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var userList []User
	for _, u := range users {
		userList = append(userList, *u)
	}

	c.JSON(http.StatusOK, gin.H{"users": userList})
}

// CreateUser creates a new user (admin only)
func CreateUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	currentUser := user.(*User)
	if currentUser.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	if _, exists := users[req.Username]; exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Set default role if not provided
	if req.Role == "" {
		req.Role = "user"
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	newUser := &User{
		ID:       userCounter,
		Username: req.Username,
		Email:    req.Email,
		Role:     req.Role,
		Created:  time.Now(),
	}
	users[req.Username] = newUser
	userCounter++

	// Store password (in production, store in database)
	_ = hashedPassword // Would store this in database

	c.JSON(http.StatusCreated, gin.H{"user": newUser})
}

// DeleteUser deletes a user (admin only)
func DeleteUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	currentUser := user.(*User)
	if currentUser.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	username := c.Param("username")
	if username == "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete admin user"})
		return
	}

	if _, exists := users[username]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	delete(users, username)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// AuthMiddleware validates session tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix if present
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}

		session, exists := sessions[token]
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Check if session is expired
		if time.Now().After(session.Expires) {
			delete(sessions, token)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
			c.Abort()
			return
		}

		// Find user by ID
		var user *User
		for _, u := range users {
			if u.ID == session.UserID {
				user = u
				break
			}
		}

		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

// generateToken creates a random session token
func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
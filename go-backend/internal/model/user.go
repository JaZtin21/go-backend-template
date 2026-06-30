package model

import "time"

// User represents the blueprint of your user data in Go and your database columns.
type User struct {
	ID           string    `json:"id" db:"id"`                      // Google Sub ID (e.g., google-oauth2|12345)
	FirstName    string    `json:"firstName" db:"first_name"`       // User's first name from Google profile
	LastName     string    `json:"lastName" db:"last_name"`         // User's last name from Google profile
	Email        string    `json:"email" db:"email"`                // User's secure Gmail address
	ProfilePhoto string    `json:"profilePhoto" db:"profile_photo"` // Google avatar image URL string
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}

type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

type GoogleUserInfo struct {
	ID         string `json:"sub"` // 🌟 FIXED: Changed from "id" to "sub"
	Email      string `json:"email"`
	GivenName  string `json:"given_name"`
	FamilyName string `json:"family_name"`
	Picture    string `json:"picture"`
}

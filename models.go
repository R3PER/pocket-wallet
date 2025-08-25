package main

import "time"

// User represents a user in the system
type User struct {
	UserID           string    `json:"user_id"`
	Login            string    `json:"login"`
	Email            string    `json:"email"`
	Salt             string    `json:"salt"`
	PasswordHash     string    `json:"password_hash"`
	EncryptedBalance string    `json:"encrypted_balance"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Login        string `json:"login"`
	Email        string `json:"email"`
	Salt         string `json:"salt"`
	PasswordHash string `json:"password_hash"`
}

// UserMetaResponse represents the user metadata response
type UserMetaResponse struct {
	UserID       string `json:"user_id"`
	Salt         string `json:"salt"`
	PasswordHash string `json:"password_hash"`
}

// BalanceRequest represents the balance update request
type BalanceRequest struct {
	UserID           string `json:"user_id"`
	EncryptedBalance string `json:"encrypted_balance"`
}

// BalanceResponse represents the balance response
type BalanceResponse struct {
	EncryptedBalance string `json:"encrypted_balance"`
}

// StripePaymentIntentRequest represents the Stripe payment intent request
type StripePaymentIntentRequest struct {
	UserID string `json:"user_id"`
	Amount int64  `json:"amount"` // Amount in cents
}

// StripePaymentIntentResponse represents the Stripe payment intent response
type StripePaymentIntentResponse struct {
	ClientSecret string `json:"client_secret"`
	PaymentID    string `json:"payment_id"`
}

// Transaction represents a transaction in the system
type Transaction struct {
	TransactionID string    `json:"transaction_id"`
	UserID        string    `json:"user_id"`
	Type          string    `json:"type"` // "deposit", "withdrawal", "payment"
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Status        string    `json:"status"` // "pending", "completed", "failed"
	Description   string    `json:"description"`
	PaymentID     string    `json:"payment_id,omitempty"` // Stripe payment ID
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// TransactionRequest represents a transaction creation request
type TransactionRequest struct {
	UserID      string  `json:"user_id"`
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
	PaymentID   string  `json:"payment_id,omitempty"`
}

// TransactionListResponse represents a list of transactions
type TransactionListResponse struct {
	Transactions []Transaction `json:"transactions"`
	Total        int           `json:"total"`
}

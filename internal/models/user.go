package models

import (
	"time"
)

type User struct {
	UserID           string    `json:"user_id" couchbase:"user_id"`
	Login            string    `json:"login" couchbase:"login"`
	Email            string    `json:"email" couchbase:"email"`
	Salt             string    `json:"salt" couchbase:"salt"`
	PasswordHash     string    `json:"password_hash" couchbase:"password_hash"`
	EncryptedBalance string    `json:"encrypted_balance" couchbase:"encrypted_balance"`
	CreatedAt        time.Time `json:"created_at" couchbase:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" couchbase:"updated_at"`
}

type RegisterRequest struct {
	Login        string `json:"login"`
	Email        string `json:"email"`
	Salt         string `json:"salt"`
	PasswordHash string `json:"password_hash"`
}

type LoginRequest struct {
	Login string `json:"login"`
}

type UserMetaResponse struct {
	Salt         string `json:"salt"`
	PasswordHash string `json:"password_hash"`
}

type BalanceRequest struct {
	UserID           string `json:"user_id"`
	EncryptedBalance string `json:"encrypted_balance"`
}

type BalanceResponse struct {
	EncryptedBalance string `json:"encrypted_balance"`
}

type StripePaymentIntentRequest struct {
	UserID string `json:"user_id"`
	Amount int64  `json:"amount"` // amount in cents
}

type StripePaymentIntentResponse struct {
	ClientSecret string `json:"client_secret"`
}

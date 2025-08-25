package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"pocket-wallet/internal/database"

	stripeService "pocket-wallet/internal/stripe"
	"pocket-wallet/pkg/config"

	"github.com/stripe/stripe-go/v76"
)

// App struct
type App struct {
	ctx           context.Context
	config        *config.Config
	db            *database.MongoDB
	stripeService *stripeService.StripeService
	server        *http.Server
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Load configuration
	a.config = config.Load()

	// Initialize database connection
	var err error
	a.db, err = database.NewMongoDB(a.config)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Initialize Stripe service
	a.stripeService = stripeService.NewStripeService(a.config)

	// Start HTTP server for webhooks
	a.startHTTPServer()

	log.Println("Application started successfully")
}

// OnDomReady is called after front-end resources have been loaded
func (a *App) OnDomReady(ctx context.Context) {
	// Application is ready
}

// OnBeforeClose is called when the application is about to quit
func (a *App) OnBeforeClose(ctx context.Context) (prevent bool) {
	if a.db != nil {
		a.db.Close()
	}
	if a.server != nil {
		a.server.Shutdown(ctx)
	}
	return false
}

// OnShutdown is called when the application is shutting down
func (a *App) OnShutdown(ctx context.Context) {
	log.Println("Application shutting down")
}

// Register creates a new user account with real data validation
func (a *App) Register(req RegisterRequest) (*User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	// Validate input data
	if req.Login == "" || req.Email == "" || req.Salt == "" || req.PasswordHash == "" {
		return nil, fmt.Errorf("all fields are required")
	}

	// Validate email format
	if !strings.Contains(req.Email, "@") || !strings.Contains(req.Email, ".") {
		return nil, fmt.Errorf("invalid email format")
	}

	// Convert to database type
	dbReq := &database.RegisterRequest{
		Login:        req.Login,
		Email:        req.Email,
		Salt:         req.Salt,
		PasswordHash: req.PasswordHash,
	}

	// Create user with real data
	dbUser, err := a.db.CreateUser(dbReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Convert back to main type
	user := &User{
		UserID:           dbUser.UserID,
		Login:            dbUser.Login,
		Email:            dbUser.Email,
		Salt:             dbUser.Salt,
		PasswordHash:     dbUser.PasswordHash,
		EncryptedBalance: dbUser.EncryptedBalance,
		CreatedAt:        dbUser.CreatedAt,
		UpdatedAt:        dbUser.UpdatedAt,
	}

	log.Printf("User registered successfully: %s", req.Login)
	return user, nil
}

// GetUserMeta retrieves real user metadata for login process
func (a *App) GetUserMeta(login string) (*UserMetaResponse, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	if login == "" {
		return nil, fmt.Errorf("login is required")
	}

	// Get full user data to include user_id
	dbUser, err := a.db.GetUserByLogin(login)
	if err != nil {
		return nil, fmt.Errorf("user not found or database error: %w", err)
	}

	// Convert to main type
	meta := &UserMetaResponse{
		UserID:       dbUser.UserID,
		Salt:         dbUser.Salt,
		PasswordHash: dbUser.PasswordHash,
	}

	return meta, nil
}

// GetUserByLogin retrieves full user data by login
func (a *App) GetUserByLogin(login string) (*User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	if login == "" {
		return nil, fmt.Errorf("login is required")
	}

	dbUser, err := a.db.GetUserByLogin(login)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Convert to main type
	user := &User{
		UserID:           dbUser.UserID,
		Login:            dbUser.Login,
		Email:            dbUser.Email,
		Salt:             dbUser.Salt,
		PasswordHash:     dbUser.PasswordHash,
		EncryptedBalance: dbUser.EncryptedBalance,
		CreatedAt:        dbUser.CreatedAt,
		UpdatedAt:        dbUser.UpdatedAt,
	}

	return user, nil
}

// UpdateBalance updates user's real encrypted balance
func (a *App) UpdateBalance(req BalanceRequest) error {
	if a.db == nil {
		return fmt.Errorf("database connection not available")
	}

	if req.UserID == "" || req.EncryptedBalance == "" {
		return fmt.Errorf("user_id and encrypted_balance are required")
	}

	err := a.db.UpdateUserBalance(req.UserID, req.EncryptedBalance)
	if err != nil {
		return fmt.Errorf("failed to update balance: %w", err)
	}

	log.Printf("Balance updated for user: %s", req.UserID)
	return nil
}

// GetBalance retrieves user's real encrypted balance
func (a *App) GetBalance(userID string) (*BalanceResponse, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	if userID == "" {
		return nil, fmt.Errorf("user_id is required")
	}

	user, err := a.db.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &BalanceResponse{
		EncryptedBalance: user.EncryptedBalance,
	}, nil
}

// CreatePaymentIntent creates a real Stripe payment intent
func (a *App) CreatePaymentIntent(req StripePaymentIntentRequest) (*StripePaymentIntentResponse, error) {
	if req.UserID == "" || req.Amount <= 0 {
		return nil, fmt.Errorf("valid user_id and amount are required")
	}

	// Verify user exists
	_, err := a.db.GetUserByID(req.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Convert to stripe type
	stripeReq := &stripeService.StripePaymentIntentRequest{
		UserID: req.UserID,
		Amount: req.Amount,
	}

	stripeResponse, err := a.stripeService.CreatePaymentIntent(stripeReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment intent: %w", err)
	}

	// Create transaction record
	transactionReq := &database.TransactionRequest{
		UserID:      req.UserID,
		Type:        "deposit",
		Amount:      float64(req.Amount) / 100.0, // Convert cents to PLN
		Currency:    "PLN",
		Description: fmt.Sprintf("Doładowanie portfela - %.2f PLN", float64(req.Amount)/100.0),
		PaymentID:   stripeResponse.PaymentID,
	}

	_, err = a.db.CreateTransaction(transactionReq)
	if err != nil {
		log.Printf("Warning: Failed to create transaction record: %v", err)
		// Don't fail the payment intent creation if transaction record fails
	}

	// Convert back to main type
	response := &StripePaymentIntentResponse{
		ClientSecret: stripeResponse.ClientSecret,
		PaymentID:    stripeResponse.PaymentID,
	}

	log.Printf("Payment intent created for user %s, amount: %d cents", req.UserID, req.Amount)
	return response, nil
}

// startHTTPServer starts the real HTTP server for Stripe webhooks
func (a *App) startHTTPServer() {
	mux := http.NewServeMux()

	// Real Stripe webhook endpoint
	mux.HandleFunc("/stripe/webhook", a.handleStripeWebhook)

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	a.server = &http.Server{
		Addr:    ":" + a.config.ServerPort,
		Handler: mux,
	}

	go func() {
		log.Printf("HTTP server started on port %s for webhooks", a.config.ServerPort)
		if err := a.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("HTTP server error: %v", err)
		}
	}()
}

// handleStripeWebhook handles real Stripe webhook events
func (a *App) handleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading webhook body: %v", err)
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}

	signature := r.Header.Get("Stripe-Signature")
	if signature == "" {
		log.Println("Missing Stripe signature in webhook")
		http.Error(w, "Missing Stripe signature", http.StatusBadRequest)
		return
	}

	// Verify real webhook signature
	err = a.stripeService.VerifyWebhookSignature(body, signature)
	if err != nil {
		log.Printf("Webhook signature verification failed: %v", err)
		http.Error(w, "Signature verification failed", http.StatusBadRequest)
		return
	}

	// Parse real webhook event
	var event stripe.Event
	err = json.Unmarshal(body, &event)
	if err != nil {
		log.Printf("Error parsing webhook JSON: %v", err)
		http.Error(w, "Error parsing JSON", http.StatusBadRequest)
		return
	}

	log.Printf("Received Stripe webhook event: %s", event.Type)

	// Handle real payment success
	if event.Type == "payment_intent.succeeded" {
		err = a.handlePaymentSuccess(&event)
		if err != nil {
			log.Printf("Error handling payment success: %v", err)
			http.Error(w, "Error processing payment", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
}

// handlePaymentSuccess processes real successful payment
func (a *App) handlePaymentSuccess(event *stripe.Event) error {
	var paymentIntent stripe.PaymentIntent
	err := json.Unmarshal(event.Data.Raw, &paymentIntent)
	if err != nil {
		return fmt.Errorf("error parsing payment intent: %w", err)
	}

	userID, exists := paymentIntent.Metadata["user_id"]
	if !exists {
		return fmt.Errorf("user_id not found in payment intent metadata")
	}

	// Verify user exists in database
	user, err := a.db.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("user not found in database: %w", err)
	}

	// Update transaction status to completed
	transaction, err := a.db.GetTransactionByPaymentID(paymentIntent.ID)
	if err != nil {
		log.Printf("Warning: Could not find transaction for payment ID %s: %v", paymentIntent.ID, err)
	} else {
		err = a.db.UpdateTransactionStatus(transaction.TransactionID, "completed")
		if err != nil {
			log.Printf("Warning: Could not update transaction status: %v", err)
		}
	}

	log.Printf("Payment of %d cents successful for user %s (%s)",
		paymentIntent.Amount, userID, user.Login)

	// Note: The actual balance update will be handled by the frontend
	// since only the frontend has access to the user's encryption key
	// This webhook serves as confirmation that the payment was processed

	return nil
}

// GetStripePublishableKey returns the real Stripe publishable key for frontend
func (a *App) GetStripePublishableKey() string {
	log.Printf("Debug: Stripe publishable key: '%s'", a.config.StripePublishableKey)
	if a.config.StripePublishableKey == "" {
		log.Printf("Warning: Stripe publishable key is empty!")
	}
	return a.config.StripePublishableKey
}

// ValidateUserSession validates if user session is active (helper method)
func (a *App) ValidateUserSession(userID string) (bool, error) {
	if userID == "" {
		return false, fmt.Errorf("user_id is required")
	}

	_, err := a.db.GetUserByID(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user session: %w", err)
	}

	return true, nil
}

// ConvertAmountToCents converts PLN amount to cents for Stripe
func (a *App) ConvertAmountToCents(amount float64) int64 {
	return int64(amount * 100)
}

// ConvertCentsToAmount converts cents back to PLN amount
func (a *App) ConvertCentsToAmount(cents int64) float64 {
	return float64(cents) / 100.0
}

// GetUserTransactions retrieves transaction history for a user
func (a *App) GetUserTransactions(userID string, limit int) (*TransactionListResponse, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	if userID == "" {
		return nil, fmt.Errorf("user_id is required")
	}

	// Verify user exists
	_, err := a.db.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Get transactions from database
	dbTransactions, err := a.db.GetUserTransactions(userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	// Convert database transactions to main types
	transactions := make([]Transaction, len(dbTransactions))
	for i, dbTx := range dbTransactions {
		transactions[i] = Transaction{
			TransactionID: dbTx.TransactionID,
			UserID:        dbTx.UserID,
			Type:          dbTx.Type,
			Amount:        dbTx.Amount,
			Currency:      dbTx.Currency,
			Status:        dbTx.Status,
			Description:   dbTx.Description,
			PaymentID:     dbTx.PaymentID,
			CreatedAt:     dbTx.CreatedAt,
			UpdatedAt:     dbTx.UpdatedAt,
		}
	}

	response := &TransactionListResponse{
		Transactions: transactions,
		Total:        len(transactions),
	}

	log.Printf("Retrieved %d transactions for user %s", len(transactions), userID)
	return response, nil
}

// GetDatabaseStatus returns current database connection status
func (a *App) GetDatabaseStatus() map[string]interface{} {
	status := map[string]interface{}{
		"connected": false,
		"error":     "",
	}

	if a.db == nil {
		status["error"] = "Database not initialized"
		return status
	}

	// Try to perform a simple operation to check connection
	_, err := a.db.GetUserByID("health-check")
	if err != nil {
		// This is expected for health check, but if we get a connection error, that's bad
		if strings.Contains(err.Error(), "connection") || strings.Contains(err.Error(), "timeout") {
			status["error"] = err.Error()
			return status
		}
	}

	status["connected"] = true
	return status
}

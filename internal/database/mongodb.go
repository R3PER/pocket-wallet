package database

import (
	"context"
	"fmt"
	"time"

	"pocket-wallet/pkg/config"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// User types from main package
type User struct {
	UserID           string    `json:"user_id" bson:"user_id"`
	Login            string    `json:"login" bson:"login"`
	Email            string    `json:"email" bson:"email"`
	Salt             string    `json:"salt" bson:"salt"`
	PasswordHash     string    `json:"password_hash" bson:"password_hash"`
	EncryptedBalance string    `json:"encrypted_balance" bson:"encrypted_balance"`
	CreatedAt        time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" bson:"updated_at"`
}

type RegisterRequest struct {
	Login        string `json:"login"`
	Email        string `json:"email"`
	Salt         string `json:"salt"`
	PasswordHash string `json:"password_hash"`
}

type UserMetaResponse struct {
	Salt         string `json:"salt"`
	PasswordHash string `json:"password_hash"`
}

// Transaction types for database
type Transaction struct {
	TransactionID string    `json:"transaction_id" bson:"transaction_id"`
	UserID        string    `json:"user_id" bson:"user_id"`
	Type          string    `json:"type" bson:"type"` // "deposit", "withdrawal", "payment"
	Amount        float64   `json:"amount" bson:"amount"`
	Currency      string    `json:"currency" bson:"currency"`
	Status        string    `json:"status" bson:"status"` // "pending", "completed", "failed"
	Description   string    `json:"description" bson:"description"`
	PaymentID     string    `json:"payment_id,omitempty" bson:"payment_id,omitempty"` // Stripe payment ID
	CreatedAt     time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" bson:"updated_at"`
}

type TransactionRequest struct {
	UserID      string  `json:"user_id"`
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
	PaymentID   string  `json:"payment_id,omitempty"`
}

type MongoDB struct {
	client                *mongo.Client
	database              *mongo.Database
	collection            *mongo.Collection
	transactionCollection *mongo.Collection
}

func NewMongoDB(cfg *config.Config) (*MongoDB, error) {
	// Debug: print MongoDB URI (without password for security)
	fmt.Printf("Connecting to MongoDB with URI: %s\n", cfg.MongoDBURI)

	// Set client options
	clientOptions := options.Client().ApplyURI(cfg.MongoDBURI)

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Check the connection
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	database := client.Database("pocketwallet")
	collection := database.Collection("users")
	transactionCollection := database.Collection("transactions")

	// Create unique index on login
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "login", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	_, err = collection.Indexes().CreateOne(ctx, indexModel)
	if err != nil {
		// Index might already exist, log but don't fail
		fmt.Printf("Warning: Could not create index: %v\n", err)
	}

	// Create index on user_id for transactions
	transactionIndexModel := mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}},
	}

	_, err = transactionCollection.Indexes().CreateOne(ctx, transactionIndexModel)
	if err != nil {
		// Index might already exist, log but don't fail
		fmt.Printf("Warning: Could not create transaction index: %v\n", err)
	}

	return &MongoDB{
		client:                client,
		database:              database,
		collection:            collection,
		transactionCollection: transactionCollection,
	}, nil
}

func (db *MongoDB) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return db.client.Disconnect(ctx)
}

func (db *MongoDB) CreateUser(req *RegisterRequest) (*User, error) {
	userID := uuid.New().String()
	now := time.Now()

	user := &User{
		UserID:           userID,
		Login:            req.Login,
		Email:            req.Email,
		Salt:             req.Salt,
		PasswordHash:     req.PasswordHash,
		EncryptedBalance: "", // Initially empty
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.collection.InsertOne(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (db *MongoDB) GetUserByLogin(login string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	err := db.collection.FindOne(ctx, bson.M{"login": login}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

func (db *MongoDB) GetUserByID(userID string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	err := db.collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

func (db *MongoDB) UpdateUserBalance(userID, encryptedBalance string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"encrypted_balance": encryptedBalance,
			"updated_at":        time.Now(),
		},
	}

	result, err := db.collection.UpdateOne(ctx, bson.M{"user_id": userID}, update)
	if err != nil {
		return fmt.Errorf("failed to update user balance: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (db *MongoDB) GetUserMeta(login string) (*UserMetaResponse, error) {
	user, err := db.GetUserByLogin(login)
	if err != nil {
		return nil, err
	}

	return &UserMetaResponse{
		Salt:         user.Salt,
		PasswordHash: user.PasswordHash,
	}, nil
}

// Transaction methods
func (db *MongoDB) CreateTransaction(req *TransactionRequest) (*Transaction, error) {
	transactionID := uuid.New().String()
	now := time.Now()

	transaction := &Transaction{
		TransactionID: transactionID,
		UserID:        req.UserID,
		Type:          req.Type,
		Amount:        req.Amount,
		Currency:      req.Currency,
		Status:        "pending", // Default status
		Description:   req.Description,
		PaymentID:     req.PaymentID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.transactionCollection.InsertOne(ctx, transaction)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	return transaction, nil
}

func (db *MongoDB) GetUserTransactions(userID string, limit int) ([]*Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Set default limit if not provided
	if limit <= 0 {
		limit = 50
	}

	// Find transactions for user, sorted by creation date (newest first)
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}).SetLimit(int64(limit))
	cursor, err := db.transactionCollection.Find(ctx, bson.M{"user_id": userID}, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}
	defer cursor.Close(ctx)

	var transactions []*Transaction
	for cursor.Next(ctx) {
		var transaction Transaction
		if err := cursor.Decode(&transaction); err != nil {
			return nil, fmt.Errorf("failed to decode transaction: %w", err)
		}
		transactions = append(transactions, &transaction)
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %w", err)
	}

	return transactions, nil
}

func (db *MongoDB) UpdateTransactionStatus(transactionID, status string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"updated_at": time.Now(),
		},
	}

	result, err := db.transactionCollection.UpdateOne(ctx, bson.M{"transaction_id": transactionID}, update)
	if err != nil {
		return fmt.Errorf("failed to update transaction status: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("transaction not found")
	}

	return nil
}

func (db *MongoDB) GetTransactionByPaymentID(paymentID string) (*Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var transaction Transaction
	err := db.transactionCollection.FindOne(ctx, bson.M{"payment_id": paymentID}).Decode(&transaction)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("transaction not found")
		}
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	return &transaction, nil
}

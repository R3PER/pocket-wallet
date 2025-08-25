package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoDBURI           string
	StripeSecretKey      string
	StripePublishableKey string
	StripeWebhookSecret  string
	ServerPort           string
}

func Load() *Config {
	// Get current working directory
	wd, err := os.Getwd()
	if err != nil {
		log.Printf("Warning: Could not get working directory: %v", err)
	} else {
		log.Printf("Current working directory: %s", wd)
	}

	// Try to load .env file from current directory
	err = godotenv.Load()
	if err != nil {
		log.Printf("Warning: Error loading .env file from current directory: %v", err)
		// Try to load from parent directory (in case we're in a subdirectory)
		err = godotenv.Load("../.env")
		if err != nil {
			log.Printf("Warning: Error loading .env file from parent directory: %v", err)
		} else {
			log.Printf("Successfully loaded .env from parent directory")
		}
	} else {
		log.Printf("Successfully loaded .env from current directory")
	}

	config := &Config{
		MongoDBURI:           getEnv("MONGODB_URI", ""),
		StripeSecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
		StripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
		StripeWebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
		ServerPort:           getEnv("SERVER_PORT", "8080"),
	}

	// Debug logging
	log.Printf("Config loaded - MongoDB URI: %s", maskString(config.MongoDBURI))
	log.Printf("Config loaded - Stripe Secret Key: %s", maskString(config.StripeSecretKey))
	log.Printf("Config loaded - Stripe Publishable Key: %s", maskString(config.StripePublishableKey))
	log.Printf("Config loaded - Server Port: %s", config.ServerPort)

	return config
}

func maskString(s string) string {
	if len(s) <= 8 {
		return s
	}
	return s[:4] + "****" + s[len(s)-4:]
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

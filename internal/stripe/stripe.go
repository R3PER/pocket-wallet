package stripe

import (
	"fmt"
	"pocket-wallet/pkg/config"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"github.com/stripe/stripe-go/v76/webhook"
)

// Local types matching main package
type StripePaymentIntentRequest struct {
	UserID string `json:"user_id"`
	Amount int64  `json:"amount"` // Amount in cents
}

type StripePaymentIntentResponse struct {
	ClientSecret string `json:"client_secret"`
	PaymentID    string `json:"payment_id"`
}

type StripeService struct {
	config *config.Config
}

func NewStripeService(cfg *config.Config) *StripeService {
	stripe.Key = cfg.StripeSecretKey
	return &StripeService{
		config: cfg,
	}
}

func (s *StripeService) CreatePaymentIntent(req *StripePaymentIntentRequest) (*StripePaymentIntentResponse, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(req.Amount),
		Currency: stripe.String(string(stripe.CurrencyPLN)),
		Metadata: map[string]string{
			"user_id": req.UserID,
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment intent: %w", err)
	}

	return &StripePaymentIntentResponse{
		ClientSecret: pi.ClientSecret,
		PaymentID:    pi.ID,
	}, nil
}

func (s *StripeService) VerifyWebhookSignature(payload []byte, signature string) error {
	_, err := webhook.ConstructEvent(payload, signature, s.config.StripeWebhookSecret)
	if err != nil {
		return fmt.Errorf("webhook signature verification failed: %w", err)
	}
	return nil
}

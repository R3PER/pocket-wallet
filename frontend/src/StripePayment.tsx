import React, { useState } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { CreditCard } from '@mui/icons-material';

// Stripe card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true,
};

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  clientSecret: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onError, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string>('');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsProcessing(true);
    setCardError('');

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        setCardError(error.message || 'Wystąpił błąd podczas przetwarzania płatności');
        onError(error.message || 'Błąd płatności');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setCardError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError('');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <CreditCard sx={{ mr: 1 }} />
        Doładowanie portfela - {formatCurrency(amount)}
      </Typography>

      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2, 
          border: cardError ? '1px solid #f44336' : '1px solid #e0e0e0',
          borderRadius: 1
        }}
      >
        <CardElement
          options={cardElementOptions}
          onChange={handleCardChange}
        />
      </Paper>

      {cardError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {cardError}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Dane testowe: 4242 4242 4242 4242, 12/25, 123
      </Typography>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={!stripe || isProcessing}
        startIcon={isProcessing ? <CircularProgress size={20} /> : <CreditCard />}
        sx={{ mt: 2 }}
      >
        {isProcessing ? 'Przetwarzanie...' : `Zapłać ${formatCurrency(amount)}`}
      </Button>
    </Box>
  );
};

interface StripePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  stripePublishableKey: string;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const StripePaymentDialog: React.FC<StripePaymentDialogProps> = ({
  open,
  onClose,
  amount,
  stripePublishableKey,
  clientSecret,
  onSuccess,
  onError
}) => {
  const stripePromise = loadStripe(stripePublishableKey);

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleError = (error: string) => {
    onError(error);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        Płatność kartą
      </DialogTitle>
      <DialogContent>
        {stripePublishableKey && clientSecret ? (
          <Elements stripe={stripePromise}>
            <PaymentForm
              amount={amount}
              onSuccess={handleSuccess}
              onError={handleError}
              clientSecret={clientSecret}
            />
          </Elements>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Anuluj
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StripePaymentDialog;

import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  ButtonGroup
} from '@mui/material';
import {
  AccountBalanceWallet,
  Logout,
  CreditCard,
  History,
  Add,
  Euro
} from '@mui/icons-material';
import { apiClient, Transaction, TransactionListResponse } from './api';
import { generateSalt, generatePasswordHash, deriveEncryptionKey, encryptData, decryptData, verifyPassword } from './crypto';
import StripePaymentDialog from './StripePayment';

// Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Types
interface User {
  login: string;
  user_id: string;
}

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  userBalance: string;
  encryptionKey: CryptoKey | null;
  stripePublishableKey: string;
  loading: boolean;
  transactions: Transaction[];
}

// Notification component
interface NotificationProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

// Login Form Component
interface LoginFormProps {
  onLogin: (login: string, password: string) => Promise<void>;
  onShowRegister: () => void;
  loading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onShowRegister, loading }) => {
  const [formData, setFormData] = useState({ login: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(formData.login, formData.password);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Pocket Wallet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bezpieczny portfel cyfrowy
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="login"
              label="Login"
              name="login"
              autoComplete="username"
              autoFocus
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Hasło"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="outlined"
              onClick={onShowRegister}
            >
              Nie masz konta? Zarejestruj się
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// Register Form Component
interface RegisterFormProps {
  onRegister: (login: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  onShowLogin: () => void;
  loading: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onShowLogin, loading }) => {
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegister(formData.login, formData.email, formData.password, formData.confirmPassword);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Pocket Wallet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Utwórz nowe konto
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="login"
              label="Login"
              name="login"
              autoComplete="username"
              autoFocus
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Hasło"
              type="password"
              id="password"
              autoComplete="new-password"
              helperText="Minimum 8 znaków"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Potwierdź hasło"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Rejestracja...' : 'Zarejestruj się'}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="outlined"
              onClick={onShowLogin}
            >
              Masz już konto? Zaloguj się
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

// Dashboard Component
interface DashboardProps {
  user: User;
  balance: string;
  transactions: Transaction[];
  onLogout: () => void;
  onTopUp: (amount: number) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, balance, transactions, onLogout, onTopUp }) => {
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const quickAmounts = [5, 10, 20, 50, 100, 200];

  const handleTopUp = async () => {
    if (topUpAmount <= 0) return;
    
    setIsTopUpLoading(true);
    try {
      await onTopUp(topUpAmount);
      setTopUpAmount(0);
    } finally {
      setIsTopUpLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <AccountBalanceWallet sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pocket Wallet
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Witaj, {user.login}
          </Typography>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={onLogout}
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          
          {/* Balance Card */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              color: 'white',
              minHeight: 200
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceWallet sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Saldo portfela
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatCurrency(parseFloat(balance))}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Up Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CreditCard sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Doładuj portfel
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="Kwota (PLN)"
                  type="number"
                  value={topUpAmount || ''}
                  onChange={(e) => setTopUpAmount(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Euro /></InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 1, step: 0.01 }}
                />

                <Typography variant="body2" sx={{ mb: 1 }}>
                  Szybkie kwoty:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <ButtonGroup variant="outlined" size="small" sx={{ flexWrap: 'wrap' }}>
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={topUpAmount === amount ? 'contained' : 'outlined'}
                        onClick={() => setTopUpAmount(amount)}
                        sx={{ mb: 1 }}
                      >
                        {amount} zł
                      </Button>
                    ))}
                  </ButtonGroup>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={handleTopUp}
                  disabled={topUpAmount <= 0 || isTopUpLoading}
                  startIcon={isTopUpLoading ? <CircularProgress size={20} /> : <Add />}
                  sx={{ mt: 2 }}
                >
                  {isTopUpLoading ? 'Przetwarzanie...' : `Doładuj ${formatCurrency(topUpAmount)}`}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Transaction History Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <History sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Historia transakcji
                  </Typography>
                </Box>
                
                {transactions.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <History sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1" gutterBottom>
                      Brak transakcji do wyświetlenia
                    </Typography>
                    <Typography variant="body2">
                      Twoje transakcje pojawią się tutaj po pierwszym doładowaniu
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {transactions.map((transaction) => (
                      <Box
                        key={transaction.transaction_id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          borderBottom: '1px solid #e0e0e0',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {transaction.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(transaction.created_at).toLocaleString('pl-PL')}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: transaction.status === 'completed' ? 'success.main' : 
                                     transaction.status === 'pending' ? 'warning.main' : 'error.main'
                            }}
                          >
                            {transaction.status === 'completed' ? 'Ukończono' :
                             transaction.status === 'pending' ? 'Oczekuje' : 'Nieudane'}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body1" 
                          fontWeight="bold"
                          color={transaction.type === 'deposit' ? 'success.main' : 'error.main'}
                        >
                          {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

// Main App Component
const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    currentUser: null,
    userBalance: '0.00',
    encryptionKey: null,
    stripePublishableKey: '',
    loading: false,
    transactions: []
  });

  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    amount: number;
    clientSecret: string;
  }>({
    open: false,
    amount: 0,
    clientSecret: ''
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleRegister = async (login: string, email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      showNotification('Hasła nie są identyczne', 'error');
      return;
    }

    if (password.length < 8) {
      showNotification('Hasło musi mieć co najmniej 8 znaków', 'error');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const salt = generateSalt();
      const passwordHash = await generatePasswordHash(password, salt);

      await apiClient.register({
        login,
        email,
        salt,
        password_hash: passwordHash
      });

      showNotification('Konto zostało utworzone pomyślnie!', 'success');
      setCurrentView('login');
    } catch (error) {
      showNotification(`Błąd rejestracji: ${error}`, 'error');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleLogin = async (login: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const userMeta = await apiClient.getUserMeta(login);
      const isValidPassword = await verifyPassword(password, userMeta.salt, userMeta.password_hash);
      
      if (!isValidPassword) {
        showNotification('Nieprawidłowy login lub hasło', 'error');
        return;
      }

      const encryptionKey = await deriveEncryptionKey(password, userMeta.salt);
      const stripeKey = await apiClient.getStripePublishableKey();

      // Use the actual user_id from database
      const userId = userMeta.user_id;

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: { login, user_id: userId },
        encryptionKey,
        stripePublishableKey: stripeKey
      }));

      await loadBalance(userId, encryptionKey);
      await loadTransactions(userId);
      showNotification('Zalogowano pomyślnie!', 'success');
    } catch (error) {
      showNotification(`Błąd logowania: ${error}`, 'error');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadBalance = async (userId: string, encryptionKey: CryptoKey) => {
    try {
      const response = await apiClient.getBalance(userId);
      
      if (response.encrypted_balance) {
        const decryptedBalance = await decryptData(response.encrypted_balance, encryptionKey);
        setState(prev => ({ ...prev, userBalance: decryptedBalance }));
      } else {
        setState(prev => ({ ...prev, userBalance: '0.00' }));
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      setState(prev => ({ ...prev, userBalance: '0.00' }));
    }
  };

  const loadTransactions = async (userId: string) => {
    try {
      const response: TransactionListResponse = await apiClient.getUserTransactions(userId, 10);
      setState(prev => ({ ...prev, transactions: response.transactions }));
    } catch (error) {
      console.error('Error loading transactions:', error);
      setState(prev => ({ ...prev, transactions: [] }));
    }
  };

  const updateBalance = async (newBalance: string) => {
    if (!state.currentUser || !state.encryptionKey) return;

    try {
      const encryptedBalance = await encryptData(newBalance, state.encryptionKey);
      
      await apiClient.updateBalance({
        user_id: state.currentUser.user_id,
        encrypted_balance: encryptedBalance
      });

      setState(prev => ({ ...prev, userBalance: newBalance }));
    } catch (error) {
      showNotification(`Błąd aktualizacji salda: ${error}`, 'error');
    }
  };

  const handleTopUp = async (amount: number) => {
    if (!state.currentUser || !state.stripePublishableKey) return;

    try {
      // Create payment intent through backend
      const paymentIntent = await apiClient.createPaymentIntent({
        user_id: state.currentUser.user_id,
        amount: Math.round(amount * 100) // Convert to cents
      });

      // Open Stripe payment dialog
      setPaymentDialog({
        open: true,
        amount: amount,
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      showNotification(`Błąd doładowania: ${error}`, 'error');
    }
  };

  const handlePaymentSuccess = async () => {
    const currentBalance = parseFloat(state.userBalance);
    const newBalance = (currentBalance + paymentDialog.amount).toFixed(2);
    
    await updateBalance(newBalance);
    
    // Refresh transactions after payment
    if (state.currentUser) {
      await loadTransactions(state.currentUser.user_id);
    }
    
    showNotification(`Doładowano ${paymentDialog.amount.toFixed(2)} PLN!`, 'success');
    
    setPaymentDialog({ open: false, amount: 0, clientSecret: '' });
  };

  const handlePaymentError = (error: string) => {
    showNotification(`Błąd płatności: ${error}`, 'error');
  };

  const handleLogout = () => {
    setState({
      isAuthenticated: false,
      currentUser: null,
      userBalance: '0.00',
      encryptionKey: null,
      stripePublishableKey: '',
      loading: false,
      transactions: []
    });
    
    setCurrentView('login');
    showNotification('Wylogowano pomyślnie', 'success');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={handleCloseNotification}
        />

        {!state.isAuthenticated ? (
          currentView === 'login' ? (
            <LoginForm
              onLogin={handleLogin}
              onShowRegister={() => setCurrentView('register')}
              loading={state.loading}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              onShowLogin={() => setCurrentView('login')}
              loading={state.loading}
            />
          )
        ) : (
          state.currentUser && (
            <Dashboard
              user={state.currentUser}
              balance={state.userBalance}
              transactions={state.transactions}
              onLogout={handleLogout}
              onTopUp={handleTopUp}
            />
          )
        )}

        {/* Stripe Payment Dialog */}
        <StripePaymentDialog
          open={paymentDialog.open}
          onClose={() => setPaymentDialog({ open: false, amount: 0, clientSecret: '' })}
          amount={paymentDialog.amount}
          stripePublishableKey={state.stripePublishableKey}
          clientSecret={paymentDialog.clientSecret}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;

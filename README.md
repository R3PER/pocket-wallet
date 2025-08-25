# Pocket Wallet - Secure Payment Wallet

A complete payment wallet application built using modern technologies and the highest security standards.

## Screens and Video
<img width="1021" height="808" alt="1" src="https://github.com/user-attachments/assets/518332dd-2229-4d8e-9dbc-48e088ccd479" />
<img width="1028" height="866" alt="2" src="https://github.com/user-attachments/assets/b1edf4d9-e41d-4f7f-ac7e-601c03d86078" />
<img width="1023" height="864" alt="3" src="https://github.com/user-attachments/assets/1ede3426-0ac8-47c4-8d73-a9e8b6a3f01c" />


https://github.com/user-attachments/assets/1a955104-448a-445f-b7c8-628cef18ac0a




## 🏗️ Architecture

### Frontend
- **TypeScript + React** – Modern user interface  
- **Material-UI (MUI)** – UI components and styling  
- **Wails** – Framework for desktop applications  

### Backend
- **Go (Golang)** – Efficient and secure backend  
- **Couchbase Capella** – Cloud database (accessible only through the backend)  

### Security
- **AES-256-GCM** – End-to-end data encryption  
- **End-to-End Encryption** – Backend never sees unencrypted data  

### Payments
- **Stripe** – Payment integration in test mode  
- **Webhooks** – Automatic payment processing  

## 🔐 Security Model

### Registration
1. Frontend generates a random 16-byte salt  
2. Frontend derives an AES-256 key for data encryption  
3. Backend only receives: login, email, salt, password hash  
4. **Backend never sees the user’s password**  

### Login
1. Frontend fetches salt and password hash from the backend  
2. User enters password  
3. Frontend verifies the password locally  
4. Upon success, frontend generates the AES key to decrypt data  

### Data Encryption
- All sensitive data (e.g., balance) is encrypted using AES-256-GCM  
- The encryption key never leaves the frontend  
- Backend only stores encrypted data  

## 🚀 Installation & Running

### Requirements
- Go 1.23+  
- Node.js 18+  
- pnpm  
- Wails v2  
- Couchbase Capella account  
- Stripe account (test mode)  

### 1. Clone the repository
```bash
git clone <repository-url>
cd pocket-wallet
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your details:
```env
# Couchbase Capella
COUCHBASE_CONNECTION_STRING=couchbases://your-cluster.cloud.couchbase.com
COUCHBASE_USERNAME=your_username
COUCHBASE_PASSWORD=your_password
COUCHBASE_BUCKET=pocket-wallet

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
SERVER_PORT=8080
```

### 3. Install dependencies

#### Backend (Go)
```bash
go mod tidy
```

#### Frontend (React)
```bash
cd frontend
pnpm install
cd ..
```

### 4. Stripe CLI setup (recommended)

Instead of manually setting the webhook secret, use Stripe CLI for local testing:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to the local app
stripe listen --forward-to localhost:8080/stripe/webhook
```

Stripe CLI will automatically generate a webhook secret and forward events.

### 5. Run the app

#### Option A: Auto script with Stripe CLI (recommended)
```bash
./start-with-stripe.sh
```

This script will:
- Check Stripe CLI installation  
- Install dependencies  
- Guide you through Stripe CLI setup  
- Launch the app  

#### Option B: Manual run

1. **Run Stripe CLI in a separate terminal:**
```bash
stripe listen --forward-to localhost:8080/stripe/webhook
```

2. **Copy the webhook secret into `.env`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

3. **Run the app:**
```bash
wails dev
```

#### Production build
```bash
wails build
```

## 🗄️ Database Structure

### User Document (Couchbase)
```json
{
  "user_id": "uuid",
  "login": "username",
  "email": "user@example.com",
  "salt": "base64_encoded_salt",
  "password_hash": "hash_here",
  "encrypted_balance": "base64(iv + ciphertext + tag)",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 🔌 API Endpoints

### Authentication
- `POST /register` – Register user  
- `GET /user-meta/:login` – Get user metadata  

### Wallet
- `POST /balance` – Update encrypted balance  
- `GET /balance/:user_id` – Get encrypted balance  

### Payments
- `POST /stripe/create-intent` – Create PaymentIntent  
- `POST /stripe/webhook` – Stripe webhook  

## 🧪 Testing

### Stripe test data
```
Card number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

### Payment test steps
1. Log into the app  
2. Click "Top up wallet"  
3. Select amount (e.g., 5 PLN)  
4. Use Stripe test card data  
5. Verify updated balance  

## 🔧 Development

### Project Structure
```
pocket-wallet/
├── app.go                 # Wails main app
├── main.go                # Entry point
├── internal/
│   ├── auth/              # Authentication
│   ├── crypto/            # Cryptography (AES-256-GCM)
│   ├── database/          # Couchbase integration
│   ├── models/            # Data models
│   └── stripe/            # Stripe integration
├── pkg/
│   ├── config/            # Configuration
│   └── utils/             # Utilities
└── frontend/
    ├── src/
    │   ├── App.tsx        # Main React component
    │   ├── api.ts         # API client
    │   ├── crypto.ts      # Frontend cryptography
    │   └── main.tsx       # React entry point
    ├── tailwind.config.js
    └── package.json
```

### Adding new features
1. Backend: Add endpoint in `app.go`  
2. Frontend: Add function in `api.ts`  
3. UI: Create React components  
4. Wails: Regenerate bindings with `wails generate module`  

## 🛡️ Security

### Best Practices
- ✅ End-to-end encryption  
- ✅ AES-256-GCM for data  
- ✅ Stripe webhook verification  
- ✅ Input validation  
- ✅ Secure key storage  

### Security Notes
- Backend never has access to unencrypted user data  
- Encryption keys are generated locally and never leave the frontend  
- All database connections are encrypted (TLS)  
- Stripe webhooks are verified by signature  

This project is for educational purposes. A security audit is required before production use.

## 🤝 Support

If you encounter issues:
1. Check application logs  
2. Verify `.env` configuration  
3. Ensure Couchbase and Stripe are correctly set up  
4. Check your internet connection

## 🔄 Updates

### v1.0.0
- ✅ Basic wallet functionality  
- ✅ Registration and login  
- ✅ End-to-end encryption  
- ✅ Stripe integration  
- ✅ React + Tailwind UI  

### Planned features
- [ ] Transaction history  
- [ ] Data export  
- [ ] Two-factor authentication (2FA)  
- [ ] Push notifications  
- [ ] Mobile app

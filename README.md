# Pocket Wallet - Bezpieczny Portfel Płatniczy

Kompletna aplikacja portfela płatniczego zbudowana z wykorzystaniem nowoczesnych technologii i najwyższych standardów bezpieczeństwa.

## 🏗️ Architektura

### Frontend
- **TypeScript + React** - Nowoczesny interfejs użytkownika
- **Material-UI (MUI)** - Komponenty UI i stylowanie
- **Wails** - Framework do aplikacji desktopowych

### Backend
- **Go (Golang)** - Wydajny i bezpieczny backend
- **Couchbase Capella** - Baza danych w chmurze (dostęp tylko przez backend)

### Bezpieczeństwo
- **AES-256-GCM** - Szyfrowanie end-to-end danych użytkownika
- **Argon2id** - Bezpieczne hashowanie haseł i derywacja kluczy
- **End-to-End Encryption** - Backend nigdy nie widzi niezaszyfrowanych danych

### Płatności
- **Stripe** - Integracja płatności w trybie testowym
- **Webhooks** - Automatyczne przetwarzanie płatności

## 🔐 Model Bezpieczeństwa

### Rejestracja
1. Frontend generuje losowy salt (16 bajtów)
2. Argon2id generuje:
   - Hash hasła do uwierzytelniania
   - Klucz AES-256 do szyfrowania danych
3. Backend otrzymuje tylko: login, email, salt, hash hasła
4. **Backend nigdy nie widzi hasła użytkownika**

### Logowanie
1. Frontend pobiera salt i hash hasła z backendu
2. Użytkownik wprowadza hasło
3. Frontend weryfikuje hasło lokalnie
4. Po weryfikacji generuje klucz AES do deszyfrowania danych

### Szyfrowanie Danych
- Wszystkie wrażliwe dane (saldo) są szyfrowane AES-256-GCM
- Klucz szyfrowania nigdy nie opuszcza frontendu
- Backend przechowuje tylko zaszyfrowane dane

## 🚀 Instalacja i Uruchomienie

### Wymagania
- Go 1.23+
- Node.js 18+
- pnpm
- Wails v2
- Konto Couchbase Capella
- Konto Stripe (tryb testowy)

### 1. Klonowanie repozytorium
```bash
git clone <repository-url>
cd pocket-wallet
```

### 2. Konfiguracja środowiska
```bash
cp .env.example .env
```

Edytuj plik `.env` i uzupełnij:
```env
# Couchbase Capella
COUCHBASE_CONNECTION_STRING=couchbases://your-cluster.cloud.couchbase.com
COUCHBASE_USERNAME=your_username
COUCHBASE_PASSWORD=your_password
COUCHBASE_BUCKET=pocket-wallet

# Stripe (tryb testowy)
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
SERVER_PORT=8080
```

### 3. Instalacja zależności

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

### 4. Konfiguracja Stripe CLI (zalecane)

Zamiast webhook secret, użyj Stripe CLI do lokalnego testowania:

```bash
# Zainstaluj Stripe CLI
# https://stripe.com/docs/stripe-cli

# Zaloguj się do Stripe
stripe login

# Przekieruj webhooks do lokalnej aplikacji
stripe listen --forward-to localhost:8080/stripe/webhook
```

Stripe CLI automatycznie wygeneruje webhook secret i będzie przekierowywać eventy.

### 5. Uruchomienie aplikacji

#### Opcja A: Automatyczny skrypt ze Stripe CLI (zalecane)
```bash
./start-with-stripe.sh
```

Skrypt automatycznie:
- Sprawdzi instalację Stripe CLI
- Zainstaluje zależności
- Poprowadzi przez konfigurację Stripe CLI
- Uruchomi aplikację

#### Opcja B: Ręczne uruchomienie

1. **Uruchom Stripe CLI w osobnym terminalu:**
```bash
stripe listen --forward-to localhost:8080/stripe/webhook
```

2. **Skopiuj webhook secret i zaktualizuj .env:**
```bash
# Skopiuj whsec_... z Stripe CLI i wklej do .env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

3. **Uruchom aplikację:**
```bash
wails dev
```

#### Build produkcyjny
```bash
wails build
```

## 🗄️ Struktura Bazy Danych

### Dokument Użytkownika (Couchbase)
```json
{
  "user_id": "uuid",
  "login": "username",
  "email": "user@example.com",
  "salt": "base64_encoded_salt",
  "password_hash": "argon2id$v=19$m=65536,t=3,p=1$...",
  "encrypted_balance": "base64(iv + ciphertext + tag)",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 🔌 API Endpoints

### Uwierzytelnianie
- `POST /register` - Rejestracja użytkownika
- `GET /user-meta/:login` - Pobranie metadanych użytkownika

### Portfel
- `POST /balance` - Aktualizacja zaszyfrowanego salda
- `GET /balance/:user_id` - Pobranie zaszyfrowanego salda

### Płatności
- `POST /stripe/create-intent` - Utworzenie PaymentIntent
- `POST /stripe/webhook` - Webhook Stripe

## 🧪 Testowanie

### Dane testowe Stripe
```
Numer karty: 4242 4242 4242 4242
Data ważności: 12/25
CVC: 123
```

### Testowanie płatności
1. Zaloguj się do aplikacji
2. Kliknij "Doładuj portfel"
3. Wybierz kwotę (np. 5 PLN)
4. Użyj danych testowych karty Stripe
5. Sprawdź aktualizację salda

## 🔧 Rozwój

### Struktura projektu
```
pocket-wallet/
├── app.go                 # Główna aplikacja Wails
├── main.go               # Entry point
├── internal/
│   ├── auth/            # Uwierzytelnianie
│   ├── crypto/          # Kryptografia (AES-256-GCM)
│   ├── database/        # Couchbase integration
│   ├── models/          # Modele danych
│   └── stripe/          # Integracja Stripe
├── pkg/
│   ├── config/          # Konfiguracja
│   └── utils/           # Narzędzia
└── frontend/
    ├── src/
    │   ├── App.tsx      # Główny komponent React
    │   ├── api.ts       # API client
    │   ├── crypto.ts    # Kryptografia frontend
    │   └── main.tsx     # Entry point React
    ├── tailwind.config.js
    └── package.json
```

### Dodawanie nowych funkcji
1. Backend: Dodaj endpoint w `app.go`
2. Frontend: Dodaj funkcję w `api.ts`
3. UI: Utwórz komponenty React
4. Wails: Regeneruj bindings: `wails generate module`

## 🛡️ Bezpieczeństwo

### Najlepsze praktyki
- ✅ End-to-end encryption
- ✅ Argon2id dla haseł
- ✅ AES-256-GCM dla danych
- ✅ Weryfikacja webhook Stripe
- ✅ Walidacja danych wejściowych
- ✅ Bezpieczne przechowywanie kluczy

### Uwagi bezpieczeństwa
- Backend nigdy nie ma dostępu do niezaszyfrowanych danych użytkownika
- Klucze szyfrowania są generowane lokalnie i nigdy nie opuszczają frontendu
- Wszystkie komunikacje z bazą danych są szyfrowane (TLS)
- Stripe webhooks są weryfikowane podpisem

## 📝 Licencja

Ten projekt jest przykładem edukacyjnym. Przed użyciem w produkcji należy przeprowadzić audyt bezpieczeństwa.

## 🤝 Wsparcie

W przypadku problemów:
1. Sprawdź logi aplikacji
2. Zweryfikuj konfigurację `.env`
3. Upewnij się, że Couchbase i Stripe są poprawnie skonfigurowane
4. Sprawdź połączenie internetowe

## 🔄 Aktualizacje

### v1.0.0
- ✅ Podstawowa funkcjonalność portfela
- ✅ Rejestracja i logowanie
- ✅ Szyfrowanie end-to-end
- ✅ Integracja Stripe
- ✅ Interfejs React + Tailwind

### Planowane funkcje
- [ ] Historia transakcji
- [ ] Eksport danych
- [ ] Dwuskładnikowe uwierzytelnianie (2FA)
- [ ] Powiadomienia push
- [ ] Aplikacja mobilna

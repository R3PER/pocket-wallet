#!/bin/bash

# Skrypt do uruchomienia aplikacji z Stripe CLI

echo "🚀 Uruchamianie Pocket Wallet z Stripe CLI..."

# Sprawdź czy Stripe CLI jest zainstalowane
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI nie jest zainstalowane!"
    echo "Zainstaluj ze strony: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Sprawdź czy użytkownik jest zalogowany do Stripe
if ! stripe config --list &> /dev/null; then
    echo "❌ Nie jesteś zalogowany do Stripe!"
    echo "Uruchom: stripe login"
    exit 1
fi

# Skopiuj .env.example do .env jeśli nie istnieje
if [ ! -f .env ]; then
    echo "📋 Kopiowanie .env.example do .env..."
    cp .env.example .env
    echo "✅ Plik .env został utworzony. Sprawdź konfigurację przed kontynuowaniem."
fi

echo "🔧 Instalowanie zależności..."

# Instaluj zależności Go
go mod tidy

# Instaluj zależności frontend
cd frontend
pnpm install
cd ..

echo "🎯 Uruchamianie Stripe CLI webhook listener..."
echo "Stripe CLI będzie przekierowywać webhooks do localhost:8080/stripe/webhook"
echo ""
echo "W nowym terminalu uruchom:"
echo "stripe listen --forward-to localhost:8080/stripe/webhook"
echo ""
echo "Skopiuj webhook secret (whsec_...) i zaktualizuj plik .env"
echo ""

read -p "Naciśnij Enter gdy Stripe CLI jest uruchomione i .env jest zaktualizowane..."

echo "🚀 Uruchamianie aplikacji Wails..."
wails dev

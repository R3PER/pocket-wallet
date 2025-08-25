import * as App from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';

// Export types from generated models for convenience
export type RegisterRequest = main.RegisterRequest;
export type User = main.User;
export type UserMetaResponse = main.UserMetaResponse;
export type BalanceRequest = main.BalanceRequest;
export type BalanceResponse = main.BalanceResponse;
export type StripePaymentIntentRequest = main.StripePaymentIntentRequest;
export type StripePaymentIntentResponse = main.StripePaymentIntentResponse;
export type Transaction = main.Transaction;
export type TransactionListResponse = main.TransactionListResponse;

// API Client class for backend communication
export class ApiClient {
  
  // Register new user
  async register(request: RegisterRequest): Promise<User> {
    try {
      const user = await App.Register(request);
      return user;
    } catch (error) {
      throw new Error(`Registration failed: ${error}`);
    }
  }

  // Get user metadata for login
  async getUserMeta(login: string): Promise<UserMetaResponse> {
    try {
      const meta = await App.GetUserMeta(login);
      return meta;
    } catch (error) {
      throw new Error(`Failed to get user metadata: ${error}`);
    }
  }


  // Update user's encrypted balance
  async updateBalance(request: BalanceRequest): Promise<void> {
    try {
      await App.UpdateBalance(request);
    } catch (error) {
      throw new Error(`Failed to update balance: ${error}`);
    }
  }

  // Get user's encrypted balance
  async getBalance(userId: string): Promise<BalanceResponse> {
    try {
      const balance = await App.GetBalance(userId);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  // Create Stripe payment intent
  async createPaymentIntent(request: StripePaymentIntentRequest): Promise<StripePaymentIntentResponse> {
    try {
      const response = await App.CreatePaymentIntent(request);
      return response;
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error}`);
    }
  }

  // Get Stripe publishable key
  async getStripePublishableKey(): Promise<string> {
    try {
      const key = await App.GetStripePublishableKey();
      return key;
    } catch (error) {
      throw new Error(`Failed to get Stripe key: ${error}`);
    }
  }

  // Get user transactions
  async getUserTransactions(userId: string, limit: number = 50): Promise<TransactionListResponse> {
    try {
      const transactions = await App.GetUserTransactions(userId, limit);
      return transactions;
    } catch (error) {
      throw new Error(`Failed to get transactions: ${error}`);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase URL or key is missing - using minimal auth');
      // Create a dummy client that won't be used
      this.supabase = null as any;
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase authentication service initialized');
  }

  // Sign up a new user with email and password
  async signUp(email: string, password: string, userData: any = {}) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData, // Pass additional user metadata
        },
      });

      if (error) {
        this.logger.error(`Supabase signup error: ${error.message}`);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in Supabase signup:', error);
      throw error;
    }
  }

  // Sign in a user with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.error(`Supabase login error: ${error.message}`);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in Supabase signin:', error);
      throw error;
    }
  }

  // Sign out a user
  async signOut(accessToken: string) {
    try {
      // Set the session in Supabase client
      this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        this.logger.error(`Supabase signout error: ${error.message}`);
        throw error;
      }

      return true;
    } catch (error) {
      this.logger.error('Error in Supabase signout:', error);
      throw error;
    }
  }

  // Get user information
  async getUser(accessToken: string) {
    try {
      // Set the session in Supabase client
      this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });

      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        this.logger.error(`Error getting user: ${error.message}`);
        throw error;
      }

      return data.user;
    } catch (error) {
      this.logger.error('Error getting user from Supabase:', error);
      throw error;
    }
  }

  // Refresh Supabase tokens
  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        this.logger.error(`Supabase token refresh error: ${error.message}`);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error refreshing Supabase token:', error);
      throw error;
    }
  }

  // Update user data in Supabase
  async updateUserData(accessToken: string, userData: any) {
    try {
      // Set the session in Supabase client
      await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });

      const { data, error } = await this.supabase.auth.updateUser({
        data: userData,
      });

      if (error) {
        this.logger.error(`Error updating user data: ${error.message}`);
        throw error;
      }

      return data.user;
    } catch (error) {
      this.logger.error('Error updating user data in Supabase:', error);
      throw error;
    }
  }

  // Reset password via email
  async resetPassword(email: string) {
    try {
      const { data, error } =
        await this.supabase.auth.resetPasswordForEmail(email);

      if (error) {
        this.logger.error(
          `Error sending password reset email: ${error.message}`,
        );
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in password reset:', error);
      throw error;
    }
  }

  // Verify OTP for email verification or password reset
  async verifyOTP(email: string, token: string, type: 'email' | 'recovery') {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (error) {
        this.logger.error(`OTP verification error: ${error.message}`);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in OTP verification:', error);
      throw error;
    }
  }
}

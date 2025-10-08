"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase'; // Import the Supabase client

function Login() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Blob Battle</h1>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers for now
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(220 89% 57%)', // Blue-500
                  brandAccent: 'hsl(220 89% 67%)', // Blue-600
                  inputBackground: 'hsl(220 10% 15%)', // Gray-800
                  inputBorder: 'hsl(220 10% 25%)', // Gray-700
                  inputPlaceholder: 'hsl(220 10% 40%)', // Gray-500
                  inputText: 'hsl(220 10% 90%)', // Gray-100
                  defaultButtonBackground: 'hsl(220 89% 57%)', // Blue-500
                  defaultButtonBackgroundHover: 'hsl(220 89% 67%)', // Blue-600
                  defaultButtonBorder: 'hsl(220 89% 57%)', // Blue-500
                  defaultButtonText: 'hsl(0 0% 100%)', // White
                  dividerBackground: 'hsl(220 10% 25%)', // Gray-700
                  anchorTextColor: 'hsl(220 89% 57%)', // Blue-500
                  anchorTextHoverColor: 'hsl(220 89% 67%)', // Blue-600
                },
              },
            },
          }}
          theme="dark" // Using dark theme to match app's aesthetic
          redirectTo={window.location.origin} // Redirect to home after login/signup
        />
      </div>
    </div>
  );
}

export default Login;
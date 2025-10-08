"use client";

import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase'; // Import the Supabase client
import { showInfo, showError } from '../utils/toast'; // Import toast utilities

// Declare Telegram WebApp globally
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

function Login() {
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) {
      setIsTelegramWebApp(true);
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand(); // Expand the mini app to full screen
      
      if (!authAttempted) {
        handleTelegramLogin(window.Telegram.WebApp.initData);
        setAuthAttempted(true);
      }
    } else {
      setIsTelegramWebApp(false);
    }
  }, [authAttempted]);

  const handleTelegramLogin = async (initData: string) => {
    showInfo('Attempting Telegram login...');
    try {
      // Construct the Edge Function URL using the project reference from environment variables
      const edgeFunctionUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_REF}.supabase.co/functions/v1/telegram-auth`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.access_token && data.refresh_token) {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          showInfo('Logged in with Telegram!');
          // The SessionContextProvider will handle the redirect
        } else {
          showError('Telegram login failed: No session tokens received.');
        }
      } else {
        showError(`Telegram login failed: ${data.error || 'Unknown error'}`);
        console.error('Telegram login error:', data.error);
      }
    } catch (error: any) {
      showError(`Telegram login error: ${error.message}`);
      console.error('Telegram login error:', error);
    }
  };

  if (isTelegramWebApp) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 text-white text-center">
        <div className="w-full max-w-md p-8 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-6">Blob Battle</h1>
          <p className="text-lg mb-4">Authenticating with Telegram...</p>
          <p className="text-sm text-gray-400">Please wait, this should only take a moment.</p>
        </div>
      </div>
    );
  }

  // Fallback for non-Telegram WebApp environments
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Blob Battle</h1>
        <p className="text-red-400 text-center mb-4">
          This application is designed to run within Telegram.
        </p>
        <p className="text-gray-300 text-center mb-6">
          Please open it through a Telegram Mini App link.
        </p>
        {/* Optionally, you can keep the Supabase Auth UI for email/password as a fallback for development/testing */}
        <Auth
          supabaseClient={supabase}
          providers={[]} // No providers here, as we're forcing Telegram login
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(220 89% 57%)',
                  brandAccent: 'hsl(220 89% 67%)',
                  inputBackground: 'hsl(220 10% 15%)',
                  inputBorder: 'hsl(220 10% 25%)',
                  inputPlaceholder: 'hsl(220 10% 40%)',
                  inputText: 'hsl(220 10% 90%)',
                  defaultButtonBackground: 'hsl(220 89% 57%)',
                  defaultButtonBackgroundHover: 'hsl(220 89% 67%)',
                  defaultButtonBorder: 'hsl(220 89% 57%)',
                  defaultButtonText: 'hsl(0 0% 100%)',
                  dividerBackground: 'hsl(220 10% 25%)',
                  anchorTextColor: 'hsl(220 89% 57%)',
                  anchorTextHoverColor: 'hsl(220 89% 67%)',
                },
              },
            },
          }}
          theme="dark"
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
}

export default Login;
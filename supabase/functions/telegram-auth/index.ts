import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function to verify Telegram initData hash
async function verifyTelegramInitData(initData: string, botToken: string): Promise<boolean> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(botToken),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const key = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode('WebAppData')
  );

  const checkHash = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    checkHash,
    encoder.encode(dataCheckString)
  );

  const hexHash = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hexHash === hash;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    if (!initData) {
      return new Response(JSON.stringify({ error: 'initData is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    }

    const isValid = await verifyTelegramInitData(initData, botToken);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid initData hash' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    if (!userParam) {
      return new Response(JSON.stringify({ error: 'User data not found in initData' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const telegramUser = JSON.parse(userParam);
    const telegramId = telegramUser.id;
    const firstName = telegramUser.first_name;
    const lastName = telegramUser.last_name;
    const username = telegramUser.username;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userId: string;
    let session: any;

    // Try to find existing user by telegram_id in public.profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      throw profileError;
    }

    if (profile) {
      // User exists, sign them in
      userId = profile.id;
      // For users created via admin API, signInWithIdToken might not work directly.
      // We generate a session link and extract the session from it.
      const { data: { user: authUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (getUserError) throw getUserError;
      
      const { data: { session: generatedSession }, error: generateSessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser?.email || `${telegramId}@telegram.bot`, // Fallback email
        password: Math.random().toString(36).substring(2, 15), // Dummy password
      });
      if (generateSessionError) throw generateSessionError;
      session = generatedSession;

    } else {
      // User does not exist, create new user in auth.users and profile
      const { data: { user: newUser }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${telegramId}@telegram.bot`, // Use a unique email for Supabase auth
        password: Math.random().toString(36).substring(2, 15), // Generate a random password
        user_metadata: {
          telegram_id: telegramId,
          first_name: firstName,
          last_name: lastName,
          username: username,
        },
      });

      if (createUserError) throw createUserError;
      if (!newUser) throw new Error('Failed to create new user.');

      userId = newUser.id;

      // Update the public.profiles entry created by the trigger with telegram_id
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          telegram_id: telegramId,
          first_name: firstName,
          last_name: lastName,
          // avatar_url: telegramUser.photo_url, // If you want to store avatar
        })
        .eq('id', userId);

      if (updateProfileError) throw updateProfileError;

      // Generate a session for the newly created user
      const { data: { session: newSession }, error: generateSessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: newUser.email!,
        password: Math.random().toString(36).substring(2, 15), // Dummy password
      });
      if (generateSessionError) throw generateSessionError;
      session = newSession;
    }

    if (!session) {
      throw new Error('Failed to create or retrieve session.');
    }

    return new Response(JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Telegram Auth Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
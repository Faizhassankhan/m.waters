
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define CORS headers directly in the function file for simplicity and reliability.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // This is a preflight request. It's sent by the browser to check if the server
  // will accept the actual request. We need to respond with the correct headers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a new admin client to perform elevated actions.
    // This client uses the SERVICE_ROLE_KEY, which bypasses RLS.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, email } = await req.json();

    // 1. Create the authentication user in Supabase's auth system.
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: Math.random().toString(36).slice(-8), // Auto-generate a random password
      email_confirm: true, // Auto-confirm the user's email so they can log in immediately
      user_metadata: { user_type: 'customer' }
    });

    if (authError) {
      // If auth user creation fails, throw an error.
      throw authError;
    }
    if (!user) {
      // This should not happen if authError is null, but it's good practice to check.
      throw new Error("Failed to create auth user.");
    }

    // 2. Create the corresponding user profile in the public.users table.
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({ id: user.id, name: name });

    if (profileError) {
      // IMPORTANT: If profile creation fails, we must delete the orphaned auth user
      // to prevent a state where a login exists without a profile.
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    // If everything is successful, return a success response.
    return new Response(JSON.stringify({ message: "User created successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // If any error occurs, return a generic error response.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

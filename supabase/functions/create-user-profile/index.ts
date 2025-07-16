
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a new admin client to perform elevated actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, email } = await req.json();

    // 1. Create the authentication user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: Math.random().toString(36).slice(-8), // Auto-generate a random password
      email_confirm: true, // Auto-confirm the user's email
      user_metadata: { user_type: 'customer' }
    });

    if (authError) {
      throw authError;
    }
    if (!user) {
      throw new Error("Failed to create auth user.");
    }

    // 2. Create the user profile in the public.users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({ id: user.id, name: name });

    if (profileError) {
      // If profile creation fails, attempt to delete the orphaned auth user
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    return new Response(JSON.stringify({ message: "User created successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

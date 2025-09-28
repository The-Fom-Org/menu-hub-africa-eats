
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Creating admin user...')
    
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Supabase client created')

    // Create the admin user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@menuhub.com',
      password: 'AdminPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'MenuHub Admin'
      }
    })

    console.log('Auth user creation result:', { authUser: !!authUser, authError })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: authError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!authUser.user) {
      console.error('No user created')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No user created' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User created successfully:', authUser.user.id)

    // Add to admin_users table
    const { error: adminError } = await supabaseAdmin
      .from('admin_users')
      .upsert({
        user_id: authUser.user.id,
        email: 'admin@menuhub.com',
        role: 'admin'
      })

    console.log('Admin table upsert result:', { adminError })

    if (adminError) {
      console.error('Admin table error:', adminError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: adminError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Admin user created successfully')
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Admin user created successfully',
      userId: authUser.user.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

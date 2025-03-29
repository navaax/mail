import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, content } = await req.json();

    // Aquí implementarías la lógica de envío de correo usando el servicio que prefieras
    // Por ejemplo, usando SendGrid, Mailgun, etc.
    
    // Este es un ejemplo usando el servicio de email de Supabase
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/send_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      },
      body: JSON.stringify({
        to_email: to,
        subject: subject,
        content: content,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Error al enviar el correo');
    }

    return new Response(
      JSON.stringify({ message: 'Correos enviados exitosamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
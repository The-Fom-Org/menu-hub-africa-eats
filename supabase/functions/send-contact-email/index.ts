
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  restaurantName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  location?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactRequest = await req.json();

    const emailContent = `
      <h2>New Contact Form Submission</h2>
      
      <h3>Contact Information:</h3>
      <p><strong>Restaurant Name:</strong> ${data.restaurantName}</p>
      <p><strong>Contact Person:</strong> ${data.contactPerson}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
      <p><strong>Location:</strong> ${data.location || 'Not provided'}</p>
      
      <h3>Message:</h3>
      <p>${data.message}</p>
      
      <hr>
      <p><em>This message was sent from the MenuHub contact form.</em></p>
    `;

    const emailResponse = await resend.emails.send({
      from: "MenuHub Contact <noreply@resend.dev>",
      to: ["menuhubafrica@gmail.com"],
      reply_to: [data.email],
      subject: `Contact Form - ${data.restaurantName}`,
      html: emailContent,
    });

    // Send confirmation email to customer
    await resend.emails.send({
      from: "MenuHub <noreply@resend.dev>",
      to: [data.email],
      subject: "Message Received - MenuHub",
      html: `
        <h2>Thank you for contacting MenuHub!</h2>
        <p>Dear ${data.contactPerson},</p>
        
        <p>We have received your message and will get back to you within 2 hours.</p>
        
        <p>In the meantime, feel free to explore our platform features or contact us directly via WhatsApp.</p>
        
        <p>Best regards,<br>
        The MenuHub Team</p>
        
        <hr>
        <p><small>This is an automated message. Please do not reply to this email.</small></p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

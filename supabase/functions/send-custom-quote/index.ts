import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CustomQuoteRequest {
  restaurantName: string;
  contactPerson: string;
  email: string;
  phone: string;
  restaurantType: string;
  interestAreas: string[];
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: CustomQuoteRequest = await req.json();

    const emailContent = `
      <h2>New Custom Quote Request</h2>
      
      <h3>Contact Information:</h3>
      <p><strong>Restaurant Name:</strong> ${data.restaurantName}</p>
      <p><strong>Contact Person:</strong> ${data.contactPerson}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      
      <h3>Business Details:</h3>
      <p><strong>Restaurant Type:</strong> ${data.restaurantType}</p>
      
      <h3>Areas of Interest:</h3>
      <ul>
        ${data.interestAreas.map(area => `<li>${area}</li>`).join('')}
      </ul>
      
      ${data.message ? `
        <h3>Additional Requirements:</h3>
        <p>${data.message}</p>
      ` : ''}
      
      <hr>
      <p><em>Please respond to this request within 24 hours as promised.</em></p>
    `;

    const emailResponse = await resend.emails.send({
      from: "MenuHub Quote Request <noreply@resend.dev>",
      to: ["menuhubafrica@gmail.com"],
      reply_to: [data.email],
      subject: `Custom Quote Request - ${data.restaurantName}`,
      html: emailContent,
    });

    // Send confirmation email to customer
    await resend.emails.send({
      from: "MenuHub <noreply@resend.dev>",
      to: [data.email],
      subject: "Quote Request Received - MenuHub",
      html: `
        <h2>Thank you for your interest in MenuHub!</h2>
        <p>Dear ${data.contactPerson},</p>
        
        <p>We have received your custom quote request for <strong>${data.restaurantName}</strong>.</p>
        
        <p>Our team will review your requirements and get back to you within 24 hours with a tailored solution and pricing.</p>
        
        <p>In the meantime, feel free to explore our platform features or contact us if you have any questions.</p>
        
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
    console.error("Error in send-custom-quote function:", error);
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
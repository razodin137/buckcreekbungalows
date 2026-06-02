/**
 * Cloudflare Pages Function: /api/forms
 * Accepts HTML form posts or JSON and forwards them via MailChannels.
 */

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPost(context) {
  try {
    let output = {};
    const contentType = context.request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      output = await context.request.json();
    } else {
      const formData = await context.request.formData();
      for (const [key, value] of formData.entries()) {
        output[key] = value;
      }
    }

    if (!output.email || !output.message) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email and message are required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const emailResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: "gerald@buckcreekbungalows.com" }],
            dkim_domain: "buckcreekbungalows.com"
          }
        ],
        from: {
          email: "noreply@buckcreekbungalows.com",
          name: "Buck Creek Bungalows"
        },
        reply_to: {
          email: output.email,
          name: output.name || "Guest"
        },
        subject: `Buck Creek Contact Form: ${output.subject || "General Inquiry"}`,
        content: [
          {
            type: "text/html",
            value: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${output.name || "Not provided"}</p>
              <p><strong>Email:</strong> ${output.email}</p>
              <p><strong>Phone:</strong> ${output.phone || "Not provided"}</p>
              <p><strong>Subject:</strong> ${output.subject || "Not specified"}</p>
              <p><strong>Message:</strong></p>
              <p>${String(output.message || "").replace(/\n/g, "<br>")}</p>
            `
          }
        ]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      return new Response(
        JSON.stringify({ ok: false, error: errorText }),
        { status: 502, headers: jsonHeaders }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: jsonHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: jsonHeaders }
    );
  }
}

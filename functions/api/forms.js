/**
 * POST /api/forms
 * Handle form submissions and send email via Mailchannels
 */
export async function onRequestPost(context) {
  try {
    // Parse form data from request
    const formData = await context.request.formData();

    // Convert FormData to JSON object
    // NOTE: Handles multiple values per key
    let output = {};
    for (let [key, value] of formData) {
      let tmp = output[key];
      if (tmp === undefined) {
        output[key] = value;
      } else {
        output[key] = [].concat(tmp, value);
      }
    }

    // Validate required fields
    if (!output.email || !output.message) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send email via Mailchannels
    const emailResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: "gerald@buckcreekbungalows.com" }],
          },
        ],
        from: {
          email: "noreply@buckcreekbungalows.com",
          name: "Buck Creek Bungalows Contact Form",
        },
        subject: `New Contact Form Submission from ${output.name || "Guest"}`,
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
              <p>${(output.message || "").replace(/\n/g, "<br>")}</p>
            `,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Mailchannels error:", error);
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to send email" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

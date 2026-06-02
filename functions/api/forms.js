export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders()
      });
    }

    try {
      // Resolve config from KV
      let configRaw = null;

      const token = request.headers.get("X-Platform-Token");
      if (token) {
        configRaw = await env.CUSTOMER_CONFIGS.get(`token_${token}`);
      }

      if (!configRaw) {
        let domain = null;
        try {
          const origin = request.headers.get("Origin") || request.headers.get("Referer");
          if (origin) domain = new URL(origin).hostname;
        } catch (e) {}

        if (!domain) domain = "buckcreekbungalows.com";

        configRaw = await env.CUSTOMER_CONFIGS.get(`domain_${domain}`);
      }

      if (!configRaw) {
        return new Response("Unauthorized", {
          status: 401,
          headers: corsHeaders()
        });
      }

      const config = JSON.parse(configRaw);

      const body = await request.json();

      if (!body?.email || !body?.message) {
        return new Response("Invalid payload", {
          status: 400,
          headers: corsHeaders()
        });
      }

      await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: config.email }] }],
          from: {
            email: "no-reply@buckcreekbungalows.com",
            name: "Website Form"
          },
          subject: `New message from ${body.name || "unknown"}`,
          content: [{
            type: "text/plain",
            value: `Name: ${body.name || ""}\nEmail: ${body.email}\nPhone: ${body.phone || ""}\n\nMessage:\n${body.message}`
          }]
        })
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Platform-Token"
  };
}
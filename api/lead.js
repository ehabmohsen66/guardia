// Vercel serverless function: receives the landing-page lead and delivers it.
// Configure in Vercel → Settings → Environment Variables:
//   RESEND_API_KEY  + LEAD_TO_EMAIL (+ optional LEAD_FROM_EMAIL)  → emails each lead
//   LEAD_WEBHOOK_URL (optional)                                   → also POSTs JSON (Zapier, Make, CRM…)
const clean = (value, max) => String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  if (clean(body.website, 100)) return res.status(200).json({ ok: true }); // honeypot: pretend success

  const lead = {
    name: clean(body.name, 100),
    email: clean(body.email, 160),
    phone: clean(body.phone, 40),
    subject: clean(body.subject, 200) || "Oracle ERP landing page lead",
    message: clean(body.message, 4000),
    receivedAt: new Date().toISOString()
  };
  if (!lead.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !lead.phone) {
    return res.status(400).json({ ok: false, error: "Missing or invalid fields" });
  }

  const tasks = [];
  const { RESEND_API_KEY, LEAD_TO_EMAIL, LEAD_FROM_EMAIL, LEAD_WEBHOOK_URL } = process.env;

  if (RESEND_API_KEY && LEAD_TO_EMAIL) {
    tasks.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: LEAD_FROM_EMAIL || "Guardia Leads <onboarding@resend.dev>",
        to: LEAD_TO_EMAIL.split(",").map((a) => a.trim()).filter(Boolean),
        reply_to: lead.email,
        subject: lead.subject,
        html: `<p><b>${escapeHtml(lead.name)}</b><br>${escapeHtml(lead.email)}<br>${escapeHtml(lead.phone)}</p><pre style="font:14px/1.5 system-ui;white-space:pre-wrap">${escapeHtml(lead.message)}</pre>`
      })
    }).then((r) => { if (!r.ok) throw new Error(`Email provider ${r.status}`); }));
  }

  if (LEAD_WEBHOOK_URL) {
    tasks.push(fetch(LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    }).then((r) => { if (!r.ok) throw new Error(`Webhook ${r.status}`); }));
  }

  if (!tasks.length) {
    console.error("Lead received but no delivery configured (set RESEND_API_KEY + LEAD_TO_EMAIL or LEAD_WEBHOOK_URL).");
    return res.status(500).json({ ok: false, error: "Lead delivery is not configured" });
  }

  const results = await Promise.allSettled(tasks);
  if (results.every((r) => r.status === "rejected")) {
    console.error("Lead delivery failed", results.map((r) => r.reason?.message));
    return res.status(502).json({ ok: false, error: "Could not deliver lead" });
  }
  return res.status(200).json({ ok: true });
}

function safeJson(text) {
  try { return JSON.parse(text); } catch (_) { return {}; }
}

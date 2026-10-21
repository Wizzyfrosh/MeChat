import "server-only";

type EmailPurpose = "sign-in" | "email-verification" | "forget-password" | "change-email";

const emailCopy: Record<EmailPurpose, { subject: string; heading: string; intro: string }> = {
  "sign-in": {
    subject: "Your MeChat sign-in code",
    heading: "Your sign-in code",
    intro: "Enter the code below to finish signing in to your MeChat account.",
  },
  "email-verification": {
    subject: "Verify your MeChat email",
    heading: "Confirm your email",
    intro: "You're one step away from your MeChat workspace. Confirm your email with this one-time code.",
  },
  "forget-password": {
    subject: "Reset your MeChat password",
    heading: "Reset your password",
    intro: "Enter this code to securely reset your MeChat password.",
  },
  "change-email": {
    subject: "Confirm your MeChat email change",
    heading: "Confirm your new email",
    intro: "Use this code to confirm your requested email-address change.",
  },
};

function renderOtpEmail(purpose: EmailPurpose, otp: string) {
  const { subject, heading, intro } = emailCopy[purpose];
  const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="padding:0;margin:0;background:#f5f6f3;color:#172720;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your MeChat verification code expires in 10 minutes.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f6f3;">
    <tr><td align="center" style="padding:44px 16px 54px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:540px;">
        <tr><td style="padding:0 0 24px 3px;">
          <span style="display:inline-block;vertical-align:middle;width:35px;height:35px;line-height:35px;background:#176b59;color:#fff;text-align:center;border-radius:10px;font-weight:700;font-size:20px;">m</span>
          <span style="vertical-align:middle;padding-left:8px;font-size:23px;font-weight:700;letter-spacing:-1.1px;color:#172720;">mechat<span style="color:#176b59;">.</span></span>
        </td></tr>
        <tr><td style="border:1px solid #e5e9e5;border-radius:16px;background:#fff;overflow:hidden;">
          <div style="height:5px;background:#176b59;"></div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="padding:44px 40px 10px;">
              <div style="color:#176b59;letter-spacing:1.5px;font-size:10px;font-weight:700;">ACCOUNT SECURITY</div>
              <h1 style="font-size:29px;font-weight:700;letter-spacing:-1px;line-height:1.25;margin:15px 0 15px;color:#172720;">${heading}</h1>
              <p style="color:#59655e;font-size:14px;line-height:1.8;margin:0;">${intro}</p>
            </td></tr>
            <tr><td style="padding:23px 40px 19px;">
              <div style="border:1px solid #daeadf;background:#f0f7f2;border-radius:12px;text-align:center;padding:25px 8px 24px;">
                <div style="color:#547464;text-transform:uppercase;letter-spacing:1.5px;font-size:10px;font-weight:700;margin-bottom:12px;">YOUR ONE-TIME CODE</div>
                <div style="color:#124e40;font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:700;line-height:1.2;letter-spacing:9px;padding-left:9px;">${otp}</div>
              </div>
            </td></tr>
            <tr><td style="padding:0 40px 38px;">
              <p style="color:#59655e;font-size:13px;line-height:1.7;margin:0 0 19px;">This code expires in <strong style="color:#172720;">10 minutes</strong> and can only be used once.</p>
              <div style="border-top:1px solid #e8ece8;padding-top:19px;">
                <p style="margin:0;color:#78847c;font-size:12px;line-height:1.8;">If you didn't request this, you can ignore this email. Never share your verification code with anyone, including MeChat support.</p>
              </div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="text-align:center;padding:23px 10px 0;color:#8b9790;font-size:11px;line-height:1.8;">MeChat — your space to think, write and explore.<br>
          <a href="https://mechat.froshcodeorbit.site" style="color:#176b59;text-decoration:none;">mechat.froshcodeorbit.site</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const textContent =
    `MeChat — ${heading}\n\n${intro}\n\nYour one-time code: ${otp}\n\nThis code expires in 10 minutes and can only be used once.\n\nIf you didn't request this, you can ignore this email. Never share this code.\n\nhttps://mechat.froshcodeorbit.site`;
  return { subject, htmlContent, textContent };
}

export async function sendOtpEmail(
  recipient: string,
  code: string,
  purpose: EmailPurpose,
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !sender) throw new Error("Email delivery is not configured");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error("Invalid recipient email");
  if (!/^\d{6}$/.test(code)) throw new Error("Invalid verification code");
  if (!sender.toLowerCase().endsWith("@mechat.froshcodeorbit.site")) {
    throw new Error("MeChat email sender is not configured for the verified domain");
  }

  const { subject, htmlContent, textContent } = renderOtpEmail(purpose, code);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "MeChat", email: sender },
      to: [{ email: recipient }],
      subject,
      htmlContent,
      textContent,
    }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });

  if (!response.ok) {
    // Brevo errors can contain personal addresses or account information.
    // Never log or surface response bodies and API credentials to browsers.
    throw new Error("Unable to deliver verification email");
  }
}

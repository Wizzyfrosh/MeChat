import "server-only";

export async function sendOtpEmail(address: string, code: string, kind: "sign-in"|"email-verification"|"forget-password") {
 const apiKey=process.env.BREVO_API_KEY, sender=process.env.BREVO_SENDER_EMAIL;
 if(!apiKey||!sender) throw new Error("Email delivery is not configured");
 const titles={"sign-in":"Your MeChat sign-in code","email-verification":"Verify your MeChat email","forget-password":"Reset your MeChat password"};
 const subject=titles[kind];
 const digits=code.replace(/[^0-9]/g,"");
 if(digits.length!==6) throw new Error("OTP is invalid");
 const html='<div style="background:#f6f6f2;padding:48px 18px;font-family:Arial,sans-serif;color:#1c2623"><div style="max-width:480px;background:white;margin:auto;padding:38px;border:1px solid #e5e8e4;border-radius:16px"><div style="font-size:24px;font-weight:800;letter-spacing:-1px">MeChat<span style="color:#087c67">.</span></div><h1 style="font-size:25px;letter-spacing:-.8px;margin-top:38px">'+subject+'</h1><p style="font-size:14px;line-height:1.7;color:#5b6763">Enter this one-time code in MeChat. It expires in 10 minutes.</p><div style="font-size:36px;letter-spacing:10px;font-weight:800;background:#f1f6f3;padding:24px;text-align:center;border-radius:12px">'+digits+'</div><p style="font-size:12px;color:#6a7470;margin-top:25px">If you did not request this, you can safely ignore the email. Never share this code.</p></div></div>';
 const response=await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{"content-type":"application/json","api-key":apiKey},body:JSON.stringify({sender:{name:"MeChat",email:sender},to:[{email:address}],subject,htmlContent:html})});
 if(!response.ok) throw new Error("Unable to deliver verification email");
}

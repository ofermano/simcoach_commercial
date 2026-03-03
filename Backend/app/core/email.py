"""Email sending for whitelist approval and signup link."""
from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig

from app.config import get_settings

settings = get_settings()


def _get_mail_config() -> ConnectionConfig:
    return ConnectionConfig(
        MAIL_USERNAME=settings.smtp_user,
        MAIL_PASSWORD=settings.smtp_password,
        MAIL_FROM=settings.mail_from,
        MAIL_PORT=settings.smtp_port,
        MAIL_SERVER=settings.smtp_host,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )


def _base_html_template(title: str, heading: str, body_html: str) -> str:
    """Wrap content in a dark racing-themed HTML email shell to match frontend branding."""
    # Basic, table-based layout for decent email client support. No external CSS.
    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>{title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#05070c;color:#e5e7eb;font-family:'DM Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#05070c;background-image:radial-gradient(circle at 50% 0%,rgba(25,30,40,0.5) 0%,transparent 70%);">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#05070c;border-radius:20px;border:1px solid rgba(255,255,255,0.07);box-shadow:0 0 40px rgba(0,0,0,0.6);overflow:hidden;">
            <tr>
              <td style="padding:20px 24px 12px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width:40px;height:40px;border-radius:12px;background-color:rgba(225,29,72,0.12);text-align:center;vertical-align:middle;">
                            <span style="display:inline-block;width:24px;height:24px;border-radius:999px;border:2px solid #e11d48;border-top-color:transparent;transform:rotate(45deg);"></span>
                          </td>
                          <td style="padding-left:10px;">
                            <span style="font-family:'Oxanium',system-ui,sans-serif;font-weight:700;font-size:22px;letter-spacing:0.18em;color:#f9fafb;text-transform:uppercase;display:block;">
                              FLOW
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="text-align:right;vertical-align:middle;">
                      <span style="font-size:10px;letter-spacing:0.2em;font-family:'Oxanium',system-ui,sans-serif;text-transform:uppercase;color:#9ca3af;">
                        Beta Intelligence Layer
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;">
                <h1 style="margin:0 0 8px 0;font-family:'Oxanium',system-ui,sans-serif;font-weight:700;font-size:22px;letter-spacing:0.08em;color:#f9fafb;text-transform:uppercase;">
                  {heading}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;font-size:14px;line-height:1.6;color:#d1d5db;">
                {body_html}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 20px 24px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:11px;line-height:1.4;color:#6b7280;">
                  You’re receiving this email because this address was used to interact with the FLOW beta.
                  If this wasn’t you, you can safely ignore this message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


async def send_super_admin_code_email(to_email: str, code: str) -> bool:
    """Send 6-digit login code to super admin email."""
    if not settings.smtp_user or not settings.smtp_password:
        return False
    conf = _get_mail_config()

    body_html = f"""
      <p style="margin:0 0 16px 0;">Hello,</p>
      <p style="margin:0 0 16px 0;">
        Use the one-time code below to complete your FLOW admin sign-in. This code is valid for
        <strong>10 minutes</strong>.
      </p>
      <div style="margin:18px 0;padding:14px 18px;border-radius:10px;background:linear-gradient(135deg,#111827,#020617);border:1px solid rgba(249,250,251,0.12);text-align:center;">
        <span style="display:inline-block;font-family:'Oxanium',system-ui,sans-serif;font-size:24px;letter-spacing:0.35em;font-weight:700;color:#f9fafb;">
          {code}
        </span>
      </div>
      <p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;">
        If you did not request this code, you can safely ignore this email.
      </p>
    """

    message = MessageSchema(
        subject="Your FLOW admin login code",
        recipients=[to_email],
        body=_base_html_template(
            title="FLOW Admin Login Code",
            heading="Admin Authentication",
            body_html=body_html,
        ),
        subtype=MessageType.html,
    )
    mail = FastMail(conf)
    try:
        await mail.send_message(message)
        return True
    except Exception:
        return False


async def send_whitelist_applied_confirmation_email(to_email: str) -> bool:
    """Send confirmation to applicant when they submit a whitelist request."""
    if not settings.smtp_user or not settings.smtp_password:
        return False
    conf = _get_mail_config()

    body_html = """
      <p style="margin:0 0 14px 0;">Hello,</p>
      <p style="margin:0 0 14px 0;">
        We’ve received your request to join the <strong>FLOW</strong> for Assetto Corsa.
      </p>
      <p style="margin:0 0 14px 0;">
        Our team will review your application and email you once your access has been approved.
        Until then, you don’t need to do anything else.
      </p>
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        If you did not submit this request, you can safely ignore this email.
      </p>
    """

    message = MessageSchema(
        subject="We received your FLOW beta access request",
        recipients=[to_email],
        body=_base_html_template(
            title="FLOW Beta – Request Received",
            heading="Request Received",
            body_html=body_html,
        ),
        subtype=MessageType.html,
    )
    mail = FastMail(conf)
    try:
        await mail.send_message(message)
        return True
    except Exception:
        return False


async def send_whitelist_approved_email(to_email: str, signup_link: str) -> bool:
    """Send email with signup link after whitelist is approved."""
    if not settings.smtp_user or not settings.smtp_password:
        return False
    conf = _get_mail_config()

    safe_link = signup_link
    button_html = f"""
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td align="center">
            <a href="{safe_link}" style="display:inline-block;padding:12px 26px;border-radius:999px;background:linear-gradient(135deg,#e11d48,#b91c1c);color:#f9fafb;font-family:'Oxanium',system-ui,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;">
              Create Account
            </a>
          </td>
        </tr>
      </table>
    """

    body_html = f"""
      <p style="margin:0 0 14px 0;">Hello,</p>
      <p style="margin:0 0 14px 0;">
        Good news – your whitelist application for the <strong>FLOW</strong> has been
        <span style="color:#4ade80;">approved</span>.
      </p>
      <p style="margin:0 0 14px 0;">
        Use the link below to create your driver account and set your password. For security, this link
        will expire in <strong>7 days</strong>.
      </p>
      {button_html}
      <p style="margin:0 0 6px 0;font-size:12px;color:#9ca3af;">
        If the button doesn’t work, copy and paste this URL into your browser:
      </p>
      <p style="margin:0 0 10px 0;font-size:12px;color:#9ca3af;word-break:break-all;">
        {safe_link}
      </p>
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        If you did not request access to FLOW, you can safely ignore this email.
      </p>
    """

    message = MessageSchema(
        subject="You're approved – create your FLOW account",
        recipients=[to_email],
        body=_base_html_template(
            title="FLOW – Access Approved",
            heading="Access Approved",
            body_html=body_html,
        ),
        subtype=MessageType.html,
    )
    mail = FastMail(conf)
    try:
        await mail.send_message(message)
        return True
    except Exception:
        return False

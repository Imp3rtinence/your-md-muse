/**
 * Welcome email for new Komma users.
 * Dark hero band (matches app's electric magenta → lime gradient),
 * light content area for max email-client compatibility.
 */
export function welcomeEmailHtml(opts: { displayName: string; ctaUrl: string }) {
  const name = opts.displayName?.trim() || "Komma-Crew";
  const cta = opts.ctaUrl;

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>Willkommen bei Komma</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Machen statt scrollen. Deine Crew wartet schon.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(20,10,40,0.08);">

          <!-- Hero band: dark gradient with logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#2a1140 0%,#7a1f7a 45%,#c84bbf 75%,#d6f06b 130%);padding:44px 36px 56px 36px;text-align:left;">
              <div style="font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:-1px;color:#ffffff;line-height:1;">
                Komma<span style="color:#d6f06b;">,</span>
              </div>
              <div style="margin-top:28px;font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;font-size:34px;font-weight:700;color:#ffffff;line-height:1.15;letter-spacing:-0.5px;">
                Hey ${escapeHtml(name)},<br/>schön dass du da bist.
              </div>
              <div style="margin-top:14px;font-size:16px;line-height:1.5;color:rgba(255,255,255,0.85);">
                Machen statt scrollen. Du bist drin.
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 8px 36px;">
              <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#1a1a2e;">
                Komma ist anders. Hier wird nicht gelikt, gepostet, gescrollt – hier wird <strong>gemacht</strong>. Du bekommst Challenges, lieferst Beweise und reichst die Kette an deine Crew weiter.
              </p>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#1a1a2e;">
                In den ersten 5 Minuten:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="padding:0 0 14px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" style="width:32px;padding-right:12px;">
                          <div style="width:28px;height:28px;border-radius:8px;background:#fbe9f8;color:#a8189c;font-weight:700;text-align:center;line-height:28px;font-size:14px;">1</div>
                        </td>
                        <td valign="top" style="font-size:15px;line-height:1.5;color:#2a2a3e;">
                          <strong>Profil schärfen.</strong> Wähl deine Interessen – wir matchen dich mit passenden Challenges.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 14px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" style="width:32px;padding-right:12px;">
                          <div style="width:28px;height:28px;border-radius:8px;background:#fbe9f8;color:#a8189c;font-weight:700;text-align:center;line-height:28px;font-size:14px;">2</div>
                        </td>
                        <td valign="top" style="font-size:15px;line-height:1.5;color:#2a2a3e;">
                          <strong>Erste Challenge annehmen.</strong> Eine Aktion, ein Beweis – fertig. Aura sammeln startet sofort.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" style="width:32px;padding-right:12px;">
                          <div style="width:28px;height:28px;border-radius:8px;background:#f0fbcc;color:#5a7a00;font-weight:700;text-align:center;line-height:28px;font-size:14px;">3</div>
                        </td>
                        <td valign="top" style="font-size:15px;line-height:1.5;color:#2a2a3e;">
                          <strong>Crew einladen.</strong> Allein ist's halb so geil. Hol deine Leute an Bord.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
                <tr>
                  <td align="center" style="border-radius:14px;background:#c41fa3;">
                    <a href="${escapeAttr(cta)}"
                       style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;letter-spacing:-0.2px;">
                      Jetzt loslegen →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0 0;font-size:13px;line-height:1.5;color:#7a7a8e;">
                Falls der Button nicht funktioniert, kopier diesen Link in deinen Browser:<br/>
                <a href="${escapeAttr(cta)}" style="color:#a8189c;word-break:break-all;">${escapeHtml(cta)}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:32px 36px 0 36px;">
              <div style="height:1px;background:#ececf2;width:100%;"></div>
            </td>
          </tr>

          <!-- Footer message -->
          <tr>
            <td style="padding:24px 36px 36px 36px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#5a5a72;">
                Wenn du Fragen hast, antworte einfach auf diese Mail – wir lesen mit.<br/>
                Bis gleich in der App.<br/><br/>
                <strong style="color:#1a1a2e;">— Das Komma-Team</strong>
              </p>
            </td>
          </tr>

        </table>

        <!-- Legal footer -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:20px 16px 8px 16px;font-size:12px;line-height:1.5;color:#9a9aae;">
              Gotham Consulting GmbH · komma.fun<br/>
              Du bekommst diese Mail, weil du dich gerade bei Komma registriert hast.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
function escapeAttr(s: string) {
  return escapeHtml(s);
}

import path from 'node:path'

const LOGO_CID = 'hbbc-logo'
const logoPath = path.join(process.cwd(), 'server', 'assets', 'hbbc-logo-email.png')

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Gmail/Outlook/Apple Mail show this next to the subject in the inbox list —
// a plain-text snippet of the body makes the inbox preview useful instead of
// showing raw HTML or nothing.
function toPreheader(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return escapeHtml(text.slice(0, 150))
}

// Colors/spacing for each tag the Tiptap editor can produce (bold/italic,
// heading, bullet/numbered list, link) — kept in one place so both the
// inline-style pass below and AdminNewsletter.vue's live preview describe
// the same values.
const CONTENT_TAG_STYLES: Record<string, string> = {
  h1: 'color:#ffffff; font-size:19px; font-weight:700; margin:24px 0 10px; padding-left:12px; border-left:3px solid #ef4444;',
  h2: 'color:#ffffff; font-size:19px; font-weight:700; margin:24px 0 10px; padding-left:12px; border-left:3px solid #ef4444;',
  h3: 'color:#ffffff; font-size:19px; font-weight:700; margin:24px 0 10px; padding-left:12px; border-left:3px solid #ef4444;',
  p: 'margin:0 0 14px;',
  ul: 'margin:0 0 14px; padding-left:22px;',
  ol: 'margin:0 0 14px; padding-left:22px;',
  li: 'margin:4px 0;',
  strong: 'color:#ffffff;',
  em: 'color:#d1d5db;',
  a: 'color:#f87171; text-decoration:underline;',
}

// Many email clients (Gmail's app, Outlook desktop, older Outlook.com)
// strip <style> blocks or override anchor/heading colors entirely, so
// relying on the <head><style> rules alone means the delivered mail can
// look nothing like the preview (plain black headings, default blue
// links). Inlining the same styles directly onto each tag guarantees the
// colors survive regardless of client support — the <style> block stays
// too, as a harmless no-op for clients that do honor it.
function inlineContentStyles(html: string): string {
  let result = html
  for (const [tag, style] of Object.entries(CONTENT_TAG_STYLES)) {
    result = result.replace(new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi'), (_match, attrs: string | undefined) => {
      if (attrs && /style\s*=\s*"/i.test(attrs)) {
        return `<${tag}${attrs.replace(/style\s*=\s*"([^"]*)"/i, (_m, existing: string) => `style="${existing}; ${style}"`)}>`
      }
      return `<${tag}${attrs ?? ''} style="${style}">`
    })
  }
  return result
}

export interface RenderedNewsletter {
  html: string
  attachments: { filename: string; path: string; cid: string }[]
}

// Wraps HTML in the club's branded template — table-based layout since email
// clients have very limited CSS support. The logo travels as a CID
// attachment rather than a URL, since email clients can't fetch
// localhost/relative image paths. An embedded <style> block (supported by
// Gmail, Apple Mail, Outlook.com, and modern Outlook desktop) styles
// headings/lists/links — mirrored in AdminNewsletter.vue's preview so what
// the admin sees matches what subscribers get. Used for every email the
// backend sends (newsletter, contact form, account notifications), with
// `eyebrow` and `footerHtml` customized per use so the wording stays
// accurate (e.g. a contact-form copy shouldn't mention unsubscribing).
export function renderBrandedEmail(
  subject: string,
  bodyHtml: string,
  footerHtml: string,
  eyebrow = 'HBBC',
): RenderedNewsletter {
  const inlinedBodyHtml = inlineContentStyles(bodyHtml)
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <style>
      body { margin: 0; padding: 0; background-color: #0b0f19; }
      .content h2 { color: #ffffff; font-size: 19px; font-weight: 700; margin: 24px 0 10px; padding-left: 12px; border-left: 3px solid #ef4444; }
      .content p { margin: 0 0 14px; }
      .content ul, .content ol { margin: 0 0 14px; padding-left: 22px; }
      .content li { margin: 4px 0; }
      .content a { color: #f87171; text-decoration: underline; }
      .content strong { color: #ffffff; }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${toPreheader(bodyHtml)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f19; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#161d2b; border-radius: 16px; overflow:hidden; max-width: 600px; border: 1px solid #262f42;">
            <tr>
              <td align="center" style="background-color:#3f0a0a; background-image: linear-gradient(135deg, #4a0d0d 0%, #2a0606 100%); padding: 36px 24px 28px;">
                <img src="cid:${LOGO_CID}" width="64" alt="HBBC Logo" style="display:block; margin: 0 auto; border-radius: 8px;" />
                <div style="color:#fca5a5; font-size:11px; font-weight:700; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 16px;">
                  ${escapeHtml(eyebrow)}
                </div>
                <div style="color:#ffffff; font-size:17px; font-weight:600; margin-top: 6px;">
                  Hamburger Böblinger Banausenchor und VFB Fanclub
                </div>
              </td>
            </tr>
            <tr>
              <td style="height:3px; background-color:#ef4444; font-size:0; line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td class="content" style="padding: 32px 28px; color:#d1d5db; font-size:15px; line-height:1.7;">
                <h1 style="color:#ffffff; font-size:23px; font-weight:700; margin: 0 0 20px;">${escapeHtml(subject)}</h1>
                ${inlinedBodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 28px; background-color:#0f1420; border-top: 1px solid #262f42; color:#6b7280; font-size:12px; text-align:center; line-height:1.6;">
                ${footerHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return {
    html,
    attachments: [{ filename: 'hbbc-logo.png', path: logoPath, cid: LOGO_CID }],
  }
}

const NEWSLETTER_FOOTER =
  'Du erhältst diese E-Mail, weil du den HBBC-Newsletter abonniert hast.<br />Abmelden kannst du dich jederzeit in deinem Profil.'

export function renderNewsletterEmail(subject: string, bodyHtml: string): RenderedNewsletter {
  return renderBrandedEmail(subject, bodyHtml, NEWSLETTER_FOOTER, 'HBBC Newsletter')
}

// app.js
import express from 'express';
import pkg from 'express-openid-connect';
const { auth, requiresAuth } = pkg;
import dotenv from 'dotenv';

// Map Azure group GUIDs to friendly application roles
const GROUP_ROLE_MAP = {
  "defbac70-abd2-464d-a100-ae801597f814": "Arkham App - Administrator",
  "3669003e-1155-4d33-9b00-1b5cda2880a2": "Arkham App - Developer",
  "919b0a22-7de1-4262-9f4a-d36d16a99a0b": "Arkham App - Report Generator",
  "00c9b5ce-22a7-49d2-abb9-a3ec4ce4ddb6": "Arkham App - Support Agent",
  "6a9bd496-7b6e-421c-b751-d1b3ed6caa19": "Arkham App - Viewer",
};


dotenv.config();

const app = express();

// Serve the images folder
app.use('/images', express.static('images'));

const config = {
  authRequired: false,                // allow anonymous access to /
  auth0Logout: true,                  // log out of Auth0 on /logout
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  secret: process.env.SESSION_SECRET
};

app.use(auth(config));

/**
 * Helper to render the HTML shell.
 * This is basically the static design you saw earlier, but made dynamic.
 */
function renderPage({ isAuthenticated, user }) {
  const pillText = isAuthenticated ? 'Authenticated' : 'Anonymous';
  const userJson = user ? JSON.stringify(user, null, 2) : '// Not logged in';
  const loginUrl = '/login';
  const logoutUrl = '/logout';

// Extract groups in all supported formats
// Extract groups in all supported formats (safe when user is null)
let groups = [];

if (user) {
  groups =
    user["https://arkham.live/groups"] ||
    user.groups ||
    user["groups"] ||
    [];

  if (typeof groups === "string") {
    groups = groups.split(",");
  }
}

// Derive friendly roles from group GUIDs
const roles = groups
  .map(g => GROUP_ROLE_MAP[g] || null)
  .filter(Boolean); // remove nulls

  const hasGroups = Array.isArray(groups) && groups.length > 0;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Arkham SAML SSO Playground</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: linear-gradient(135deg, #111827, #1f2937);
      color: #e5e7eb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 960px;
      width: 100%;
      padding: 2rem;
    }
    .card {
      background: rgba(15, 23, 42, 0.95);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 20px 30px rgba(0,0,0,0.5);
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .3rem .7rem;
      border-radius: 999px;
      background: rgba(55, 65, 81, 0.7);
      font-size: .78rem;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #9ca3af;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0;
      font-size: 1.6rem;
    }
    button, a.button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.4rem;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
      background: #4f46e5;
      color: white;
      box-shadow: 0 10px 20px rgba(79, 70, 229, 0.4);
      transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.1s ease;
      white-space: nowrap;
    }
    button:hover, a.button:hover {
      background: #6366f1;
      transform: translateY(-1px);
      box-shadow: 0 14px 25px rgba(79, 70, 229, 0.55);
    }
    button.secondary, a.button.secondary {
      background: transparent;
      box-shadow: none;
      border: 1px solid rgba(148, 163, 184, 0.5);
      color: #e5e7eb;
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1.4fr);
      gap: 1.5rem;
      margin-top: 1rem;
    }
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
    .panel {
      background: rgba(15, 23, 42, 0.9);
      border-radius: .9rem;
      padding: 1rem 1.2rem;
      border: 1px solid rgba(55, 65, 81, 0.8);
    }
    .panel h2 {
      margin: 0 0 .6rem;
      font-size: 1rem;
      color: #e5e7eb;
    }
    .meta {
      font-size: .85rem;
      color: #9ca3af;
      margin: .15rem 0;
    }
    pre {
      margin: 0;
      padding: .8rem;
      background: #020617;
      border-radius: .6rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: .78rem;
      overflow-x: auto;
      border: 1px solid rgba(31, 41, 55, 0.9);
    }
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: .4rem;
      margin-top: .4rem;
    }
    .tag {
      padding: .18rem .55rem;
      border-radius: 999px;
      background: rgba(55, 65, 81, 0.9);
      font-size: .74rem;
      color: #d1d5db;
    }
    .muted {
      opacity: .7;
    }
    .link-row {
      margin-top: .8rem;
      font-size: .8rem;
      color: #9ca3af;
    }
    .link-row a {
      color: #a5b4fc;
      text-decoration: none;
    }
    .link-row a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="card-header">
        <div>
          <div class="pill">${pillText}</div>
          <div style="display:flex; align-items:center; gap:.6rem;">
            <img src="/images/ArkhamSmall.png" alt="Arkham Logo"
                style="height:32px; width:auto; border-radius:.3rem;" />
            <h1 style="margin:0;">Arkham SSO Playground</h1>
          </div>
          <p class="muted">
            Auth0 ↔ Microsoft Entra ID via SAML · Inspect ID token claims, groups and session details.
          </p>
        </div>
        <div>
          ${
            isAuthenticated
              ? `<a class="button secondary" href="${logoutUrl}">Log out</a>`
              : `<a class="button" href="${loginUrl}">Login with Microsoft Entra</a>`
          }
        </div>
      </div>

      <div class="grid">
        <div class="panel">
          <h2>User / ID Token Claims</h2>
          <p class="meta">
            These are the claims your app sees after Auth0 validates the SAML assertion from Entra.
            Look here for <code>email</code>, <code>name</code>, and any <code>groups</code> / role claims.
          </p>
          <pre>${userJson}</pre>
          <div class="link-row">
            View raw session JSON: <a href="/session">/session</a>
          </div>
        </div>

        <div class="panel">
          <h2>Session Details</h2>
          <p class="meta">
            High-level info from the current OpenID Connect session (browser ↔ Auth0 ↔ Entra).
          </p>
          <div class="meta"><strong>Authenticated:</strong> ${isAuthenticated}</div>
          ${
            isAuthenticated
              ? `
                <div class="meta"><strong>Subject (sub):</strong> ${user?.sub || 'n/a'}</div>
                <div class="meta"><strong>Email:</strong> ${user?.email || 'n/a'}</div>
              `
              : `
                <p class="meta muted" style="margin-top:.6rem;">
                  Not logged in. Use the button above to start the Auth0 → Entra SSO flow.
                </p>
              `
          }
          <p class="meta" style="margin-top:.8rem;">
            For full token timings (iat, exp, etc.) hit the <code>/debug</code> endpoint.
          </p>
          ${
  groups.length > 0
    ? `
      <div class="meta" style="margin-top:.8rem;"><strong>Groups:</strong></div>
      <div class="tag-list">
        ${groups.map(g => `<span class="tag">${g}</span>`).join("")}
      </div>
      ${
        roles.length > 0
          ? `
          <div class="meta" style="margin-top:1rem;"><strong>Derived Roles:</strong></div>
          <div class="tag-list">
            ${roles.map(r => `<span class="tag">${r}</span>`).join("")}
          </div>
          `
          : ""
      }
    `
    : `<p class="meta muted" style="margin-top:.8rem;">
         No group claims detected.
       </p>`
}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * GET / – main page
 * express-openid-connect injects req.oidc.{isAuthenticated,user}
 */
app.get('/', (req, res) => {
  const isAuthenticated = req.oidc.isAuthenticated();
  const user = req.oidc.user || null;
  res.send(renderPage({ isAuthenticated, user }));
});

/**
 * GET /session – show current OIDC session JSON (nice for debugging)
 */
app.get('/session', (req, res) => {
  res.json({
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user || null
  });
});

/**
 * GET /debug – raw token payloads & timing
 * Requires authentication.
 */
app.get('/debug', requiresAuth(), (req, res) => {
  const { idToken, accessToken, refreshToken, user } = req.oidc;
  res.json({
    now: Math.floor(Date.now() / 1000),
    user,
    idToken,
    accessToken,
    refreshToken
  });
});

/**
 * Note: /login, /logout, /callback are handled for you
 * by express-openid-connect based on the config above.
 */

const port = 3000;
app.listen(port, () => {
  console.log(`SAML playground listening on ${process.env.BASE_URL || `http://localhost:${port}`}`);
});

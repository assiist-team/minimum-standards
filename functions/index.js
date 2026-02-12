const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getShareCodeFromRequest(req) {
  const queryCode = req.query.shareCode || req.query.code || req.query.snapshotCode;
  if (queryCode) {
    return String(queryCode).trim().toUpperCase();
  }

  const parts = String(req.path || '')
    .split('/')
    .filter(Boolean);
  const last = parts[parts.length - 1] || '';
  return last.trim().toUpperCase();
}

exports.sharePage = functions.https.onRequest(async (req, res) => {
  try {
    const shareCode = getShareCodeFromRequest(req);
    const origin = `${req.protocol}://${req.get('host')}`;
    const deepLink = `minimumstandards://snapshot/${encodeURIComponent(shareCode)}`;
    const logoUrl = `${origin}/logo.png`;

    let snapshotTitle = 'Snapshot';
    let shareEnabled = true;

    if (shareCode) {
      const shareLinks = await admin
        .firestore()
        .collection('shareLinks')
        .where('shareCode', '==', shareCode)
        .limit(1)
        .get();

      if (!shareLinks.empty) {
        const shareLinkDoc = shareLinks.docs[0];
        const shareLink = shareLinkDoc.data() || {};
        if (shareLink.disabledAt) {
          shareEnabled = false;
        }
        const snapshotId = shareLink.snapshotId;
        if (snapshotId) {
          const snapshotDoc = await admin.firestore().collection('snapshots').doc(snapshotId).get();
          const snapshot = snapshotDoc.exists ? snapshotDoc.data() : null;
          if (snapshot && snapshot.title) {
            snapshotTitle = String(snapshot.title);
          }
          if (snapshot && snapshot.isEnabled === false) {
            shareEnabled = false;
          }
        }
      } else {
        shareEnabled = false;
      }
    } else {
      shareEnabled = false;
    }

    const title = `${snapshotTitle} — Minimum Standards`;
    const description = shareEnabled
      ? `Import the "${snapshotTitle}" snapshot in Minimum Standards.`
      : `This snapshot link is disabled or invalid.`;

    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>

    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(logoUrl)}" />
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(logoUrl)}" />
  </head>
  <body style="font-family: -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial; padding: 24px;">
    <h1 style="margin: 0 0 8px 0;">${escapeHtml(snapshotTitle)}</h1>
    <p style="margin: 0 0 16px 0; color: #444;">${escapeHtml(description)}</p>

    <a href="${escapeHtml(deepLink)}"
       style="display:inline-block; padding: 12px 16px; background: #0B5FFF; color: white; border-radius: 10px; text-decoration: none; font-weight: 600;">
      Open in Minimum Standards
    </a>

    <script>
      // For humans: try to open the app. Keep the HTML response so preview bots can read OG tags.
      setTimeout(function () {
        window.location.href = ${JSON.stringify(deepLink)};
      }, 250);
    </script>
  </body>
</html>`);
  } catch (err) {
    res.status(500).send('Failed to render share preview.');
  }
});


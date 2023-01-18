const http = require('http');
const https = require('https');
const url = require('url');
const { google } = require('googleapis');

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 * To get these credentials for your application, visit
 * https://console.cloud.google.com/apis/credentials.
 */
const oauth2Client = new google.auth.OAuth2(
  '502934569314-26j86ebbmuc4b1n28vb66s58ah53sd7d.apps.googleusercontent.com',
  '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',
  'http://localhost:3000/oauth/callback',
);

// Access scopes for read-only Drive activity.
const scopes = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

// Generate a url that asks permissions for the Drive activity scope
const authorizationUrl = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',
  /** Pass in the scopes array defined above.
    * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
  scope: scopes,
  // Enable incremental authorization. Recommended as a best practice.
  include_granted_scopes: true,
});

/* Global variable that stores user credential in this code example.
 * ACTION ITEM for developers:
 *   Store user's refresh token in your data store if
 *   incorporating this code into your real app.
 *   For more information on handling refresh tokens,
 *   see https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens
 */
let userCredential = null;

async function main() {
  http.createServer(async (req, res) => {
    // Example on redirecting user to Google's OAuth 2.0 server.
    if (req.url === '/') {
      res.writeHead(301, { Location: authorizationUrl });
    }

    // Receive the callback from Google's OAuth 2.0 server.
    if (req.url.startsWith('/oauth/callback')) {
      // Handle the OAuth 2.0 server response
      const q = url.parse(req.url, true).query;

      if (q.error) { // An error response e.g. error=access_denied
        console.log(`Error:${q.error}`);
      } else { // Get access and refresh tokens (if access_type is offline)
        const { tokens } = await oauth2Client.getToken(q.code);
        oauth2Client.setCredentials(tokens);

        /** Save credential to the global variable in case access token was refreshed.
          * ACTION ITEM: In a production app, you likely want to save the refresh token
          *              in a secure persistent database instead. */
        userCredential = tokens;
        console.log(userCredential);
      }
    }
    res.end();
  }).listen(3000);
}
main().catch(console.error);

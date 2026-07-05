require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`


const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];


app.get("/auth", (req, res) => {

    console.log("Loaded CLIENT_ID:", CLIENT_ID);
    console.log("Loaded CLIENT_SECRET:", CLIENT_SECRET?.slice(0, 10) + "...");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", 
    prompt: "consent",      
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // tokens = { access_token, refresh_token, scope, token_type, expiry_date }
    console.log("Received tokens:", tokens);

    // Save to a file for now (swap this for your MySQL insert)
    fs.writeFileSync("tokens.json", JSON.stringify(tokens, null, 2));

    res.send("✅ Authorization successful! You can close this tab.");
  } catch (err) {
    console.error("Error exchanging code for tokens:", err);
    res.status(500).send("Authentication failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Start auth flow at: http://localhost:${PORT}/auth`);
});
require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");

const { pool, InsertGoogleAccount, InsertSource, getCredentialsByUserId, getSourcesByYTId, deleteSource, deleteAllSources,deleteAccount } = require('./db.js')

const app = express();
app.use(express.json())

const PORT = process.env.PORT || 3000;

REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`


const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];


app.get("/auth", (req, res) => {

  const tg_id = req.query.tg_id;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: tg_id
  });
  res.redirect(authUrl);
});
app.get("/oauth2callback", async (req, res) => {
  const { code, state: tg_id } = req.query;

  console.log(tg_id)
  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    await InsertGoogleAccount(tg_id, tokens, profile)

    res.send("✅ Authorization successful! You can close this tab.");
  } catch (err) {
    console.error("Error exchanging code for tokens:", err);
    res.status(500).send("Authentication failed");
  }
});


app.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id)
  const data = await getCredentialsByUserId(id);
  res.send(data)
})
app.delete("/user",async (req,res)=>{
  try {
    const {account_id,chat_id} = req.body;

    await deleteAccount(account_id,chat_id)
    
    return res.send("Ok")
  } catch (e) {
    console.error(e)
    return res.status(500).send("Fail")
  }
})

app.get("/source/:yt_id", async (req, res) => {
  const { yt_id } = req.params;

  const data = await getSourcesByYTId(yt_id);

  return res.send(data);
})

app.post("/source", async (req, res) => {
  try {
    const { yt_id, link } = req.body;

    await InsertSource(yt_id, link);

    return res.send("Ok");
  } catch (e) {
    console.error(e);
    return res.status(500).send("Fail");
  }
})
app.delete("/source", async (req, res) => {
  try {
    const { yt_id, link } = req.body;
    if(link){
      await deleteSource(yt_id, link)
    }else{
      await deleteAllSources(yt_id)
    }
    return res.send("Ok")
  } catch (e) {
    console.error(e);
    return res.status(500).send("Fail")
  }
})

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Start auth flow at: http://localhost:${PORT}/auth`);
});




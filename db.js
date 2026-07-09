const db = require("mysql2/promise");

const pool = db.createPool({
    host: "sql7.freesqldatabase.com",
    user: "sql7832546",
    password: "CCiKNuVXc8",
    database: "sql7832546",
});

async function InsertGoogleAccount(user_id, tokens, profile) {
    await pool.execute(
        `INSERT INTO youtube_credentials
      (user_id, access_token, refresh_token, scope, token_type, expiry_date, google_email, google_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id,
            tokens.access_token,
            tokens.refresh_token || null,
            tokens.scope,
            tokens.token_type,
            tokens.expiry_date,
            profile.email,
            profile.name,
        ]
    );
}

async function InsertSource(yt_id, link) {
    await pool.execute(`INSERT INTO tiktok_sources (yt_id,link,last_upload) 
        VALUES (?,?,?)`, [yt_id, link, new Date(Date.now() + 2 * 60 * 60 * 1000)])
}
async function InsertUploadDefaults(yt_id, title,description) {
    await pool.execute(`INSERT INTO upload_defaults (yt_id,title,description) 
        VALUES (?,?,?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description)`, [yt_id, title,description])
}

async function getSourcesByYTId(yt_id) {
    const [rows] = await pool.execute(`
        SELECT google_email, google_name, tiktok_sources.link 
        FROM youtube_credentials   
        INNER JOIN tiktok_sources 
        ON youtube_credentials.id = tiktok_sources.yt_id 
        WHERE youtube_credentials.id=?`,[yt_id]);

    return rows || null;
}
async function deleteSource(yt_id,link) {
    await pool.execute(`DELETE FROM tiktok_sources WHERE link=? and yt_id=?;`,[link,yt_id])
}
async function deleteAllSources(yt_id) {
    await pool.execute(`DELETE FROM tiktok_sources WHERE yt_id=?;`,[yt_id])
}
async function deleteAccount(account_id,chat_id){
    await pool.execute(`DELETE FROM youtube_credentials WHERE id=? AND user_id=?;`,[account_id,chat_id])
}

async function getCredentialsByUserId(userId) {
    const [rows] = await pool.execute(
        "SELECT * FROM youtube_credentials WHERE user_id = ?",
        [userId]
    );
    return rows || null;
}

async function getCredentialsByEmail(email) {
    const [rows] = await pool.execute(
        "SELECT * FROM youtube_credentials WHERE google_email = ? LIMIT 1",
        [email]
    );
    return rows[0] || null;
}


module.exports = { pool, InsertGoogleAccount, getCredentialsByUserId, InsertSource, getSourcesByYTId, deleteSource,deleteAllSources,deleteAccount,InsertUploadDefaults }
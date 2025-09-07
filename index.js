const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const app = express();
app.use(cors());

const GAMEPASS_ID = 1451516545;
const redeemedPath = './redeemed.json';
let redeemedUsers = {};

// Load redeemed usernames on startup
if (fs.existsSync(redeemedPath)) {
  redeemedUsers = JSON.parse(fs.readFileSync(redeemedPath));
}

// Save to file
function saveRedeemed() {
  fs.writeFileSync(redeemedPath, JSON.stringify(redeemedUsers, null, 2));
}

// Convert username to userId
async function getUserId(username) {
  const res = await axios.post('https://users.roblox.com/v1/usernames/users', {
    usernames: [username],
    excludeBannedUsers: true
  });
  return res.data.data[0]?.id;
}

// Check gamepass ownership
async function ownsGamepass(userId) {
  const res = await axios.get(`https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${GAMEPASS_ID}`);
  return res.data.data.length > 0;
}

// Endpoint: /check?username=USERNAME
app.get('/check', async (req, res) => {
  const username = req.query.username?.toLowerCase();
  if (!username) return res.status(400).json({ error: 'Missing username' });

  // Already redeemed → block immediately
  if (redeemedUsers[username]) {
    return res.json({ owns: false, message: 'already redeemed' });
  }

  try {
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const owns = await ownsGamepass(userId);
    if (owns) {
      // ✅ Owns gamepass → lock username
      redeemedUsers[username] = true;
      saveRedeemed();
      return res.json({ owns: true });
    } else {
      // ❌ Doesn't own → allow retry later
      return res.json({ owns: false });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Failed to check ownership' });
  }
});

// Render-compatible listener
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('✅ JJHub backend running');
});

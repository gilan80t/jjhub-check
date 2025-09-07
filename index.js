app.get('/check', async (req, res) => {
  const username = req.query.username?.toLowerCase();
  if (!username) return res.status(400).json({ error: 'Missing username' });

  // Already redeemed → block immediately
  if (redeemedUsers[username]) {
    return res.status(403).json({ error: 'Username already redeemed' });
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

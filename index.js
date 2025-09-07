app.get('/check', async (req, res) => {
  const username = req.query.username?.toLowerCase();
  if (!username) return res.status(400).json({ error: 'Missing username' });

  // Check if already redeemed
  if (redeemedUsers[username]) {
    return res.status(403).json({ error: 'Username already redeemed' });
  }

  try {
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const owns = await ownsGamepass(userId);
    if (owns) {
      // First-time buyer → allow + lock
      redeemedUsers[username] = true;
      saveRedeemed();
      return res.json({ owns: true });
    } else {
      // User doesn't own the gamepass
      return res.json({ owns: false });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Already Redeemed' });
  }
});

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');
const { queryAtoms, storeAtom, getMartyMemory, setMartyMemory } = require('./database');
const { runIntelligenceEngine } = require('./intelligence-engine');
const { deployToNetlify } = require('./deploy');
const { pushToGitHub } = require('./github');

// Public health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authenticated atom query
router.post('/atoms/query', authenticateToken, async (req, res) => {
  try {
    const { vector, limit } = req.body;
    const results = await queryAtoms(vector, limit || 10);
    res.json({ success: true, atoms: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Authenticated atom storage
router.post('/atoms/store', authenticateToken, async (req, res) => {
  try {
    const { content, coordinates } = req.body;
    const id = await storeAtom(content, coordinates);
    res.json({ success: true, atomId: id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Authenticated memory read
router.get('/memory/:key', authenticateToken, async (req, res) => {
  try {
    const value = await getMartyMemory(req.params.key);
    res.json({ success: true, value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Authenticated memory write
router.post('/memory', authenticateToken, async (req, res) => {
  try {
    const { key, value } = req.body;
    await setMartyMemory(key, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Authenticated intelligence engine trigger
router.post('/ie/run', authenticateToken, async (req, res) => {
  try {
    const result = await runIntelligenceEngine(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Authenticated deploy to Netlify
router.post('/deploy/netlify', authenticateToken, async (req, res) => {
  try {
    const result = await deployToNetlify(req.body);
    res.json({ success: true, deployId: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Authenticated GitHub push
router.post('/github/push', authenticateToken, async (req, res) => {
  try {
    const { repo, branch, files, message } = req.body;
    const result = await pushToGitHub(repo, branch, files, message);
    res.json({ success: true, commitSha: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
const router = require('express').Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY type, name');
  res.json(rows);
});

module.exports = router;
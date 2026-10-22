const router = require('express').Router();
const db = require('../db');
const USER_ID = 1;

// List all transactions
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = ? 
       ORDER BY t.transaction_date DESC, t.id DESC`,
      [USER_ID]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const { category_id, amount, description, transaction_date, type } = req.body;
    if (!category_id || !amount || !transaction_date || !type)
      return res.status(400).json({ error: 'Missing required fields' });

    const [result] = await db.query(
      `INSERT INTO transactions (user_id, category_id, amount, description, transaction_date, type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [USER_ID, category_id, amount, description || null, transaction_date, type]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, USER_ID]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
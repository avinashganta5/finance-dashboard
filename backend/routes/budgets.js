const router = require('express').Router();
const db = require('../db');
const USER_ID = 1;

// Get budgets for month/year (with spent calculation)
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const [rows] = await db.query(
      `SELECT b.*, c.name AS category_name, c.icon,
        COALESCE((
          SELECT SUM(amount) FROM transactions 
          WHERE user_id = b.user_id 
            AND category_id = b.category_id 
            AND MONTH(transaction_date) = b.month 
            AND YEAR(transaction_date) = b.year 
            AND type = 'expense'
        ), 0) AS spent
       FROM budgets b 
       JOIN categories c ON b.category_id = c.id 
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
      [USER_ID, month, year]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Set/update budget
router.post('/', async (req, res) => {
  try {
    const { category_id, amount, month, year } = req.body;
    if (!category_id || !amount || !month || !year)
      return res.status(400).json({ error: 'Missing required fields' });

    await db.query(
      `INSERT INTO budgets (user_id, category_id, amount, month, year) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [USER_ID, category_id, amount, month, year]
    );
    res.json({ message: 'Budget saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, USER_ID]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
const router = require('express').Router();
const db = require('../db');
const USER_ID = 1;

// Summary for month/year
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const [[income]] = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM transactions 
       WHERE user_id = ? AND type = 'income' 
       AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
      [USER_ID, month, year]
    );
    const [[expense]] = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM transactions 
       WHERE user_id = ? AND type = 'expense' 
       AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
      [USER_ID, month, year]
    );
    res.json({
      totalIncome: Number(income.total),
      totalExpense: Number(expense.total),
      balance: Number(income.total) - Number(expense.total)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Category breakdown (for pie chart)
router.get('/categories', async (req, res) => {
  try {
    const { month, year, type = 'expense' } = req.query;
    const [rows] = await db.query(
      `SELECT c.name, c.icon, SUM(t.amount) AS total 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = ? AND t.type = ? 
       AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
       GROUP BY c.id ORDER BY total DESC`,
      [USER_ID, type, month, year]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6-month trend
router.get('/trend', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT YEAR(transaction_date) AS year, MONTH(transaction_date) AS month,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
       FROM transactions 
       WHERE user_id = ? AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY year, month ORDER BY year, month`,
      [USER_ID]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
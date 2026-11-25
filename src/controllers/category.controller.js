exports.getCategories = (req, res) => {
  global.db.query('SELECT * FROM categories WHERE is_active = 1', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
};
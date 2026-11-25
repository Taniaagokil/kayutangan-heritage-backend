exports.addReview = (req, res) => {
  const { user_id, place_id, category_id, rating, comment } = req.body;
  const query = 'INSERT INTO reviews (user_id, place_id, category_id, rating, comment) VALUES (?, ?, ?, ?, ?)';
  
  global.db.query(query, [user_id, place_id, category_id, rating, comment], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Ulasan berhasil ditambahkan!' });
  });
};
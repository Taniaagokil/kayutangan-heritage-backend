exports.getPlaces = (req, res) => {
  const { category_id } = req.query;
  let query = 'SELECT * FROM places WHERE is_active = 1';
  let params = [];

  if (category_id) {
    query += ' AND category_id = ?';
    params.push(category_id);
  }

  global.db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
};

exports.getPlaceDetail = (req, res) => {
  const placeId = req.params.id;

  global.db.query('SELECT * FROM places WHERE id = ?', [placeId], (err, placeRes) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (placeRes.length === 0) return res.status(404).json({ success: false, message: 'Tempat tidak ditemukan' });

    const place = placeRes[0];

    global.db.query('SELECT * FROM place_images WHERE place_id = ?', [placeId], (err, images) => {
      global.db.query('SELECT * FROM place_opening_hours WHERE place_id = ?', [placeId], (err, hours) => {
        global.db.query('SELECT * FROM reviews WHERE place_id = ?', [placeId], (err, reviews) => {
          res.json({
            success: true,
            data: {
              ...place,
              images: images,
              opening_hours: hours,
              reviews: reviews
            }
          });
        });
      });
    });
  });
};
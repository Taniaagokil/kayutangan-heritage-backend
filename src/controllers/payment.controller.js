exports.verifyPayment = (req, res) => {
  const { ticket_id } = req.body;

  const updatePayment = 'UPDATE payments SET status = "Success", paid_at = CURRENT_TIMESTAMP WHERE ticket_id = ?';
  const updateTicket = 'UPDATE tickets SET status = "Active" WHERE id = ?';

  global.db.query(updatePayment, [ticket_id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    
    global.db.query(updateTicket, [ticket_id], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Pembayaran berhasil diverifikasi! Tiket aktif.' });
    });
  });
};

exports.cancelPayment = (req, res) => {
  const { ticket_id } = req.body;

  const updatePayment = 'UPDATE payments SET status = "Cancelled" WHERE ticket_id = ?';
  const updateTicket = 'UPDATE tickets SET status = "Cancelled" WHERE id = ?';

  global.db.query(updatePayment, [ticket_id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    global.db.query(updateTicket, [ticket_id], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Pesanan dibatalkan.' });
    });
  });
};
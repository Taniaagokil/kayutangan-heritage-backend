exports.createTicket = (req, res) => {
  const { user_id, visitor_name, visit_date, visit_time, visitor_type, quantity, unit_price, total_price } = req.body;
  const ticketCode = 'KH-' + Math.floor(10000000 + Math.random() * 90000000);

  const insertTicket = `INSERT INTO tickets (ticket_code, user_id, visitor_name, visit_date, visit_time, visitor_type, quantity, unit_price, total_price, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`;

  global.db.query(insertTicket, [ticketCode, user_id, visitor_name, visit_date, visit_time, visitor_type, quantity, unit_price, total_price], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const ticketId = result.insertId;

    const insertPayment = `INSERT INTO payments (ticket_id, method, amount, status) VALUES (?, 'QRIS', ?, 'Pending')`;
    global.db.query(insertPayment, [ticketId, total_price], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ 
        success: true, 
        message: 'Tiket berhasil dibuat, silakan lakukan pembayaran.', 
        ticket_id: ticketId,
        ticket_code: ticketCode 
      });
    });
  });
};

exports.getUserTickets = (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT t.*, p.status as payment_status FROM tickets t LEFT JOIN payments p ON t.id = p.ticket_id WHERE t.user_id = ?';
  
  global.db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
};

exports.scanTicket = (req, res) => {
  const { ticket_code } = req.body;
  const query = 'UPDATE tickets SET status = "Used", used_at = CURRENT_TIMESTAMP WHERE ticket_code = ?';

  global.db.query(query, [ticket_code], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
    
    res.json({ success: true, message: 'Tiket berhasil divalidasi dan berstatus "Sudah Digunakan".' });
  });
};

exports.checkMapAccess = (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT * FROM tickets WHERE user_id = ? AND status = "Active" LIMIT 1';

  global.db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (results.length > 0) {
      res.json({ has_access: true, active_ticket: results[0] });
    } else {
      res.json({ has_access: false, message: 'Akses peta terkunci. Harap beli & aktifkan tiket terlebih dahulu.' });
    }
  });
};
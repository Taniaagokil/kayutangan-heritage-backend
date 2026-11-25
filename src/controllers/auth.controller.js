const bcrypt = require('bcrypt');

// ======================================
// REGISTER
// ======================================

exports.register = async (req, res) => {
  try {
    const { nama, email, no_hp, password } = req.body || {};

    // Validasi input
    if (!nama || !email || !no_hp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Semua data wajib diisi.',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 8 karakter.',
      });
    }

    const cleanNama = String(nama).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanHp = String(no_hp).trim();

    // Cek email dan nomor telepon
    const checkSql = `
      SELECT id
      FROM users
      WHERE email = ? OR no_hp = ?
      LIMIT 1
    `;

    global.db.query(
      checkSql,
      [cleanEmail, cleanHp],
      async (err, results) => {
        if (err) {
          console.error('Error cek user:', err);

          return res.status(500).json({
            success: false,
            message: 'Gagal memeriksa data pengguna.',
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Email atau nomor telepon sudah terdaftar.',
          });
        }

        try {
          // Hash password
          const passwordHash = await bcrypt.hash(
            String(password),
            10
          );

          // Simpan ke database
          const insertSql = `
            INSERT INTO users
            (nama, email, password_hash, no_hp, role)
            VALUES (?, ?, ?, ?, 'user')
          `;

          global.db.query(
            insertSql,
            [
              cleanNama,
              cleanEmail,
              passwordHash,
              cleanHp,
            ],
            (insertErr, result) => {
              if (insertErr) {
                console.error('Error insert user:', insertErr);

                return res.status(500).json({
                  success: false,
                  message: 'Gagal menyimpan akun ke database.',
                });
              }

              return res.status(201).json({
                success: true,
                message: 'Registrasi berhasil!',
                data: {
                  id: result.insertId,
                  nama: cleanNama,
                  email: cleanEmail,
                  no_hp: cleanHp,
                  role: 'user',
                },
              });
            }
          );
        } catch (hashError) {
          console.error('Hash error:', hashError);

          return res.status(500).json({
            success: false,
            message: 'Gagal memproses password.',
          });
        }
      }
    );
  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};


// ======================================
// LOGIN
// ======================================

exports.login = (req, res) => {
  const { identifier, email, password } = req.body || {};

  const loginIdentifier = String(
    identifier || email || ''
  ).trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/nomor telepon dan password wajib diisi.',
    });
  }

  const sql = `
    SELECT
      id,
      nama,
      email,
      password_hash,
      no_hp,
      role,
      avatar_url
    FROM users
    WHERE LOWER(email) = LOWER(?)
       OR no_hp = ?
    LIMIT 1
  `;

  global.db.query(
    sql,
    [loginIdentifier, loginIdentifier],
    async (err, results) => {
      if (err) {
        console.error('Login query error:', err);

        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database.',
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email/nomor telepon atau password salah.',
        });
      }

      const user = results[0];

      try {
        const passwordMatch = await bcrypt.compare(
          String(password),
          user.password_hash
        );

        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            message: 'Email/nomor telepon atau password salah.',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Login berhasil!',
          data: {
            id: user.id,
            nama: user.nama,
            email: user.email,
            no_hp: user.no_hp,
            role: user.role,
            avatar_url: user.avatar_url,
          },
        });
      } catch (error) {
        console.error('Password verification error:', error);

        return res.status(500).json({
          success: false,
          message: 'Gagal memverifikasi password.',
        });
      }
    }
  );
};
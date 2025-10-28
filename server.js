const express = require('express');
const path = require('path');
const { getPool } = require('./db');

const app = express();
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Rutas API
// GET /api/clientes?term=...&page=1&limit=20
app.get('/api/clientes', async (req, res) => {
  try {
    const pool = await getPool();
    const term = (req.query.term || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];

    if (term) {
      // Busca en varios campos
      const like = `%${term}%`;
      whereClauses.push('(nombre LIKE ? OR email LIKE ? OR telefono LIKE ? OR empresa LIKE ? OR cargo LIKE ? OR temas_de_interes LIKE ?)');
      params.push(like, like, like, like, like, like);
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [rows] = await pool.query(
      `SELECT SQL_CALC_FOUND_ROWS * FROM clientes ${whereSQL} ORDER BY ID_Client DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ 'FOUND_ROWS()': total }]] = await pool.query(['SELECT FOUND_ROWS()'].join(''));
    res.json({ data: rows, page, limit, total: total || rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// GET single
app.get('/api/clientes/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM clientes WHERE ID_Client = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// CREATE
app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre, email, telefono, empresa, cargo, temas_de_interes } = req.body;
    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, email, telefono, empresa, cargo, temas_de_interes) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, telefono, empresa, cargo, temas_de_interes]
    );
    const [rows] = await pool.query('SELECT * FROM clientes WHERE ID_Client = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// UPDATE
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, email, telefono, empresa, cargo, temas_de_interes } = req.body;
    const pool = await getPool();
    const [result] = await pool.query(
      'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, empresa = ?, cargo = ?, temas_de_interes = ? WHERE ID_Client = ?',
      [nombre, email, telefono, empresa, cargo, temas_de_interes, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    const [rows] = await pool.query('SELECT * FROM clientes WHERE ID_Client = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// DELETE
app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const [result] = await pool.query('DELETE FROM clientes WHERE ID_Client = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not_found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
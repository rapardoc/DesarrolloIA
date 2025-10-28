const mysql = require('mysql2/promise');

async function getPool() {
  // Ajusta user/password/host/port si usas credenciales diferentes en XAMPP
  return mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',   // por defecto XAMPP suele usar root sin pass
    database: 'clientes',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });
}

module.exports = { getPool };
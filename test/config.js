'use strict';

module.exports = {
    host: process.env.MYSQLX_HOST || 'localhost',
    password: process.env.MYSQLX_PASSWORD || '',
    port: parseInt(process.env.MYSQLX_PORT, 10) || 33060,
    schema: process.env.MYSQLX_DEFAULT_SCHEMA || 'nodejsmysqlxtest',
    socket: process.env.MYSQLX_SOCKET,
    ssl: process.env.MYSQLX_TLS !== 'false',
    user: process.env.MYSQLX_USER || 'root'
};

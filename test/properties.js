'use strict';

const os = require('os');
const path = require('path');

const socketPath = process.env.NODE_TEST_MYSQL_SOCKET;
const socket = socketPath && socketPath.length ? socketPath : path.join(os.tmpdir(), 'mysqlx.sock');
const isRemoteServer = process.env.NODE_TEST_MYSQL_LOCATION === 'remote';
const isSecureServer = process.env.NODE_TEST_MYSQL_SSL !== 'false';

module.exports = {
    dbPassword: process.env.NODE_TEST_MYSQL_PASSWORD || '',
    dbUser: process.env.NODE_TEST_MYSQL_USER || 'root',
    host: process.env.NODE_TEST_MYSQL_HOST || 'localhost',
    port: parseInt(process.env.NODE_TEST_MYSQL_PORT, 10) || 33060,
    schema: process.env.NODE_TEST_MYSQL_SCHEMA || 'nodejsmysqlxtest',
    socket: !isRemoteServer && os.platform() !== 'win32' ? socket : undefined,
    ssl: isSecureServer
};

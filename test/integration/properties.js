'use strict';

module.exports = {
    dbPassword: process.env.NODE_TEST_MYSQL_PASSWORD || '',
    dbUser: process.env.NODE_TEST_MYSQL_USER || 'root',
    host: process.env.NODE_TEST_MYSQL_HOST || 'localhost',
    port: process.env.NODE_TEST_MYSQL_PORT || '33060',
    schema: process.env.NODE_TEST_MYSQL_SCHEMA || 'nodejsmysqlxtest'
};

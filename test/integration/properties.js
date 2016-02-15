const properties = {
    "host": "localhost",
    "port": 33060,
    "dbUser": "root",
    "dbPassword": "",
    "schema": "nodejsmysqlxtest"
};

if (process.env.NODE_TEST_MYSQL_HOST) {
    properties.host = process.env.NODE_TEST_MYSQL_HOST;
}
if (process.env.NODE_TEST_MYSQL_PORT) {
    properties.port = process.env.NODE_TEST_MYSQL_PORT;
}
if (process.env.NODE_TEST_MYSQL_USER) {
    properties.dbUser = process.env.NODE_TEST_MYSQL_USER;
}
if (process.env.NODE_TEST_MYSQL_PASSWORD) {
    properties.dbPassword = process.env.NODE_TEST_MYSQL_PASSWORD;
}
if (process.env.NODE_TEST_MYSQL_SCHEMA) {
    properties.schema = process.env.NODE_TEST_MYSQL_SCHEMA;
}

module.exports = properties;

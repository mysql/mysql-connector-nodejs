'use strict';

const mysqlx = require('../../../../');

const config = JSON.parse(process.env.MYSQLX_CLIENT_CONFIG);
const baseConfig = Object.assign({}, config, { schema: undefined });

// additional configuration properties are provided via a JSON command argument
const additionalConfig = JSON.parse(process.argv[2] || null);
const scriptConfig = Object.assign({}, baseConfig, additionalConfig);

const pool = mysqlx.getClient(scriptConfig);

pool.getSession()
    .then(session => {
        return session.close();
    })
    .then(() => {
        return pool.getSession();
    })
    .then(() => {
        return pool.close();
    })
    .catch(err => {
        // errors in should be passed as JSON to the parent process via stderr
        console.error(JSON.stringify({ message: err.message, stack: err.stack }));
        return process.exit(1);
    });

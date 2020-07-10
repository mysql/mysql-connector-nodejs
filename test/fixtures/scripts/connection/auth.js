'use strict';

const mysqlx = require('../../../../');

const config = JSON.parse(process.env.MYSQLX_CLIENT_CONFIG);

// required arguments
const user = process.argv[2];
const password = process.argv[3];
const auth = process.argv[4];

const baseConfig = Object.assign({}, config, { auth, password, schema: undefined, user });

mysqlx.getSession(baseConfig)
    .then(session => {
        return session.close();
    })
    .catch(err => {
        // errors in should be passed as JSON to the parent process via stderr
        console.error(JSON.stringify({ message: err.message, stack: err.stack }));
        return process.exit(1);
    });

'use strict';

const mysqlx = require('../../../../');

const config = JSON.parse(process.env.MYSQLX_CLIENT_CONFIG);

// required arguments
const schema = process.argv[2];
const table = process.argv[3];
// column names and values are provided as JSON arrays
const columns = process.argv[4];
const values = process.argv[5];

const baseConfig = Object.assign({}, config, { schema });

mysqlx.getSession(baseConfig)
    .then(session => {
        return session.getDefaultSchema().getTable(table).insert(JSON.parse(columns))
            .values(JSON.parse(values))
            .execute()
            .then(() => {
                return session.close();
            });
    })
    .catch(err => {
        // errors in should be passed as JSON to the parent process via stderr
        console.error(JSON.stringify({ message: err.message, stack: err.stack }));
        process.exit(1);
    });

'use strict';

const mysqlx = require('../../../../');

const config = JSON.parse(process.env.MYSQLX_CLIENT_CONFIG);

// required arguments
const schema = process.argv[2];
const collection = process.argv[3];
const criteria = process.argv[4];
// bindings are provided as JSON objects
const fstRunBindings = JSON.parse(process.argv[5]);
const sndRunBindings = JSON.parse(process.argv[6]);

const baseConfig = Object.assign({}, config, { schema });

mysqlx.getSession(baseConfig)
    .then(session => {
        const statement = session.getDefaultSchema().getCollection(collection)
            .remove(criteria);

        return statement.bind(fstRunBindings)
            .execute()
            .then(() => {
                return statement.bind(sndRunBindings)
                    .execute();
            })
            .then(() => {
                return statement.limit(1)
                    .bind(fstRunBindings)
                    .execute();
            })
            .then(() => {
                return session.close();
            });
    })
    .catch(err => {
        // errors in should be passed as JSON to the parent process via stderr
        console.error(JSON.stringify({ message: err.message, stack: err.stack }));
        process.exit(1);
    });

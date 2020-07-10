'use strict';

const mysqlx = require('../../../../');

const config = JSON.parse(process.env.MYSQLX_CLIENT_CONFIG);

// required arguments
const schema = process.argv[2];
const collection = process.argv[3];
// bindings are provided as JSON objects
const fstRunBindings = JSON.parse(process.argv[4]);
const sndRunBindings = JSON.parse(process.argv[5]);

const baseConfig = Object.assign({}, config, { schema });

mysqlx.getSession(baseConfig)
    .then(session => {
        const statement = session.getDefaultSchema().getCollection(collection).find();

        return statement.limit(fstRunBindings.limit)
            .offset(fstRunBindings.offset)
            .execute()
            .then(() => {
                return statement.limit(sndRunBindings.limit)
                    .offset(sndRunBindings.offset)
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

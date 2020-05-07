'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('../../../fixtures');

describe('schema management', () => {
    let session;

    const baseConfig = { schema: undefined };

    beforeEach('create default session', () => {
        return fixtures.createSession(baseConfig)
            .then(newSession => {
                session = newSession;
            });
    });

    afterEach('close default session', () => {
        return session.close();
    });

    context('creating a new schema', () => {
        it('succeeds when a schema with the given name does not exist yet', () => {
            const schemaName = 'foo';

            return session.createSchema(schemaName)
                .then(() => {
                    return session.sql('SHOW DATABASES')
                        .execute();
                })
                .then(res => {
                    return expect(res.fetchAll().map(row => row[0])).to.deep.include(schemaName);
                })
                .then(() => {
                    return session.sql(`DROP DATABASE IF EXISTS ${schemaName}`)
                        .execute();
                });
        });

        it('fails when the schema with a given name already exists', () => {
            const schemaName = 'foo';

            // try creating the same schema twice
            return session.createSchema(schemaName)
                .then(() => session.createSchema(schemaName))
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1007);

                    return session.sql(`DROP DATABASE IF EXISTS ${schemaName}`)
                        .execute();
                });
        });

        it('fails when the schema name is not valid', () => {
            const schemaName = '';

            return session.createSchema(schemaName)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1102);
                });
        });
    });

    context('listing existing schemas', () => {
        it('should return a list of schema instances mapping the existing databases in the server', () => {
            return session.getSchemas()
                .then(schemas => {
                    return session.sql('SHOW DATABASES')
                        .execute()
                        .then(res => {
                            return expect(schemas.map(schema => schema.getName())).to.deep.equal(res.fetchAll().map(row => row[0]));
                        });
                });
        });
    });

    context('dropping schemas', () => {
        it('succeeds when a schema with the given name exists', () => {
            const schemaName = 'foo';

            return session.sql(`CREATE DATABASE IF NOT EXISTS ${schemaName}`)
                .execute()
                .then(() => {
                    return session.dropSchema(schemaName);
                });
        });

        it('succeeds when a schema with the given name does not exist', () => {
            const schemaName = 'foo';

            return session.sql(`DROP DATABASE IF EXISTS ${schemaName}`)
                .execute()
                .then(() => {
                    return session.dropSchema(schemaName);
                });
        });

        it('fails when the schema name is not valid', () => {
            const schemaName = '';

            return session.dropSchema(schemaName)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1102);
                });
        });
    });

    // it('allows to create a new session using an existing default schema', () => {
    //     return session.createSchema(config.schema)
    //         .then(() => mysqlx.getSession(config))
    //         .then(session => {
    //             expect(session.getDefaultSchema().getName()).to.equal(config.schema);
    //             return session.close();
    //         });
    // });
});

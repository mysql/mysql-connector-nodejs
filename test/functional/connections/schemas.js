'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');

describe('schema management', () => {
    let session;

    beforeEach('create session', () => {
        const options = Object.assign({}, config, { schema: undefined });

        return mysqlx.getSession(options)
            .then(s => {
                session = s;
            });
    });

    beforeEach('drop duplicate schemas', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('drop duplicate schemas', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('allows to create a new schema', () => {
        let schemas = [];

        return session.createSchema(config.schema)
            .then(() => {
                return session.sql('SHOW DATABASES')
                    .execute(schema => {
                        schemas = schemas.concat(schema);
                    });
            })
            .then(() => {
                expect(schemas).to.include(config.schema);
            });
    });

    it('allows to list the existing schemas', () => {
        let expected = [];

        return session.sql('SHOW DATABASES')
            .execute(schema => {
                expected = expected.concat(schema);
            })
            .then(() => {
                return session.getSchemas();
            })
            .then(actual => {
                return expect(actual.map(schema => schema.getName())).to.deep.equal(expected);
            });
    });

    it('allows to drop an existing schema', () => {
        return session.createSchema(config.schema)
            .then(() => session.dropSchema(config.schema));
    });

    it('does not fail to drop a non-existent schema', () => {
        return session.dropSchema(config.schema)
            .then(() => session.dropSchema(config.schema));
    });

    it('fails to drop a schema with an empty name', () => {
        return session.dropSchema('')
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.not.equal('expect.fail()'));
    });

    it('fails to drop a schema with an invalid name', () => {
        return session.dropSchema(' ')
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.not.equal('expect.fail()'));
    });

    it('fails to drop a schema with name set to `null`', () => {
        return session.dropSchema(null)
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.not.equal('expect.fail()'));
    });

    it('allows to create a new session using an existing default schema', () => {
        return session.createSchema(config.schema)
            .then(() => mysqlx.getSession(config))
            .then(session => {
                expect(session.getDefaultSchema().getName()).to.equal(config.schema);
                return session.close();
            });
    });
});

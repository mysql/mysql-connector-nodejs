'use strict';

/* eslint-env node, mocha */

const config = require('../../config');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('schema validation behavior on older servers', () => {
    let schema, session;

    // server container defined in docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.3', socket: undefined };

    beforeEach('create default schema', () => {
        return fixtures.createSchema(config.schema, baseConfig);
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(Object.assign({}, config, baseConfig))
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('fails to create a collection with a valid JSON schema', () => {
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
        const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

        return schema.createCollection('test', options)
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.'));
    });

    it('re-uses an existing collection without a schema', () => {
        const options = { reuseExisting: true };

        return schema.createCollection('test')
            .then(() => schema.createCollection('test', options));
    });

    it('fails to modify a collection with a valid JSON schema', () => {
        const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
        const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

        return schema.modifyCollection('test', options)
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.'));
    });
});

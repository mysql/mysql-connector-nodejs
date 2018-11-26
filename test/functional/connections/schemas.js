'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional schema management', () => {
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

    it('should allow to create a new schema', () => {
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

    it('should allow to list the existing schemas', () => {
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

    it('should allow to drop an existing schema', () => {
        return session.createSchema(config.schema)
            .then(() => {
                return expect(session.dropSchema(config.schema)).to.be.fulfilled;
            });
    });

    it('should not fail to drop a non-existent schema', () => {
        return session.dropSchema(config.schema)
            .then(() => {
                return expect(session.dropSchema(config.schema)).to.be.fulfilled;
            });
    });

    it('should fail to drop a schema with an empty name', () => {
        return expect(session.dropSchema('')).to.be.rejected;
    });

    it('should fail to drop a schema with an invalid name', () => {
        return expect(session.dropSchema(' ')).to.be.rejected;
    });

    it('should fail to drop a schema with name set to `null`', () => {
        return expect(session.dropSchema(null)).to.be.rejected;
    });

    it('should allow to create a new session using an existing default schema', () => {
        return session.createSchema(config.schema)
            .then(() => {
                return mysqlx.getSession(config);
            })
            .then(session => {
                return expect(session.getDefaultSchema().getName()).to.equal(config.schema);
            });
    });
});

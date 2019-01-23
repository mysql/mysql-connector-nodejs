'use strict';

/* eslint-env node, mocha */

const config = require('test/properties');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@docker autonomous prepared statements without server support', () => {
    let collection, schema, session;

    // MySQL 8.0.13 server port (defined in docker.compose.yml)
    const baseConfig = Object.assign({}, config, { port: 33065 });

    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema(baseConfig);
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(baseConfig)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(baseConfig.schema);
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    beforeEach('add fixtures', () => {
        return collection
            .add({ _id: '1', name: 'foo' })
            .add({ _id: '2', name: 'bar' })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(baseConfig.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('find', () => {
        it('falls back to the regular execution mode', () => {
            const expected = [{ _id: '1' }, { _id: '2' }];
            const actual = [];

            const op = collection.find('name = :name').fields('_id');
            const names = ['foo', 'bar'];

            return expect(Promise.all(names.map(name => op.bind('name', name).execute(doc => actual.push(doc))))).to.be.fulfilled
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});

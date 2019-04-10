'use strict';

/* eslint-env node, mocha */

const config = require('../../../test/properties');
const expect = require('chai').expect;
const fixtures = require('../../../test/fixtures');
const mysqlx = require('../../../');

describe('autonomous prepared statements for collections without server support', () => {
    let collection, schema, session;

    // MySQL 8.0.13 server port (defined in docker.compose.yml)
    const baseConfig = Object.assign({}, config, { port: 33065, socket: undefined });

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
            .add({ _id: '3', name: 'baz' })
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
            const expected = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];
            const actual = [];

            const op = collection.find('name = :name').fields('_id');
            const names = ['foo', 'bar', 'baz'];

            return Promise.all(names.map(name => op.bind('name', name).execute(doc => actual.push(doc))))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('modify', () => {
        it('falls back to the regular execution mode', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'qux' }, { _id: '3', name: 'qux' }];
            const actual = [];

            const op = collection.modify('name = :name').set('name', 'qux');
            const names = ['foo', 'bar', 'baz'];

            return Promise.all(names.map(name => op.bind('name', name).execute()))
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('remove', () => {
        it('falls back to the regular execution mode', () => {
            const actual = [];

            const op = collection.remove('name = :name');
            const names = ['foo', 'bar', 'baz'];

            return Promise.all(names.map(name => op.bind('name', name).execute()))
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.be.empty);
        });
    });
});

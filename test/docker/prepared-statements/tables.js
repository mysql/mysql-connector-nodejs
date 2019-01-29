'use strict';

/* eslint-env node, mocha */

const config = require('test/properties');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@docker autonomous prepared statements for tables without server support', () => {
    let schema, session, table;

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

    beforeEach('create table', () => {
        return session.sql('CREATE TABLE test (_id VARBINARY(32), name VARCHAR(4))')
            .execute();
    });

    beforeEach('get table', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return table.insert('_id', 'name')
            .values('1', 'foo')
            .values('2', 'bar')
            .values('3', 'baz')
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(baseConfig.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('select', () => {
        it('falls back to the regular execution mode', () => {
            const expected = [['1'], ['2'], ['3']];
            const actual = [];

            const op = table.select('_id').where('name = :name');
            const names = ['foo', 'bar', 'baz'];

            return expect(Promise.all(names.map(name => op.bind('name', name).execute(row => actual.push(row))))).to.be.fulfilled
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('update', () => {
        it('falls back to the regular execution mode', () => {
            const expected = [['1', 'qux'], ['2', 'qux'], ['3', 'qux']];
            const actual = [];

            const op = table.update().where('name = :name').set('name', 'qux');
            const names = ['foo', 'bar', 'baz'];

            return expect(Promise.all(names.map(name => op.bind('name', name).execute()))).to.be.fulfilled
                .then(() => table.select().orderBy('_id').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('delete', () => {
        it('falls back to the regular execution mode', () => {
            const actual = [];

            const op = table.delete().where('name = :name');
            const names = ['foo', 'bar', 'baz'];

            return expect(Promise.all(names.map(name => op.bind('name', name).execute()))).to.be.fulfilled
                .then(() => table.select().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.be.empty);
        });
    });
});

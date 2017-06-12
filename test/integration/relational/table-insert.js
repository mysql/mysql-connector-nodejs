'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');

describe('@integration relational table insert', () => {
    let session, schema, table;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    beforeEach('create table', () => {
        return schema
            .createTable('test')
            .addColumn(schema.columnDef('test1', schema.Type.Varchar, 255))
            .addColumn(schema.columnDef('test2', schema.Type.Int))
            .execute();
    });

    beforeEach('update context', () => {
        table = schema.getTable('test');
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('with an array of columns', () => {
        it('should insert values provided as an array', () => {
            const expected = [['value1', 42]];
            let actual = [];

            return table
                .insert(['test1', 'test2'])
                .values(expected[0])
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should insert values provided as multiple arguments', () => {
            const expected = [['value1', 42]];
            let actual = [];

            return table
                .insert(['test1', 'test2'])
                .values(expected[0][0], expected[0][1])
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with multiple column arguments', () => {
        it('should insert values provided as an array', () => {
            const expected = [['value1', 42]];
            let actual = [];

            return table
                .insert('test1', 'test2')
                .values(expected[0])
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should insert values provided as multiple arguments', () => {
            const expected = [['value1', 42]];
            let actual = [];

            return table
                .insert('test1', 'test2')
                .values(expected[0][0], expected[0][1])
                .execute()
                .then(() => table.select().execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    it('should insert values provided as a mapping object to each column', () => {
        const expected = [['value1', 42]];
        let actual = [];

        return table
            .insert({ test1: 'value1', test2: 42 })
            .execute()
            .then(() => table.select().execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });
});

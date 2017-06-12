'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');

describe('@integration view create', () => {
    let session, schema;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('collection views', () => {
        let collection;

        beforeEach('create collection', () => {
            return schema.createCollection('test');
        });

        beforeEach('update context', () => {
            collection = schema.getCollection('test');
        });

        it('should not be allowed', () => {
            expect(() => schema.createView('foobar').definedAs(collection.find())).to.throw();
        });
    });

    context('immutable view definitions', () => {
        let table;

        beforeEach('create table', () => {
            return schema
                .createTable('test')
                .addColumn(schema.columnDef('foo', schema.Type.Varchar, 255))
                .addColumn(schema.columnDef('bar', schema.Type.Int))
                .execute();
        });

        beforeEach('update context', () => {
            table = schema.getTable('test');
        });

        beforeEach('add fixtures', () => {
            return table
                .insert(['foo', 'bar'])
                .values(['value1', 42])
                .values(['value1', 23])
                .values(['value2', 23])
                .execute();
        });

        it('should not override', () => {
            const expected = [['value2', 23], ['value1', 23], ['value1', 42]];
            const actual = [];
            const query = table.select('foo', 'bar').orderBy('bar');
            const view = schema.createView('foobar').definedAs(query);

            query.limit(2);

            return view
                .execute(row => actual.push(row))
                .then(() => {
                    actual.forEach((row, index) => {
                        expect(row).to.deep.equal(expected[index]);
                    });
                });
        });
    });
});


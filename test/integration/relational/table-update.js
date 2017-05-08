'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');

describe('@integration relational table update', () => {
    let schema, table;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            schema = suite.schema;
        });
    });

    beforeEach('create table', () => {
        return schema
            .createTable('test')
            .addColumn(schema.columnDef('name', schema.Type.Varchar, 255))
            .addColumn(schema.columnDef('age', schema.Type.Int))
            .execute();
    });

    beforeEach('update context', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return schema
            .getTable('test')
            .insert(['name', 'age'])
            .values(['foo', 42])
            .values(['bar', 23])
            .values(['baz', 42])
            .execute();
    });

    afterEach('clear context', () => {
        return fixtures.teardown();
    });

    context('with truthy condition', () => {
        it('should update all rows in a table without using `where()`', () => {
            const expected = [['bar', 50], ['baz', 50], ['foo', 50]];
            let actual = [];

            return table
                .update('true')
                .set('age', 50)
                .execute()
                .then(() => table.select().orderBy('name ASC').execute(row => {
                    if (!row || !row.length) {
                        return;
                    }

                    actual.push(row);
                }))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should update all rows in a table using `where()`', () => {
            const expected = [['foo', 23], ['foo', 42], ['foo', 42]];
            let actual = [];

            return table
                .update()
                .set('name', 'foo')
                .where('true')
                .execute()
                .then(() => table.select().orderBy('age ASC').execute(row => {
                    if (!row || !row.length) {
                        return;
                    }

                    actual.push(row);
                }))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with filtering condition', () => {
        it('should update the rows in a table that match the criteria defined without `where()`', () => {
            const expected = [['bar', 23], ['baz', 42], ['foo', 50]];
            let actual = [];

            return table
                .update()
                .where('`name` == "foo"')
                .set('age', 50)
                .execute()
                .then(() => table.select().orderBy('age ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should update the rows in a table that match the criteria defined with `where()`', () => {
            const expected = [['bar', 23], ['foo', 42], ['foo', 42]];
            let actual = [];

            return table
                .update()
                .where('`age` == 42')
                .set('name', 'foo')
                .execute()
                .then(() => table.select().orderBy('age ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        it('should update a given number of rows', () => {
            const expected = [['bar', 23], ['baz', 42], ['qux', 42]];
            let actual = [];

            return table
                .update('true')
                .set('name', 'qux')
                .limit(1)
                .execute()
                .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});

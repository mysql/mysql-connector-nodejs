'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/integration/fixtures');

describe('@slow relational table integration tests', () => {
    let session, schema;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session);
    });

    context('select', () => {
        beforeEach('create table', () => {
            return schema
                .createTable('test')
                .addColumn(schema
                    .columnDef('test1', schema.Type.Bigint)
                    .notNull()
                    .autoIncrement()
                    .primaryKey()
                )
                .addColumn(schema.columnDef('test2', schema.Type.Varchar, 255))
                .addColumn(schema.columnDef('test3', schema.Type.Int))
                .execute();
        });

        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['test2', 'test3'])
                .values(['value2', 23])
                .values(['value1', 42])
                .execute();
        });

        context('without projection', () => {
            it('should include all columns without projection', () => {
                const expected = [[1, 'value2', 23], [2, 'value1', 42]];
                let actual = [];

                return schema
                    .getTable('test')
                    .select()
                    .execute(row => {
                        actual.push(row);
                    })
                    .then(() => {
                        expect(actual).to.deep.include.members(expected);
                    });
            });
        });

        context('with projection', () => {
            it('should include only columns provided as an expression array', () => {
                const expected = [['value2', 23], ['value1', 42]];
                let actual = [];

                return schema
                    .getTable('test')
                    .select(['test2', 'test3'])
                    .execute(row => {
                        actual.push(row);
                    })
                    .then(() => {
                        expect(actual).to.deep.include.members(expected);
                    });
            });

            it('should include only columns provided as expression arguments', () => {
                const expected = [['value2', 23], ['value1', 42]];
                let actual = [];

                return schema
                    .getTable('test')
                    .select('test2', 'test3')
                    .execute(row => {
                        actual.push(row);
                    })
                    .then(() => {
                        expect(actual).to.deep.include.members(expected);
                    });
            });
        });
    });
});
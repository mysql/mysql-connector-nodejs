'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');

describe('@integration relational table select', () => {
    let schema;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            schema = suite.schema;
        });
    });

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

    afterEach('clear context', () => {
        return fixtures.teardown();
    });

    context('without projection', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['test2', 'test3'])
                .values(['value2', 23])
                .values(['value1', 42])
                .execute();
        });

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
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['test2', 'test3'])
                .values(['value2', 23])
                .values(['value1', 42])
                .execute();
        });

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

    context('with order', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['test2', 'test3'])
                .values(['value1', 42])
                .values(['value1', 23])
                .values(['value2', 23])
                .execute();
        });

        it('should sort by columns provided as an expression array', () => {
            const expected = [['value2', 23], ['value1', 23], ['value1', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select('test2', 'test3')
                .orderBy(['test2 desc', 'test3 asc'])
                .execute(row => {
                    actual.push(row);
                })
                .then(() => {
                    actual.forEach((row, index) => {
                        expect(row).to.deep.equal(expected[index]);
                    });
                });
        });

        it('should sort by columns provided as expression arguments', () => {
            const expected = [['value1', 42], ['value2', 23], ['value1', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select('test2', 'test3')
                .orderBy('test3 desc', 'test2 desc')
                .execute(row => {
                    actual.push(row);
                })
                .then(() => {
                    actual.forEach((row, index) => {
                        expect(row).to.deep.equal(expected[index]);
                    });
                });
        });
    });

    context('with grouping', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['test2', 'test3'])
                .values(['value1', 42])
                .values(['value2', 23])
                .values(['value1', 42])
                .values(['value1', 23])
                .values(['value2', 23])
                .values(['value2', 42])
                .execute();
        });

        it('should group columns provided as an expression array', () => {
            const expected = [['value1', 23], ['value1', 42], ['value2', 23], ['value2', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select('test2', 'test3')
                .groupBy(['test2', 'test3'])
                .execute(row => {
                    actual.push(row);
                })
                .then(() => {
                    expect(actual).to.have.lengthOf(expected.length);
                    actual.forEach((row, index) => {
                        expect(row).to.deep.equal(expected[index]);
                    });
                });
        });

        it('should group columns provided as expression arguments', () => {
            const expected = [['value1', 23], ['value2', 23], ['value1', 42], ['value2', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select('test2', 'test3')
                .groupBy('test3', 'test2')
                .execute(row => {
                    actual.push(row);
                })
                .then(() => {
                    expect(actual).to.have.lengthOf(expected.length);
                    actual.forEach((row, index) => {
                        expect(row).to.deep.equal(expected[index]);
                    });
                });
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['test2', 'test3'])
                .values(['foo', 42])
                .values(['bar', 23])
                .values(['baz', 42])
                .values(['qux', 23])
                .values(['quux', 23])
                .execute();
        });

        it('should return a given number of row', () => {
            const expected = [[1, 'foo', 42], [2, 'bar', 23], [3, 'baz', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select()
                .limit(3)
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should return the rows after a given offset', () => {
            const expected = [[3, 'baz', 42], [4, 'qux', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select()
                .limit(2, 2)
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});

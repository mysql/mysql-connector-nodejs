'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('relational table select', () => {
    let session, schema, table;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(config.schema);
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(config)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    beforeEach('create table', () => {
        return session.sql(`CREATE TABLE test (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            age INT)`).execute();
    });

    beforeEach('load table', () => {
        table = schema.getTable('test');
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('without criteria and projection', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'bar', 23])
                .values([2, 'foo', 42])
                .execute();
        });

        context('with a callback', () => {
            it('includes all the rows in the table (and all the columns for each row)', () => {
                const expected = [[1, 'bar', 23], [2, 'foo', 42]];
                const actual = [];

                return table.select()
                    .execute(row => actual.push(row))
                    .then(() => expect(actual).to.deep.include.members(expected));
            });

            it('does not fail when trying to use a pull-based cursor', () => {
                const noop = () => {};

                return table.select()
                    .execute(noop)
                    .then(result => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;
                        expect(result.fetchAll()).to.deep.equal([]);
                    });
            });

            it('returns the column metadata for each row', () => {
                return table.select().execute(() => {}, columns => {
                    expect(columns).to.have.lengthOf(3);
                    expect(columns[0].getColumnName()).to.equal('id');
                    expect(columns[0].getType()).to.equal('BIGINT');
                    expect(columns[1].getColumnName()).to.equal('name');
                    expect(columns[1].getType()).to.equal('STRING');
                    expect(columns[2].getColumnName()).to.equal('age');
                    expect(columns[2].getType()).to.equal('INT');
                });
            });
        });

        context('without a callback', () => {
            it('returns the first row in the resultset (and all its columns)', () => {
                const expected = [1, 'bar', 23];

                return table.select()
                    .orderBy('id')
                    .execute()
                    .then(result => {
                        let actual = result.fetchOne();
                        expect(actual).to.deep.equal(expected);

                        actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(1);
                    });
            });

            it('returns all the existing rows in the table (and all the columns for each row)', () => {
                const expected = [[1, 'bar', 23], [2, 'foo', 42]];

                return table.select()
                    .execute()
                    .then(result => {
                        let actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.fetchAll();
                        return expect(actual).to.be.empty;
                    });
            });

            it('returns the resultset as an array', () => {
                const expected = [[1, 'bar', 23], [2, 'foo', 42]];

                return table.select()
                    .execute()
                    .then(result => {
                        let actual = result.toArray();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.toArray();
                        return expect(actual).to.have.lengthOf(expected.length);
                    });
            });

            it('returns the column metadata for each row', () => {
                return table.select()
                    .execute()
                    .then(result => {
                        const columns = result.getColumns();

                        expect(columns).to.have.lengthOf(3);
                        expect(columns[0].getColumnName()).to.equal('id');
                        expect(columns[0].getType()).to.equal('BIGINT');
                        expect(columns[1].getColumnName()).to.equal('name');
                        expect(columns[1].getType()).to.equal('STRING');
                        expect(columns[2].getColumnName()).to.equal('age');
                        expect(columns[2].getType()).to.equal('INT');
                    });
            });
        });
    });

    context('with projection', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'bar', 23])
                .values([2, 'foo', 42])
                .execute();
        });

        it('includes only columns provided as an expression array', () => {
            const expected = [['bar', 23], ['foo', 42]];
            const actual = [];

            return table.select(['name', 'age'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.include.members(expected));
        });

        it('includes only columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 42]];
            const actual = [];

            return table.select('name', 'age')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.include.members(expected));
        });
    });

    context('with order', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'foo', 23])
                .values([3, 'bar', 23])
                .execute();
        });

        it('sorts by columns provided as an expression array', () => {
            const expected = [['foo', 23], ['foo', 42], ['bar', 23]];
            const actual = [];

            return table.select('name', 'age')
                .orderBy(['name desc', 'age asc'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('sorts by columns provided as expression arguments', () => {
            const expected = [['foo', 42], ['foo', 23], ['bar', 23]];
            const actual = [];

            return table.select('name', 'age')
                .orderBy('age desc', 'name desc')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with grouping', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 42])
                .values([4, 'foo', 23])
                .values([5, 'bar', 23])
                .values([6, 'bar', 42])
                .execute();
        });

        it('groups columns provided as an expression array', () => {
            const expected = [['bar', 42], ['bar', 23], ['foo', 42], ['foo', 23]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy(['name', 'age'])
                // MySQL 8 does not ensure GROUP BY order
                .orderBy(['name ASC', 'age DESC'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('groups columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 23], ['bar', 42], ['foo', 42]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy('age', 'name')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy('age ASC', 'name ASC')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with grouping criteria', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 42])
                .values([4, 'foo', 23])
                .values([5, 'bar', 23])
                .values([6, 'bar', 42])
                .execute();
        });

        it('groups columns provided as an expression array', () => {
            const expected = [['bar', 42], ['foo', 42]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy(['name', 'age'])
                .having('age > 23')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy(['name ASC', 'age DESC'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('groups columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 23]];
            const actual = [];

            return table.select('name', 'age')
                .groupBy('age', 'name')
                .having('age = 23')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy('age ASC', 'name ASC')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'baz', 42])
                .values([4, 'qux', 23])
                .values([5, 'quux', 23])
                .execute();
        });

        it('returns a given number of row', () => {
            const expected = [[1, 'foo', 42], [2, 'bar', 23], [3, 'baz', 42]];
            const actual = [];

            return table.select()
                .limit(3)
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns the rows after a given offset', () => {
            const expected = [[3, 'baz', 42], [4, 'qux', 23]];
            const actual = [];

            return table.select()
                .limit(2)
                .offset(2)
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        beforeEach('add fixtures', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'baz', 42])
                .execute();
        });

        it('returns all documents that match a criteria specified by a grouped expression', () => {
            const expected = [[1, 'foo', 42], [3, 'baz', 42]];
            const actual = [];

            return table.select()
                .where("name in ('foo', 'baz')")
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [[2, 'bar', 23]];
            const actual = [];

            return table.select()
                .where('age not in (50, 42)')
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('when debug mode is enabled', () => {
        beforeEach('populate table', () => {
            return table.insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 50])
                .execute();
        });

        it('logs the basic operation parameters', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName()])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('collection', 'data_model');
                    expect(crudFind.collection).to.contain.keys('name', 'schema');
                    expect(crudFind.collection.name).to.equal(table.getName());
                    expect(crudFind.collection.schema).to.equal(schema.getName());
                    expect(crudFind.data_model).to.equal('TABLE');
                });
        });

        it('logs the criteria statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-criteria.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name = :v', 'v', 'foo'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('criteria', 'args');
                    expect(crudFind.criteria).to.contain.keys('type', 'operator');
                    expect(crudFind.criteria.type).to.equal('OPERATOR');
                    expect(crudFind.criteria.operator).to.contain.keys('name', 'param');
                    expect(crudFind.criteria.operator.name).to.equal('==');
                    expect(crudFind.criteria.operator.param).to.be.an('array').and.have.lengthOf(2);
                    expect(crudFind.criteria.operator.param[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.criteria.operator.param[0].type).to.equal('IDENT');
                    expect(crudFind.criteria.operator.param[0].identifier).contain.keys('name');
                    expect(crudFind.criteria.operator.param[0].identifier.name).to.equal('name');
                    expect(crudFind.criteria.operator.param[1]).to.contain.keys('type', 'position');
                    expect(crudFind.criteria.operator.param[1].type).to.equal('PLACEHOLDER');
                    expect(crudFind.criteria.operator.param[1].position).to.equal(0);
                    expect(crudFind.args).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.args[0]).to.contain.keys('type', 'v_string');
                    expect(crudFind.args[0].type).to.equal('V_STRING');
                    expect(crudFind.args[0].v_string).to.contain.keys('value');
                    expect(crudFind.args[0].v_string.value).to.equal('foo');
                });
        });

        it('logs the projection statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-projection.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name AS col'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('projection');
                    expect(crudFind.projection).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.projection[0]).contain.keys('source', 'alias');
                    expect(crudFind.projection[0].source).to.contain.keys('type', 'identifier');
                    expect(crudFind.projection[0].source.type).to.equal('IDENT');
                    expect(crudFind.projection[0].source.identifier).to.contain.keys('name');
                    expect(crudFind.projection[0].source.identifier.name).to.equal('name');
                    expect(crudFind.projection[0].alias).to.equal('col');
                });
        });

        it('logs the order statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-order.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'age DESC'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('order');
                    expect(crudFind.order).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.order[0]).to.contain.keys('expr', 'direction');
                    expect(crudFind.order[0].expr).to.contain.keys('type', 'identifier');
                    expect(crudFind.order[0].expr.type).to.equal('IDENT');
                    expect(crudFind.order[0].expr.identifier).to.contain.keys('name');
                    expect(crudFind.order[0].expr.identifier.name).to.equal('age');
                    expect(crudFind.order[0].direction).to.equal('DESC');
                });
        });

        it('logs the grouping statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-grouping.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name, AVG(age)', 'name'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('grouping');
                    expect(crudFind.grouping).to.be.an('array').and.have.lengthOf(1);
                    expect(crudFind.grouping[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.grouping[0].type).equal('IDENT');
                    expect(crudFind.grouping[0].identifier).to.contain.keys('name');
                    expect(crudFind.grouping[0].identifier.name).to.equal('name');
                });
        });

        it('logs the grouping criteria statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-grouping-criteria.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), 'name, AVG(age) as age', 'name', 'age > 22'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('grouping_criteria');
                    expect(crudFind.grouping_criteria).to.contain.keys('type', 'operator');
                    expect(crudFind.grouping_criteria.type).equal('OPERATOR');
                    expect(crudFind.grouping_criteria.operator).to.contain.keys('name', 'param');
                    expect(crudFind.grouping_criteria.operator.name).to.equal('>');
                    expect(crudFind.grouping_criteria.operator.param).to.be.an('array').and.have.lengthOf(2);
                    expect(crudFind.grouping_criteria.operator.param[0]).to.contain.keys('type', 'identifier');
                    expect(crudFind.grouping_criteria.operator.param[0].identifier).to.contain.keys('name');
                    expect(crudFind.grouping_criteria.operator.param[0].identifier.name).to.equal('age');
                    expect(crudFind.grouping_criteria.operator.param[1]).to.contain.keys('type', 'literal');
                    expect(crudFind.grouping_criteria.operator.param[1].type).to.equal('LITERAL');
                    expect(crudFind.grouping_criteria.operator.param[1].literal).to.contain.keys('type', 'v_unsigned_int');
                    expect(crudFind.grouping_criteria.operator.param[1].literal.type).to.equal('V_UINT');
                    expect(crudFind.grouping_criteria.operator.param[1].literal.v_unsigned_int).to.equal(22);
                });
        });

        it('logs the correct locking parameters', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-locking.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Find', script, [schema.getName(), table.getName(), mysqlx.LockContention.SKIP_LOCKED])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudFind = proc.logs[0];
                    expect(crudFind).to.contain.keys('locking', 'locking_options');
                    expect(crudFind.locking).to.equal('SHARED_LOCK');
                    expect(crudFind.locking_options).to.equal('SKIP_LOCKED');
                });
        });

        it('logs the result set column metadata sent by the server', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select-with-projection.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Resultset.ColumnMetaData', script, [schema.getName(), table.getName(), 'age as col'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const columnMetadata = proc.logs[0];
                    expect(columnMetadata).to.contain.keys('type', 'name', 'original_name', 'table', 'original_table', 'schema', 'catalog', 'collation', 'fractional_digits', 'length', 'flags');
                    expect(columnMetadata.type).to.equal('SINT'); // INT is SIGNED by default
                    expect(columnMetadata.name).to.equal('col');
                    expect(columnMetadata.original_name).to.equal('age');
                    expect(columnMetadata.table).to.equal(table.getName());
                    expect(columnMetadata.original_table).to.equal(table.getName());
                    expect(columnMetadata.schema).to.equal(schema.getName());
                    expect(columnMetadata.catalog).to.equal('def'); // always "def"
                    expect(columnMetadata.collation).to.equal(0); // no collation for INT
                    expect(columnMetadata.fractional_digits).to.equal(0);
                    expect(columnMetadata.length).to.equal(11); // sizeof INT
                    expect(columnMetadata.flags).to.equal(0);
                });
        });

        it('logs the result set row data sent by the server', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'select.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Resultset.Row', script, [schema.getName(), table.getName()])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(3); // number of rows

                    const rows = proc.logs;
                    rows.forEach(row => expect(row).to.contain.keys('fields'));
                    expect(rows[0].fields).to.deep.equal([1, 'foo', 42]);
                    expect(rows[1].fields).to.deep.equal([2, 'bar', 23]);
                    expect(rows[2].fields).to.deep.equal([3, 'foo', 50]);
                });
        });
    });
});

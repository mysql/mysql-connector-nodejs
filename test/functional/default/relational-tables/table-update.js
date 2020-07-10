'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('updating data in a table', () => {
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
                name VARCHAR(255),
                age INT)`)
            .execute();
    });

    beforeEach('load table', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return table.insert(['name', 'age'])
            .values(['foo', 42])
            .values(['bar', 23])
            .values(['baz', 42])
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('updates all rows in a table using `where()`', () => {
        const expected = [['foo', 23], ['foo', 42], ['foo', 42]];
        const actual = [];

        return table.update()
            .set('name', 'foo')
            .where('true')
            .execute()
            .then(() => table.select().orderBy('age ASC').execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('updates the rows in a table that match the criteria defined with `where()`', () => {
        const expected = [['bar', 23], ['foo', 42], ['foo', 42]];
        const actual = [];

        return table.update()
            .where('age = 42')
            .set('name', 'foo')
            .execute()
            .then(() => table.select().orderBy('age ASC').execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('fails to update any row if no filtering criteria is provided with `where()`', () => {
        return table.update()
            .where()
            .set('name', 'foo')
            .execute()
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
    });

    it('updates a given number of rows', () => {
        const expected = [['bar', 23], ['baz', 42], ['qux', 42]];
        const actual = [];

        return table.update()
            .where('true')
            .set('name', 'qux')
            .limit(1)
            .orderBy('name DESC')
            .execute()
            .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    context('nullable values', () => {
        it('updates values with null', () => {
            const expected = [['bar', null], ['baz', null], ['foo', null]];
            const actual = [];

            return table.update()
                .where('true')
                .set('age', null)
                .execute()
                .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('BUG#31709879 fails to update values with `undefined`', () => {
            return table.update()
                .where('true')
                .set('age', undefined)
                .execute()
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5152);
                });
        });
    });

    context('multi-option expressions', () => {
        it('updates all documents that match a criteria specified by a grouped expression', () => {
            const expected = [['foo', 50], ['bar', 50], ['baz', 42]];
            const actual = [];

            return table.update()
                .where("name in ('foo', 'bar')")
                .set('age', 50)
                .execute()
                .then(() => table.select().orderBy('age DESC', 'name DESC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('updates all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [['baz', 42], ['foo', 42], ['qux', 23]];
            const actual = [];

            return table.update()
                .where('age not in (42, 50)')
                .set('name', 'qux')
                .execute()
                .then(() => table.select().orderBy('name ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30163003', () => {
        beforeEach('add BLOB column', () => {
            return session.sql('ALTER TABLE test ADD COLUMN (bin BLOB)')
                .execute();
        });

        it('updates a MySQL BLOB using a Node.js Buffer', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const data = new Buffer('quux');
            const expected = [[data]];
            const actual = [];

            return table.update()
                .where('name = :name')
                .bind('name', 'foo')
                .set('bin', data)
                .execute()
                .then(() => {
                    return table.select('bin')
                        .where('name = :name')
                        .bind('name', 'foo')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30401962 affected items', () => {
        context('without limit', () => {
            it('returns the number of documents that have been updated in the table', () => {
                return table.update()
                    .where('true')
                    .set('name', 'quux')
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
            });
        });

        context('with limit', () => {
            it('returns the number of documents that have been updated in the table', () => {
                const limit = 2;

                return table.update()
                    .where('true')
                    .set('name', 'quux')
                    .limit(limit)
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(limit));
            });
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'relational-tables', 'update.js');

        beforeEach('populate table', () => {
            return table.insert(['name', 'age'])
                .values(['foo', 42])
                .values(['bar', 23])
                .values(['baz', 42])
                .execute();
        });

        it('logs the basic operation parameters', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Update', script, [schema.getName(), table.getName(), 'age', 42])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudUpdate = proc.logs[0];
                    expect(crudUpdate).to.contain.keys('collection', 'data_model');
                    expect(crudUpdate.collection).to.contain.keys('name', 'schema');
                    expect(crudUpdate.collection.name).to.equal(table.getName());
                    expect(crudUpdate.collection.schema).to.equal(schema.getName());
                    expect(crudUpdate.data_model).to.equal('TABLE');
                });
        });

        it('logs the update operation data', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Update', script, [schema.getName(), table.getName(), 'age', 42])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudUpdate = proc.logs[0];
                    expect(crudUpdate).to.contain.keys('operation');
                    expect(crudUpdate.operation).to.be.an('array').and.to.have.lengthOf(1);
                    expect(crudUpdate.operation[0]).to.have.keys('source', 'operation', 'value');
                    expect(crudUpdate.operation[0].source).to.have.keys('name');
                    expect(crudUpdate.operation[0].source.name).to.equal('age');
                    expect(crudUpdate.operation[0].operation).to.equal('SET');
                    expect(crudUpdate.operation[0].value).to.have.keys('type', 'literal');
                    expect(crudUpdate.operation[0].value.type).to.equal('LITERAL');
                    expect(crudUpdate.operation[0].value.literal).to.have.keys('type', 'v_unsigned_int');
                    expect(crudUpdate.operation[0].value.literal.type).to.equal('V_UINT');
                    expect(crudUpdate.operation[0].value.literal.v_unsigned_int).to.equal(42);
                });
        });

        it('logs the table changes metadata', () => {
            return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [schema.getName(), table.getName(), 'age', 42])
                .then(proc => {
                    // LOCAL notices are decoded twice (needs to be improved)
                    // so there are no assurances about the correct length
                    expect(proc.logs).to.have.length.above(0);

                    const rowsAffectedNotice = proc.logs[proc.logs.length - 1];
                    expect(rowsAffectedNotice).to.have.keys('type', 'scope', 'payload');
                    expect(rowsAffectedNotice.type).to.equal('SESSION_STATE_CHANGED');
                    expect(rowsAffectedNotice.scope).to.equal('LOCAL');
                    expect(rowsAffectedNotice.payload).to.have.keys('param', 'value');
                    expect(rowsAffectedNotice.payload.param).to.equal('ROWS_AFFECTED');
                    expect(rowsAffectedNotice.payload.value).to.be.an('array').and.have.lengthOf(1);
                    expect(rowsAffectedNotice.payload.value[0]).to.have.keys('type', 'v_unsigned_int');
                    expect(rowsAffectedNotice.payload.value[0].type).to.equal('V_UINT');
                    expect(rowsAffectedNotice.payload.value[0].v_unsigned_int).to.equal(2);
                });
        });
    });
});

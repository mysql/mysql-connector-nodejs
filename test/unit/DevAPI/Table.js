'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Table = require('lib/DevAPI/Table');
const TableInsert = require('lib/DevAPI/TableInsert');
const expect = require('chai').expect;
const td = require('testdouble');

describe('Table', () => {
    let sqlStmtExecute, getName;

    beforeEach('create fakes', () => {
        sqlStmtExecute = td.function();
        getName = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getName()', () => {
        it('should return the table name', () => {
            const table = new Table(null, null, 'foobar');

            expect(table.getName()).to.equal('foobar');
        });
    });

    context('existsInDatabase()', () => {
        it('should return true if the table exists in database', () => {
            const table = new Table({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute(query, ['def', 'bar', 'foo'], td.callback(['foo']))).thenResolve();

            return expect(table.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if the table does not exist in database', () => {
            const table = new Table({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute(query, ['def', 'bar', 'foo'], td.callback([]))).thenResolve();

            return expect(table.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('isView()', () => {
        it('should return true if the table exists in database', () => {
            const table = new Table({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute(query, ['def', 'bar', 'foo'], td.callback(['foo']))).thenResolve();

            return expect(table.isView()).to.eventually.be.true;
        });

        it('should return false if the table does not exist in database', () => {
            const table = new Table({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute(query, ['def', 'bar', 'foo'], td.callback([]))).thenResolve();

            return expect(table.isView()).to.eventually.be.false;
        });
    });

    context('select()', () => {
        it('should return an instance of the proper class', () => {
            const instance = (new Table()).select();

            expect(instance.getClassName()).to.equal('TableSelect');
        });

        it('should set the projection parameters provided as an array', () => {
            const expressions = ['foo', 'bar'];
            const instance = (new Table()).select(expressions);

            expect(instance.getProjection()).to.deep.equal(expressions);
        });

        it('should set the projection parameters provided as multiple arguments', () => {
            const expressions = ['foo', 'bar'];
            const instance = (new Table()).select(expressions[0], expressions[1]);

            expect(instance.getProjection()).to.deep.equal(expressions);
        });
    });

    context('insert()', () => {
        it('should return an instance of the proper class', () => {
            const instance = (new Table()).insert([]);

            expect(instance.getClassName()).to.equal('TableInsert');
        });

        it('should set field names provided as an array', () => {
            const expressions = ['foo', 'bar'];
            const instance = (new Table()).insert(expressions);

            expect(instance.getFields()).to.deep.equal(expressions);
        });

        it('should set field names provided as multiple arguments', () => {
            const expressions = ['foo', 'bar'];
            const instance = (new Table()).insert(expressions[0], expressions[1]);

            expect(instance.getFields()).to.deep.equal(expressions);
        });

        it('should set field names provided as object keys', () => {
            const expressions = ['foo', 'bar'];
            const instance = (new Table()).insert({ foo: 'baz', bar: 'qux' });

            expect(instance.getFields()).to.deep.equal(expressions);
        });

        it('should throw an error if the fields are invalid', () => {
            const table = new Table();

            expect(() => table.insert()).to.throw(Error);
        });
    });

    context('count()', () => {
        it('should return the number of records found', () => {
            const table = new Table({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const count = 3;

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`', [], td.callback([count]))).thenResolve();

            return expect(table.count()).to.eventually.equal(count);
        });

        it('should fail if an expected error is thrown', () => {
            const table = new Table({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`'), { ignoreExtraArgs: true }).thenReject(error);

            return expect(table.count()).to.eventually.be.rejectedWith(error);
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const table = new Table(null, { getName }, 'foo');
            const expected = { schema: 'bar', table: 'foo' };

            td.when(getName()).thenReturn('bar');

            expect(table.inspect()).to.deep.equal(expected);
        });
    });

    context('delete()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const table = 'baz';
            const query = 'true';
            const instance = (new Table(session, schema, table)).delete(query);

            expect(instance.getClassName()).to.equal('TableDelete');
        });
    });

    context('update()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const table = 'baz';
            const query = 'true';
            const instance = (new Table(session, schema, table)).update(query);

            expect(instance.getClassName()).to.equal('TableUpdate');
        });
    });
});

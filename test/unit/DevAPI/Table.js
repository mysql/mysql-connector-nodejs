'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Table', () => {
    let execute, stmtExecute, table;

    beforeEach('create fakes', () => {
        execute = td.function();
        stmtExecute = td.function();

        table = proxyquire('lib/DevAPI/Table', { './StmtExecute': stmtExecute });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getName()', () => {
        it('should return the table name', () => {
            const instance = table(null, null, 'foobar');

            expect(instance.getName()).to.equal('foobar');
        });
    });

    context('existsInDatabase()', () => {
        it('should return true if the table exists in database', () => {
            const instance = table('foo', 'bar', 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(execute(td.callback(['bar']))).thenResolve();
            td.when(stmtExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return expect(instance.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if the table does not exist in database', () => {
            const instance = table('foo', 'bar', 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(execute(td.callback([]))).thenResolve();
            td.when(stmtExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return expect(instance.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('isView()', () => {
        it('should return true if the table exists in database', () => {
            const instance = table('foo', 'bar', 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(execute(td.callback(['bar']))).thenResolve();
            td.when(stmtExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return expect(instance.isView()).to.eventually.be.true;
        });

        it('should return false if the table does not exist in database', () => {
            const instance = table('foo', 'bar', 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(execute(td.callback([]))).thenResolve();
            td.when(stmtExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return expect(instance.isView()).to.eventually.be.false;
        });
    });

    context('select()', () => {
        it('should return an instance of the proper class', () => {
            const instance = table().select();

            expect(instance.getClassName()).to.equal('TableSelect');
        });

        it('should set the projection parameters provided as an array', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().select(expressions);

            expect(instance.getProjections()).to.deep.equal(expressions);
        });

        it('should set the projection parameters provided as multiple arguments', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().select(expressions[0], expressions[1]);

            expect(instance.getProjections()).to.deep.equal(expressions);
        });
    });

    context('insert()', () => {
        it('should return an instance of the proper class', () => {
            const instance = table().insert([]);

            expect(instance.getClassName()).to.equal('TableInsert');
        });

        it('should set column names provided as an array', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert(expressions);

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('should set column names provided as multiple arguments', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert(expressions[0], expressions[1]);

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('should set column names provided as object keys', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert({ foo: 'baz', bar: 'qux' });

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('should throw an error if the columns are invalid', () => {
            const instance = table();

            expect(() => instance.insert()).to.throw(Error);
        });
    });

    context('count()', () => {
        it('should return the number of records found', () => {
            const instance = table('foo', 'bar', 'baz');
            const count = 3;

            td.when(execute(td.callback([count]))).thenResolve();
            td.when(stmtExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return expect(instance.count()).to.eventually.equal(count);
        });

        it('should fail if an expected error is thrown', () => {
            const instance = table('foo', 'bar', 'baz');
            const error = new Error('foobar');

            td.when(execute(), { ignoreExtraArgs: true }).thenReject(error);
            td.when(stmtExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return expect(instance.count()).to.eventually.be.rejectedWith(error);
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const instance = table(null, 'foo', 'bar');
            const expected = { schema: 'foo', table: 'bar' };

            expect(instance.inspect()).to.deep.equal(expected);
        });
    });

    context('delete()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = (table(session, schema, name)).delete(query);

            expect(instance.getClassName()).to.equal('TableDelete');
        });
    });

    context('update()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = (table(session, schema, name)).update(query);

            expect(instance.getClassName()).to.equal('TableUpdate');
        });
    });

    context('escapeIdentifier()', () => {
        it('should escape and wrap the identifier with a set of backticks', () => {
            expect(table.escapeIdentifier('foo')).to.equal('`foo`');
            expect(table.escapeIdentifier('fo`o')).to.equal('`fo``o`');
            expect(table.escapeIdentifier('fo``o-ba``r')).to.equal('`fo````o-ba````r`');
        });
    });
});

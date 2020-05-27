'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const statement = require('../../../lib/DevAPI/Statement');
const td = require('testdouble');

describe('Table', () => {
    let execute, sqlExecute, table;

    beforeEach('create fakes', () => {
        execute = td.function();
        sqlExecute = td.function();
        sqlExecute.Namespace = statement.Type;

        td.replace('../../../lib/DevAPI/SqlExecute', sqlExecute);
        table = require('../../../lib/DevAPI/Table');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getName()', () => {
        it('returns the table name', () => {
            const instance = table(null, null, 'foobar');

            expect(instance.getName()).to.equal('foobar');
        });
    });

    context('getSchema()', () => {
        it('returns the instance of the table schema', () => {
            const getSchema = td.function();
            const getName = td.function();
            const session = { getSchema };
            const schema = { getName };
            const coll = table(session, schema, 'bar');

            td.when(getName()).thenReturn('foo');
            td.when(getSchema('foo')).thenReturn(schema);

            return expect(coll.getSchema().getName()).to.equal('foo');
        });
    });

    context('existsInDatabase()', () => {
        let fetchAll, getName;

        beforeEach('create fakes', () => {
            fetchAll = td.function();
            getName = td.function();
        });

        it('returns true if the table exists in database', () => {
            const schema = { getName };
            const instance = table('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(fetchAll()).thenReturn([['baz', 'TABLE']]);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', pattern: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.true);
        });

        it('returns false if a collection with the same name exists in the database', () => {
            const schema = { getName };
            const instance = table('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(fetchAll()).thenReturn([['baz', 'COLLECTION']]);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', pattern: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });

        it('returns false if the table does not exist in database', () => {
            const schema = { getName };
            const instance = table('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(fetchAll()).thenReturn([]);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', pattern: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });
    });

    context('isView()', () => {
        it('returns true if the table exists in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback(['bar']))).thenResolve();
            td.when(sqlExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return instance.isView()
                .then(actual => expect(actual).to.be.true);
        });

        it('returns false if the table does not exist in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([]))).thenResolve();
            td.when(sqlExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return instance.isView()
                .then(actual => expect(actual).to.be.false);
        });
    });

    context('select()', () => {
        it('returns an instance of TableSelect', () => {
            const query = table().select();

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.where).to.be.a('function');
            expect(query.groupBy).to.be.a('function');
            expect(query.having).to.be.a('function');
            expect(query.orderBy).to.be.a('function');
            expect(query.limit).to.be.a('function');
            expect(query.offset).to.be.a('function');
            expect(query.lockExclusive).to.be.a('function');
            expect(query.lockShared).to.be.a('function');
            expect(query.bind).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableInsert
            expect(query.insert).to.not.exist;
            expect(query.values).to.not.exist;

            // is not a TableUpdate
            expect(query.set).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });

        it('sets the projection parameters provided as an array', () => {
            const session = { _statements: [] };
            const expressions = ['foo', 'bar'];
            const instance = table(session).select(expressions);

            expect(instance.getProjections()).to.deep.equal(expressions);
        });

        it('sets the projection parameters provided as multiple arguments', () => {
            const session = { _statements: [] };
            const expressions = ['foo', 'bar'];
            const instance = table(session).select(expressions[0], expressions[1]);

            expect(instance.getProjections()).to.deep.equal(expressions);
        });
    });

    context('insert()', () => {
        it('returns an instance of TableInsert', () => {
            const query = table().insert([]);

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.values).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableSelect or a TableDelete
            expect(query.where).to.not.exist;
            expect(query.orderBy).to.not.exist;
            expect(query.limit).to.not.exist;
            expect(query.bind).to.not.exist;
            expect(query.groupBy).to.not.exist;
            expect(query.having).to.not.exist;
            expect(query.offset).to.not.exist;
            expect(query.lockExclusive).to.not.exist;
            expect(query.lockShared).to.not.exist;

            // is not a TableUpdate
            expect(query.set).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });

        it('sets column names provided as an array', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert(expressions);

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('sets column names provided as multiple arguments', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert(expressions[0], expressions[1]);

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('sets column names provided as object keys', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert({ foo: 'baz', bar: 'qux' });

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('throws an error if the columns are invalid', () => {
            const instance = table();

            expect(() => instance.insert()).to.throw(Error);
        });
    });

    context('count()', () => {
        it('returns the number of records found', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const count = 3;

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([count]))).thenResolve();
            td.when(sqlExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return instance.count()
                .then(actual => expect(actual).to.equal(count));
        });

        it('fails if an expected error is thrown', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('bar');
            td.when(execute(), { ignoreExtraArgs: true }).thenReject(error);
            td.when(sqlExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return instance.count()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('inspect()', () => {
        it('hides internals', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table(null, schema, 'bar');
            const expected = { schema: 'foo', table: 'bar' };

            td.when(getName()).thenReturn('foo');

            expect(instance.inspect()).to.deep.equal(expected);
        });
    });

    context('delete()', () => {
        it('returns an instance of TableDelete', () => {
            const query = table().delete();

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.where).to.be.a('function');
            expect(query.orderBy).to.be.a('function');
            expect(query.limit).to.be.a('function');
            expect(query.bind).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableSelect or a TableDelete
            expect(query.groupBy).to.not.exist;
            expect(query.having).to.not.exist;
            expect(query.offset).to.not.exist;
            expect(query.lockExclusive).to.not.exist;
            expect(query.lockShared).to.not.exist;

            // is not a TableInsert
            expect(query.insert).to.not.exist;
            expect(query.values).to.not.exist;

            // is not a TableUpdate
            expect(query.set).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });
    });

    context('update()', () => {
        it('returns an instance of TableUpdate', () => {
            const query = table().update();

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.set).to.be.a('function');
            expect(query.where).to.be.a('function');
            expect(query.orderBy).to.be.a('function');
            expect(query.limit).to.be.a('function');
            expect(query.bind).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableSelect
            expect(query.groupBy).to.not.exist;
            expect(query.having).to.not.exist;
            expect(query.offset).to.not.exist;
            expect(query.lockExclusive).to.not.exist;
            expect(query.lockShared).to.not.exist;

            // is not a TableInsert
            expect(query.insert).to.not.exist;
            expect(query.values).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });
    });

    context('escapeIdentifier()', () => {
        it('escapes and wrap the identifier with a set of backticks', () => {
            expect(table.escapeIdentifier('foo')).to.equal('`foo`');
            expect(table.escapeIdentifier('fo`o')).to.equal('`fo``o`');
            expect(table.escapeIdentifier('fo``o-ba``r')).to.equal('`fo````o-ba````r`');
        });
    });
});

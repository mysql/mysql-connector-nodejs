'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('Table', () => {
    let execute, sqlExecute, table;

    beforeEach('create fakes', () => {
        execute = td.function();
        sqlExecute = td.function();

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
        it('returns true if the table exists in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback(['bar']))).thenResolve();
            td.when(sqlExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.true);
        });

        it('returns false if the table does not exist in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.TABLES WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([]))).thenResolve();
            td.when(sqlExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

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
        it('returns an instance of the proper class', () => {
            const session = { _statements: [] };
            const instance = table(session).select();

            expect(instance.getClassName()).to.equal('TableSelect');
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
        it('returns an instance of the proper class', () => {
            const instance = table().insert([]);

            expect(instance.getClassName()).to.equal('TableInsert');
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
        it('returns an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = (table(session, schema, name)).delete(query);

            expect(instance.getClassName()).to.equal('TableDelete');
        });
    });

    context('update()', () => {
        it('returns an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = (table(session, schema, name)).update(query);

            expect(instance.getClassName()).to.equal('TableUpdate');
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

'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('prepared statements for CollectionRemove', () => {
    let collection, schema, session;

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

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    beforeEach('add fixtures', () => {
        return collection
            .add({ _id: '1', name: 'foo' })
            .add({ _id: '2', name: 'bar' })
            .add({ _id: '3', name: 'baz' })
            .add({ _id: '4', name: 'qux' })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('does not create a prepared statement when the operation is executed once', () => {
        const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        return collection.remove('_id = :id')
            .bind('id', '1')
            .execute()
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('creates a prepared statement on subsequent calls if the query boundaries do not change', () => {
        const expected = [{ _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$._id') = ?)`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('deallocates a prepared statement on subsequent calls if the query boundaries change', () => {
        const expected = [{ _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.bind('id', '3').sort('name').execute())
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('resets the statement id when the session is closed', () => {
        const expected = [{ _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => session.close())
            .then(() => mysqlx.getSession(config))
            .then(s => { session = s; schema = s.getSchema(schema.getName()); collection = schema.getCollection('test'); })
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.not.exist)
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('does not re-prepare a statement if the limit changes', () => {
        const expected = [{ _id: '1', name: 'foo' }, { _id: '4', name: 'qux' }];
        const actual = [];

        const op = collection.remove('name LIKE :name').bind('name', '%ba%');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_UNQUOTE(JSON_EXTRACT(doc,'$.name')) LIKE ?) LIMIT ?`;

        return op.execute()
            .then(() => op.limit(1).execute())
            .then(() => fixtures.getPreparedStatement(session, 1))
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => op.limit(2).execute())
            .then(() => fixtures.getPreparedStatement(session, 1))
            // statement id in the server should be the same
            .then(statement => expect(statement).to.deep.equal([1, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('re-uses ids from previous prepared statements that have been deallocated', () => {
        const actual = [];

        const op = collection.remove('_id = :id').bind('id', '1');
        const sql = `DELETE FROM \`${schema.getName()}\`.\`test\` WHERE (JSON_EXTRACT(doc,'$._id') = ?) ORDER BY JSON_EXTRACT(doc,'$.name')`;

        return op.execute()
            .then(() => op.bind('id', '2').execute())
            .then(() => op.sort('name').execute())
            .then(() => op.bind('id', '3').execute())
            // at this point the operation still sorts the records before removing them
            .then(() => op.bind('id', '4').execute())
            // statement id on the client should be `1` since the first prepared statement has been deallocated
            .then(() => fixtures.getPreparedStatement(session, 1))
            // incremental statement id on the server should be `2` since it is the second statement that is prepared
            .then(statement => expect(statement).to.deep.equal([2, sql]))
            .then(() => collection.find().execute(doc => actual.push(doc)))
            .then(() => expect(actual).to.be.empty);
    });

    context('when the total server statement count is exceeded', () => {
        beforeEach('prevent additional prepared statements', () => {
            return session.sql('SET GLOBAL max_prepared_stmt_count=0')
                .execute();
        });

        afterEach('reset default prepared statement limit', () => {
            return session.sql('SET GLOBAL max_prepared_stmt_count=16382')
                .execute();
        });

        it('neither fails nor prepares any statement', () => {
            const expected = [{ _id: '3', name: 'baz' }, { _id: '4', name: 'qux' }];
            const actual = [];

            const op = collection.remove('_id = :id').bind('id', '1');

            return op.execute()
                .then(() => op.bind('id', '2').execute())
                .then(() => fixtures.getPreparedStatement(session, 1))
                .then(statement => expect(statement).to.not.exist)
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('when debug mode is enabled', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'reprepared-remove.js');
        const criteria = 'name = :name';
        const fstRunBindings = { name: 'foo' };
        const sndRunBindings = { name: 'bar' };

        it('logs the message to create a prepared statement', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Prepare.Prepare', script, [schema.getName(), collection.getName(), criteria, JSON.stringify(fstRunBindings), JSON.stringify(sndRunBindings)])
                .then(proc => {
                    expect(proc.logs).to.be.an('array').and.have.lengthOf(2); // the statement is re-prepared when a limit is introduced
                    expect(proc.logs[0]).to.contain.keys('stmt_id', 'stmt');
                    expect(proc.logs[0].stmt_id).to.equal(1);
                    expect(proc.logs[0].stmt).to.have.keys('type', 'delete');
                    expect(proc.logs[0].stmt.type).to.equal('DELETE');
                    expect(proc.logs[0].stmt.delete).to.have.keys('collection', 'data_model', 'criteria');
                    expect(proc.logs[0].stmt.delete.criteria).to.have.keys('type', 'operator');
                    expect(proc.logs[0].stmt.delete.criteria.operator).to.have.keys('name', 'param');
                    expect(proc.logs[0].stmt.delete.criteria.operator.param).to.be.an('array').and.have.lengthOf(2); // operands
                    expect(proc.logs[0].stmt.delete.criteria.operator.param[0]).to.have.keys('type', 'identifier');
                    expect(proc.logs[0].stmt.delete.criteria.operator.param[0].type).to.equal('IDENT');
                    expect(proc.logs[0].stmt.delete.criteria.operator.param[1]).to.have.keys('type', 'position');
                    expect(proc.logs[0].stmt.delete.criteria.operator.param[1].type).to.equal('PLACEHOLDER');
                    expect(proc.logs[0].stmt.delete.criteria.operator.param[1].position).to.equal(0);
                });
        });

        it('logs the message to execute a prepared statement', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Prepare.Execute', script, [schema.getName(), collection.getName(), criteria, JSON.stringify(fstRunBindings), JSON.stringify(sndRunBindings)])
                .then(proc => {
                    expect(proc.logs).to.be.an('array').and.have.lengthOf(2); // the statement is re-prepared and executed when a limit is introduced
                    expect(proc.logs[0]).to.contain.keys('stmt_id', 'args');
                    expect(proc.logs[0].args).to.be.an('array').and.have.lengthOf(1);
                    expect(proc.logs[0].args[0]).to.have.keys('type', 'scalar');
                    expect(proc.logs[0].args[0].type).to.equal('SCALAR');
                    expect(proc.logs[0].args[0].scalar).to.have.keys('type', 'v_string');
                    expect(proc.logs[0].args[0].scalar.type).to.equal('V_STRING');
                    expect(proc.logs[0].args[0].scalar.v_string).to.have.keys('value');
                    expect(proc.logs[0].args[0].scalar.v_string.value).to.equal('bar');
                });
        });

        it('logs the message to deallocate the prepared statement', () => {
            return fixtures.collectLogs('protocol:outbound:Mysqlx.Prepare.Deallocate', script, [schema.getName(), collection.getName(), criteria, JSON.stringify(fstRunBindings), JSON.stringify(sndRunBindings)])
                .then(proc => {
                    expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                    expect(proc.logs[0]).to.have.keys('stmt_id');
                    expect(proc.logs[0].stmt_id).to.equal(1);
                });
        });
    });
});

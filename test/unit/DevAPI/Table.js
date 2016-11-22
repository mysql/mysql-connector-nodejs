'use strict';

/* eslint-env node, mocha */
/* global chai, Encoding, mysqlxtest, Messages */

// npm `test` script was updated to use NODE_PATH=.
const Table = require('lib/DevAPI/Table');
const TableSelect = require('lib/DevAPI/TableSelect');
const TableInsert = require('lib/DevAPI/TableInsert');
const expect = require('chai').expect;

chai.should();

describe('DevAPI', () => {
    context('Table', () => {
        let session, table;

        beforeEach('get Session', () => {
            return mysqlxtest.getNullSession().then(function (s) {
                session = s;
                table = session.getSchema('schema').getTable('table');
            });
        });

        it('Should know its name', () => {
            table.getName().should.equal('table');
        });

        it('Should provide access to the schema', () => {
            table.getSchema().getName().should.equal('schema');
        });

        it('Should provide access to the session', () => {
            table.getSession().should.deep.equal(session);
        });

        function createResponse (protocol, row) {
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
                name: '_doc',
                table: 'table',
                schema: 'schema'
            }, Encoding.serverMessages));

            if (row) {
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, {field: ['\x01']}, Encoding.serverMessages));
            }

            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, Encoding.serverMessages));
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
        }

        it('should return true if it exists in database', () => {
            const promise = table.existsInDatabase();
            createResponse(session._client, true);
            return promise.should.eventually.equal(true);
        });

        it('should return false if it doesn\'t exist in database', () => {
            const promise = table.existsInDatabase();
            createResponse(session._client, false);
            return promise.should.eventually.equal(false);
        });

        it('should return true if table is a view', () => {
            const promise = table.isView();
            createResponse(session._client, true);
            return promise.should.eventually.equal(true);
        });

        it('should return false if table is not a view', () => {
            const promise = table.isView();
            createResponse(session._client, false);
            return promise.should.eventually.equal(false);
        });

        it('should return true for good drop', () => {
            const promise = table.drop();
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            return promise.should.eventually.equal(true);
        });

        it('should fail for bad drop', () => {
            const promise = table.drop();
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, { code: 1, sql_state: 'HY000', msg: 'Invalid' }, Encoding.serverMessages));
            return promise.should.be.rejected;
        });

        it('should hide internals from inspect output', () => {
            table.inspect().should.deep.equal({ schema: 'schema', table: 'table' });
        });

        context('select()', () => {
            it('should return an instance of the proper class', () => {
                const instance = (new Table()).select();

                expect(instance).to.be.an.instanceof(TableSelect);
            });

            it('should set the projection parameters provided as an array', () => {
                const expressions = ['foo', 'bar'];
                const instance = (new Table()).select(expressions);

                expect(instance._projection).to.deep.equal(expressions);
            });

            it('should set the projection parameters provided as multiple arguments', () => {
                const expressions = ['foo', 'bar'];
                const instance = (new Table()).select(expressions[0], expressions[1]);

                expect(instance._projection).to.deep.equal(expressions);
            });
        });

        context('insert()', () => {
            it('should return an instance of the proper class', () => {
                const instance = (new Table()).insert([]);

                expect(instance).to.be.an.instanceof(TableInsert);
            });

            it('should set field names provided as an array', () => {
                const expressions = ['foo', 'bar'];
                const instance = (new Table()).insert(expressions);

                expect(instance._fields).to.deep.equal(expressions);
            });

            it('should set field names provided as multiple arguments', () => {
                const expressions = ['foo', 'bar'];
                const instance = (new Table()).insert(expressions[0], expressions[1]);

                expect(instance._fields).to.deep.equal(expressions);
            });

            it('should set field names provided as object keys', () => {
                const expressions = ['foo', 'bar'];
                const instance = (new Table()).insert({ foo: 'baz', bar: 'qux' });

                expect(instance._fields).to.deep.equal(expressions);
            });
        });
    });
});
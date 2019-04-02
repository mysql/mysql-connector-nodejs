'use strict';

/* eslint-env node, mocha */

const StmtExecuteStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_sql_pb').StmtExecute;
const expect = require('chai').expect;
const td = require('testdouble');

describe('Protobuf', () => {
    context('Sql', () => {
        let Sql;

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('createStmtExecute()', () => {
            let FakeStmtExecuteStub, createOperationArgs, getNamespace, getSQL;

            beforeEach('create fakes', () => {
                FakeStmtExecuteStub = td.constructor(StmtExecuteStub);

                getNamespace = td.function();
                getSQL = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_sql_pb', { StmtExecute: FakeStmtExecuteStub });
                Sql = require('../../../../lib/Protocol/Protobuf/Adapters/Sql');
                createOperationArgs = td.replace(Sql, 'createOperationArgs');
            });

            it('appends placeholder values as Mysqlx.Sql.StmtExecute.args by default', () => {
                const statement = { getNamespace, getSQL };

                td.when(getNamespace()).thenReturn('foo');
                td.when(getSQL()).thenReturn('bar');
                td.when(createOperationArgs(statement)).thenReturn('baz');

                const proto = Sql.createStmtExecute(statement);

                expect(proto).to.be.an.instanceOf(FakeStmtExecuteStub);
                expect(td.explain(FakeStmtExecuteStub.prototype.setNamespace).callCount).to.equal(1);
                expect(td.explain(FakeStmtExecuteStub.prototype.setNamespace).calls[0].args[0]).to.equal('foo');
                expect(td.explain(FakeStmtExecuteStub.prototype.setStmt).callCount).to.equal(1);
                // eslint-disable-next-line node/no-deprecated-api
                expect(td.explain(FakeStmtExecuteStub.prototype.setStmt).calls[0].args[0]).to.deep.equal(new Uint8Array(new Buffer('bar')));
                expect(td.explain(FakeStmtExecuteStub.prototype.setArgsList).callCount).to.equal(1);
                expect(td.explain(FakeStmtExecuteStub.prototype.setArgsList).calls[0].args[0]).to.equal('baz');
            });

            it('allows to not append placeholder values as Mysqlx.Sql.StmtExecute.args', () => {
                const statement = { getNamespace, getSQL };

                td.when(getNamespace()).thenReturn('foo');
                td.when(getSQL()).thenReturn('bar');
                td.when(createOperationArgs(statement)).thenReturn('baz');

                const proto = Sql.createStmtExecute(statement, { appendArgs: false });

                expect(proto).to.be.an.instanceOf(FakeStmtExecuteStub);
                expect(td.explain(FakeStmtExecuteStub.prototype.setNamespace).callCount).to.equal(1);
                expect(td.explain(FakeStmtExecuteStub.prototype.setNamespace).calls[0].args[0]).to.equal('foo');
                expect(td.explain(FakeStmtExecuteStub.prototype.setStmt).callCount).to.equal(1);
                // eslint-disable-next-line node/no-deprecated-api
                expect(td.explain(FakeStmtExecuteStub.prototype.setStmt).calls[0].args[0]).to.deep.equal(new Uint8Array(new Buffer('bar')));
                expect(td.explain(FakeStmtExecuteStub.prototype.setArgsList).callCount).to.equal(0);
            });
        });

        context('decodeStmtExecuteOk()', () => {
            it('returns an object version of a Mysqlx.Sql.StmtExecuteOk message', () => {
                const data = 'foo';
                const deserializeBinary = td.function();
                const toObject = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_sql_pb', { StmtExecuteOk: { deserializeBinary } });
                td.when(toObject()).thenReturn('bar');
                td.when(deserializeBinary(new Uint8Array(data))).thenReturn({ toObject });

                Sql = require('../../../../lib/Protocol/Protobuf/Adapters/Sql');

                return expect(Sql.decodeStmtExecuteOk(data)).to.equal('bar');
            });
        });

        context('createOperationArgs()', () => {
            it('encodes Mysqlx.Sql.StmtExecute args as a list of Mysqlx.Datatypes.Any values', () => {
                const createAny = td.function();
                const getArgs = td.function();
                const statement = { getArgs };

                td.replace('../../../../lib/Protocol/Protobuf/Adapters/Datatypes', { createAny });
                td.when(getArgs()).thenReturn(['foo', 'bar']);
                td.when(createAny('foo'), { times: 1 }).thenReturn('baz');
                td.when(createAny('bar'), { times: 1 }).thenReturn('qux');

                Sql = require('../../../../lib/Protocol/Protobuf/Adapters/Sql');
                const args = Sql.createOperationArgs(statement);

                expect(args).to.have.lengthOf(2);
                return expect(args).to.deep.equal(['baz', 'qux']);
            });
        });

        context('encodeStmtExecute()', () => {
            it('returns a Buffer-encoded version of a Mysqlx.Sql.StmtExecute object', () => {
                const statement = 'foo';
                const serializeBinary = td.function();
                const toObject = td.function();

                Sql = require('../../../../lib/Protocol/Protobuf/Adapters/Sql');
                const createStmtExecute = td.replace(Sql, 'createStmtExecute');

                td.when(createStmtExecute(statement)).thenReturn({ serializeBinary, toObject });
                td.when(serializeBinary()).thenReturn('bar');

                const stmtExecute = Sql.encodeStmtExecute(statement);

                // eslint-disable-next-line node/no-deprecated-api
                return expect(stmtExecute).to.deep.equal(new Buffer('bar'));
            });
        });
    });
});

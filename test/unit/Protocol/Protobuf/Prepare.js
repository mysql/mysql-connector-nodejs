'use strict';

/* eslint-env node, mocha */

const PrepareStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_prepare_pb').Prepare;
const DeallocateStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_prepare_pb').Deallocate;
const ExecuteStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_prepare_pb').Execute;
const expect = require('chai').expect;
const td = require('testdouble');

describe('Protobuf', () => {
    context('Prepare', () => {
        let Prepare;

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('createOneOfMessage()', () => {
            let FakeOneOfMessageStub, getType;

            beforeEach('create fakes', () => {
                FakeOneOfMessageStub = td.constructor(PrepareStub.OneOfMessage);
                getType = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_prepare_pb', { Prepare: { OneOfMessage: FakeOneOfMessageStub } });
            });

            it('creates a Mysqlx.Prepare.OneOfMessage object containing a Mysqlx.Crud.Find query', () => {
                const type = PrepareStub.OneOfMessage.Type.FIND;
                const statement = { getType };
                const createFind = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Adapters/Crud', { createFind });
                td.when(getType()).thenReturn(type);
                td.when(createFind(statement, 'foo')).thenReturn('bar');

                Prepare = require('../../../../lib/Protocol/Protobuf/Adapters/Prepare');
                Prepare.createOneOfMessage(statement, 'foo');

                expect(td.explain(FakeOneOfMessageStub.prototype.setType).callCount).to.equal(1);
                expect(td.explain(FakeOneOfMessageStub.prototype.setType).calls[0].args[0]).to.equal(type);
                expect(td.explain(FakeOneOfMessageStub.prototype.setFind).callCount).to.equal(1);
                return expect(td.explain(FakeOneOfMessageStub.prototype.setFind).calls[0].args[0]).to.equal('bar');
            });

            it('creates a Mysqlx.Prepare.OneOfMessage object containing a Mysqlx.Crud.Update query', () => {
                const type = PrepareStub.OneOfMessage.Type.UPDATE;
                const statement = { getType };
                const createUpdate = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Adapters/Crud', { createUpdate });
                td.when(getType()).thenReturn(type);
                td.when(createUpdate(statement, 'foo')).thenReturn('bar');

                Prepare = require('../../../../lib/Protocol/Protobuf/Adapters/Prepare');
                Prepare.createOneOfMessage(statement, 'foo');

                expect(td.explain(FakeOneOfMessageStub.prototype.setType).callCount).to.equal(1);
                expect(td.explain(FakeOneOfMessageStub.prototype.setType).calls[0].args[0]).to.equal(type);
                expect(td.explain(FakeOneOfMessageStub.prototype.setUpdate).callCount).to.equal(1);
                return expect(td.explain(FakeOneOfMessageStub.prototype.setUpdate).calls[0].args[0]).to.equal('bar');
            });

            it('creates a Mysqlx.Prepare.OneOfMessage object containing a Mysqlx.Crud.Delete query', () => {
                const type = PrepareStub.OneOfMessage.Type.DELETE;
                const statement = { getType };
                const createDelete = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Adapters/Crud', { createDelete });
                td.when(getType()).thenReturn(type);
                td.when(createDelete(statement, 'foo')).thenReturn('bar');

                Prepare = require('../../../../lib/Protocol/Protobuf/Adapters/Prepare');
                Prepare.createOneOfMessage(statement, 'foo');

                expect(td.explain(FakeOneOfMessageStub.prototype.setType).callCount).to.equal(1);
                expect(td.explain(FakeOneOfMessageStub.prototype.setType).calls[0].args[0]).to.equal(type);
                expect(td.explain(FakeOneOfMessageStub.prototype.setDelete).callCount).to.equal(1);
                return expect(td.explain(FakeOneOfMessageStub.prototype.setDelete).calls[0].args[0]).to.equal('bar');
            });
        });

        context('encodeDeallocate()', () => {
            let FakeDeallocateStub, getStatementId;

            beforeEach('create fakes', () => {
                FakeDeallocateStub = td.constructor(DeallocateStub);
                getStatementId = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_prepare_pb', { Deallocate: FakeDeallocateStub });

                Prepare = require('../../../../lib/Protocol/Protobuf/Adapters/Prepare');
            });

            it('encodes a Mysqlx.Prepare.Deallocate message', () => {
                const statement = { getStatementId };

                td.when(getStatementId()).thenReturn('foo');
                td.when(FakeDeallocateStub.prototype.serializeBinary()).thenReturn('bar');

                const message = Prepare.encodeDeallocate(statement);

                // eslint-disable-next-line node/no-deprecated-api
                expect(message).to.deep.equal(new Buffer('bar'));
                expect(td.explain(FakeDeallocateStub.prototype.setStmtId).callCount).to.equal(1);
                return expect(td.explain(FakeDeallocateStub.prototype.setStmtId).calls[0].args[0]).to.equal('foo');
            });
        });

        context('encodeExecute()', () => {
            let FakeExecuteStub, createPreparedStatementArgs, getStatementId, getType;

            beforeEach('create fakes', () => {
                FakeExecuteStub = td.constructor(ExecuteStub);

                createPreparedStatementArgs = td.function();
                getStatementId = td.function();
                getType = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_prepare_pb', { Execute: FakeExecuteStub, Prepare: PrepareStub });
            });

            it('encodes a Mysqlx.Prepare.Execute message with a CRUD query', () => {
                const type = PrepareStub.OneOfMessage.Type.FIND;
                const statement = { getStatementId, getType };

                td.replace('../../../../lib/Protocol/Protobuf/Adapters/Crud', { createPreparedStatementArgs });
                Prepare = require('../../../../lib/Protocol/Protobuf/Adapters/Prepare');

                td.when(getType()).thenReturn(type);
                td.when(getStatementId()).thenReturn('foo');
                td.when(createPreparedStatementArgs(statement)).thenReturn('bar');
                td.when(FakeExecuteStub.prototype.serializeBinary()).thenReturn('baz');

                const message = Prepare.encodeExecute(statement);

                // eslint-disable-next-line node/no-deprecated-api
                expect(message).to.deep.equal(new Buffer('baz'));
                expect(td.explain(FakeExecuteStub.prototype.setStmtId).callCount).to.equal(1);
                expect(td.explain(FakeExecuteStub.prototype.setStmtId).calls[0].args[0]).to.equal('foo');
                expect(td.explain(FakeExecuteStub.prototype.setArgsList).callCount).to.equal(1);
                return expect(td.explain(FakeExecuteStub.prototype.setArgsList).calls[0].args[0]).to.equal('bar');
            });
        });

        context('encodePrepare()', () => {
            let FakePrepareStub, createOneOfMessage, getStatementId;

            beforeEach('create fakes', () => {
                FakePrepareStub = td.constructor(PrepareStub);
                getStatementId = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_prepare_pb', { Prepare: FakePrepareStub });

                Prepare = require('../../../../lib/Protocol/Protobuf/Adapters/Prepare');
                createOneOfMessage = td.replace(Prepare, 'createOneOfMessage');
            });

            it('encodes a Mysqlx.Prepare.Prepare message with a CRUD query', () => {
                const getCount = td.function();
                const statement = { getCount, getStatementId };

                td.when(getCount()).thenReturn(3);
                td.when(getStatementId()).thenReturn('foo');
                td.when(createOneOfMessage(statement, td.matchers.contains({ useLimitExpr: true }))).thenReturn('bar');
                td.when(FakePrepareStub.prototype.serializeBinary()).thenReturn('baz');

                const message = Prepare.encodePrepare(statement);

                // eslint-disable-next-line node/no-deprecated-api
                expect(message).to.deep.equal(new Buffer('baz'));
                expect(td.explain(FakePrepareStub.prototype.setStmtId).callCount).to.equal(1);
                expect(td.explain(FakePrepareStub.prototype.setStmtId).calls[0].args[0]).to.equal('foo');
                expect(td.explain(FakePrepareStub.prototype.setStmt).callCount).to.equal(1);
                return expect(td.explain(FakePrepareStub.prototype.setStmt).calls[0].args[0]).to.equal('bar');
            });
        });
    });
});

'use strict';

/* eslint-env node, mocha */

const ColumnIdentifier = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').ColumnIdentifier;
const Crud = require('../../../../lib/Protocol/Protobuf/Adapters/Crud');
const DataModel = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_crud_pb').DataModel;
const DocumentPathItem = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').DocumentPathItem;
const Expr = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').Expr;
const Parser = require('../../../../lib/ExprParser');
const Scalar = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Scalar;
const UpdateOperation = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_crud_pb').UpdateOperation;
const expect = require('chai').expect;
const td = require('testdouble');

describe('Protobuf', () => {
    context('Crud', () => {
        afterEach('reset fakes', () => {
            td.reset();
        });

        context('create()', () => {
            let createExpr, getCategory, getOrderings, hasBaseCriteria;

            beforeEach('create fakes', () => {
                createExpr = td.function();
                getCategory = td.function();
                getOrderings = td.function();
                hasBaseCriteria = td.function();

                td.replace('../../../../lib/Protocol/Protobuf/Adapters/Expr', { createExpr });
            });

            context('by default', () => {
                let FakeCrud, FakeStub, createOperationArgs, createLimit;

                beforeEach('create fakes', () => {
                    FakeStub = td.constructor(['setArgsList', 'setCollection', 'setCriteria', 'setDataModel', 'setLimit', 'setOrderList']);

                    td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_crud_pb', { FakeStub });
                    FakeCrud = require('../../../../lib/Protocol/Protobuf/Adapters/Crud');

                    td.replace(FakeCrud, 'createCollection');
                    createLimit = td.replace(FakeCrud, 'createLimit');
                    createOperationArgs = td.replace(FakeCrud, 'createOperationArgs');
                });

                it('appends placeholder assignment values of an existing criteria expression', () => {
                    const getCriteriaExpr = td.function();
                    const setCriteriaExpr = td.function();

                    const statement = { getCategory, getCriteriaExpr, getOrderings, hasBaseCriteria, setCriteriaExpr };

                    td.when(getCriteriaExpr()).thenReturn('foo');
                    td.when(createOperationArgs(statement), { ignoreExtraArgs: true }).thenReturn('bar');
                    td.when(getOrderings()).thenReturn([]);

                    FakeCrud.create(statement, { appendArgs: true, builder: 'FakeStub' });

                    expect(td.explain(setCriteriaExpr).callCount).to.equal(1);
                    expect(td.explain(setCriteriaExpr).calls[0].args[0]).to.equal('foo');
                    expect(td.explain(FakeStub.prototype.setCriteria).callCount).to.equal(1);
                    expect(td.explain(FakeStub.prototype.setCriteria).calls[0].args[0]).to.equal('foo');
                    expect(td.explain(FakeStub.prototype.setArgsList).callCount).to.equal(1);
                    return expect(td.explain(FakeStub.prototype.setArgsList).calls[0].args[0]).to.equal('bar');
                });

                it('appends placeholder assignment values of a new criteria expression', () => {
                    const getCriteria = td.function();
                    const getCriteriaExpr = td.function();
                    const setCriteriaExpr = td.function();

                    const statement = { getCategory, getCriteria, getCriteriaExpr, getOrderings, hasBaseCriteria, setCriteriaExpr };

                    td.when(getCriteriaExpr()).thenReturn();
                    td.when(getCriteria()).thenReturn('foo');
                    td.when(createExpr('foo'), { ignoreExtraArgs: true }).thenReturn('bar');
                    td.when(createOperationArgs(statement), { ignoreExtraArgs: true }).thenReturn('baz');
                    td.when(getOrderings()).thenReturn([]);

                    FakeCrud.create(statement, { appendArgs: true, builder: 'FakeStub' });

                    expect(td.explain(setCriteriaExpr).callCount).to.equal(1);
                    expect(td.explain(setCriteriaExpr).calls[0].args[0]).to.equal('bar');
                    expect(td.explain(FakeStub.prototype.setCriteria).callCount).to.equal(1);
                    expect(td.explain(FakeStub.prototype.setCriteria).calls[0].args[0]).to.equal('bar');
                    expect(td.explain(FakeStub.prototype.setArgsList).callCount).to.equal(1);
                    return expect(td.explain(FakeStub.prototype.setArgsList).calls[0].args[0]).to.equal('baz');
                });

                it('uses the legacy limit object definition', () => {
                    const statement = { getCategory, getOrderings, hasBaseCriteria };

                    td.when(hasBaseCriteria()).thenReturn(true);
                    td.when(createLimit(statement)).thenReturn('foo');
                    td.when(getOrderings()).thenReturn([]);

                    FakeCrud.create(statement, { builder: 'FakeStub' });

                    expect(td.explain(FakeStub.prototype.setLimit).callCount).to.equal(1);
                    return expect(td.explain(FakeStub.prototype.setLimit).calls[0].args[0]).to.equal('foo');
                });
            });

            context('when preparing a statement', () => {
                let FakeCrud, FakeStub, createLimitExpr, getBindings;

                beforeEach('create fakes', () => {
                    FakeStub = td.constructor(['setArgsList', 'setCollection', 'setCriteria', 'setDataModel', 'setLimitExpr', 'setOrderList']);

                    getBindings = td.function();

                    td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_crud_pb', { FakeStub });
                    FakeCrud = require('../../../../lib/Protocol/Protobuf/Adapters/Crud');

                    td.replace(FakeCrud, 'createCollection');
                    createLimitExpr = td.replace(FakeCrud, 'createLimitExpr');
                });

                it('does not append placeholder assignment values when preparing a statement', () => {
                    const getCriteriaExpr = td.function();
                    const setCriteriaExpr = td.function();

                    const statement = { getCategory, getBindings, getCriteriaExpr, getOrderings, hasBaseCriteria, setCriteriaExpr };

                    td.when(getBindings()).thenReturn({});
                    td.when(getCriteriaExpr()).thenReturn('foo');
                    td.when(getOrderings()).thenReturn([]);

                    FakeCrud.create(statement, { appendArgs: false, builder: 'FakeStub', useLimitExpr: true });

                    expect(td.explain(setCriteriaExpr).callCount).to.equal(1);
                    expect(td.explain(setCriteriaExpr).calls[0].args[0]).to.equal('foo');
                    expect(td.explain(FakeStub.prototype.setCriteria).callCount).to.equal(1);
                    expect(td.explain(FakeStub.prototype.setCriteria).calls[0].args[0]).to.equal('foo');
                    return expect(td.explain(FakeStub.prototype.setArgsList).callCount).to.equal(0);
                });

                it('uses the new limit expressions', () => {
                    const statement = { getBindings, getCategory, getOrderings, hasBaseCriteria };

                    td.when(hasBaseCriteria()).thenReturn(true);
                    td.when(getBindings()).thenReturn({});
                    td.when(createLimitExpr(statement), { ignoreExtraArgs: true }).thenReturn('foo');
                    td.when(getOrderings()).thenReturn([]);

                    FakeCrud.create(statement, { builder: 'FakeStub', useLimitExpr: true });

                    expect(td.explain(FakeStub.prototype.setLimitExpr).callCount).to.equal(1);
                    return expect(td.explain(FakeStub.prototype.setLimitExpr).calls[0].args[0]).to.equal('foo');
                });
            });
        });

        context('createDelete()', () => {
            it('creates a valid Mysqlx.Crud.Delete instance using the message builder', () => {
                const mode = 'foo';
                const options = { appendArgs: true, builder: 'Delete', mode, useLimitExpr: false };
                const getCategory = td.function();
                const statement = { getCategory };

                const FakeCrud = require('../../../../lib/Protocol/Protobuf/Adapters/Crud');
                const create = td.replace(FakeCrud, 'create');

                td.when(getCategory()).thenReturn(mode);
                td.when(create(statement, td.matchers.contains(options))).thenReturn('bar');

                return expect(FakeCrud.createDelete(statement)).to.equal('bar');
            });
        });

        context('createProjection()', () => {
            it('encodes a Mysqlx.Expr.Expr', () => {
                const docPathItem = new DocumentPathItem();
                docPathItem.setType(DocumentPathItem.Type.MEMBER);
                docPathItem.setValue('foo');

                const id = new ColumnIdentifier();
                id.addDocumentPath(docPathItem);

                const expr = new Expr();
                expr.setType(Expr.Type.IDENT);
                expr.setIdentifier(id);

                const encoded = Crud.createProjection(expr);
                return expect(encoded.getSource()).to.deep.equal(expr);
            });
        });

        context('createTypedRow()', () => {
            it('encodes a typed row given a single object', () => {
                const encoded = Crud.createTypedRow({ name: 'foo' });
                const row = encoded.getFieldList()[0];

                expect(row.getType()).to.equal(Expr.Type.OBJECT);

                const fields = row.getObject().getFldList();
                expect(fields).to.have.lengthOf(1);
                expect(fields[0].getKey()).to.equal('name');
                expect(fields[0].getValue().getType()).to.equal(Expr.Type.LITERAL);
                expect(fields[0].getValue().getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                // eslint-disable-next-line node/no-deprecated-api
                return expect(new Buffer(fields[0].getValue().getLiteral().getVString().getValue()).toString()).to.equal('foo');
            });

            it('encodes an array of expressions', () => {
                const expr1 = Parser.parse('foo', { mode: Parser.Mode.TABLE }).output;
                const expr2 = Parser.parse('bar', { mode: Parser.Mode.TABLE }).output;
                const encoded = Crud.createTypedRow([expr1, expr2]);
                const fields = encoded.getFieldList();

                expect(fields[0].toObject()).to.deep.equal(expr1.toObject());
                return expect(fields[1].toObject()).to.deep.equal(expr2.toObject());
            });

            it('encodes an array of any kind of language type', () => {
                const encoded = Crud.createTypedRow(['foo', 23, 1.1, true]);
                const fields = encoded.getFieldList();

                expect(fields).to.have.lengthOf(4);
                fields.forEach(field => expect(field.getType()).to.equal(Expr.Type.LITERAL));
                expect(fields[0].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                // eslint-disable-next-line node/no-deprecated-api
                expect(new Buffer(fields[0].getLiteral().getVString().getValue()).toString()).to.equal('foo');
                expect(fields[1].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(fields[1].getLiteral().getVUnsignedInt()).to.equal(23);
                expect(fields[2].getLiteral().getType()).to.equal(Scalar.Type.V_FLOAT);
                expect(fields[2].getLiteral().getVFloat()).to.equal(1.1);
                expect(fields[3].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                return expect(fields[3].getLiteral().getVBool()).to.equal(true);
            });

            it('encodes a typed row given an array of falsy values', () => {
                let encoded = Crud.createTypedRow([0, false, null, undefined]);
                const fields = encoded.getFieldList();

                expect(fields).to.have.lengthOf(4);
                fields.forEach(field => expect(field.getType()).to.equal(Expr.Type.LITERAL));
                expect(fields[0].getLiteral().getType()).to.equal(Scalar.Type.V_SINT);
                expect(fields[0].getLiteral().getVSignedInt()).to.equal(0);
                expect(fields[1].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(fields[1].getLiteral().getVBool()).to.equal(false);
                expect(fields[2].getLiteral().getType()).to.equal(Scalar.Type.V_NULL);
                return expect(fields[3].getLiteral().getType()).to.equal(Scalar.Type.V_NULL);
            });
        });

        context('createUpdate()', () => {
            it('sets the list of update operations', () => {
                const mode = 'foo';
                const getCategory = td.function();
                const getOperations = td.function();
                const operations = ['foo', 'bar'];
                const options = { appendArgs: true, builder: 'Update', mode, useLimitExpr: false };
                const setOperationList = td.function();
                const statement = { getCategory, getOperations };

                const FakeCrud = require('../../../../lib/Protocol/Protobuf/Adapters/Crud');
                const create = td.replace(FakeCrud, 'create');
                const createUpdateOperation = td.replace(FakeCrud, 'createUpdateOperation');

                td.when(getCategory()).thenReturn(mode);
                td.when(getOperations()).thenReturn(operations);
                td.when(createUpdateOperation(operations[0], options)).thenReturn('baz');
                td.when(createUpdateOperation(operations[1], options)).thenReturn('qux');
                td.when(create(statement, td.matchers.contains(options))).thenReturn({ setOperationList });

                FakeCrud.createUpdate(statement);

                expect(td.explain(setOperationList).callCount).to.equal(1);
                return expect(td.explain(setOperationList).calls[0].args[0]).to.deep.equal(['baz', 'qux']);
            });
        });

        context('createUpdateOperation()', () => {
            it('encodes a table operation with a `null` value', () => {
                const encoded = Crud.createUpdateOperation({ source: 'foo', type: UpdateOperation.UpdateType.SET, value: null }, { mode: DataModel.TABLE });

                expect(encoded.getOperation()).to.equal(UpdateOperation.UpdateType.SET);
                expect(encoded.getSource().getName()).to.equal('foo');
                expect(encoded.getValue().getType()).to.equal(Expr.Type.LITERAL);
                return expect(encoded.getValue().getLiteral().getType()).to.equal(Scalar.Type.V_NULL);
            });

            it('encodes a table operation with a `undefined` value', () => {
                const encoded = Crud.createUpdateOperation({ source: 'foo', type: UpdateOperation.UpdateType.SET }, { mode: DataModel.TABLE });

                expect(encoded.getOperation()).to.equal(UpdateOperation.UpdateType.SET);
                expect(encoded.getSource().getName()).to.equal('foo');
                expect(encoded.getValue().getType()).to.equal(Expr.Type.LITERAL);
                return expect(encoded.getValue().getLiteral().getType()).to.equal(Scalar.Type.V_NULL);
            });

            it('@regression ignores falsy values for ITEM_REMOVE operations', () => {
                const encoded = Crud.createUpdateOperation({ source: 'foo', type: UpdateOperation.UpdateType.ITEM_REMOVE }, { mode: DataModel.TABLE });

                expect(encoded.getOperation()).to.equal(UpdateOperation.UpdateType.ITEM_REMOVE);
                expect(encoded.getSource().getName()).to.equal('foo');
                return expect(encoded.getValue()).to.not.exist;
            });
        });
    });
});

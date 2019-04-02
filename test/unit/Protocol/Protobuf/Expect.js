'use strict';

/* eslint-env node, mocha */

const ConditionStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expect_pb').Open.Condition;
const OpenStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expect_pb').Open;
const CloseStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expect_pb').Close;
const expect = require('chai').expect;
const td = require('testdouble');

describe('Protobuf', () => {
    context('Expect', () => {
        let Expect;

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('createCondition()', () => {
            let FakeConditionStub;

            beforeEach('create fakes', () => {
                FakeConditionStub = td.constructor(ConditionStub);

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expect_pb', { Open: { Condition: FakeConditionStub } });
                Expect = require('../../../../lib/Protocol/Protobuf/Adapters/Expect');
            });

            it('creates a valid Mysqlx.Expect.Open.Condition object type given an expecation object', () => {
                const expectation = { key: 'foo', value: 'bar', operation: 'baz' };

                const condition = Expect.createCondition(expectation);

                expect(condition).to.be.an.instanceOf(FakeConditionStub);
                expect(td.explain(FakeConditionStub.prototype.setConditionKey).callCount).to.equal(1);
                expect(td.explain(FakeConditionStub.prototype.setConditionKey).calls[0].args[0]).to.equal('foo');
                expect(td.explain(FakeConditionStub.prototype.setConditionValue).callCount).to.equal(1);
                // eslint-disable-next-line node/no-deprecated-api
                expect(td.explain(FakeConditionStub.prototype.setConditionValue).calls[0].args[0]).to.deep.equal(new Uint8Array(new Buffer('bar')));
                expect(td.explain(FakeConditionStub.prototype.setOp).callCount).to.equal(1);
                expect(td.explain(FakeConditionStub.prototype.setOp).calls[0].args[0]).to.equal('baz');
            });
        });

        context('encodeClose()', () => {
            let FakeCloseStub, FakeConditionStub;

            beforeEach('create fakes', () => {
                FakeCloseStub = td.constructor(CloseStub);
                FakeConditionStub = td.constructor(ConditionStub);

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expect_pb', { Close: FakeCloseStub, Open: { Condition: FakeConditionStub } });
                Expect = require('../../../../lib/Protocol/Protobuf/Adapters/Expect');
            });

            it('returns a Buffer-encoded version of Mysqlx.Expect.Close object', () => {
                td.when(FakeCloseStub.prototype.serializeBinary()).thenReturn('foo');

                // eslint-disable-next-line node/no-deprecated-api
                return expect(Expect.encodeClose()).to.deep.equal(new Buffer('foo'));
            });
        });

        context('encodeOpen()', () => {
            let FakeOpenStub, createCondition;

            beforeEach('create fakes', () => {
                FakeOpenStub = td.constructor(OpenStub);

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_expect_pb', { Open: FakeOpenStub });
                Expect = require('../../../../lib/Protocol/Protobuf/Adapters/Expect');
                createCondition = td.replace(Expect, 'createCondition');
            });

            it('returns a Buffer-encoded version of a Mysqlx.Expect.Open object containing the entire list of expectations', () => {
                const expectations = ['foo', 'bar'];

                td.when(createCondition('foo')).thenReturn('baz');
                td.when(createCondition('bar')).thenReturn('qux');
                td.when(FakeOpenStub.prototype.serializeBinary()).thenReturn('quux');

                const open = Expect.encodeOpen(expectations);

                // eslint-disable-next-line node/no-deprecated-api
                expect(open).to.deep.equal(new Buffer('quux'));
                expect(td.explain(FakeOpenStub.prototype.setCondList).callCount).to.equal(1);
                return expect(td.explain(FakeOpenStub.prototype.setCondList).calls[0].args[0]).to.deep.equal(['baz', 'qux']);
            });
        });
    });
});

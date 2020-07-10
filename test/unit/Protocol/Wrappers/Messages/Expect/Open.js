'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let open = require('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Open');

describe('Mysqlx.Expect.Open wrapper', () => {
    let ExpectStub, condition, serializable, wraps;

    beforeEach('create fakes', () => {
        ExpectStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expect_pb');
        condition = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Condition');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        open = require('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Open');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Expect.Open wrap instance', () => {
                const proto = new ExpectStub.Open();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });
                td.when(condition.create('bar')).thenReturn({ valueOf: () => 'qux' });
                td.when(condition.create('baz')).thenReturn({ valueOf: () => 'quux' });

                expect(open.create(['bar', 'baz']).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCondList).callCount).to.equal(1);
                expect(td.explain(proto.setCondList).calls[0].args[0]).to.deep.equal(['qux', 'quux']);
            });
        });
    });

    context('instance methods', () => {
        context('getOperation()', () => {
            it('returns the name of the operation', () => {
                const proto = new ExpectStub.Open();

                td.when(proto.getOp()).thenReturn(ExpectStub.Open.CtxOperation.EXPECT_CTX_COPY_PREV);
                expect(open(proto).getOperation()).to.equal('EXPECT_CTX_COPY_PREV');

                td.when(proto.getOp()).thenReturn(ExpectStub.Open.CtxOperation.EXPECT_CTX_EMPTY);
                expect(open(proto).getOperation()).to.equal('EXPECT_CTX_EMPTY');
            });
        });

        context('serialize()', () => {
            it('returns the raw buffer data to be sent through the wire', () => {
                const proto = new ExpectStub.Open();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(open(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Expect.open message', () => {
                const proto = new ExpectStub.Open();

                const wrapper = open(proto);
                const getOperation = td.replace(wrapper, 'getOperation');

                td.when(getOperation()).thenReturn('foo');
                td.when(proto.getCondList()).thenReturn(['p_bar', 'p_baz']);
                td.when(condition('p_bar')).thenReturn({ toJSON: () => 'bar' });
                td.when(condition('p_baz')).thenReturn({ toJSON: () => 'baz' });

                expect(wrapper.toJSON()).to.deep.equal({ op: 'foo', cond: ['bar', 'baz'] });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExpectStub.Open();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(open(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

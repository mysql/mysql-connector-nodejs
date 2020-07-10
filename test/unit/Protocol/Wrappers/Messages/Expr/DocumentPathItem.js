'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let documentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');

describe('Mysqlx.Expr.DocumentPathItem wrapper', () => {
    let ExprStub, wraps;

    beforeEach('create fakes', () => {
        ExprStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        documentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the document path item type name', () => {
                const proto = new ExprStub.DocumentPathItem();

                td.when(proto.getType()).thenReturn(0);
                // eslint-disable-next-line no-unused-expressions
                expect(documentPathItem(proto).getType()).to.not.exist;

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.MEMBER);
                expect(documentPathItem(proto).getType()).to.equal('MEMBER');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.MEMBER_ASTERISK);
                expect(documentPathItem(proto).getType()).to.equal('MEMBER_ASTERISK');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
                expect(documentPathItem(proto).getType()).to.equal('ARRAY_INDEX');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(documentPathItem(proto).getType()).to.equal('ARRAY_INDEX_ASTERISK');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(documentPathItem(proto).getType()).to.equal('DOUBLE_ASTERISK');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Expr.DocumentPathItem message', () => {
                const proto = new ExprStub.DocumentPathItem();

                const wrapper = documentPathItem(proto);
                const getType = td.replace(wrapper, 'getType');

                td.when(getType()).thenReturn('foo');

                td.when(proto.toObject()).thenReturn({ type: 'foo', value: 'bar' });
                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', value: 'bar' });

                td.when(proto.toObject()).thenReturn({ type: 'foo', index: 'bar' });
                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', index: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExprStub.DocumentPathItem();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(documentPathItem(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

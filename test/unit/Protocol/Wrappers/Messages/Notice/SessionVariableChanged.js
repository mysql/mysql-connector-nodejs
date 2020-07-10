'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let sessionVariableChanged = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionVariableChanged');

describe('Mysqlx.Notice.SessionVariableChanged wrapper', () => {
    let NoticeStub, bytes, scalar, wraps;

    beforeEach('create fakes', () => {
        NoticeStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_notice_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        sessionVariableChanged = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/SessionVariableChanged');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Notice.SessionVariableChanged wrap instance based on raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(NoticeStub.SessionVariableChanged.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(sessionVariableChanged.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Notice.SessionVariableChanged message', () => {
                const proto = new NoticeStub.SessionVariableChanged();

                td.when(proto.getParam()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('bar');
                td.when(scalar('bar')).thenReturn({ toJSON: () => 'baz' });

                expect(sessionVariableChanged(proto).toJSON()).to.deep.equal({ param: 'foo', value: 'baz' });
            });
        });

        context('toObject()', () => {
            it('returns a plain JavaScript object representation of the underlying data', () => {
                const proto = new NoticeStub.SessionVariableChanged();

                td.when(proto.getParam()).thenReturn('foo');
                td.when(proto.getValue()).thenReturn('bar');
                td.when(scalar('bar')).thenReturn({ toLiteral: () => 'baz' });

                expect(sessionVariableChanged(proto).toObject()).to.deep.equal({ foo: 'baz' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new NoticeStub.SessionVariableChanged();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(sessionVariableChanged(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

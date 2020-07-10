'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let warning = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/Warning');

describe('Mysqlx.Notice.Warning wrapper', () => {
    let NoticeStub, bytes, wraps;

    beforeEach('create fakes', () => {
        NoticeStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_notice_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        warning = require('../../../../../../lib/Protocol/Wrappers/Messages/Notice/Warning');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Notice.Warning wrap instance based on raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(NoticeStub.Warning.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(warning.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('getLevel()', () => {
            it('returns the potential log level name', () => {
                const proto = new NoticeStub.Warning();

                td.when(proto.getLevel()).thenReturn(0);
                // eslint-disable-next-line no-unused-expressions
                expect(warning(proto).getLevel()).to.not.exist;

                td.when(proto.getLevel()).thenReturn(NoticeStub.Warning.Level.NOTE);
                expect(warning(proto).getLevel()).to.equal('NOTE');

                td.when(proto.getLevel()).thenReturn(NoticeStub.Warning.Level.WARNING);
                expect(warning(proto).getLevel()).to.equal('WARNING');

                td.when(proto.getLevel()).thenReturn(NoticeStub.Warning.Level.ERROR);
                expect(warning(proto).getLevel()).to.equal('ERROR');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Notice.Warning message', () => {
                const proto = new NoticeStub.Warning();

                const wrapper = warning(proto);
                const getLevel = td.replace(wrapper, 'getLevel');

                td.when(getLevel()).thenReturn('foo');
                td.when(proto.getCode()).thenReturn('bar');
                td.when(proto.getMsg()).thenReturn('baz');

                expect(wrapper.toJSON()).to.deep.equal({ level: 'foo', code: 'bar', msg: 'baz' });
            });
        });

        context('toObject()', () => {
            it('returns a plain JavaScript object representation of the underlying data', () => {
                const proto = new NoticeStub.Warning();

                td.when(proto.toObject()).thenReturn('foo');

                expect(warning(proto).toObject()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new NoticeStub.Warning();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(warning(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

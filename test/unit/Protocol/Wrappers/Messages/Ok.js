'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let ok = require('../../../../../lib/Protocol/Wrappers/Messages/Ok');

describe('Mysqlx.Ok wrapper', () => {
    let MysqlxStub, bytes, wraps;

    beforeEach('create fakes', () => {
        MysqlxStub = td.replace('../../../../../lib/Protocol/Stubs/mysqlx_pb');
        bytes = td.replace('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        wraps = td.replace('../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        ok = require('../../../../../lib/Protocol/Wrappers/Messages/Ok');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Ok wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(MysqlxStub.Ok.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(ok.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Ok message', () => {
                const proto = new MysqlxStub.Ok();

                td.when(proto.toObject()).thenReturn('foo');

                expect(ok(proto).toJSON()).to.equal('foo');
            });
        });

        context('toObject()', () => {
            it('returns an empty object if there is no message', () => {
                const proto = new MysqlxStub.Ok();

                td.when(proto.hasMsg()).thenReturn(false);

                // eslint-disable-next-line no-unused-expressions
                expect(ok(proto).toObject()).to.be.an('object').and.be.empty;
            });

            it('returns an object with an existing protocol message', () => {
                const proto = new MysqlxStub.Ok();

                td.when(proto.hasMsg()).thenReturn(true);
                td.when(proto.getMsg()).thenReturn('foo');

                expect(ok(proto).toObject()).to.deep.equal({ message: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new MysqlxStub.Ok();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(ok(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

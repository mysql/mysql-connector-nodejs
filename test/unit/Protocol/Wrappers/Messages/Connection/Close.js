'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let close = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Close');

describe('Mysqlx.Connection.Close wrapper', () => {
    let ConnectionStub, empty, serializable, wraps;

    beforeEach('create fakes', () => {
        ConnectionStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_connection_pb');
        empty = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Empty');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        close = require('../../../../../../lib/Protocol/Wrappers/Messages/Connection/Close');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a wrapper instance based on a protobuf stub', () => {
                td.when(wraps(td.matchers.argThat(v => v instanceof ConnectionStub.Close))).thenReturn({ valueOf: () => 'foo' });

                expect(close.create().valueOf()).to.equal('foo');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns the raw buffer data to be sent through the wire', () => {
                const proto = new ConnectionStub.Close();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(close(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Connection.Close message', () => {
                const proto = new ConnectionStub.Close();

                td.when(empty(proto)).thenReturn({ toJSON: () => 'foo' });

                expect(close(proto).toJSON()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ConnectionStub.Close();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(close(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

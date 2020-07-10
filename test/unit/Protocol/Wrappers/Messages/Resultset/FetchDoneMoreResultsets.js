'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let fetchDoneMoreResultsets = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/FetchDoneMoreResultsets');

describe('Mysqlx.Resultset.FetchDoneMoreResultsets wrapper', () => {
    let ResultsetStub, bytes, empty, wraps;

    beforeEach('create fakes', () => {
        ResultsetStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_resultset_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        empty = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Empty');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        fetchDoneMoreResultsets = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/FetchDoneMoreResultsets');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Resultset.FetchDoneMoreResultsets wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(ResultsetStub.FetchDoneMoreResultsets.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(fetchDoneMoreResultsets.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Resultset.FetchDoneMoreResultsets message', () => {
                const proto = new ResultsetStub.FetchDoneMoreResultsets();

                td.when(empty(proto)).thenReturn({ toJSON: () => 'foo' });

                expect(fetchDoneMoreResultsets(proto).toJSON()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ResultsetStub.FetchDoneMoreResultsets();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(fetchDoneMoreResultsets(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

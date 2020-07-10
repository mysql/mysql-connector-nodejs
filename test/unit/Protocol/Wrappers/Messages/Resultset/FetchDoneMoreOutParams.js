'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let fetchDoneMoreOutParams = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/FetchDoneMoreOutParams');

describe('Mysqlx.Resultset.FetchDoneMoreOutParams wrapper', () => {
    let ResultsetStub, bytes, empty, wraps;

    beforeEach('create fakes', () => {
        ResultsetStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_resultset_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        empty = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Empty');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        fetchDoneMoreOutParams = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/FetchDoneMoreOutParams');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            context('deserialize()', () => {
                it('returns a Mysqlx.Resultset.FetchDoneMoreOutParams wrap instance encoded with raw protocol data from the network', () => {
                    td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                    td.when(ResultsetStub.FetchDoneMoreOutParams.deserializeBinary('baz')).thenReturn('qux');
                    td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                    expect(fetchDoneMoreOutParams.deserialize('foo').valueOf()).to.equal('bar');
                });
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Resultset.FetchDoneMoreOutParams message', () => {
                const proto = new ResultsetStub.FetchDoneMoreOutParams();

                td.when(empty(proto)).thenReturn({ toJSON: () => 'foo' });

                expect(fetchDoneMoreOutParams(proto).toJSON()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ResultsetStub.FetchDoneMoreOutParams();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(fetchDoneMoreOutParams(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

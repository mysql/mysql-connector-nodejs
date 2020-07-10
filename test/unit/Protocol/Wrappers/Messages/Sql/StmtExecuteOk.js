'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let stmtExecuteOk = require('../../../../../../lib/Protocol/Wrappers/Messages/Sql/StmtExecuteOk');

describe('Mysqlx.Sql.StmtExecuteOk wrapper', () => {
    let SqlStub, bytes, empty, wraps;

    beforeEach('create fakes', () => {
        SqlStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_sql_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        empty = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Empty');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        stmtExecuteOk = require('../../../../../../lib/Protocol/Wrappers/Messages/Sql/StmtExecuteOk');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Sql.StmtExecuteOk wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(SqlStub.StmtExecuteOk.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(stmtExecuteOk.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Sql.StmtExecuteOk message', () => {
                const proto = new SqlStub.StmtExecuteOk();

                td.when(empty(proto)).thenReturn({ toJSON: () => 'foo' });

                expect(stmtExecuteOk(proto).toJSON()).to.equal('foo');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new SqlStub.StmtExecuteOk();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(stmtExecuteOk(proto).valueOf()).to.equal('foo');
            });
        });
    });
});

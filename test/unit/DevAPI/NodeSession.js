"use strict";

chai.should();

const assert = require("assert"),
    protobuf = new (require('../../../lib/Protocol/protobuf.js'))(Messages);

function produceResultSet(protocol) {
    const result = new Server.ResultSet(data => protocol.handleNetworkFragment(data));
    result.beginResult(2);
    result.row(2);
    result.row(2);
    result.finalize();
}

describe('DevAPI', function () {
    describe('nodeSession', function () {
        describe('executeSQL', function () {
            let session;
            beforeEach('get Session', function () {
                return mysqlxtest.getNullNodeSession().then(function (s) {
                    session = s;
                });
            });
            it('should call the row callback', function () {
                const rowcb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute(rowcb);
                produceResultSet(session._client);
                rowcb.should.be.called.twice;
                promise.should.eventually.be.fullfilled;
            });
            it('should call the row and meta callback', function () {
                const rowcb = chai.spy(),
                    metacb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute(rowcb, metacb);
                produceResultSet(session._client);
                rowcb.should.be.called.twice;
                metacb.should.be.called.once;
                promise.should.eventually.be.fullfilled;
            });
            it('should call the row and meta callback from object', function () {
                const rowcb = chai.spy(),
                    metacb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute({row: rowcb, meta: metacb});
                produceResultSet(session._client);
                rowcb.should.be.called.twice;
                metacb.should.be.called.once;
                promise.should.eventually.be.fullfilled;
            });
        });
    });
});

"use strict";
/*global
 describe, context, beforeEach, afterEach, it, chai, Client, Encoding, Messages, nullStream
 */

chai.should();

const assert = require("assert");

describe('Client', function () {
    describe('fragmentation', function () {
        it('should handle fragmented after the header', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.crudModify("schema", "collection", Client.dataModel.DOCUMENT, "", []);
            const complete = Encoding.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1,
                sql_state: "0000",
                msg: "Unknown error"
            }, Encoding.serverMessages);
            protocol.handleNetworkFragment(complete.slice(0, 14));
            protocol.handleNetworkFragment(complete.slice(14));
            return promise.should.be.rejected;
        });
        it('should handle fragmented within the header', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.crudModify("schema", "collection", Client.dataModel.DOCUMENT, "", []);
            const complete = Encoding.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1,
                sql_state: "0000",
                msg: "Unknown error"
            }, Encoding.serverMessages);

            protocol.handleNetworkFragment(complete.slice(0, 1));
            protocol.handleNetworkFragment(complete.slice(1));
            return promise.should.be.rejected;
        });
    });
});

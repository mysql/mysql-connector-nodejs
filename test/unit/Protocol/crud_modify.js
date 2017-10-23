"use strict";
/*global
 describe, context, beforeEach, afterEach, it, chai, Client, Encoding, Messages, nullStream
 */

chai.should();

const assert = require("assert");

describe('Client', function () {
    // TODO(Rui): tests should be fixed when the fragmentation logic is refactored.
    describe.skip('crudModify', function () {
        // mot tests should be in devapi layer, where we can encode operations better
        it('should fail if error is received', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.crudModify("schema", "collection", Client.dataModel.DOCUMENT, "", []);
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1,
                sql_state: "0000",
                msg: "Unknown error"
            }, Encoding.serverMessages));
            return promise.should.be.rejected;
        });
    });
});

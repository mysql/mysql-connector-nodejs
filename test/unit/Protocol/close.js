"use strict";

chai.should();

var assert = require("assert");

describe('Client', function () {
    describe('close', function () {
        it('should throw if row callback is no function', function () {
            const protocol = new Client(nullStream),
                promise = protocol.close();

            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.OK, {}, Encoding.serverMessages));

            return promise.should.be.fullfilled;
        });
    });
});

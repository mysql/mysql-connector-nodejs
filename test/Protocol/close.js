"use strict";

var chai = require("chai"),
    spies = require('chai-spies');
chai.should();
chai.use(spies);

var assert = require("assert");
var Protocol = require("../../lib/Protocol");
var Messages = require('../../lib/Protocol/Messages');

var nullStream = {
    on: function () {},
    write: function () {}
};
describe('Protocol', function () {
    describe('close', function () {
        it('should throw if row callback is no function', function () {
            const protocol = new Protocol(nullStream),
                promise = protocol.close();

            protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.OK, {}, protocol.serverMessages));

            return promise.should.be.fullfilled;
        });
    });
});

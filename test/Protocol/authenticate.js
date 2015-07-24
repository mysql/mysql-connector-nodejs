"use strict";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.should();
chai.use(chaiAsPromised);

var assert = require("assert");
var Protocol = require("../../lib/Protocol");
var Messages = require('../../lib/Protocol/Messages');

var nullStream = {
    on: function () {},
    write: function () {}
};

describe('Protocol', function () {
    describe('Authentication', function () {
        describe('Single-Pass', function () {
            it('should put the initial data into the Authentication Start message', function () {
                var sentData = null;
                var testBuffer = new Buffer([0, 1, 2, 3, 4, 5]);

                var mockedStream = {
                    on: function () {
                    },
                    write: function (data) {
                        sentData = data;
                    }
                };
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                        return testBuffer;
                    }
                };

                var protocol = new Protocol(mockedStream);
                assert.strictEqual(sentData, null, "There was data sent too early");
                protocol.authenticate(mockedAuthenticator);
                assert.notEqual(sentData, null, "There was no data sent");
                var data = protocol.decodeMessage(sentData, 0, protocol.clientMessages);
                assert.strictEqual(data.decoded.auth_data.length, testBuffer.length);
                assert.strictEqual(data.decoded.auth_data.toString(), testBuffer.toString());
            });
            it('should put the authenticator\'s name in the Authentication Start message', function () {
                var sentData = null;

                var mockedStream = {
                    on: function () {
                    },
                    write: function (data) {
                        sentData = data;
                    }
                };
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                        return;
                    }
                };

                var protocol = new Protocol(mockedStream);
                assert.equal(sentData, null, "There was data sent too early");
                protocol.authenticate(mockedAuthenticator);
                assert.notEqual(sentData, null, "There was no data sent");
                var data = protocol.decodeMessage(sentData, 0, protocol.clientMessages);
                assert.strictEqual(data.decoded.mech_name, 'mock');
            });
            it('should resolve Promise if Authentication succeeds after Auth Start', function () {
                var protocol = new Protocol(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, protocol.serverMessages));
                return promise.should.be.fulfilled;
            });
            it('should allow Failing with empty reason after Auth Start', function () {
                var protocol = new Protocol(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_FAIL), {}, protocol.serverMessages);
                return promise.should.be.rejectedWith(Error, /unknown reason/);
            });
            it('should allow to provide a reason, when Failing after Auth Start', function () {
                var protocol = new Protocol(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var message = "This is a test!";
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_FAIL, {msg: message}, protocol.serverMessages));
                return promise.should.be.rejectedWith(Error, message);
            });
            it('should empty queue if auth succeeds after Auth Start', function () {
                var protocol = new Protocol(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, protocol.serverMessages));
                return promise.then(function () {
                    assert.equal(protocol._workQueue.hasMore(), false);
                    return true;
                });
            });
            it('should allow Failing with empty reason after Auth Start', function () {
                var protocol = new Protocol(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_FAIL), {}, protocol.serverMessages);
                return promise.catch(function () {
                    assert.equal(protocol._workQueue.hasMore(), false);
                    return true;
                });
            });
        });
        describe('multi-pass', function () {
            it('should put the additional data into the Authentication Continue message', function () {
                var sentData = null;
                var testBuffers = [ new Buffer([0, 1, 2, 3, 4, 5]), new Buffer([6, 7, 8, 9]) ];

                var mockedStream = {
                    on: function () {
                    },
                    write: function (data) {
                        sentData = data;
                    }
                };
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                        return testBuffers.shift();
                    }
                };

                var protocol = new Protocol(mockedStream);
                protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                var data = protocol.decodeMessage(sentData, 0, protocol.clientMessages);
                assert.strictEqual(data.decoded.auth_data.toString(), (new Buffer([0, 1, 2, 3, 4, 5])).toString());
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                var data = protocol.decodeMessage(sentData, 0, protocol.clientMessages);
                assert.strictEqual(data.decoded.auth_data.toString(), (new Buffer([6, 7, 8, 9])).toString());
            });
            it('should resolve Promise if Authentication succeeds after Auth Continue', function () {
                var protocol = new Protocol(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, protocol.serverMessages));
                return promise.should.be.fulfilled;
            });
            it('should fail if Authentication fails after Auth Continue', function () {
                var protocol = new Protocol(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, protocol.serverMessages));
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_FAIL, {}, protocol.serverMessages));
                return promise.should.be.rejected;
            });
        });
    });
});
"use strict";

chai.should();

var assert = require("assert");

describe('Client', function () {
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

                var protocol = new Client(mockedStream);
                assert.strictEqual(sentData, null, "There was data sent too early");
                protocol.authenticate(mockedAuthenticator);
                assert.notEqual(sentData, null, "There was no data sent");
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
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

                var protocol = new Client(mockedStream);
                assert.equal(sentData, null, "There was data sent too early");
                protocol.authenticate(mockedAuthenticator);
                assert.notEqual(sentData, null, "There was no data sent");
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
                assert.strictEqual(data.decoded.mech_name, 'mock');
            });
            it('should resolve Promise if Authentication succeeds after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));
                return promise.should.be.fulfilled;
            });
            it('should allow Failing with empty reason after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
            it('should allow to provide a reason, when Failing after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var message = "This is a test!";
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {msg: message}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
            it('should empty queue if auth succeeds after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));
                return promise.then(function () {
                    assert.equal(protocol._workQueue.hasMore(), false);
                    return true;
                });
            });
            it('should allow Failing with empty reason after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {}, Encoding.serverMessages));
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

                var protocol = new Client(mockedStream);
                protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
                assert.strictEqual(data.decoded.auth_data.toString(), (new Buffer([0, 1, 2, 3, 4, 5])).toString());
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
                assert.strictEqual(data.decoded.auth_data.toString(), (new Buffer([6, 7, 8, 9])).toString());
            });
            it('should fail if handler doesn\'t expect continuation', function () {
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
                    },
                };

                var protocol = new Client(mockedStream);
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
            it('should resolve Promise if Authentication succeeds after Auth Continue', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));
                return promise.should.be.fulfilled;
            });
            it('should fail if Authentication fails after Auth Continue', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
        });
    });
});
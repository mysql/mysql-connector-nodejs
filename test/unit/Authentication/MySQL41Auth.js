"use strict";

var assert = require("assert");
var MySQL41Auth = require("../../../lib/Authentication/MySQL41Auth");

var username = "root";

describe('MySQL41Auth', function () {
    it('should throw if no username was provided', function () {
        assert.throws(
            function () {
                new MySQL41Auth({});
            },
            /No username given/
        );
    });
    it('should throw if the server sends less than 20 bytes', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        assert.throws(
            function () {
                auth.getNextAuthData(new Buffer(19));
            },
            /Scramble buffer had invalid length/
        );
    });
    it('should throw if the server sends more than 20 bytes', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        assert.throws(
            function () {
                auth.getNextAuthData(new Buffer(22));
            },
            /Scramble buffer had invalid length/
        );
    });
    it('should be long enough for 2*\\0 + username length + 1 yte for \'*\' +20 bytes for hash', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        var result = auth.getNextAuthData(new Buffer(20));

        assert.equal(result.length, 2 + username.length + 1 + 40);
    });
    it('should create a response starting with a \\0 byte', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        var result = auth.getNextAuthData(new Buffer(20));

        assert.equal(result[0], 0);
    });
    it('should return the username starting at offset 1 in the response', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        var result = auth.getNextAuthData(new Buffer(20));

        assert.equal(result.slice(1, username.length + 1).toString(), username);
    });
    it('should have a \\0 byte after username in the response', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        var result = auth.getNextAuthData(new Buffer(20));

        assert.equal(result[username.length + 1], 0);
    });
    it('should properly hash the password fff with a given hash', function () {
        var auth = new MySQL41Auth({dbUser: 'root', dbPassword: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0xa, 0x35, 0x42, 0x1a, 0x43, 0x47, 0x6d, 0x65, 0x1, 0x4a, 0xf, 0x4c, 0x9, 0x5c, 0x32, 0x61, 0x64, 0x3c, 0x13, 0x6]));

        var exp = "*34439ed3004cf0e6030a9ec458338151bfb4e22d";
        assert.equal(result.slice(6).toString(), exp);
    });
    it('should return the properly hashed password with a given hash', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0x41, 0x43, 0x56, 0x6e, 0x78, 0x19, 0x2c, 0x2c, 0x19, 0x6f, 0x18, 0x29, 0x05, 0x52, 0x3c, 0x62, 0x39, 0x3d, 0x5c, 0x77]));

        var exp = "*af1ef523d254181abb1155c1fbc933b80c2ec853";
        assert.equal(result.slice(6).toString(), exp);
    });
    it('should properly encode a result containing 0x10 and write "10" into the response buffer', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0x7a, 0x59, 0x6b, 0x6e, 0x19, 0x7f, 0x44, 0x1, 0x6f, 0x4a, 0xf, 0xf, 0x3e, 0x19, 0x50, 0x4c, 0x4f, 0x47, 0x53, 0x5b]));

        var exp = "*950d944626109ab5bce8bc56a4e78a296e34271d";
        assert.equal(result.slice(6).toString(), exp);
    });
    it('should return a buffer of length = username + 2 if no password is given', function () {
        var auth = new MySQL41Auth({dbUser: username});
        var result = auth.getNextAuthData(new Buffer(20));

        assert.equal(result.length, username.length + 2);
    });
    it('should return a buffer of length = username + 3 if empty password is given', function () {
        var auth = new MySQL41Auth({dbUser: username, dbPassword: ''});
        var result = auth.getNextAuthData(new Buffer(20));

        assert.equal(result.length, username.length + 2);
    });
});


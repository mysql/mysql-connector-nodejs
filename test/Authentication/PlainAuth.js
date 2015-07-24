"use strict";

var assert = require("assert");
var PlainAuth = require("../../lib/Authentication/PlainAuth");

var username = 'root';
var password = 'fff';

describe('PlainAuth', function () {
    it('should throw if auth continue is requested', function () {
        var auth = new PlainAuth({dbUser: username, dbPassword: password});
        assert.throws(
            function () {
                auth.getNextAuthData(new Buffer(20));
            },
            /Unexpected/
        );
    });
    it('password string should be long enough for 3*\\0 + username length + password length', function () {
        var auth = new PlainAuth({dbUser: username, dbPassword: password});
        var result = auth.getInitialAuthData();

        assert.equal(result.length, 3 + username.length + password.length);
    });
    it('password string should start with a \\0 byte', function () {
        var auth = new PlainAuth({dbUser: username, dbPassword: password});
        var result = auth.getInitialAuthData();

        assert.equal(result[0], 0);
    });
    it('password string should return the username starting at offset 1', function () {
        var auth = new PlainAuth({dbUser: username, dbPassword: password});
        var result = auth.getInitialAuthData();

        assert.equal(result.slice(1, username.length + 1).toString(), username);
    });
    it('password string should have a \\0 byte after username', function () {
        var auth = new PlainAuth({dbUser: username, dbPassword: password});
        var result = auth.getInitialAuthData();

        assert.equal(result[username.length + 1], 0);
    });
    it('password should return the password', function () {
        var auth = new PlainAuth({dbUser: username, dbPassword: password});
        var result = auth.getInitialAuthData();

        assert.equal(result.slice(username.length + 2, username.length + 2 + password.length).toString(), password);
    });
    it('password string should have a \\0 byte at the end', function () {
        var auth = new PlainAuth({dbUser: username, dbPassword: password});
        var result = auth.getInitialAuthData();

        assert.equal(result[username.length + 2 + password.length], 0);
    });
});
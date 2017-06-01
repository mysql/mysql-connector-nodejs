'use strict';

/* eslint-env node, mocha */

const parseUserInfo = require('lib/DevAPI/Util/URIParser/parseUserInfo');
const expect = require('chai').expect;

describe('parseUserInfo', () => {
    it('should parse an userinfo segment containing both a username and a password', () => {
        ['foo:bar', 'foo:bar@'].forEach(userinfo => {
            expect(parseUserInfo('foo:bar')).to.deep.equal({ username: 'foo', password: 'bar' });
        });
    });

    it('should parse a userinfo segment containing just the username', () => {
        expect(parseUserInfo('foo')).to.deep.equal({ username: 'foo', password: undefined });
    });

    it('should parse a userinfo segment containing a password less user', () => {
        expect(parseUserInfo('foo:')).to.deep.equal({ username: 'foo', password: '' });
    });

    it('should parse an userinfo segment with encoded usernames or passwords', () => {
        expect(parseUserInfo('foo%20bar:baz%20qux')).to.deep.equal({ username: 'foo bar', password: 'baz qux' });
    });

    it('should parse an incomplete userinfo segment', () => {
        ['', '@', ':', ':bar'].forEach(password => {
            expect(parseUserInfo(password)).to.deep.equal({ username: undefined, password: undefined });
        });
    });

    it('should throw an error if the username is not valid', () => {
        [
            'foo:bar:baz',
            'foo/bar:baz',
            'foo?bar:baz',
            'foo#bar:baz',
            'foo[bar:baz',
            'foo]bar:baz'
        ].forEach(userinfo => {
            expect(() => parseUserInfo(userinfo)).to.throw('Invalid userinfo segment');
        });
    });

    it('should throw an error if the password is not valid', () => {
        [
            'foo:bar/baz',
            'foo:bar?baz',
            'foo:bar#baz',
            'foo:bar[baz',
            'foo:bar]baz'
        ].forEach(userinfo => {
            expect(() => parseUserInfo(userinfo)).to.throw('Invalid userinfo segment');
        });
    });
});

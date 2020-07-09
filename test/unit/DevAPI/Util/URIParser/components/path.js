'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseUri = require('../../../../../../lib/DevAPI/Util/URIParser');

describe('parsing the path', () => {
    it('uses an undefined schema when the path does not exist', () => {
        let connectionString = 'user@hostname';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        return expect(parseUri(connectionString).schema).to.not.exist;
    });

    it('uses an undefined schema when the path is empty', () => {
        let connectionString = 'user@hostname/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = 'user@127.0.0.1/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = 'user@[a1:b2:c4:d4:e5:f6:a7:b8]/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = 'user@(/path/to/socket.sock)/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `user@${encodeURIComponent('/path/to/socket.sock')}/`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        return expect(parseUri(connectionString).schema).to.not.exist;
    });

    it('fails if the path contains multiple segments', () => {
        let connectionString = 'user@hostname/foo/bar';
        expect(() => parseUri(connectionString)).to.throw('Invalid schema name');

        connectionString = `mysqlx://${connectionString}`;
        expect(() => parseUri(connectionString)).to.throw('Invalid schema name');
    });

    it('uses the first path segment as the schema name', () => {
        let connectionString = 'user@hostname/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@hostname/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = 'user@127.0.0.1/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@127.0.0.1/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = 'user@[a1:b2:c4:d4:e5:f6:a7:b8]/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@[a1:b2:c4:d4:e5:f6:a7:b8]/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = 'user@(/path/to/socket.sock)/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@(/path/to/socket.sock)/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `user@${encodeURIComponent('/path/to/socket.sock')}/foo`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@${encodeURIComponent('/path/to/socket.sock')}/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');
    });

    it('fails if the value is not valid', () => {
        let connectionString = `user@hostname/^`;
        expect(() => parseUri(connectionString)).to.throw('Invalid schema name');

        connectionString = `mysqlx://${connectionString}`;
        expect(() => parseUri(connectionString)).to.throw('Invalid schema name');
    });
});

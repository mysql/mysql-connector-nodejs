'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseUri = require('../../../../../../lib/DevAPI/Util/URIParser');

describe('parsing the authority component', () => {
    context('when a connection string does not contain the required details', () => {
        it('fails to parse', () => {
            let connectionString = '';
            expect(() => parseUri(connectionString)).throw('Invalid URI');

            connectionString = ' ';
            expect(() => parseUri(connectionString)).throw('Invalid URI');
        });
    });

    context('when a connection string contains an invalid host', () => {
        it('fails to parse', () => {
            expect(() => parseUri('mysql#x')).to.throw(Error, 'Invalid URI');
        });
    });

    context('when a connection string contains only the required details', () => {
        it('parses hostnames', () => {
            let connectionString = 'user@hostname';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('hostname');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('hostname');
        });

        it('parses IPv4 addresses', () => {
            let connectionString = 'user@127.0.0.1';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('127.0.0.1');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('127.0.0.1');
        });

        it('parses IPv6 addresses', () => {
            let connectionString = 'user@[a1:b2:c4:d4:e5:f6:a7:b8]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');

            connectionString = 'user@[::]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('::');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('::');
        });

        it('parses local UNIX sockets', () => {
            let connectionString = 'user@(/path/to/socket.sock)';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');

            connectionString = `user@${encodeURIComponent('/path/to/socket.sock')}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');
        });
    });

    context('when a connection string contains additional details', () => {
        it('parses hostnames', () => {
            let connectionString = 'user:password@hostname:3357';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('hostname');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('hostname');
        });

        it('parses IPv4 addresses', () => {
            let connectionString = 'user:password@127.0.0.1:3357';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('127.0.0.1');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('127.0.0.1');
        });

        it('parses IPv6 addresses', () => {
            let connectionString = 'user:password@[a1:b2:c4:d4:e5:f6:a7:b8]:3357';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');

            connectionString = 'user@[::]:3357';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('::');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('::');
        });

        it('parses local UNIX sockets', () => {
            let connectionString = 'user:password@(/path/to/socket.sock)/schema';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');

            connectionString = `user:password@${encodeURIComponent('/path/to/socket.sock')}/schema`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).endpoints[0].host).to.not.exist;
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket.sock');
        });

        it('parses the server port', () => {
            let connectionString = 'user@hostname:33061';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].port).to.equal(33061);

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].port).to.equal(33061);

            connectionString = 'user@hostname:foo';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].port).to.equal('foo');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(1);
            expect(parseUri(connectionString).endpoints[0].port).to.equal('foo');
        });

        it('parses the user name', () => {
            let connectionString = 'foo@hostname';
            expect(parseUri(connectionString).user).to.equal('foo');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).user).to.equal('foo');

            connectionString = 'foo:bar@hostname';
            expect(parseUri(connectionString).user).to.equal('foo');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).user).to.equal('foo');
        });

        it('parses the password', () => {
            let connectionString = 'foo:@hostname';
            expect(parseUri(connectionString).password).to.equal('');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).password).to.equal('');

            connectionString = 'foo:bar@hostname';
            expect(parseUri(connectionString).password).to.equal('bar');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).password).to.equal('bar');
        });
    });

    context('when a connection string contains a list of endpoints without an explicit priority', () => {
        it('parses hostnames', () => {
            let connectionString = 'user@[foo.example.com,bar.example.com,baz.example.com]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('foo.example.com');
            expect(parseUri(connectionString).endpoints[1].host).to.equal('bar.example.com');
            expect(parseUri(connectionString).endpoints[2].host).to.equal('baz.example.com');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('foo.example.com');
            expect(parseUri(connectionString).endpoints[1].host).to.equal('bar.example.com');
            expect(parseUri(connectionString).endpoints[2].host).to.equal('baz.example.com');
        });

        it('parses IPv4 addresses', () => {
            let connectionString = 'user@[192.168.1.101,192.168.1.102,192.168.1.103]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('192.168.1.101');
            expect(parseUri(connectionString).endpoints[1].host).to.equal('192.168.1.102');
            expect(parseUri(connectionString).endpoints[2].host).to.equal('192.168.1.103');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('192.168.1.101');
            expect(parseUri(connectionString).endpoints[1].host).to.equal('192.168.1.102');
            expect(parseUri(connectionString).endpoints[2].host).to.equal('192.168.1.103');
        });

        it('parses IPv6 addresses', () => {
            let connectionString = 'user@[[a1:b2:c4:d4:e5:f6:a7:b8],[a2:b2:c4:d4:e5:f6:a7:b8],[a3:b2:c4:d4:e5:f6:a7:b8]]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[1].host).to.equal('a2:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[2].host).to.equal('a3:b2:c4:d4:e5:f6:a7:b8');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[1].host).to.equal('a2:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[2].host).to.equal('a3:b2:c4:d4:e5:f6:a7:b8');
        });

        it('parses local UNIX sockets', () => {
            // TODO(Rui): proposal for socket paths wrapped with parenthesis.
            // Right now parseUri('user@[(/path/to/socket.sock)]') throws an error

            let connectionString = `user@[${encodeURIComponent('/path/to/socket1.sock')},${encodeURIComponent('/path/to/socket2.sock')},${encodeURIComponent('/path/to/socket3.sock')}]`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket1.sock');
            expect(parseUri(connectionString).endpoints[1].socket).to.equal('/path/to/socket2.sock');
            expect(parseUri(connectionString).endpoints[2].socket).to.equal('/path/to/socket3.sock');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket1.sock');
            expect(parseUri(connectionString).endpoints[1].socket).to.equal('/path/to/socket2.sock');
            expect(parseUri(connectionString).endpoints[2].socket).to.equal('/path/to/socket3.sock');
        });

        it('parses ports', () => {
            let connectionString = 'user@[foo.example.com:33061:,192.168.1.101:33062,[a1:b2:c4:d4:e5:f6:a7:b8]:33063]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].port).to.equal(33061);
            expect(parseUri(connectionString).endpoints[1].port).to.equal(33062);
            expect(parseUri(connectionString).endpoints[2].port).to.equal(33063);

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].port).to.equal(33061);
            expect(parseUri(connectionString).endpoints[1].port).to.equal(33062);
            expect(parseUri(connectionString).endpoints[2].port).to.equal(33063);
        });
    });

    context('when a connection string contains a list of endpoints with an explicit priority', () => {
        it('parses hostnames and priorities', () => {
            let connectionString = 'user@[(address=foo.example.com,priority=98),(address=bar.example.com,priority=97),(address=baz.example.com,priority=99)]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('foo.example.com');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[1].host).to.equal('bar.example.com');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(97);
            expect(parseUri(connectionString).endpoints[2].host).to.equal('baz.example.com');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(99);

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('foo.example.com');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[1].host).to.equal('bar.example.com');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(97);
            expect(parseUri(connectionString).endpoints[2].host).to.equal('baz.example.com');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(99);
        });

        it('parses IPv4 addresses and priorities', () => {
            let connectionString = 'user@[(address=192.168.1.101,priority=99),(address=192.168.1.102,priority=98),(address=192.168.1.103,priority=97)]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('192.168.1.101');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(99);
            expect(parseUri(connectionString).endpoints[1].host).to.equal('192.168.1.102');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[2].host).to.equal('192.168.1.103');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(97);

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('192.168.1.101');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(99);
            expect(parseUri(connectionString).endpoints[1].host).to.equal('192.168.1.102');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[2].host).to.equal('192.168.1.103');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(97);
        });

        it('parses IPv6 addresses and priorities', () => {
            let connectionString = 'user@[(address=[a1:b2:c4:d4:e5:f6:a7:b8],priority=97),(address=[a2:b2:c4:d4:e5:f6:a7:b8],priority=98),(address=[a3:b2:c4:d4:e5:f6:a7:b8],priority=99)]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(97);
            expect(parseUri(connectionString).endpoints[1].host).to.equal('a2:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[2].host).to.equal('a3:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(99);

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].host).to.equal('a1:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(97);
            expect(parseUri(connectionString).endpoints[1].host).to.equal('a2:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[2].host).to.equal('a3:b2:c4:d4:e5:f6:a7:b8');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(99);
        });

        it('parses local UNIX sockets and priorities', () => {
            // TODO(Rui): proposal for socket paths wrapped with parenthesis.
            // Right now parseUri('user@[(/path/to/socket.sock)]') throws an error

            let connectionString = `user@[(address=${encodeURIComponent('/path/to/socket1.sock')},priority=99),(address=${encodeURIComponent('/path/to/socket2.sock')},priority=97),(address=${encodeURIComponent('/path/to/socket3.sock')},priority=98)]`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket1.sock');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(99);
            expect(parseUri(connectionString).endpoints[1].socket).to.equal('/path/to/socket2.sock');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(97);
            expect(parseUri(connectionString).endpoints[2].socket).to.equal('/path/to/socket3.sock');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(98);

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].socket).to.equal('/path/to/socket1.sock');
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(99);
            expect(parseUri(connectionString).endpoints[1].socket).to.equal('/path/to/socket2.sock');
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(97);
            expect(parseUri(connectionString).endpoints[2].socket).to.equal('/path/to/socket3.sock');
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(98);
        });

        it('parses ports and priorities', () => {
            let connectionString = 'user@[(address=foo.example.com:33061,priority=98),(address=192.168.1.101:33062,priority=99),(address=[a1:b2:c4:d4:e5:f6:a7:b8]:33063,priority=97)]';
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].port).to.equal(33061);
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[1].port).to.equal(33062);
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(99);
            expect(parseUri(connectionString).endpoints[2].port).to.equal(33063);
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(97);

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).endpoints).to.be.an('array').and.have.lengthOf(3);
            expect(parseUri(connectionString).endpoints[0].port).to.equal(33061);
            expect(parseUri(connectionString).endpoints[0].priority).to.equal(98);
            expect(parseUri(connectionString).endpoints[1].port).to.equal(33062);
            expect(parseUri(connectionString).endpoints[1].priority).to.equal(99);
            expect(parseUri(connectionString).endpoints[2].port).to.equal(33063);
            expect(parseUri(connectionString).endpoints[2].priority).to.equal(97);
        });
    });
});

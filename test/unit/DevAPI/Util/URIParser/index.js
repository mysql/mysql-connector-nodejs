'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseUri = require('../../../../../lib/DevAPI/Util/URIParser');

describe('parseUri', () => {
    context('for RFC-3986 URIs', () => {
        it('parses an URI with a hostname', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: 'password',
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://user:password@hostname:3357')).to.deep.equal(expected);
        });

        it('parses an URI with an arbitrary IPv4 host', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: 'password',
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: '127.0.0.1',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://user:password@127.0.0.1:3357')).to.deep.equal(expected);
        });

        it('parses an URI with a loopback IPv6 host', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: 'password',
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: '::',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://user:password@[::]:3357')).to.deep.equal(expected);
        });

        it('parses an URI with an arbitrary IPv6 host', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: 'password',
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'a1:a2:a3:a4:a5:a6:a7:a8',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://user:password@[a1:a2:a3:a4:a5:a6:a7:a8]:3357')).to.deep.equal(expected);
        });

        it('parses an URI containing just the hostname', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'server.example.com',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://server.example.com')).to.deep.equal(expected);
        });

        it('parses an URI string containing just the IPv4 address', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: '127.0.0.1',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://127.0.0.1')).to.deep.equal(expected);
        });

        it('parses an URI containing just the IPv6 address', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'a1:b2:c4:d4:e5:f6:a7:b8',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://[a1:b2:c4:d4:e5:f6:a7:b8]')).to.deep.equal(expected);
        });

        it('parses an URI with an empty path', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: 'password',
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://user:password@hostname:3357/')).to.deep.equal(expected);
        });

        it('parses a complete URI', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: 'password',
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: 'schema',
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://user:password@hostname:3357/schema')).to.deep.equal(expected);
        });

        it('parses a URI with an invalid port type (validation is done somewhere else)', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: 'foobar',
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('mysqlx://hostname:foobar')).to.deep.equal(expected);
        });

        context('route failover', () => {
            it('parses an URI containing failover addresses without priority', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: '127.0.0.1',
                        port: 3357,
                        socket: undefined
                    }, {
                        host: '::1',
                        port: 3357,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: 'schema',
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('mysqlx://user:password@[127.0.0.1:3357, [::1]:3357]/schema')).to.deep.equal(expected);
            });

            it('parses an URI containing failover addresses with priority', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: '127.0.0.1',
                        port: undefined,
                        priority: 99,
                        socket: undefined
                    }, {
                        host: 'localhost',
                        port: 3357,
                        priority: 0,
                        socket: undefined
                    }, {
                        host: '::1',
                        port: undefined,
                        priority: 100,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: 'schema',
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('mysqlx://user:password@[(address=127.0.0.1, priority=99), (address=localhost:3357, priority=0), (address=[::1], priority=100)]/schema')).to.deep.equal(expected);
            });

            it('throws an error if any but not all addresses have a priority', () => {
                [
                    '[127.0.0.1, (address=[::1], priority=100)]',
                    '[(address=127.0.0.1), (address=[::1], 100)]',
                    '[(address=127.0.0.1, foo), (address=[::1], priority=100)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`mysqlx://user:password@${invalid}/schema`)).to.throw('You must either assign no priority to any of the routers or give a priority for every router');
                });
            });

            it('throws an error if any priority is out of range', () => {
                [
                    '[(address=127.0.0.1, priority=-1), (address=[::1], priority=-2)]',
                    '[(address=127.0.0.1, priority=100), (address=[::1], priority=101)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`mysqlx://user:password@${invalid}/schema`)).to.throw('The priorities must be between 0 and 100');
                });
            });
        });

        context('SSL/TLS properties', () => {
            it('parses a URI that requires SSL/TLS', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060/?ssl-mode=REQUIRED')).to.deep.equal(expected);
            });

            it('parses a URI that disables SSL/TLS', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: false
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060/?ssl-mode=DISABLED')).to.deep.equal(expected);
            });

            it('parses an URI with encoded paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=%2Fpath%2Fto%2Fca&ssl-crl=%2Fpath%2Fto%2Fcrl')).to.deep.equal(expected);
            });

            it('parses an URI with custom paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=(/path/to/ca)&ssl-crl=(/path/to/crl)')).to.deep.equal(expected);
            });

            it('parses empty paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=&ssl-crl=')).to.deep.equal(expected);
            });

            it('parses empty custom paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=()&ssl-crl=()')).to.deep.equal(expected);
            });

            it('parses a list of TLS versions', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        versions: ['TLSv1.2', 'TLSv1.3']
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?tls-versions=[TLSv1.2,TLSv1.3]')).to.deep.equal(expected);
            });

            it('parses a list of TLS ciphersuites', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ciphersuites: ['foo', 'bar']
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?tls-ciphersuites=[foo,bar]')).to.deep.equal(expected);
            });
        });

        context('local sockets', () => {
            it('parses an URI with a pct-encoded UNIX socket', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: undefined,
                        port: undefined,
                        socket: '/path/to/socket'
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('mysqlx://user:password@%2Fpath%2Fto%2Fsocket')).to.deep.equal(expected);
            });

            it('parses an URI with a custom-encoded UNIX socket', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: undefined,
                        port: undefined,
                        socket: '/path/to/socket'
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('mysqlx://user:password@(/path/to/socket)')).to.deep.equal(expected);
            });
        });

        context('authentication method', () => {
            it('parses an URI with a specific authentication method', () => {
                const expected = {
                    auth: 'AUTHMETHOD',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'localhost',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('mysqlx://user:password@localhost:33060?auth=authMethod')).to.deep.equal(expected);
            });
        });

        context('connection timeout', () => {
            it('parses an URI with a specific connection timeout', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '2',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'localhost',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('mysqlx://user:password@localhost:33060?connect-timeout=2')).to.deep.equal(expected);
            });
        });

        it('throws an error if the host is not valid', () => {
            expect(() => parseUri('mysql#x')).to.throw(Error, 'Invalid URI');
        });

        context('SRV resolution', () => {
            it('parses the scheme extension that enables SRV resolution', () => {
                expect(parseUri('mysqlx+srv://user:password@host:33060')).to.deep.include({ resolveSrv: true });
            });

            it('fails if an unknown scheme extension is provided', () => {
                expect(() => parseUri('mysqlx+foo://user:password@host:33060')).to.throw('Scheme mysqlx+foo is not valid.');
            });
        });
    });

    context('for a unified connection string', () => {
        it('parses a connection string if the password is not provided', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('user@hostname:3357')).to.deep.equal(expected);
        });

        it('parses a connection string if the password is empty', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: '',
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: 3357,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('user:@hostname:3357')).to.deep.equal(expected);
        });

        it('parses a connection string if the port is not provided', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('user@hostname')).to.deep.equal(expected);
        });

        it('parses a connection string if the port is empty', () => {
            const expected = {
                auth: '',
                dbUser: 'user',
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('user@hostname:')).to.deep.equal(expected);
        });

        it('parses a connection string containing just the hostname', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'server.example.com',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('server.example.com')).to.deep.equal(expected);
        });

        it('parses a connection string containing just the IPv4 address', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: '127.0.0.1',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('127.0.0.1')).to.deep.equal(expected);
        });

        it('parses a connection string containing just the IPv6 address', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'a1:b2:c4:d4:e5:f6:a7:b8',
                    port: undefined,
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('[a1:b2:c4:d4:e5:f6:a7:b8]')).to.deep.equal(expected);
        });

        it('parses a URI with an invalid port type (validation is done somewhere else)', () => {
            const expected = {
                auth: '',
                dbUser: undefined,
                dbPassword: undefined,
                connectTimeout: '10000',
                connectionAttributes: {},
                endpoints: [{
                    host: 'hostname',
                    port: 'foobar',
                    socket: undefined
                }],
                resolveSrv: false,
                schema: undefined,
                tls: {
                    enabled: true
                }
            };

            expect(parseUri('hostname:foobar')).to.deep.equal(expected);
        });

        context('route failover', () => {
            it('parses a connection string containing failover addresses without priority', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: '::1',
                        port: 33060,
                        socket: undefined
                    }, {
                        host: 'localhost',
                        port: 33060,
                        socket: undefined
                    }, {
                        host: '127.0.0.1',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: 'schema',
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('user:password@[[::1]:33060, localhost:33060, 127.0.0.1:33060)]/schema')).to.deep.equal(expected);
            });

            it('parses a connection string containing failover addresses with priority', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: '127.0.0.1',
                        port: 3357,
                        priority: 98,
                        socket: undefined
                    }, {
                        host: 'localhost',
                        port: 3357,
                        priority: 100,
                        socket: undefined
                    }, {
                        host: '::1',
                        port: undefined,
                        priority: 97,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: 'schema',
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('user:password@[(address=127.0.0.1:3357, priority=98), (address=localhost:3357, priority=100), (address=[::1], priority=97)]/schema')).to.deep.equal(expected);
            });

            it('throws an error if any but not all addresses have a priority', () => {
                [
                    '[127.0.0.1, (address=[::1], 100)]',
                    '[(address=127.0.0.1), (address=[::1], priority=100)]',
                    '[(address=127.0.0.1, foo), (address=[::1], priority=100)]',
                    '[(address=127.0.0.1, foo=bar), (address=[::1], 100)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`user:password@${invalid}/schema`)).to.throw('You must either assign no priority to any of the routers or give a priority for every router');
                });
            });

            it('throws an error if any priority is out of range', () => {
                [
                    '[(address=127.0.0.1, priority=-1), (address=[::1], priority=-2)]',
                    '[(address=127.0.0.1, priority=100), (address=[::1], priority=101)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`user:password@${invalid}/schema`)).to.throw('The priorities must be between 0 and 100');
                });
            });
        });

        context('SSL/TLS properties', () => {
            it('parses a connection string that requires SSL/TLS', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: undefined,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('user:password@hostname?ssl-mode=REQUIRED')).to.deep.equal(expected);
            });

            it('parses a connection string that disables SSL/TLS', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: undefined,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: false
                    }
                };

                expect(parseUri('user:password@hostname?ssl-mode=DISABLED')).to.deep.equal(expected);
            });

            it('parses a connection string with encoded paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: undefined,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=%2Fpath%2Fto%2Fca&ssl-crl=%2Fpath%2Fto%2Fcrl')).to.deep.equal(expected);
            });

            it('parses a connection string with custom paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: undefined,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=(/path/to/ca)&ssl-crl=(/path/to/crl)')).to.deep.equal(expected);
            });

            it('parses empty paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: undefined,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=&ssl-crl=')).to.deep.equal(expected);
            });

            it('parses empty custom paths to validation PEM files', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'hostname',
                        port: undefined,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true,
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=()&ssl-crl=()')).to.deep.equal(expected);
            });
        });

        context('local sockets', () => {
            it('parses a connection string with a pct-encoded UNIX socket', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: undefined,
                        port: undefined,
                        socket: './path/to/socket'
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('user:password@.%2Fpath%2Fto%2Fsocket')).to.deep.equal(expected);
            });

            it('parses an URI with a custom-encoded UNIX socket', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: undefined,
                        port: undefined,
                        socket: './path/to/socket'
                    }],
                    resolveSrv: false,
                    schema: 'schema',
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('user:password@(./path/to/socket)/schema')).to.deep.equal(expected);
            });
        });

        context('authentication method', () => {
            it('parses an URI with a specific authentication method', () => {
                const expected = {
                    auth: 'AUTHMETHOD',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '10000',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'localhost',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('user:password@localhost:33060?auth=authMethod')).to.deep.equal(expected);
            });
        });

        context('connection timeout', () => {
            it('parses an URI with a specific connection timeout', () => {
                const expected = {
                    auth: '',
                    dbUser: 'user',
                    dbPassword: 'password',
                    connectTimeout: '2',
                    connectionAttributes: {},
                    endpoints: [{
                        host: 'localhost',
                        port: 33060,
                        socket: undefined
                    }],
                    resolveSrv: false,
                    schema: undefined,
                    tls: {
                        enabled: true
                    }
                };

                expect(parseUri('user:password@localhost:33060?connect-timeout=2')).to.deep.equal(expected);
            });
        });

        it('throws an error if the host is empty', () => {
            expect(() => parseUri('')).to.throw(Error, 'Invalid URI');
        });
    });
});

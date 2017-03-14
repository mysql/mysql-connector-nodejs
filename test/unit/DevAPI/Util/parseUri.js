'use strict';

/* eslint-env node, mocha */

const parseUri = require('lib/DevAPI/Util/parseUri');
const expect = require('chai').expect;

describe('parseUri', () => {
    context('for RFC-3986 URIs', () => {
        it('should parse an URI with a hostname', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: 'password',
                endpoints: [{
                    host: 'hostname',
                    port: 3357
                }]
            };

            expect(parseUri('mysqlx://user:password@hostname:3357')).to.deep.equal(expected);
        });

        it('should parse an URI with an arbitrary IPv4 host', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: 'password',
                endpoints: [{
                    host: '127.0.0.1',
                    port: 3357
                }]
            };

            expect(parseUri('mysqlx://user:password@127.0.0.1:3357')).to.deep.equal(expected);
        });

        it('should parse an URI with a loopback IPv6 host', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: 'password',
                endpoints: [{
                    host: '::',
                    port: 3357
                }]
            };

            expect(parseUri('mysqlx://user:password@[::]:3357')).to.deep.equal(expected);
        });

        it('should parse an URI with an arbitrary IPv6 host', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: 'password',
                endpoints: [{
                    host: 'a1:a2:a3:a4:a5:a6:a7:a8',
                    port: 3357
                }]
            };

            expect(parseUri('mysqlx://user:password@[a1:a2:a3:a4:a5:a6:a7:a8]:3357')).to.deep.equal(expected);
        });

        it('should parse an URI containing just the hostname', () => {
            const expected = { endpoints: [{ host: 'server.example.com' }] };

            expect(parseUri('mysqlx://server.example.com')).to.deep.equal(expected);
        });

        it('should parse an URI string containing just the IPv4 address', () => {
            const expected = { endpoints: [{ host: '127.0.0.1' }] };

            expect(parseUri('mysqlx://127.0.0.1')).to.deep.equal(expected);
        });

        it('should parse an URI containing just the IPv6 address', () => {
            const expected = { endpoints: [{ host: 'a1:b2:c4:d4:e5:f6' }] };

            expect(parseUri('mysqlx://[a1:b2:c4:d4:e5:f6]')).to.deep.equal(expected);
        });

        it('should parse an URI with an empty path', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: 'password',
                endpoints: [{
                    host: 'hostname',
                    port: 3357
                }]
            };

            expect(parseUri('mysqlx://user:password@hostname:3357/')).to.deep.equal(expected);
        });

        it('should parse a complete URI', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: 'password',
                endpoints: [{
                    host: 'hostname',
                    port: 3357
                }],
                schema: 'schema'
            };

            expect(parseUri('mysqlx://user:password@hostname:3357/schema')).to.deep.equal(expected);
        });

        context('route failover', () => {
            it('should parse an URI containing failover addresses without priority', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: '127.0.0.1',
                        port: 3357
                    }, {
                        host: '::1',
                        port: 3357
                    }],
                    schema: 'schema'
                };

                expect(parseUri('mysqlx://user:password@[127.0.0.1:3357, [::1]:3357]/schema')).to.deep.equal(expected);
            });

            it('should parse an URI containing failover addresses with priority', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: '::1'
                    }, {
                        host: '127.0.0.1'
                    }, {
                        host: 'localhost',
                        port: 3357
                    }],
                    schema: 'schema'
                };

                expect(parseUri('mysqlx://user:password@[(127.0.0.1, priority=99), (localhost:3357, priority=0), ([::1], priority=100)]/schema')).to.deep.equal(expected);
            });

            it('should throw an error if any but not all addresses have a priority', () => {
                [
                    '[127.0.0.1, ([::1], priority=100)]',
                    '[(127.0.0.1), ([::1], 100)]',
                    '[(127.0.0.1, foo), ([::1], priority=100)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`mysqlx://user:password@${invalid}/schema`)).to.throw('You must either assign no priority to any of the routers or give a priority for every router');
                });
            });

            it('should throw an error if any priority is out of range', () => {
                [
                    '[(127.0.0.1, priority=-1), ([::1], priority=-2)]',
                    '[(127.0.0.1, priority=100), ([::1], priority=101)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`mysqlx://user:password@${invalid}/schema`)).to.throw('The priorities must be between 0 and 100');
                });
            });
        });

        context('SSL/TLS properties', () => {
            it('should parse a URI with SSL/TLS options', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname',
                        port: 33060
                    }],
                    ssl: true
                };

                expect(parseUri('mysqlx://user:password@hostname:33060/?ssl-enable')).to.deep.equal(expected);
            });

            it('should parse an URI with encoded paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname',
                        port: 33060
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=%2Fpath%2Fto%2Fca&ssl-crl=%2Fpath%2Fto%2Fcrl')).to.deep.equal(expected);
            });

            it('should parse an URI with custom paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname',
                        port: 33060
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=(/path/to/ca)&ssl-crl=(/path/to/crl)')).to.deep.equal(expected);
            });

            it('should parse empty paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname',
                        port: 33060
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=&ssl-crl=')).to.deep.equal(expected);
            });

            it('should parse empty custom paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname',
                        port: 33060
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('mysqlx://user:password@hostname:33060?ssl-ca=()&ssl-crl=()')).to.deep.equal(expected);
            });
        });

        // TODO(Rui): does this test make any sense?
        it.skip('should throw an error if the host is not valid', () => {
            expect(() => parseUri('mysqlx://')).to.throw(Error);
        });
    });

    context('for a unified connection string', () => {
        it('should parse a connection string if the password is not provided', () => {
            const expected = {
                dbUser: 'user',
                endpoints: [{
                    host: 'hostname',
                    port: 3357
                }]
            };

            expect(parseUri('user@hostname:3357')).to.deep.equal(expected);
        });

        it('should parse a connection string if the password is empty', () => {
            const expected = {
                dbUser: 'user',
                endpoints: [{
                    host: 'hostname',
                    port: 3357
                }]
            };

            expect(parseUri('user:@hostname:3357')).to.deep.equal(expected);
        });

        it('should parse a connection string if the port is not provided', () => {
            const expected = {
                dbUser: 'user',
                endpoints: [{
                    host: 'hostname'
                }]
            };

            expect(parseUri('user@hostname')).to.deep.equal(expected);
        });

        it('should parse a connection string if the port is empty', () => {
            const expected = {
                dbUser: 'user',
                endpoints: [{
                    host: 'hostname'
                }]
            };

            expect(parseUri('user@hostname:')).to.deep.equal(expected);
        });

        it('should parse a connection string containing just the hostname', () => {
            const expected = { endpoints: [{ host: 'server.example.com' }] };

            expect(parseUri('server.example.com')).to.deep.equal(expected);
        });

        it('should parse a connection string containing just the IPv4 address', () => {
            const expected = { endpoints: [{ host: '127.0.0.1' }] };

            expect(parseUri('127.0.0.1')).to.deep.equal(expected);
        });

        it('should parse a connection string containing just the IPv6 address', () => {
            const expected = { endpoints: [{ host: 'a1:b2:c4:d4:e5:f6' }] };

            expect(parseUri('[a1:b2:c4:d4:e5:f6]')).to.deep.equal(expected);
        });

        context('route failover', () => {
            it('should parse a connection string containing failover addresses without priority', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: '::1',
                        port: 33060
                    }, {
                        host: 'localhost',
                        port: 33060
                    }, {
                        host: '127.0.0.1',
                        port: 33060
                    }],
                    schema: 'schema'
                };

                expect(parseUri('user:password@[[::1]:33060, localhost:33060, 127.0.0.1:33060)]/schema')).to.deep.equal(expected);
            });

            it('should parse a connection string containing failover addresses with priority', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'localhost',
                        port: 3357
                    }, {
                        host: '127.0.0.1',
                        port: 3357
                    }, {
                        host: '::1'
                    }],
                    schema: 'schema'
                };

                expect(parseUri('user:password@[(127.0.0.1:3357, priority=98), (localhost:3357, priority=100), ([::1], priority=97)]/schema')).to.deep.equal(expected);
            });

            it('should throw an error if any but not all addresses have a priority', () => {
                [
                    '[127.0.0.1, ([::1], 100)]',
                    '[(127.0.0.1), ([::1], priority=100)]',
                    '[(127.0.0.1, foo), ([::1], priority=100)]',
                    '[(127.0.0.1, foo=bar), ([::1], 100)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`user:password@${invalid}/schema`)).to.throw('You must either assign no priority to any of the routers or give a priority for every router');
                });
            });

            it('should throw an error if any priority is out of range', () => {
                [
                    '[(127.0.0.1, priority=-1), ([::1], priority=-2)]',
                    '[(127.0.0.1, priority=100), ([::1], priority=101)]'
                ].forEach(invalid => {
                    expect(() => parseUri(`user:password@${invalid}/schema`)).to.throw('The priorities must be between 0 and 100');
                });
            });
        });

        context('SSL/TLS properties', () => {
            it('should parse a connection string with SSL/TLS options', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname'
                    }],
                    ssl: true
                };

                expect(parseUri('user:password@hostname?ssl-enable')).to.deep.equal(expected);
            });

            it('should parse a connection string with encoded paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname'
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=%2Fpath%2Fto%2Fca&ssl-crl=%2Fpath%2Fto%2Fcrl')).to.deep.equal(expected);
            });

            it('should parse a connection string with custom paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname'
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '/path/to/ca',
                        crl: '/path/to/crl'
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=(/path/to/ca)&ssl-crl=(/path/to/crl)')).to.deep.equal(expected);
            });

            it('should parse empty paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname'
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=&ssl-crl=')).to.deep.equal(expected);
            });

            it('should parse empty custom paths to validation PEM files', () => {
                const expected = {
                    dbUser: 'user',
                    dbPassword: 'password',
                    endpoints: [{
                        host: 'hostname'
                    }],
                    ssl: true,
                    sslOptions: {
                        ca: '',
                        crl: ''
                    }
                };

                expect(parseUri('user:password@hostname?ssl-ca=()&ssl-crl=()')).to.deep.equal(expected);
            });
        });

        it('should throw an error if the host is empty', () => {
            expect(() => parseUri('')).to.throw(Error, 'Invalid URI');
        });
    });
});

'use strict';

/* eslint-env node, mocha */

const PassThrough = require('stream').PassThrough;
const authenticationManager = require('../../../lib/Authentication/AuthenticationManager');
const expect = require('chai').expect;
const mysql41Auth = require('../../../lib/Authentication/MySQL41Auth');
const plainAuth = require('../../../lib/Authentication/PlainAuth');
const sha256MemoryAuth = require('../../../lib/Authentication/SHA256MemoryAuth');
const td = require('testdouble');
const tk = require('timekeeper');

// Subjects under test with dependency replacements
let Session = require('../../../lib/DevAPI/Session');

describe('Session', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('constructor', () => {
        let deprecated;

        beforeEach('create fakes', () => {
            deprecated = td.replace('../../../lib/DevAPI/Util/deprecated');
            Session = require('../../../lib/DevAPI/Session');
        });

        it('does not throw an error if the session configuration is not provided', () => {
            expect(() => new Session()).to.not.throw(Error);
        });

        it('does not throw an error if the session configuration is incomplete', () => {
            expect(() => new Session({})).to.not.throw(Error);
        });

        it('creates a session using sane defaults', () => {
            // TODO(Rui): remove "dbUser" after deprecation period
            const saneDefaults = {
                auth: 'PLAIN',
                dbUser: '',
                host: 'localhost',
                pooling: false,
                port: 33060,
                schema: undefined,
                socket: undefined,
                ssl: true,
                user: ''
            };

            expect((new Session()).inspect()).to.deep.equal(saneDefaults);
            expect((new Session(`mysqlx://localhost`)).inspect()).to.deep.equal(saneDefaults);
        });

        it('throws an error if the port is not in the appropriate range', () => {
            [-1, 65537].forEach(port => expect(() => new Session({ port })).to.throw('Port must be between 0 and 65536'));
        });

        context('enable SRV resolution', () => {
            // TODO(Rui): this kind of property inspection should not happen, but the test is useful while the the code isn't refactored
            it('assigns the requested host for SRV resolution', () => {
                const session1 = new Session({ host: 'foo' });
                const session2 = new Session({ endpoints: [{ host: 'bar' }] });

                expect(session1._requestedHost).to.equal('foo');
                expect(session2._requestedHost).to.equal('bar');
            });

            it('throws an error for connections over UNIX sockets', () => {
                expect(() => new Session({ resolveSrv: true, socket: '/path/to/unix/socket.sock' })).to.throw('Using Unix domain sockets with DNS SRV lookup is not allowed.');
                expect(() => new Session({ endpoints: [{ socket: '/path/to/unix/socket.sock' }], resolveSrv: true })).to.throw('Using Unix domain sockets with DNS SRV lookup is not allowed.');
            });

            it('throws an error if a port is specified', () => {
                expect(() => new Session({ port: 33061, resolveSrv: true })).to.throw('Specifying a port number with DNS SRV lookup is not allowed.');
                expect(() => new Session({ endpoints: [{ port: 33061 }], resolveSrv: true })).to.throw('Specifying a port number with DNS SRV lookup is not allowed.');
            });

            it('throws an error when multiple hostnames are specified', () => {
                expect(() => new Session({ endpoints: [{ host: 'foo' }, { host: 'bar' }], resolveSrv: true })).to.throw('Specifying multiple hostnames with DNS SRV lookup is not allowed.');
            });
        });

        it('issues a deprecation warning for "dbPassword"', () => {
            // eslint-disable-next-line no-new
            new Session({ dbPassword: 'foo' });

            expect(td.explain(deprecated).callCount).to.equal(1);
            expect(td.explain(deprecated).calls[0].args[0]).to.equal('The "dbPassword" property is deprecated since 8.0.22 and will be removed in future versions. Use "password" instead.');
        });

        it('issues a deprecation warning for "dbUser"', () => {
            // eslint-disable-next-line no-new
            new Session({ dbUser: 'foo' });

            expect(td.explain(deprecated).callCount).to.equal(1);
            expect(td.explain(deprecated).calls[0].args[0]).to.equal('The "dbUser" property is deprecated since 8.0.22 and will be removed in future versions. Use "user" instead.');
        });
    });

    context('getSchema()', () => {
        it('returns an instance of Schema using the given name', () => {
            const schema = (new Session({})).getSchema('foobar');

            expect(schema.getCollection).to.be.a('function');
            expect(schema.getCollections).to.be.a('function');
            expect(schema.getTable).to.be.a('function');
            expect(schema.getTables).to.be.a('function');
            return expect(schema.getName()).to.equal('foobar');
        });
    });

    context('getDefaultSchema()', () => {
        it('returns the default Schema instance bound to the session', () => {
            const session = new Session({ schema: 'foo' });
            const schema = session.getDefaultSchema();

            expect(schema.getCollection).to.be.a('function');
            expect(schema.getCollections).to.be.a('function');
            expect(schema.getTable).to.be.a('function');
            expect(schema.getTables).to.be.a('function');
            return expect(schema.getName()).to.equal('foo');
        });
    });

    context('server access methods', () => {
        let Client, net, socket;

        beforeEach('load the available authentication plugins', () => {
            authenticationManager.registerPlugin(plainAuth);
            authenticationManager.registerPlugin(mysql41Auth);
            authenticationManager.registerPlugin(sha256MemoryAuth);
        });

        beforeEach('create fakes', () => {
            Client = td.replace('../../../lib/Protocol/Client');
            net = td.replace('net');

            socket = new PassThrough();
            td.replace(socket, 'setTimeout', td.function());

            Session = require('../../../lib/DevAPI/Session');
        });

        context('connect()', () => {
            it('fails if the connection timeout is not a non-negative integer value', () => {
                const invalid = [-1, 2.2, 'foo', {}, [], () => {}];
                const expected = invalid.map(() => 'The connection timeout value must be a positive integer (including 0).');
                const actual = [];

                return Promise.all(
                    invalid.map(connectTimeout => {
                        return (new Session({ connectTimeout, password: 'bar', ssl: false, user: 'foo' }))
                            .connect()
                            .catch(err => actual.push(err.message));
                    }))
                    .then(() => {
                        expect(actual).to.deep.equal(expected);
                    });
            });

            it('fails if the connection timeout is exceeded for a single host', () => {
                const connectTimeout = 10;
                const properties = { connectTimeout, password: 'bar', ssl: false, user: 'foo' };
                const session = new Session(properties);
                const error = `Connection attempt to the server was aborted. Timeout of ${connectTimeout} ms was exceeded.`;

                td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);

                setTimeout(() => socket.emit('timeout'), 0);

                return session.connect()
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(error));
            });

            it('fails if the connection timeout is exceeded for a multiple hosts', () => {
                const connectTimeout = 10;
                const properties = { connectTimeout, password: 'bar', endpoints: [{ host: 'baz' }, { host: 'qux' }], user: 'foo' };
                const session = new Session(properties);
                const error = `All server connection attempts were aborted. Timeout of ${connectTimeout} ms was exceeded for each selected server.`;

                td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);

                setTimeout(() => {
                    socket.emit('timeout');
                    setTimeout(() => socket.emit('timeout'));
                });

                return session.connect()
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.deep.equal(error));
            });

            it('returns a clean object with the session properties', () => {
                const properties = { auth: 'PLAIN', password: 'bar', ssl: false, user: 'foo', connectionAttributes: false };
                const session = new Session(properties);
                const expected = { user: 'foo' };

                td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                setTimeout(() => socket.emit('connect'));

                return session.connect()
                    .then(session => expect(session.inspect()).to.deep.include(expected));
            });

            it('closes the internal stream if there is an error', () => {
                const session = new Session();
                const end = td.function();

                td.replace(session, '_client', { _stream: { end } });
                td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);

                setTimeout(() => socket.emit('error', new Error()));
                setTimeout(() => socket.emit('close', true));

                return session.connect()
                    .then(() => expect.fail())
                    .catch(() => expect(td.explain(end).callCount).to.equal(1));
            });

            context('secure connection', () => {
                it('is able to setup a SSL/TLS connection', () => {
                    const properties = { password: 'bar', ssl: true, user: 'foo', connectionAttributes: false };
                    const session = new Session(properties);
                    const expected = { 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] };

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenResolve();
                    td.when(Client.prototype.capabilitiesGet()).thenResolve(expected);
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(() => expect(session._serverCapabilities).to.deep.equal(expected));
                });

                it('does not try to setup a SSL/TLS connection if no such intent is specified', () => {
                    const properties = { password: 'bar', ssl: false, user: 'foo', connectionAttributes: false };
                    const session = new Session(properties);

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(() => {
                            expect(td.explain(Client.prototype.enableTLS).callCount).to.equal(0);
                            return expect(session._serverCapabilities.tls).to.be.undefined;
                        });
                });

                it('fails if an error is thrown in the SSL setup', () => {
                    const properties = { password: 'bar', ssl: true, user: 'foo' };
                    const session = new Session(properties);

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenReject(new Error());
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(() => expect.fail())
                        .catch(() => expect(session._serverCapabilities).to.be.empty);
                });

                it('enables TLS/SSL if the server supports it', () => {
                    const properties = { user: 'foo', password: 'bar', connectionAttributes: false };
                    const session = new Session(properties);

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenResolve();
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include({ ssl: true }));
                });

                it('fails if the server does not support TLS/SSL', () => {
                    const properties = { password: 'bar', user: 'foo' };
                    const session = new Session(properties);
                    const error = new Error();
                    error.info = { code: 5001 };

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenReject(error);
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(() => expect.fail())
                        .catch(err => expect(err).to.deep.equal(error));
                });

                it('selects the default authentication mechanism', () => {
                    const properties = { password: 'bar', user: 'foo', connectionAttributes: false };
                    const session = new Session(properties);

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenResolve();
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'PLAIN' }));
                });

                it('overrides the default authentication mechanism with the one provided by the user', () => {
                    const properties = { auth: 'MYSQL41', password: 'bar', user: 'foo', connectionAttributes: false };
                    const session = new Session(properties);

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenResolve();
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'MYSQL41' }));
                });
            });

            context('insecure connections', () => {
                it('selects the default authentication mechanism', () => {
                    const properties = { password: 'bar', ssl: false, user: 'foo', connectionAttributes: false };
                    const session = new Session(properties);

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => socket.emit('connect'));

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'MYSQL41' }));
                });
            });

            context('failover', () => {
                it('failovers to the next available address if the connection fails', () => {
                    const endpoints = [{ host: 'foo', port: 1, priority: 100 }, { host: 'bar', port: 2, priority: 99 }];
                    const properties = { password: 'qux', endpoints, ssl: false, user: 'baz', connectionAttributes: false };
                    const session = new Session(properties);
                    const expected = { host: 'bar', port: 2, user: 'baz' };

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => {
                        socket.emit('close', true);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('fails if there are no remaining failover addresses', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { endpoints };
                    const session = new Session(properties);

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);

                    setTimeout(() => {
                        socket.emit('close', true);
                        setTimeout(() => socket.emit('close', true));
                    });

                    return session.connect()
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.message).to.equal('Unable to connect to any of the target hosts.');
                            expect(err.errno).to.equal(4001);
                        });
                });

                it('resets the connection availability constraints when all endpoints are unavailable', () => {
                    const endpoints = [{ host: 'foo', port: 1, priority: 100 }, { host: 'bar', port: 2, priority: 99 }];
                    const properties = { password: 'qux', endpoints, ssl: false, user: 'baz', connectionAttributes: false };
                    const session = new Session(properties);
                    const expected = { host: 'foo', port: 1, user: 'baz' };

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => {
                        socket.emit('close', true);
                        setTimeout(() => {
                            socket.emit('close', true);
                            setTimeout(() => socket.emit('connect'));
                        });
                    });

                    return session.connect()
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.message).to.equal('Unable to connect to any of the target hosts.');

                            // ensure there is enough time for the host to become available once again (MULTIHOST_RETRY)
                            tk.travel(new Date(Date.now() + 20000));

                            return session.connect()
                                .then(session => expect(session.inspect()).to.deep.include(expected))
                                .then(() => tk.reset());
                        });
                });

                it('selects the default authentication mechanism for secure connections', () => {
                    const endpoints = [{ host: 'foo', port: 1, priority: 100 }, { host: 'bar', port: 2, priority: 99 }];
                    const properties = { password: 'qux', endpoints, ssl: true, user: 'baz', connectionAttributes: false };
                    const session = new Session(properties);
                    const expected = { auth: 'PLAIN', host: 'bar', port: 2, ssl: true, user: 'baz' };

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenResolve();
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => {
                        socket.emit('close', true);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('selects the default authentication mechanism for insecure connections', () => {
                    const endpoints = [{ host: 'foo', port: 1, priority: 100 }, { host: 'bar', port: 2, priority: 99 }];
                    const properties = { password: 'qux', endpoints, ssl: false, user: 'baz', connectionAttributes: false };
                    const session = new Session(properties);
                    const expected = { auth: 'MYSQL41', host: 'bar', port: 2, ssl: false, user: 'baz' };

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenResolve();
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(Client.prototype.authenticate(), { ignoreExtraArgs: true }).thenResolve();

                    setTimeout(() => {
                        socket.emit('close', true);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('overrides the default authentication mechanism with the one provided by the user', () => {
                    const endpoints = [{ host: 'foo', port: 1, priority: 100 }, { host: 'bar', port: 2, priority: 99 }];
                    const properties = { auth: 'MYSQL41', password: 'qux', endpoints, ssl: true, user: 'baz', connectionAttributes: false };
                    const session = new Session(properties);
                    const expected = { auth: 'MYSQL41', host: 'bar', port: 2, ssl: true, user: 'baz' };

                    td.when(net.connect(), { ignoreExtraArgs: true }).thenReturn(socket);
                    td.when(Client.prototype.enableTLS({ enabled: true })).thenResolve();
                    td.when(Client.prototype.capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    setTimeout(() => {
                        socket.emit('close', true);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return session.connect()
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });
            });
        });

        context('getSchemas()', () => {
            let sqlExecute, execute;

            beforeEach('create fakes', () => {
                execute = td.function();
                sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
                Session = require('../../../lib/DevAPI/Session');
            });

            it('returns a list with the existing schemas', () => {
                const session = new Session({});
                const getSchema = td.replace(session, 'getSchema');
                const name = 'foobar';
                const schema = { name };
                const expected = [schema];

                td.when(execute(td.callback([name]))).thenResolve(expected);
                td.when(sqlExecute(session, 'SHOW DATABASES')).thenReturn({ execute });
                td.when(getSchema(name)).thenReturn(schema);

                return session.getSchemas()
                    .then(actual => expect(actual).to.deep.equal(expected));
            });

            it('fails if an expected error is thrown', () => {
                const session = new Session({});
                const getSchema = td.replace(session, 'getSchema');
                const name = 'foobar';
                const schema = { name };
                const error = new Error('foobar');

                td.when(execute(td.callback([name]))).thenReject(error);
                td.when(sqlExecute(session, 'SHOW DATABASES')).thenReturn({ execute });
                td.when(getSchema(name)).thenReturn(schema);

                return session.getSchemas()
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });
        });

        context('createSchema()', () => {
            let sqlExecute, execute;

            beforeEach('create fakes', () => {
                execute = td.function();
                sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
                Session = require('../../../lib/DevAPI/Session');
            });

            it('creates and return a new schema', () => {
                const session = new Session({});
                const schema = 'foobar';
                const expected = { schema };

                session.getSchema = td.function();

                td.when(execute()).thenResolve();
                td.when(sqlExecute(session, `CREATE DATABASE \`${schema}\``)).thenReturn({ execute });
                td.when(session.getSchema(schema)).thenReturn(expected);

                return session.createSchema(schema)
                    .then(actual => expect(actual).to.deep.equal(expected));
            });
        });

        context('dropSchema()', () => {
            let sqlExecute, execute;

            beforeEach('create fakes', () => {
                execute = td.function();
                sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
                Session = require('../../../lib/DevAPI/Session');
            });

            it('returns true if the schema was dropped', () => {
                const session = new Session({});

                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return session.dropSchema('foo')
                    .then(actual => expect(actual).to.be.true);
            });

            it('returns true if the schema does not exist', () => {
                const session = new Session({});
                const error = new Error();
                error.info = { code: 1008 };

                td.when(execute()).thenReject(error);
                td.when(sqlExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return session.dropSchema('foo')
                    .then(actual => expect(actual).to.be.true);
            });

            it('fails if an unexpected error was thrown', () => {
                const session = new Session({});
                const error = new Error('foobar');

                td.when(execute()).thenReject(error);
                td.when(sqlExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return session.dropSchema('foo')
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });
        });

        context('setSavepoint()', () => {
            let sqlExecute, execute;

            beforeEach('create fakes', () => {
                execute = td.function();
                sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
                Session = require('../../../lib/DevAPI/Session');
            });

            it('creates a savepoint with a generated name if no name is passed', () => {
                const session = new Session({});

                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^SAVEPOINT `connector-nodejs-[a-f0-9]{32}`$/))).thenReturn({ execute });

                return session.setSavepoint()
                    .then(actual => expect(actual).to.be.a('string').and.not.be.empty);
            });

            it('creates a savepoint with the given name', () => {
                const session = new Session({});

                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^SAVEPOINT `foo`$/))).thenReturn({ execute });

                return session.setSavepoint('foo')
                    .then(actual => expect(actual).to.equal('foo'));
            });

            it('throws an error if name provided is invalid', () => {
                return (new Session({})).setSavepoint(null)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });
        });

        context('releaseSavepoint()', () => {
            let sqlExecute, execute;

            beforeEach('create fakes', () => {
                execute = td.function();
                sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
                Session = require('../../../lib/DevAPI/Session');
            });

            it('releases the savepoint', () => {
                const session = new Session({});

                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^RELEASE SAVEPOINT `foo`$/))).thenReturn({ execute });

                return session.releaseSavepoint('foo');
            });

            it('throws an error if name is not provided', () => {
                return (new Session({})).releaseSavepoint()
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('throws an error if name provided is invalid', () => {
                return (new Session({})).releaseSavepoint(null)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });
        });

        context('rollbackTo()', () => {
            let sqlExecute, execute;

            beforeEach('create fakes', () => {
                execute = td.function();
                sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
                Session = require('../../../lib/DevAPI/Session');
            });

            it('rolbacks to the savepoint', () => {
                const session = new Session({});

                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^ROLLBACK TO SAVEPOINT `foo`$/))).thenReturn({ execute });

                return session.rollbackTo('foo');
            });

            it('throws an error if name is not provided', () => {
                return (new Session({})).rollbackTo()
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('throws an error if name provided is invalid', () => {
                return (new Session({})).rollbackTo(null)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });
        });
    });

    context('executeSql()', () => {
        let sqlExecute;

        beforeEach('create fakes', () => {
            sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            Session = require('../../../lib/DevAPI/Session');
        });

        it('creates a sqlExecute query with a given statement', () => {
            const session = new Session({});

            session.executeSql('foo');

            expect(td.explain(sqlExecute).callCount).to.equal(1);
            expect(td.explain(sqlExecute).calls[0].args[0]).to.deep.equal(session);
            expect(td.explain(sqlExecute).calls[0].args[1]).to.deep.equal('foo');
        });

        it('creates a sqlExecute query with optional arguments', () => {
            const session = new Session({});

            session.executeSql('foo', 'bar', 'baz');

            expect(td.explain(sqlExecute).callCount).to.equal(1);
            expect(td.explain(sqlExecute).calls[0].args[0]).to.deep.equal(session);
            expect(td.explain(sqlExecute).calls[0].args[1]).to.deep.equal('foo');
            expect(td.explain(sqlExecute).calls[0].args[2]).to.deep.equal(['bar', 'baz']);
        });

        it('creates a sqlExecute query with optional arguments provided as an array', () => {
            const session = new Session({});

            session.executeSql('foo', ['bar', 'baz']);

            expect(td.explain(sqlExecute).callCount).to.equal(1);
            expect(td.explain(sqlExecute).calls[0].args[0]).to.deep.equal(session);
            expect(td.explain(sqlExecute).calls[0].args[1]).to.deep.equal('foo');
            expect(td.explain(sqlExecute).calls[0].args[2]).to.deep.equal(['bar', 'baz']);
        });
    });

    context('sql()', () => {
        let sqlExecute;

        beforeEach('create fakes', () => {
            sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            Session = require('../../../lib/DevAPI/Session');
        });

        it('creates a sqlExecute query with a given statement', () => {
            const session = new Session({});

            session.sql('foo');

            expect(td.explain(sqlExecute).callCount).to.equal(1);
            expect(td.explain(sqlExecute).calls[0].args[0]).to.deep.equal(session);
            expect(td.explain(sqlExecute).calls[0].args[1]).to.deep.equal('foo');
        });
    });

    context('close()', () => {
        it('succeeds if the session is closed', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { sessionClose: td.function() });

            td.when(client.sessionClose()).thenResolve();

            return session.close();
        });

        it('succeeds if the session is not usable', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { sessionClose: td.function() });

            session._isOpen = false;

            return session.close()
                .then(() => expect(td.explain(client.sessionClose).callCount).to.equal(0));
        });

        it('fails if there is an error while closing the session', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { sessionClose: td.function() });
            const error = new Error('foobar');

            session._isOpen = true;

            td.when(client.sessionClose()).thenReject(error);

            return session.close()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('reset()', () => {
        it('succeeds if the session is reset', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { sessionReset: td.function() });

            td.when(client.sessionReset()).thenResolve();

            return session.reset()
                .then(actual => expect(actual).to.deep.equal(session));
        });

        it('fails if there is an error while resetting the session', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { sessionReset: td.function() });
            const error = new Error('foobar');

            td.when(client.sessionReset()).thenReject(error);

            return session.reset()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    // TODO(Rui): should be the responsability of a connection management module
    context('disconnect()', () => {
        it('succeeds if the connection is closed', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { connectionClose: td.function() });

            td.when(client.connectionClose()).thenResolve();

            return session.disconnect();
        });

        it('succeeds if the connection is not usable', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { connectionClose: td.function() });

            session._isOpen = false;

            return session.disconnect()
                .then(() => expect(td.explain(client.connectionClose).callCount).to.equal(0));
        });

        it('fails if there is an error while closing the connection', () => {
            const session = new Session({});
            const client = td.replace(session, '_client', { connectionClose: td.function() });
            const error = new Error('foobar');

            session._isOpen = true;

            td.when(client.connectionClose()).thenReject(error);

            return session.disconnect()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });
});

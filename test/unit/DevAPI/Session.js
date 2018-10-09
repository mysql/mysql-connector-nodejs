'use strict';

/* eslint-env node, mocha */

const Client = require('lib/Protocol/Client');
const PassThrough = require('stream').PassThrough;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Session', () => {
    let Session, connect, execute, sqlExecute;

    beforeEach('create fakes', () => {
        connect = td.function();
        execute = td.function();
        sqlExecute = td.function();

        Session = proxyquire('lib/DevAPI/Session', { './SqlExecute': sqlExecute, 'net': { connect } });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('constructor', () => {
        it('should not throw an error if the session configuration is not provided', () => {
            expect(() => new Session()).to.not.throw(Error);
        });

        it('should not throw an error if the session configuration is incomplete', () => {
            expect(() => new Session({})).to.not.throw(Error);
        });

        it('should create a session using sane defaults', () => {
            expect((new Session()).inspect()).to.deep.equal({
                auth: 'PLAIN',
                dbUser: '',
                host: 'localhost',
                pooling: false,
                port: 33060,
                socket: undefined,
                ssl: true,
                user: ''
            });
        });

        it('should throw an error if the port is not in the appropriate range', () => {
            [-1, 65537].forEach(port => expect(() => new Session({ port })).to.throw('Port must be between 0 and 65536'));
        });
    });

    context('getSchema()', () => {
        it('should return a Schema instance', () => {
            const schema = (new Session({})).getSchema('foobar');

            expect(schema.getClassName()).to.equal('Schema');
        });

        it('should return a schema with the given name', () => {
            const schema = (new Session({})).getSchema('foobar');

            expect(schema.getName()).to.equal('foobar');
        });
    });

    context('server access methods', () => {
        let authenticate, capabilitiesGet, clientProto;

        beforeEach('create fakes', () => {
            clientProto = Object.assign({}, Client.prototype);

            authenticate = td.function();
            capabilitiesGet = td.function();

            Client.prototype.authenticate = authenticate;
            Client.prototype.capabilitiesGet = capabilitiesGet;

            td.when(authenticate(), { ignoreExtraArgs: true }).thenResolve();
        });

        afterEach(() => {
            Client.prototype = clientProto;
        });

        context('connect()', () => {
            let socket;

            beforeEach(() => {
                socket = new PassThrough();
                socket.setTimeout = td.function();

                td.when(connect(), { ignoreExtraArgs: true }).thenReturn(socket);
            });

            it('should fail if the connection timeout is not a non-negative integer value', () => {
                const invalid = [-1, 2.2, 'foo', {}, [], () => {}];
                const expected = invalid.map(() => 'The connection timeout value must be a positive integer (including 0).');
                const actual = [];

                return expect(Promise.all(
                    invalid.map(connectTimeout => {
                        return (new Session({ connectTimeout, dbPassword: 'bar', ssl: false, user: 'foo' }))
                            .connect()
                            .catch(err => actual.push(err.message));
                    }))).to.be.fulfilled
                    .then(() => {
                        expect(actual).to.deep.equal(expected);
                    });
            });

            it('should fail if the connection timeout is exceeded for a single host', () => {
                const connectTimeout = 10;
                const properties = { connectTimeout, dbPassword: 'bar', ssl: false, user: 'foo' };
                const session = new Session(properties);
                const error = `Connection attempt to the server was aborted. Timeout of ${connectTimeout} ms was exceeded.`;

                setTimeout(() => socket.emit('timeout'), 0);

                return expect(session.connect()).to.be.rejectedWith(error);
            });

            it('should fail if the connection timeout is exceeded for a multiple hosts', () => {
                const connectTimeout = 10;
                const properties = { connectTimeout, dbPassword: 'bar', endpoints: [{ host: 'baz' }, { host: 'qux' }], user: 'foo' };
                const session = new Session(properties);
                const error = `All server connection attempts were aborted. Timeout of ${connectTimeout} ms was exceeded for each selected server.`;

                setTimeout(() => {
                    socket.emit('timeout');
                    setTimeout(() => socket.emit('timeout'));
                });

                return expect(session.connect()).to.be.rejectedWith(error);
            });

            it('should return a clean object with the session properties', () => {
                const properties = { auth: 'PLAIN', dbPassword: 'bar', ssl: false, user: 'foo' };
                const session = new Session(properties);
                const expected = { user: 'foo' };

                td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                setTimeout(() => socket.emit('connect'));

                return expect(session.connect()).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.include(expected));
            });

            it('should close the internal stream if there is an error', () => {
                const session = new Session();
                const end = td.function();

                session._client._stream = { end };

                setTimeout(() => socket.emit('error', new Error()));

                return expect(session.connect()).to.be.rejected
                    .then(() => expect(td.explain(end).callCount).to.equal(1));
            });

            context('secure connection', () => {
                let enableSSL;

                beforeEach('create fakes', () => {
                    enableSSL = td.function();

                    Client.prototype.enableSSL = enableSSL;
                });

                it('should be able to setup a SSL/TLS connection', () => {
                    const properties = { dbPassword: 'bar', ssl: true, user: 'foo' };
                    const session = new Session(properties);
                    const expected = { 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] };

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve(expected);

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.fulfilled
                        .then(() => expect(session._serverCapabilities).to.deep.equal(expected));
                });

                it('should not try to setup a SSL/TLS connection if no such intent is specified', () => {
                    const properties = { dbPassword: 'bar', ssl: false, user: 'foo' };
                    const session = new Session(properties);

                    td.when(enableSSL(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.fulfilled
                        .then(() => {
                            expect(td.explain(enableSSL).callCount).to.equal(0);
                            return expect(session._serverCapabilities.tls).to.be.undefined;
                        });
                });

                it('should fail if an error is thrown in the SSL setup', () => {
                    const properties = { dbPassword: 'bar', ssl: true, user: 'foo' };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenReject(new Error());
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.rejected
                        .then(() => expect(session._serverCapabilities).to.be.empty);
                });

                it('should pass down any custom SSL/TLS-related option', () => {
                    const properties = { dbPassword: 'bar', sslOptions: { foo: 'bar' }, user: 'foo' };
                    const session = new Session(properties);

                    td.when(enableSSL({ foo: 'bar' })).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.fulfilled;
                });

                it('should enable TLS/SSL if the server supports it', () => {
                    const properties = { user: 'foo', dbPassword: 'bar' };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include({ ssl: true }));
                });

                it('should fail if the server does not support TLS/SSL', () => {
                    const properties = { dbPassword: 'bar', user: 'foo' };
                    const session = new Session(properties);
                    const error = new Error();
                    error.info = { code: 5001 };

                    td.when(enableSSL({})).thenReject(error);
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.rejected;
                });

                it('should select the default authentication mechanism', () => {
                    const properties = { dbPassword: 'bar', user: 'foo' };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'PLAIN' }));
                });

                it('should override the default authentication mechanism with the one provided by the user', () => {
                    const properties = { auth: 'MYSQL41', dbPassword: 'bar', user: 'foo' };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'MYSQL41' }));
                });
            });

            context('insecure connections', () => {
                it('should select the default authentication mechanism', () => {
                    const properties = { dbPassword: 'bar', ssl: false, user: 'foo' };
                    const session = new Session(properties);

                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => socket.emit('connect'));

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'MYSQL41' }));
                });
            });

            context('failover', () => {
                let enableSSL;

                beforeEach('create fakes', () => {
                    enableSSL = td.function();

                    Client.prototype.enableSSL = enableSSL;
                });

                it('should failover to the next available address if the connection fails', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { dbPassword: 'qux', endpoints, ssl: false, user: 'baz' };
                    const session = new Session(properties);
                    const expected = { host: 'bar', port: 2, user: 'baz' };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => {
                        socket.emit('error', error);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should fail if there are no remaining failover addresses', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { endpoints };
                    const session = new Session(properties);

                    const error = new Error('foo');
                    error.code = 'ENOTFOUND';

                    setTimeout(() => {
                        socket.emit('error', error);
                        setTimeout(() => socket.emit('error', error));
                    });

                    return expect(session.connect()).to.be.rejected.then(err => {
                        expect(err.message).to.equal('All server connection attempts have failed. (last: foo)');
                        expect(err.errno).to.equal(4001);
                    });
                });

                it('should fail if an unexpected error is thrown', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { endpoints };
                    const session = new Session(properties);
                    const error = new Error('foobar');

                    setTimeout(() => socket.emit('error', error));

                    return expect(session.connect()).to.be.rejectedWith(error);
                });

                it('should reset the connection availability constraints when all routers are unavailable', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { dbPassword: 'qux', endpoints, ssl: false, user: 'baz' };
                    const session = new Session(properties);
                    const expected = { host: 'foo', port: 1, user: 'baz' };

                    const error = new Error('foo');
                    error.code = 'ENOTFOUND';

                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => {
                        socket.emit('error', error);
                        setTimeout(() => {
                            socket.emit('error', error);
                            setTimeout(() => socket.emit('connect'));
                        });
                    });

                    return expect(session.connect()).to.be.rejectedWith('All server connection attempts have failed. (last: foo)')
                        .then(() => {
                            return expect(session.connect()).to.be.fulfilled;
                        })
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should select the default authentication mechanism for secure connections', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { dbPassword: 'qux', endpoints, ssl: true, user: 'baz' };
                    const session = new Session(properties);
                    const expected = { auth: 'PLAIN', host: 'bar', port: 2, ssl: true, user: 'baz' };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    setTimeout(() => {
                        socket.emit('error', error);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should select the default authentication mechanism for insecure connections', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { dbPassword: 'qux', endpoints, ssl: false, user: 'baz' };
                    const session = new Session(properties);
                    const expected = { auth: 'MYSQL41', host: 'bar', port: 2, ssl: false, user: 'baz' };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    setTimeout(() => {
                        socket.emit('error', error);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should override the default authentication mechanism with the one provided by the user', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { auth: 'MYSQL41', dbPassword: 'qux', endpoints, ssl: true, user: 'baz' };
                    const session = new Session(properties);
                    const expected = { auth: 'MYSQL41', host: 'bar', port: 2, ssl: true, user: 'baz' };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    setTimeout(() => {
                        socket.emit('error', error);
                        setTimeout(() => socket.emit('connect'));
                    });

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });
            });
        });

        context('getSchemas()', () => {
            it('should return a list with the existing schemas', () => {
                const session = new Session({});
                const name = 'foobar';
                const schema = { name };
                const expected = [schema];

                session.getSchema = td.function();

                td.when(execute(td.callback([name]))).thenResolve(expected);
                td.when(sqlExecute(session, 'SHOW DATABASES')).thenReturn({ execute });
                td.when(session.getSchema(name)).thenReturn(schema);

                return expect(session.getSchemas()).to.eventually.deep.equal(expected);
            });

            it('should fail if an expected error is thrown', () => {
                const session = new Session({});
                const name = 'foobar';
                const schema = { name };
                const error = new Error('foobar');

                session.getSchema = td.function();

                td.when(execute(td.callback([name]))).thenReject(error);
                td.when(sqlExecute(session, 'SHOW DATABASES')).thenReturn({ execute });
                td.when(session.getSchema(name)).thenReturn(schema);

                return expect(session.getSchemas()).to.be.rejectedWith(error);
            });
        });

        context('getDefaultSchema()', () => {
            it('should return the default schema bound to the session', () => {
                const session = new Session({ schema: 'foo' });
                const schema = session.getDefaultSchema();

                expect(schema.getClassName()).to.equal('Schema');
                return expect(schema.getName()).to.equal('foo');
            });
        });

        context('createSchema()', () => {
            it('should create and return a new schema', () => {
                const session = new Session({});
                const schema = 'foobar';
                const expected = { schema };

                session.getSchema = td.function();

                td.when(execute()).thenResolve();
                td.when(sqlExecute(session, `CREATE DATABASE \`${schema}\``)).thenReturn({ execute });
                td.when(session.getSchema(schema)).thenReturn(expected);

                return expect(session.createSchema(schema)).to.eventually.deep.equal(expected);
            });
        });

        context('dropSchema()', () => {
            it('should return true if the schema was dropped', () => {
                const session = new Session({});

                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return expect(session.dropSchema('foo')).to.eventually.be.true;
            });

            it('should return true if the schema does not exist', () => {
                const session = new Session({});
                const error = new Error();
                error.info = { code: 1008 };

                td.when(execute()).thenReject(error);
                td.when(sqlExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return expect(session.dropSchema('foo')).to.eventually.be.true;
            });

            it('should fail if an unexpected error was thrown', () => {
                const session = new Session({});
                const error = new Error('foobar');

                td.when(execute()).thenReject(error);
                td.when(sqlExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return expect(session.dropSchema('foo')).to.eventually.be.rejectedWith(error);
            });
        });

        context('setSavepoint()', () => {
            it('should create a savepoint with a generated name if no name is passed', () => {
                const session = new Session({});
                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^SAVEPOINT `connector-nodejs-[a-f0-9]{32}`$/))).thenReturn({ execute });
                return expect(session.setSavepoint()).to.eventually.be.a('string').and.not.be.empty;
            });

            it('should create a savepoint with the given name', () => {
                const session = new Session({});
                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^SAVEPOINT `foo`$/))).thenReturn({ execute });
                return expect(session.setSavepoint('foo')).to.eventually.be.equal('foo');
            });

            it('should throw an error if name provided is invalid', () => {
                return expect((new Session({})).setSavepoint(null)).to.be.rejected;
            });
        });

        context('releaseSavepoint()', () => {
            it('should release the savepoint', () => {
                const session = new Session({});
                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^RELEASE SAVEPOINT `foo`$/))).thenReturn({ execute });
                return expect(session.releaseSavepoint('foo')).to.be.fulfilled;
            });

            it('should throw an error if name is not provided', () => {
                return expect((new Session({})).releaseSavepoint()).to.be.rejected;
            });

            it('should throw an error if name provided is invalid', () => {
                return expect((new Session({})).releaseSavepoint(null)).to.be.rejected;
            });
        });

        context('rollbackTo()', () => {
            it('should rolback to the savepoint', () => {
                const session = new Session({});
                td.when(execute()).thenResolve(true);
                td.when(sqlExecute(session, td.matchers.contains(/^ROLLBACK TO SAVEPOINT `foo`$/))).thenReturn({ execute });
                return expect(session.rollbackTo('foo')).to.be.fulfilled;
            });

            it('should throw an error if name is not provided', () => {
                return expect((new Session({})).rollbackTo()).to.be.rejected;
            });

            it('should throw an error if name provided is invalid', () => {
                return expect((new Session({})).rollbackTo(null)).to.be.rejected;
            });
        });
    });

    context('executeSql()', () => {
        it('should create a sqlExecute query with a given statement', () => {
            const session = new Session({});

            td.when(sqlExecute(session, 'foo')).thenReturn();

            session.executeSql('foo');

            expect(td.explain(sqlExecute).callCount).to.equal(1);
        });

        it('should create a sqlExecute query with optional arguments', () => {
            const session = new Session({});

            td.when(sqlExecute(session, 'foo', ['bar', 'baz'])).thenReturn();

            session.executeSql('foo', 'bar', 'baz');

            expect(td.explain(sqlExecute).callCount).to.equal(1);
        });

        it('should create a sqlExecute query with optional arguments provided as an array', () => {
            const session = new Session({});

            td.when(sqlExecute(session, 'foo', ['bar', 'baz'])).thenReturn();

            session.executeSql('foo', ['bar', 'baz']);

            expect(td.explain(sqlExecute).callCount).to.equal(1);
        });
    });

    context('sql()', () => {
        it('should create a sqlExecute query with a given statement', () => {
            const session = new Session({});

            td.when(sqlExecute(session, 'foo')).thenReturn();

            session.sql('foo');

            expect(td.explain(sqlExecute).callCount).to.equal(1);
        });
    });

    context('close()', () => {
        let sessionClose;

        beforeEach('create fakes', () => {
            sessionClose = td.function();
        });

        it('should succeed if the session is closed', () => {
            const session = new Session({});
            session._client = { sessionClose };

            td.when(sessionClose()).thenResolve();

            return expect(session.close()).to.eventually.be.fulfilled;
        });

        it('should succeed if the session is not usable', () => {
            const session = new Session({});
            session._client = { sessionClose };
            session._isOpen = false;

            return expect(session.close()).to.eventually.be.fulfilled
                .then(() => expect(td.explain(sessionClose).callCount).to.equal(0));
        });

        it('should fail if there is an error while closing the session', () => {
            const session = new Session({});
            session._client = { sessionClose };
            session._isOpen = true;

            const error = new Error('foobar');

            td.when(sessionClose()).thenReject(error);

            return expect(session.close()).to.eventually.be.rejectedWith(error);
        });
    });

    context('reset()', () => {
        let sessionReset;

        beforeEach('create fakes', () => {
            sessionReset = td.function();
        });

        it('should succeed if the session is reset', () => {
            const session = new Session({});
            session._client = { sessionReset };

            td.when(sessionReset()).thenResolve();

            return expect(session.reset()).to.eventually.deep.equal(session);
        });

        it('should fail if there is an error while resetting the session', () => {
            const session = new Session({});
            session._client = { sessionReset };

            const error = new Error('foobar');

            td.when(sessionReset()).thenReject(error);

            return expect(session.reset()).to.eventually.be.rejectedWith(error);
        });
    });

    // TODO(Rui): should be the responsability of a connection management module
    context('disconnect()', () => {
        let connectionClose;

        beforeEach('create fakes', () => {
            connectionClose = td.function();
        });

        it('should succeed if the connection is closed', () => {
            const session = new Session({});
            session._client = { connectionClose };

            td.when(connectionClose()).thenResolve();

            return expect(session.disconnect()).to.be.fulfilled;
        });

        it('should succeed if the connection is not usable', () => {
            const session = new Session({});
            session._client = { connectionClose };
            session._isOpen = false;

            return expect(session.disconnect()).to.eventually.be.fulfilled
                .then(() => expect(td.explain(connectionClose).callCount).to.equal(0));
        });

        it('should fail if there is an error while closing the connection', () => {
            const session = new Session({});
            session._client = { connectionClose };
            session._isOpen = true;

            const error = new Error('foobar');

            td.when(connectionClose()).thenReject(error);

            return expect(session.disconnect()).to.eventually.be.rejectedWith(error);
        });
    });
});

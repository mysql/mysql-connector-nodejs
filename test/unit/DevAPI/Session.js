'use strict';

/* eslint-env node, mocha */

const Client = require('lib/Protocol/Client');
const Duplex = require('stream').Duplex;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Session', () => {
    let Session, execute, stmtExecute;

    beforeEach('create fakes', () => {
        execute = td.function();
        stmtExecute = td.function();

        Session = proxyquire('lib/DevAPI/Session', { './StmtExecute': stmtExecute });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('constructor', () => {
        it('should override the idGenerator function with a custom one', () => {
            const expected = { foo: 'bar' };
            const idGenerator = () => expected;
            const session = new Session({ idGenerator });

            expect(session.idGenerator()).to.deep.equal(expected);
        });

        it('should use a new seed when generating UUIDs', () => {
            const session1 = new Session({});
            const session2 = new Session({});

            expect(session1.idGenerator().substring(0, 12)).to.not.equal(session2.idGenerator().substring(0, 12));
        });

        it('should throw an error if the properties are not provided', () => {
            expect(() => new Session()).to.throw(Error);
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
        let authenticate, capabilitiesGet, clientProto, createSocket;

        beforeEach('create fakes', () => {
            clientProto = Object.assign({}, Client.prototype);

            authenticate = td.function();
            capabilitiesGet = td.function();
            createSocket = td.function();

            Client.prototype.authenticate = authenticate;
            Client.prototype.capabilitiesGet = capabilitiesGet;

            td.when(authenticate(), { ignoreExtraArgs: true }).thenResolve();
            td.when(createSocket(), { ignoreExtraArgs: true }).thenResolve(new Duplex());
        });

        afterEach(() => {
            Client.prototype = clientProto;
        });

        context('connect()', () => {
            it('should return a clean object with the session properties', () => {
                const properties = { auth: 'PLAIN', dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, ssl: false };
                const session = new Session(properties);
                const expected = { dbUser: 'foo' };

                td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                return expect(session.connect()).to.be.fulfilled
                    .then(session => expect(session.inspect()).to.deep.include(expected));
            });

            it('should close the internal stream if there is an error', () => {
                // Not providing credentials should result in an authentication error.
                const properties = { socketFactory: { createSocket } };
                const session = new Session(properties);
                const stream = new Duplex();
                const streamStub = td.function();

                stream.end = streamStub;

                td.when(createSocket(), { ignoreExtraArgs: true }).thenResolve(stream);

                return expect(session.connect()).to.be.rejected
                    .then(() => expect(td.explain(streamStub).callCount).to.equal(1));
            });

            context('secure connection', () => {
                let enableSSL;

                beforeEach('create fakes', () => {
                    enableSSL = td.function();

                    Client.prototype.enableSSL = enableSSL;
                });

                it('should be able to setup a SSL/TLS connection', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, ssl: true };
                    const session = new Session(properties);
                    const expected = { 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] };

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve(expected);

                    return expect(session.connect()).to.be.fulfilled
                        .then(() => expect(session._serverCapabilities).to.deep.equal(expected));
                });

                it('should not try to setup a SSL/TLS connection if no such intent is specified', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, ssl: false };
                    const session = new Session(properties);

                    td.when(enableSSL(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    return expect(session.connect()).to.be.fulfilled
                        .then(() => {
                            expect(td.explain(enableSSL).callCount).to.equal(0);
                            expect(session._serverCapabilities.tls).to.be.undefined;
                        });
                });

                it('should fail if an error is thrown in the SSL setup', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, ssl: true };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenReject(new Error());
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    return expect(session.connect()).to.be.rejected
                        .then(() => expect(session._serverCapabilities).to.be.empty);
                });

                it('should pass down any custom SSL/TLS-related option', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, sslOptions: { foo: 'bar' } };
                    const session = new Session(properties);

                    td.when(enableSSL({ foo: 'bar' })).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    return expect(session.connect()).to.be.fulfilled;
                });

                it('should enable TLS/SSL if the server supports it', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include({ ssl: true }));
                });

                it('should fail if the server does not support TLS/SSL', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                    const session = new Session(properties);
                    const error = new Error();
                    error.info = { code: 5001 };

                    td.when(enableSSL({})).thenReject(error);
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

                    return expect(session.connect()).to.be.rejected;
                });

                it('should select the default authentication mechanism', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'PLAIN' }));
                });

                it('should override the default authentication mechanism with the one provided by the user', () => {
                    const properties = { auth: 'MYSQL41', dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include({ auth: 'MYSQL41' }));
                });
            });

            context('insecure connections', () => {
                it('should select the default authentication mechanism', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, ssl: false };
                    const session = new Session(properties);

                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });

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
                    const properties = { dbUser: 'baz', dbPassword: 'qux', endpoints, socketFactory: { createSocket }, ssl: false };
                    const session = new Session(properties);
                    const expected = { dbUser: 'baz', host: 'bar', port: 2 };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(createSocket(td.matchers.contains({ host: 'foo' }))).thenReject(error);
                    td.when(createSocket(td.matchers.contains({ host: 'bar' }))).thenResolve(new Duplex());

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should fail if there are no remaining failover addresses', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { endpoints, socketFactory: { createSocket } };
                    const session = new Session(properties);

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(createSocket(), { ignoreExtraArgs: true }).thenReject(error);

                    return expect(session.connect()).to.be.rejected.then(err => {
                        expect(err.message).to.equal('All routers failed.');
                        expect(err.errno).to.equal(4001);
                    });
                });

                it('should fail if an unexpected error is thrown', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { endpoints, socketFactory: { createSocket } };
                    const session = new Session(properties);
                    const error = new Error('foobar');

                    td.when(createSocket(), { ignoreExtraArgs: true }).thenReject(error);

                    return expect(session.connect()).to.be.rejectedWith(error);
                });

                it('should reset the connection availability constraints when all routers are unavailable', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { dbUser: 'baz', dbPassword: 'qux', endpoints, socketFactory: { createSocket }, ssl: false };
                    const session = new Session(properties);
                    const expected = { dbUser: 'baz', host: 'foo', port: 1 };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    // failover restarts from the highest priority address
                    td.when(createSocket(), { ignoreExtraArgs: true }).thenResolve(new Duplex());
                    td.when(createSocket(), { ignoreExtraArgs: true, times: 2 }).thenReject(error);

                    return expect(session.connect()).to.be.rejectedWith('All routers failed.')
                        .then(() => expect(session.connect()).to.be.fulfilled)
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should select the default authentication mechanism for secure connections', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { dbUser: 'baz', dbPassword: 'qux', endpoints, socketFactory: { createSocket }, ssl: true };
                    const session = new Session(properties);
                    const expected = { auth: 'PLAIN', dbUser: 'baz', host: 'bar', port: 2, ssl: true };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });
                    td.when(createSocket(td.matchers.contains({ host: 'foo' }))).thenReject(error);
                    td.when(createSocket(td.matchers.contains({ host: 'bar' }))).thenResolve(new Duplex());

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should select the default authentication mechanism for insecure connections', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { dbUser: 'baz', dbPassword: 'qux', endpoints, socketFactory: { createSocket }, ssl: false };
                    const session = new Session(properties);
                    const expected = { auth: 'MYSQL41', dbUser: 'baz', host: 'bar', port: 2, ssl: false };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'] });
                    td.when(createSocket(td.matchers.contains({ host: 'foo' }))).thenReject(error);
                    td.when(createSocket(td.matchers.contains({ host: 'bar' }))).thenResolve(new Duplex());

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });

                it('should override the default authentication mechanism with the one provided by the user', () => {
                    const endpoints = [{ host: 'foo', port: 1 }, { host: 'bar', port: 2 }];
                    const properties = { auth: 'MYSQL41', dbUser: 'baz', dbPassword: 'qux', endpoints, socketFactory: { createSocket }, ssl: true };
                    const session = new Session(properties);
                    const expected = { auth: 'MYSQL41', dbUser: 'baz', host: 'bar', port: 2, ssl: true };

                    const error = new Error();
                    error.code = 'ENOTFOUND';

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve({ 'authentication.mechanisms': ['PLAIN', 'MYSQL41'], tls: true });
                    td.when(createSocket(td.matchers.contains({ host: 'foo' }))).thenReject(error);
                    td.when(createSocket(td.matchers.contains({ host: 'bar' }))).thenResolve(new Duplex());

                    return expect(session.connect()).to.be.fulfilled
                        .then(session => expect(session.inspect()).to.deep.include(expected));
                });
            });
        });

        context('getSchemas()', () => {
            it('should return an object with the existing schemas', () => {
                const session = new Session({});
                const schema = 'foobar';
                const expected = { foobar: { schema } };

                session.getSchema = td.function();

                td.when(execute(td.callback([schema]))).thenResolve(expected);
                td.when(stmtExecute(session, 'SHOW DATABASES')).thenReturn({ execute });
                td.when(session.getSchema(schema)).thenReturn({ schema });

                return expect(session.getSchemas()).to.eventually.deep.equal(expected);
            });
        });

        context('createSchema()', () => {
            it('should create and return a new schema', () => {
                const session = new Session({});
                const schema = 'foobar';
                const expected = { schema };

                session.getSchema = td.function();

                td.when(execute()).thenResolve();
                td.when(stmtExecute(session, `CREATE DATABASE \`${schema}\``)).thenReturn({ execute });
                td.when(session.getSchema(schema)).thenReturn(expected);

                return expect(session.createSchema(schema)).to.eventually.deep.equal(expected);
            });
        });

        context('dropSchema()', () => {
            it('should return true if the schema was dropped', () => {
                const session = new Session({});

                td.when(execute()).thenResolve(true);
                td.when(stmtExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return expect(session.dropSchema('foo')).to.eventually.be.true;
            });

            it('should return true if the schema does not exist', () => {
                const session = new Session({});
                const error = new Error();
                error.info = { code: 1008 };

                td.when(execute()).thenReject(error);
                td.when(stmtExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return expect(session.dropSchema('foo')).to.eventually.be.true;
            });

            it('should fail if an unexpected error was thrown', () => {
                const session = new Session({});
                const error = new Error('foobar');

                td.when(execute()).thenReject(error);
                td.when(stmtExecute(session, 'DROP DATABASE `foo`')).thenReturn({ execute });

                return expect(session.dropSchema('foo')).to.eventually.be.rejectedWith(error);
            });
        });

        context('setSavepoint()', () => {
            it('should create a savepoint with a generated name if no name is passed', () => {
                const session = new Session({});
                td.when(execute()).thenResolve(true);
                td.when(stmtExecute(session, td.matchers.contains(/^SAVEPOINT \`connector\-nodejs\-[A-F0-9]{32}\`$/))).thenReturn({ execute });
                return expect(session.setSavepoint()).to.eventually.be.a('string').and.not.be.empty;
            });

            it('should create a savepoint with the given name', () => {
                const session = new Session({});
                td.when(execute()).thenResolve(true);
                td.when(stmtExecute(session, td.matchers.contains(/^SAVEPOINT \`foo\`$/))).thenReturn({ execute });
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
                td.when(stmtExecute(session, td.matchers.contains(/^RELEASE SAVEPOINT \`foo\`$/))).thenReturn({ execute });
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
                td.when(stmtExecute(session, td.matchers.contains(/^ROLLBACK TO SAVEPOINT \`foo\`$/))).thenReturn({ execute });
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

    context('idGenerator()', () => {
        it('should generate an UUID in the apropriate format', () => {
            const uuid = (new Session({})).idGenerator();

            expect(uuid).to.match(/^[A-F0-9]{32}$/);
        });
    });

    context('executeSql()', () => {
        it('should create a StmtExecute query with a given statement', () => {
            const session = new Session({});

            td.when(stmtExecute(session, 'foo')).thenReturn();

            session.executeSql('foo');

            expect(td.explain(stmtExecute).callCount).to.equal(1);
        });

        it('should create a StmtExecute query with optional arguments', () => {
            const session = new Session({});

            td.when(stmtExecute(session, 'foo', ['bar', 'baz'])).thenReturn();

            session.executeSql('foo', 'bar', 'baz');

            expect(td.explain(stmtExecute).callCount).to.equal(1);
        });

        it('should create a StmtExecute query with optional arguments provided as an array', () => {
            const session = new Session({});

            td.when(stmtExecute(session, 'foo', ['bar', 'baz'])).thenReturn();

            session.executeSql('foo', ['bar', 'baz']);

            expect(td.explain(stmtExecute).callCount).to.equal(1);
        });
    });

    context('sql()', () => {
        it('should call `executeSQL()`', () => {
            const session = new Session({});
            const executeSql = td.function();

            session.executeSql = executeSql;

            td.when(executeSql('foo')).thenReturn('bar');

            expect(session.sql('foo')).to.equal('bar');
        });
    });
});

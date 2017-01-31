'use strict';

/* eslint-env node, mocha */

const Session = require('lib/DevAPI/Session');
const Client = require('lib/Protocol/Client');
const Duplex = require('stream').Duplex;
const Schema = require('lib/DevAPI/Schema');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Session', () => {
    let clientProto, sqlStmtExecute;

    beforeEach('create fakes', () => {
        sqlStmtExecute = td.function();

        clientProto = Object.assign({}, Client.prototype);
        Client.prototype.sqlStmtExecute = sqlStmtExecute;
    });

    afterEach('reset fakes', () => {
        Client.prototype = clientProto;

        td.reset();
    });

    context('constructor', () => {
        it('should override the idGenerator function with a custom one', () => {
            const expected = { foo: 'bar' };
            const idGenerator = () => expected;
            const session = new Session({ idGenerator });

            expect(session.idGenerator()).to.deep.equal(expected);
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

            expect(schema).to.be.an.instanceof(Schema);
        });

        it('should return a schema with the given name', () => {
            const schema = (new Session({})).getSchema('foobar');

            expect(schema.getName()).to.equal('foobar');
        });
    });

    context('server access methods', () => {
        let authenticate, capabilitiesGet, createSocket;

        beforeEach('create fakes', () => {
            authenticate = td.function();
            capabilitiesGet = td.function();
            createSocket = td.function();

            Client.prototype.authenticate = authenticate;
            Client.prototype.capabilitiesGet = capabilitiesGet;

            td.when(authenticate(), { ignoreExtraArgs: true }).thenResolve();
            td.when(createSocket(), { ignoreExtraArgs: true }).thenResolve(new Duplex());
        });

        context('connect()', () => {
            it('should return a clean object with the session properties', () => {
                const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                const session = new Session(properties);
                const expected = { dbUser: 'foo' };

                td.when(capabilitiesGet()).thenResolve();

                return session.connect().then(session => expect(session.inspect()).to.deep.include(expected));
            });

            it('should close the internal stream if there is an error', () => {
                // Not providing credentials should result in an authentication error.
                const properties = { socketFactory: { createSocket } };
                const session = new Session(properties);
                const stream = new Duplex();

                stream.end = td.function();

                td.when(createSocket(), { ignoreExtraArgs: true }).thenResolve(stream);

                return session.connect().catch(() => {
                    td.verify(stream.end(), { times: 1 });
                });
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
                    const expected = { foo: 'bar' };

                    td.when(enableSSL({})).thenResolve();
                    td.when(capabilitiesGet()).thenResolve(expected);

                    return session.connect().then(() => {
                        expect(session._serverCapabilities).to.deep.equal(expected);
                    });
                });

                it('should not try to setup a SSL/TLS connection if no such intent is specified', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                    const session = new Session(properties);

                    td.when(capabilitiesGet()).thenResolve();

                    return session.connect().then(() => {
                        td.verify(enableSSL(), { ignoreExtraArgs: true, times: 0 });
                        expect(session._serverCapabilities).to.be.empty;
                    });
                });

                it('should fail if an error is thrown in the SSL setup', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, ssl: true };
                    const session = new Session(properties);

                    td.when(enableSSL({})).thenReject(new Error());
                    td.when(capabilitiesGet()).thenResolve({ foo: 'bar' });

                    return session.connect().catch(() => {
                        expect(session._serverCapabilities).to.be.empty;
                    });
                });

                it('should pass down any custom SSL/TLS-related option', () => {
                    const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket }, sslOptions: { foo: 'bar' } };
                    const session = new Session(properties);

                    td.when(enableSSL({ foo: 'bar' })).thenResolve();
                    td.when(capabilitiesGet()).thenResolve();

                    return session.connect();
                });
            });
        });

        context('getSchemas()', () => {
            it('should return an object with the existing schemas', () => {
                const session = new Session({});
                const schema = 'foobar';
                const expected = { foobar: { schema } };

                session.getSchema = td.function();
                session._client = Object.assign({}, this._client, { sqlStmtExecute });

                td.when(session.getSchema(schema)).thenReturn({ schema });
                td.when(sqlStmtExecute('SHOW DATABASES', [], td.callback([schema]))).thenResolve();

                return expect(session.getSchemas()).to.eventually.deep.equal(expected);
            });
        });

        context('createSchema()', () => {
            it('should create and return a new schema', () => {
                const session = new Session({});
                const schema = 'foobar';
                const expected = { schema };

                session.getSchema = td.function();
                session._client = Object.assign({}, this._client, { sqlStmtExecute });

                td.when(session.getSchema(schema)).thenReturn(expected);
                td.when(sqlStmtExecute(`CREATE DATABASE \`${schema}\``)).thenResolve();

                return expect(session.createSchema(schema)).to.eventually.deep.equal(expected);
            });
        });

        context('dropSchema()', () => {
            it('should drop a schema', () => {
                const session = new Session({});
                const schema = 'foobar';

                session._client = Object.assign({}, this._client, { sqlStmtExecute });

                td.when(sqlStmtExecute(`DROP DATABASE \`${schema}\``)).thenResolve(true);

                return expect(session.dropSchema(schema)).to.eventually.be.true;
            });
        });

        context('dropCollection()', () => {
            it('should try to drop a collection', () => {
                const session = new Session({});
                const expected = { ok: true };
                const dropCollection = td.function();

                session.getSchema = td.function();

                td.when(dropCollection('qux')).thenResolve(expected);
                td.when(session.getSchema('baz')).thenReturn({ dropCollection });

                return expect(session.dropCollection('baz', 'qux')).to.eventually.deep.equal(expected);
            });
        });

        context('dropTable()', () => {
            it('should try to drop a collection', () => {
                const session = new Session({});
                const expected = { ok: true };
                const dropTable = td.function();

                session.getSchema = td.function();

                td.when(dropTable('qux')).thenResolve(expected);
                td.when(session.getSchema('baz')).thenReturn({ dropTable });

                return expect(session.dropTable('baz', 'qux')).to.eventually.deep.equal(expected);
            });
        });
    });

    context('idGenerator()', () => {
        it('should generate an UUID in the apropriate format', () => {
            const uuid = (new Session({})).idGenerator();

            expect(uuid).to.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{8}$/);
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

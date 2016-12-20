'use strict';

/* eslint-env node, mocha */

const BaseSession = require('lib/DevAPI/BaseSession');
const Client = require('lib/Protocol/Client');
const Duplex = require('stream').Duplex;
const Schema = require('lib/DevAPI/Schema');
const expect = require('chai').expect;
const td = require('testdouble');

describe('BaseSession', () => {
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
            const session = new BaseSession({ idGenerator });

            expect(session.idGenerator()).to.deep.equal(expected);
        });

        it('should throw an error if the properties are not provided', () => {
            expect(() => new BaseSession()).to.throw(Error);
        });

        it('should throw an error if the port is not in the appropriate range', () => {
            [-1, 65537].forEach(port => expect(() => new BaseSession({ port })).to.throw('Port must be between 0 and 65536'));
        });
    });

    context('getSchema()', () => {
        it('should return a Schema instance', () => {
            const schema = (new BaseSession({})).getSchema('foobar');

            expect(schema).to.be.an.instanceof(Schema);
        });

        it('should return a schema with the given name', () => {
            const schema = (new BaseSession({})).getSchema('foobar');

            expect(schema.getName()).to.equal('foobar');
        });
    });

    context('server access methods', () => {
        let authenticate, createSocket;

        beforeEach('create fakes', () => {
            authenticate = td.function();
            createSocket = td.function();

            Client.prototype.authenticate = authenticate;

            td.when(authenticate(), { ignoreExtraArgs: true }).thenResolve();
            td.when(createSocket(), { ignoreExtraArgs: true }).thenResolve(new Duplex());
        });

        context('connect()', () => {
            it('should return a clean object with the session properties', () => {
                const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                const session = (new BaseSession(properties));
                const expected = { dbUser: 'foo' };

                expect(session.connect()).to.eventually.deep.equal(expected);
            });

            it('should close the internal stream if there is an error', () => {
                // Not providing credentials should result in an authentication error.
                const properties = { socketFactory: { createSocket } };
                const session = (new BaseSession(properties));
                const stream = new Duplex();

                stream.end = td.function();

                td.when(createSocket(), { ignoreExtraArgs: true }).thenResolve(stream);

                return session.connect().catch(() => {
                    td.verify(stream.end(), { times: 1 });
                });
            });
        });

        context('getSchemas()', () => {
            it('should return an object with the existing schemas', () => {
                const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                const session = (new BaseSession(properties));
                const expected = { foobar: { schema: 'foobar' } };

                td.when(sqlStmtExecute('SHOW DATABASES', [], td.callback(['foobar']))).thenResolve();

                expect(session.connect().then(session => session.getSchemas())).to.eventually.deep.equal(expected);
            });
        });

        context('createSchema()', () => {
            it('should create and return a new schema', () => {
                const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                const session = (new BaseSession(properties));
                const expected = { foobar: { schema: 'foobar' } };

                td.when(sqlStmtExecute('CREATE DATABASE foobar')).thenResolve();

                expect(session.connect().then(session => session.createSchema('foobar'))).to.eventually.deep.equal(expected);
            });
        });

        context('dropSchema()', () => {
            it('should drop a schema', () => {
                const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                const session = (new BaseSession(properties));

                td.when(sqlStmtExecute('DROP DATABASE foobar')).thenResolve();

                expect(session.connect().then(session => session.dropSchema('foobar'))).to.eventually.be.true;
            });
        });

        context('dropCollection()', () => {
            it('should try to drop a collection', () => {
                const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                const session = (new BaseSession(properties));
                const expected = { ok: true };
                const dropCollection = td.function();

                session.getSchema = td.function();

                td.when(dropCollection('qux')).thenResolve(expected);
                td.when(session.getSchema('baz')).thenReturn({ dropCollection });

                expect(session.connect().then(session => session.dropSchema('baz', 'qux'))).to.eventually.deep.equal(expected);
            });
        });

        context('dropTable()', () => {
            it('should try to drop a collection', () => {
                const properties = { dbUser: 'foo', dbPassword: 'bar', socketFactory: { createSocket } };
                const session = (new BaseSession(properties));
                const expected = { ok: true };
                const dropTable = td.function();

                session.getSchema = td.function();

                td.when(dropTable('qux')).thenResolve(expected);
                td.when(session.getSchema('baz')).thenReturn({ dropTable });

                expect(session.connect().then(session => session.dropSchema('baz', 'qux'))).to.eventually.deep.equal(expected);
            });
        });
    });

    context('idGenerator()', () => {
        it('should generate an UUID in the apropriate format', () => {
            const uuid = (new BaseSession({})).idGenerator();

            expect(uuid).to.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{8}$/);
        });
    });
});

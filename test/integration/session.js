'use strict';

/* eslint-env node, mocha */

const Session = require('lib/DevAPI/Session');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');
const os = require('os');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration X plugin session', () => {
    context('creating new sessions', () => {
        beforeEach('password caching', () => {
            // Since MySQL 8.0.11 introduces `caching_sha2_password` as the default authentication
            // plugin, we need to make sure the password is, indeed, cached on the server before
            // testing some of the following scenarios.
            return mysqlx
                .getSession(Object.assign({}, config, { socket: undefined }))
                .then(session => session.close());
        });

        context('using a configuration object', () => {
            it('should connect to the server in a new session', () => {
                const tcpConfig = Object.assign({}, config, { socket: undefined });

                return expect(mysqlx.getSession(tcpConfig)).to.be.fulfilled
                    .then(session => session.close());
            });

            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1', socket: undefined });

                return expect(mysqlx.getSession(ipv6Config)).to.be.fulfilled
                    .then(session => session.close());
            });

            it('should connect to the server using SSL/TLS by default', () => {
                // X plugin socket connections do not support SSL/TLS.
                const secureConfig = Object.assign({}, config, { socket: undefined, ssl: true });

                return expect(mysqlx.getSession(secureConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
                const insecureConfig = Object.assign({}, config, { ssl: false, socket: undefined });

                return expect(mysqlx.getSession(insecureConfig)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('should not connect with the default configuration', () => {
                return expect(mysqlx.getSession()).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('should not connect if the credentials are invalid', () => {
                const invalidConfig = Object.assign({}, config, {
                    dbUser: 'invalid user',
                    dbPassword: 'invalid password'
                });

                return expect(mysqlx.getSession(invalidConfig)).to.be.rejected;
            });

            it('should connect to the server and create the given default schema', () => {
                const validConfig = Object.assign({}, config, { socket: undefined });

                return expect(mysqlx.getSession(validConfig)).to.be.fulfilled
                    .then(session => session.getSchemas().then(schemas => ({ schemas, session })))
                    .then(result => {
                        expect(result.schemas).to.be.an('array');
                        expect(result.schemas.map(schema => schema.inspect().name)).to.include(validConfig.schema);

                        return result.session.close();
                    });
            });
        });

        context('using a RFC-3986 URI', () => {
            it('should connect to the server and create the given default schema', () => {
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}/${config.schema}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => session.getSchemas().then(schemas => ({ schemas, session })))
                    .then(result => {
                        expect(result.schemas).to.be.an('array');
                        expect(result.schemas.map(schema => schema.inspect().name)).to.include(config.schema);

                        return result.session.close();
                    });
            });

            it('should connect to the server with an IPv6 host', () => {
                const ipv6Config = Object.assign({}, config, { host: '::1' });
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${ipv6Config.dbUser}:${ipv6Config.dbPassword}@[${ipv6Config.host}]:${ipv6Config.port}`;
                const expected = { dbUser: ipv6Config.dbUser, host: ipv6Config.host, port: ipv6Config.port, socket: undefined, ssl: true };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session).to.be.an.instanceof(Session);
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('should connect to the server in the default port', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.include({ port: config.port });

                        return session.close();
                    });
            });

            it('should not connect if the port is out of bounds', () => {
                const invalidConfig = Object.assign({}, config, { port: -1 });
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;

                return expect(mysqlx.getSession(uri)).to.be.rejectedWith('Port must be between 0 and 65536');
            });

            it('should connect to the server using SSL/TLS by default', () => {
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${config.host}?ssl-mode=DISABLED`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('should connect to the server if an address is not reachable but there is a failover available', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`${failoverConfig.host}:${failoverConfig.port + 1000}`, `${failoverConfig.host}:${failoverConfig.port}`];
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                        expect(session.inspect().port).to.deep.equal(failoverConfig.port);

                        return session.close();
                    });
            });

            it('should not connect to the server if neither none or all failover addresses have explicit priority', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`${failoverConfig.host}, (address=[::1], priority=100)`];
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                        expect(err.errno).to.equal(4000);
                    });
            });

            it('should not connect to the server if any address priority is out of bounds', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}, priority=100), (address=[::1], priority=101)`];
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `mysqlx://${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('The priorities must be between 0 and 100');
                        expect(err.errno).to.equal(4007);
                    });
            });

            it('should connect to the server with a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('should ignore security options using a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });
        });

        context('using a unified connection string', () => {
            it('should connect to the server and create the given default schema', () => {
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}:${config.port}/${config.schema}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => session.getSchemas().then(schemas => ({ schemas, session })))
                    .then(result => {
                        expect(result.schemas).to.be.an('array');
                        expect(result.schemas.map(schema => schema.inspect().name)).to.include(config.schema);

                        return result.session.close();
                    });
            });

            it('should connect to the server in the default port', () => {
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.include({ port: config.port });

                        return session.close();
                    });
            });

            it('should not connect if the port is out of bounds', () => {
                const invalidConfig = Object.assign({}, config, { port: 65537 });
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `${invalidConfig.dbUser}:${invalidConfig.dbPassword}@${invalidConfig.host}:${invalidConfig.port}`;

                return expect(mysqlx.getSession(uri)).to.be.rejectedWith('Port must be between 0 and 65536');
            });

            it('should connect to the server using SSL/TLS by default', () => {
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', true);

                        return session.close();
                    });
            });

            it('should connect to the server insecurely if SSL/TLS is disabled explicitly', () => {
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `${config.dbUser}:${config.dbPassword}@${config.host}?ssl-mode=DISABLED`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.have.property('ssl', false);

                        return session.close();
                    });
            });

            it('should connect to the server if an address is not reachable but there is a failover available', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}:${failoverConfig.port}, priority=99), (address=${failoverConfig.host}:${failoverConfig.port}, priority=100)`];
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect().host).to.deep.equal(failoverConfig.host);
                        expect(session.inspect().port).to.deep.equal(failoverConfig.port);

                        return session.close();
                    });
            });

            it('should not connect to the server if neither none or all failover addresses have explicit priority', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}), (address=[::1], priority=100)`];
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                        expect(err.errno).to.equal(4000);
                    });
            });

            it('should not connect to the server if any address priority is out of bounds', () => {
                const failoverConfig = Object.assign({}, config);
                const hosts = [`(address=${failoverConfig.host}, priority=-1), (address=[::1], priority=100)`];
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                const uri = `${failoverConfig.dbUser}:${failoverConfig.dbPassword}@[${hosts.join(', ')}]`;

                return expect(mysqlx.getSession(uri)).to.be.rejected
                    .then(err => {
                        expect(err.message).to.equal('The priorities must be between 0 and 100');
                        expect(err.errno).to.equal(4007);
                    });
            });

            it('should connect to the server with a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });

            it('should ignore security options using a local UNIX socket', function () {
                if (!config.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                // Uses the default socket allocated for MySQL.
                const uri = `${config.dbUser}:${config.dbPassword}@(${config.socket})?ssl-mode=REQUIRED&ssl-ca=(/path/to/ca.pem)?ssl-crl=(/path/to/crl.pem)`;
                const expected = { dbUser: config.dbUser, host: undefined, port: undefined, socket: config.socket, ssl: false };

                return expect(mysqlx.getSession(uri)).to.be.fulfilled
                    .then(session => {
                        expect(session.inspect()).to.deep.include(expected);

                        return session.close();
                    });
            });
        });

        context('using invalid parameters', () => {
            it('should not connect if parameter is not string or object', () => {
                return expect(mysqlx.getSession(null)).to.be.rejected;
            });

            it('should not connect if URI is not valid', () => {
                return expect(mysqlx.getSession('')).to.be.rejected;
            });
        });
    });

    context('savepoints', () => {
        let session;

        beforeEach('set context', () => {
            return fixtures.createDatabase().then(suite => {
                session = suite.session;
            });
        });

        afterEach('clear context', () => {
            return fixtures.teardown(session);
        });

        it('should create savepoint with a generated name if not provided', () => {
            return session
                .startTransaction()
                .then(() => {
                    return expect(session.setSavepoint()).to.eventually.be.a('string').and.not.be.empty;
                });
        });

        it('should create a savepoint with the given name', () => {
            return session
                .startTransaction()
                .then(() => {
                    return expect(session.setSavepoint('foo')).to.eventually.equal('foo');
                });
        });

        it('should not create a savepoint with empty string', () => {
            return session
                .startTransaction()
                .then(() => {
                    return expect(session.setSavepoint('')).to.be.rejectedWith('Invalid Savepoint name.');
                });
        });

        it('should release a valid savepoint', () => {
            return session
                .startTransaction()
                .then(() => {
                    return session.setSavepoint('foo');
                })
                .then(point => {
                    return expect(session.releaseSavepoint(point)).to.be.fulfilled;
                });
        });

        it('should not release a savepoint with empty string', () => {
            return session
                .startTransaction()
                .then(() => {
                    return session.setSavepoint('foo');
                })
                .then(point => {
                    return expect(session.releaseSavepoint('')).to.be.rejectedWith('Invalid Savepoint name.');
                });
        });

        it('should raise error on an invalid savepoint', () => {
            return session
                .startTransaction()
                .then(() => {
                    return session.setSavepoint('foo');
                })
                .then(point => {
                    return expect(session.releaseSavepoint('s')).to.be.rejected.then((err) => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1305);
                    });
                });
        });

        it('should rollback to a valid savepoint', () => {
            return session
                .startTransaction()
                .then(() => {
                    return session.setSavepoint('foo');
                })
                .then(point => {
                    return expect(session.rollbackTo(point)).to.be.fulfilled;
                });
        });

        it('should not rollback to a savepoint with an empty string', () => {
            return session
                .startTransaction()
                .then(() => {
                    return session.setSavepoint('foo');
                })
                .then(point => {
                    return expect(session.rollbackTo('')).to.be.rejectedWith('Invalid Savepoint name.');
                });
        });

        it('should raise error on an invalid savepoint', () => {
            return session
                .startTransaction()
                .then(() => {
                    return session.setSavepoint('foo');
                })
                .then(point => {
                    return expect(session.rollbackTo('s')).to.be.rejected.then((err) => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1305);
                    });
                });
        });
    });

    context('session state', () => {
        it('should fail to re-use a closed session', () => {
            const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

            return expect(mysqlx.getSession(config)).to.be.fulfilled
                .then(session => {
                    return session.close()
                        .then(() => {
                            return expect(session.getSchemas()).to.be.rejectedWith(error);
                        });
                });
        });
    });

    context('database management', () => {
        let session;

        beforeEach('set context', () => {
            return fixtures.createDatabase().then(suite => {
                session = suite.session;
            });
        });

        afterEach('clear context', () => {
            return fixtures.teardown(session);
        });

        it('should allow to drop an existing schema', () => {
            return expect(session.dropSchema(config.schema)).to.be.fulfilled;
        });

        it('should not fail to drop a non-existent schema', () => {
            return session.dropSchema(config.schema)
                .then(() => expect(session.dropSchema(config.schema)).to.be.fulfilled);
        });

        it('should fail to drop a schema with an empty name', () => {
            return expect(session.dropSchema('')).to.be.rejected;
        });

        it('should fail to drop a schema with an invalid name', () => {
            return expect(session.dropSchema(' ')).to.be.rejected;
        });

        it('should fail to drop a schema with name set to `null`', () => {
            return expect(session.dropSchema(null)).to.be.rejected;
        });

        it('should setup a default schema', () => {
            return expect(session.getDefaultSchema().getName()).to.equal(config.schema);
        });
    });
});

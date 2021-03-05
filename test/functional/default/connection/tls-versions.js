/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

/* eslint-env node, mocha */

const Level = require('../../../../lib/logger').Level;
const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const path = require('path');
const tls = require('tls');
const util = require('util');
const warnings = require('../../../../lib/constants/warnings');

describe('connecting with specific TLS versions', () => {
    const baseConfig = { schema: 'performance_schema', socket: undefined };

    context('using a configuration object', () => {
        it('fails if the connection is not using TLS', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { ssl: false, tls: { versions: ['TLSv1.1', 'TLSv1.2'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_TLS_OPTIONS);
                });
        });

        it('fails if list of TLS versions is empty', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: [] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                });
        });

        it('fails if some TLS version provided by the application is not valid', () => {
            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.2', 'foo'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, 'foo', ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'].join(', ')));
                });
        });

        it('fails if none of the TLS versions provided by the application are supported by the client', function () {
            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.2'] } });

            return mysqlx.getSession(tlsConfig)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                });
        });

        it('picks highest supported version in the client that the server also supports if none is provided', function () {
            const tlsConfig = Object.assign({}, config, baseConfig);

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const expected = 'TLSv1.2';

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the client if that is supported by both the server and the client', function () {
            const versions = ['TLSv1', 'TLSv1.1', 'TLSv1.3'];
            const tlsConfig = Object.assign({}, config, baseConfig, { ssl: true, tls: { versions } });

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const expected = 'TLSv1.1';

            return mysqlx.getSession(tlsConfig)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });
    });

    context('using a connection string', () => {
        it('fails if the connection is not using TLS', () => {
            const tlsConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?ssl-mode=DISABLED&tls-versions=[TLSv1.1,TLSv1.2]`)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_TLS_OPTIONS);
                });
        });

        it('fails if the list of TLS versions is empty', () => {
            const tlsConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?tls-versions=[]`)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                });
        });

        it('fails if some TLS version provided by the application is not valid', () => {
            const tlsConfig = Object.assign({}, config, baseConfig);

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?tls-versions=[TLSv1.2,foo]`)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_BAD_TLS_VERSION, 'foo', ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'].join(', ')));
                });
        });

        it('fails if none of the TLS versions provided by the application are supported by the client', function () {
            const tlsConfig = Object.assign({}, config, baseConfig);

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}?tls-versions=[TLSv1.3]`)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_SUPPORTED_TLS_VERSION);
                });
        });

        it('picks the highest client-supported version that the server also supports if none is provided', function () {
            const tlsConfig = Object.assign({}, config, baseConfig);

            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const expected = 'TLSv1.2';

            return mysqlx.getSession(`mysqlx://${tlsConfig.user}:${tlsConfig.password}@${tlsConfig.host}:${tlsConfig.port}/${tlsConfig.schema}`)
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });
    });

    context('when the negotiated TLS version is not deprecated', () => {
        context('with a standalone connection', () => {
            it('does not write any deprecation warning to the log for any connection when debug mode is enabled', () => {
                const scriptConfig = Object.assign({}, config, baseConfig, { socket: null, tls: { versions: ['TLSv1.2'] } });
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

                return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(0);
                    });
            });

            it('does not write any deprecation warning to stdout for any connection when debug mode is enabled', done => {
                const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.2'] } });
                const warningMessages = [];

                process.on('warning', warning => {
                    if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                        warningMessages.push(warning.message);
                    }

                    if (warning.name && warning.name === 'NoWarning') {
                        process.removeAllListeners('warning');
                        // eslint-disable-next-line no-unused-expressions
                        expect(warningMessages).to.be.empty;
                        return done();
                    }
                });

                Promise.all([mysqlx.getSession(tlsConfig), mysqlx.getSession(tlsConfig)])
                    .then(sessions => {
                        return sessions.map(session => session.close());
                    })
                    .then(() => {
                        return process.emitWarning('No more warnings.', 'NoWarning');
                    });
            });
        });

        context('with a connection pool', () => {
            context('when debug mode is enabled', () => {
                it('does not write a deprecation warning to the log for new or re-created connections', () => {
                    const scriptConfig = Object.assign({}, config, baseConfig, { socket: null }, { tls: { versions: ['TLSv1.2'] } });
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-new.js');

                    return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            return expect(proc.logs).to.have.lengthOf(0);
                        });
                });

                it('does not write a deprecation warning to the log for a connection that is re-used', () => {
                    const scriptConfig = Object.assign({}, config, baseConfig, { socket: null }, { tls: { versions: ['TLSv1.2'] } });
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                    return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            return expect(proc.logs).to.have.lengthOf(0);
                        });
                });
            });

            context('when debug mode is not enabled', () => {
                it('does not write a deprecation warning to stdout for new or re-created connections', done => {
                    const maxIdleTime = 100;
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.2'] } }), { pooling: { maxIdleTime } });
                    const warningMessages = [];

                    process.on('warning', warning => {
                        if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                            warningMessages.push(warning.message);
                        }

                        if (warning.name && warning.name === 'NoWarning') {
                            process.removeAllListeners('warning');
                            // eslint-disable-next-line no-unused-expressions
                            expect(warningMessages).to.be.empty;
                            return done();
                        }
                    });

                    pool.getSession()
                        .then(session => {
                            return session.close();
                        })
                        .then(() => {
                            // We need to wait a bit more than maxIdleTime,
                            // just to be sure the connection expires.
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime + 10));
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(() => {
                            return pool.close();
                        })
                        .then(() => {
                            return process.emitWarning('No more warnings.', 'NoWarning');
                        });
                });

                it('does not write a deprecation warning to stdout for a connection that is re-used', done => {
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig, { tls: { versions: ['TLSv1.2'] } }), { pooling: { maxIdleTime: 0 } });
                    const warningMessages = [];

                    process.on('warning', warning => {
                        if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                            warningMessages.push(warning.message);
                        }

                        if (warning.name && warning.name === 'NoWarning') {
                            process.removeAllListeners('warning');
                            // eslint-disable-next-line no-unused-expressions
                            expect(warningMessages).to.be.empty;
                            return done();
                        }
                    });

                    pool.getSession()
                        .then(session => {
                            return session.close();
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(() => {
                            return pool.close();
                        })
                        .then(() => {
                            return process.emitWarning('No more warnings.', 'NoWarning');
                        });
                });
            });
        });
    });

    context('when the negotiated TLS version is deprecated', () => {
        context('with a standalone connection', () => {
            it('writes a deprecation warning to the log for every connection when debug mode is enabled', function () {
                const deprecatedVersion = 'TLSv1.1';
                const scriptConfig = { socket: null, tls: { versions: [deprecatedVersion] } };
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

                return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(1);
                        return expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));
                    })
                    .then(() => {
                        return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING });
                    })
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(1);
                        expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));
                    })
                    .catch(err => {
                        if (err.message !== errors.MESSAGES.ER_DEVAPI_TLS_VERSION_NEGOTIATION_FAILED) {
                            throw err;
                        }

                        // If the server, for some reason, is not able to
                        // negotiate the deprecated TLS version, the test should
                        // be skipped to signal the expectations were not assured.
                        return this.skip();
                    });
            });

            it('writes a deprecation warning to stdout for every connection when debug mode is not enabled', function (done) {
                const deprecatedVersion = 'TLSv1';
                const tlsConfig = Object.assign({}, config, baseConfig, { tls: { versions: [deprecatedVersion] } });
                const warningMessages = [];

                process.on('warning', warning => {
                    if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                        warningMessages.push(warning.message);
                    }

                    if (warning.name && warning.name === 'NoWarning') {
                        process.removeAllListeners('warning');

                        expect(warningMessages).to.have.lengthOf(2);
                        expect(warningMessages[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));
                        expect(warningMessages[1]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));

                        return done();
                    }
                });

                process.once('unhandledRejection', err => {
                    // We need to remove any dangling event listener.
                    process.removeAllListeners('warning');

                    if (err.message !== errors.MESSAGES.ER_DEVAPI_TLS_VERSION_NEGOTIATION_FAILED) {
                        return done(err);
                    }

                    // If the server, for some reason, is not able to
                    // negotiate the deprecated TLS version, the test should
                    // be skipped to signal the expectations were not assured.
                    this.skip();
                });

                Promise.all([mysqlx.getSession(tlsConfig), mysqlx.getSession(tlsConfig)])
                    .then(sessions => {
                        return sessions.map(session => session.close());
                    })
                    .then(() => {
                        return process.emitWarning('No more warnings.', 'NoWarning');
                    });
            });
        });

        context('with a connection pool', () => {
            context('when debug mode is enabled', () => {
                it('writes a deprecation warning to the log for every new or re-created connection', function () {
                    const deprecatedVersion = 'TLSv1';
                    const scriptConfig = { socket: null, tls: { versions: [deprecatedVersion] } };
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-new.js');

                    return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            expect(proc.logs).to.have.lengthOf(2);
                            expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));
                            return expect(proc.logs[1]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));
                        })
                        .catch(err => {
                            if (err.message !== errors.MESSAGES.ER_DEVAPI_TLS_VERSION_NEGOTIATION_FAILED) {
                                throw err;
                            }

                            // If the server, for some reason, is not able to
                            // negotiate the deprecated TLS version, the test should
                            // be skipped to signal the expectations were not assured.
                            return this.skip();
                        });
                });

                it('does not write a deprecation warning to the log for a connection that is re-used', function () {
                    const deprecatedVersion = 'TLSv1.1';
                    const scriptConfig = { socket: null, tls: { versions: [deprecatedVersion] } };
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                    return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            expect(proc.logs).to.have.lengthOf(1);
                            return expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));
                        })
                        .catch(err => {
                            if (err.message !== errors.MESSAGES.ER_DEVAPI_TLS_VERSION_NEGOTIATION_FAILED) {
                                throw err;
                            }

                            // If the server, for some reason, is not able to
                            // negotiate the deprecated TLS version, the test should
                            // be skipped to signal the expectations were not assured.
                            return this.skip();
                        });
                });
            });

            context('when debug mode is not enabled', () => {
                it('writes a deprecation warning to stdout for every new or re-created connection', function (done) {
                    const deprecatedVersion = 'TLSv1.1';
                    const maxIdleTime = 100;
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig, { tls: { versions: [deprecatedVersion] } }), { pooling: { maxIdleTime } });
                    const warningMessages = [];

                    process.on('warning', warning => {
                        if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                            warningMessages.push(warning.message);
                        }

                        if (warning.name && warning.name === 'NoWarning') {
                            process.removeAllListeners('warning');

                            expect(warningMessages).to.have.lengthOf(2);
                            expect(warningMessages[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));
                            expect(warningMessages[1]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));

                            return done();
                        }
                    });

                    process.once('unhandledRejection', err => {
                        // We need to remove any dangling event listener.
                        process.removeAllListeners('warning');

                        if (err.message !== errors.MESSAGES.ER_DEVAPI_TLS_VERSION_NEGOTIATION_FAILED) {
                            return done(err);
                        }

                        // If the server, for some reason, is not able to
                        // negotiate the deprecated TLS version, the test should
                        // be skipped to signal the expectations were not assured.
                        this.skip();
                    });

                    pool.getSession()
                        .then(session => {
                            return session.close();
                        })
                        .then(() => {
                            // We need to wait a bit more than maxIdleTime,
                            // just to be sure the connection expires.
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime + 10));
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(() => {
                            return pool.close();
                        })
                        .then(() => {
                            return process.emitWarning('No more warnings.', 'NoWarning');
                        });
                });

                it('does not write a deprecation warning to stdout for a connection that is re-used', function (done) {
                    const deprecatedVersion = 'TLSv1';
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig, { tls: { versions: [deprecatedVersion] } }), { pooling: { maxIdleTime: 0 } });
                    const warningMessages = [];

                    process.on('warning', warning => {
                        if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                            warningMessages.push(warning.message);
                        }

                        if (warning.name && warning.name === 'NoWarning') {
                            process.removeAllListeners('warning');

                            expect(warningMessages).to.have.lengthOf(1);
                            expect(warningMessages[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, deprecatedVersion));

                            return done();
                        }
                    });

                    process.once('unhandledRejection', err => {
                        // We need to remove any dangling event listener.
                        process.removeAllListeners('warning');

                        if (err.message !== errors.MESSAGES.ER_DEVAPI_TLS_VERSION_NEGOTIATION_FAILED) {
                            return done(err);
                        }

                        // If the server, for some reason, is not able to
                        // negotiate the deprecated TLS version, the test should
                        // be skipped to signal the expectations were not assured.
                        this.skip();
                    });

                    pool.getSession()
                        .then(session => {
                            return session.close();
                        })
                        .then(() => {
                            return pool.getSession();
                        })
                        .then(() => {
                            return pool.close();
                        })
                        .then(() => {
                            return process.emitWarning('No more warnings.', 'NoWarning');
                        });
                });
            });
        });
    });
});

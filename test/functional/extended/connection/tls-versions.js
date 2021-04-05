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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const path = require('path');
const tls = require('tls');
const util = require('util');
const warnings = require('../../../../lib/constants/warnings');

describe('TLS version negotiation', () => {
    context('server with support for the most secure TLS versions only', () => {
        // container as defined in docker-compose.yml
        // server supports TLSv1.1 and TLSv1.2
        const baseConfig = { host: 'mysql-with-latest-tls-versions', schema: 'performance_schema', socket: undefined };

        it('picks the highest version supported by both the client and the server by default', () => {
            const expected = 'TLSv1.2';

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the application if it is supported by the server', () => {
            const versions = ['TLSv1', 'TLSv1.1'];
            const expected = versions[1];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('negotiates to any one version provided by the application that is supported by the server when the highest is not supported', () => {
            const versions = ['TLSv1.2', 'TLSv1.3'];
            const expected = versions[0];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('fails to negotiate if no version provided by the application is not supported by the server', () => {
            const versions = ['TLSv1'];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(() => expect.fail())
                .catch(err => {
                    // ECONNRESET: socket hang up
                    expect(err.message).to.not.equal('expect.fail()');
                });
        });

        context('with a standalone connection', () => {
            it('does not write any deprecation warning to the log for any connection when debug mode is enabled', () => {
                const scriptConfig = Object.assign({}, config, baseConfig, { socket: null });
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

                return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(0);
                    });
            });

            it('does not write any deprecation warning to stdout for any connection when debug mode is enabled', done => {
                const tlsConfig = Object.assign({}, config, baseConfig);
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
                        return process.emitWarning('There are no warnings.', 'NoWarning');
                    });
            });
        });

        context('with a connection pool', () => {
            context('when debug mode is enabled', () => {
                it('does not write a deprecation warning to the log for new or re-created connections', () => {
                    const scriptConfig = Object.assign({}, config, baseConfig, { socket: null });
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-new.js');

                    return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            return expect(proc.logs).to.have.lengthOf(0);
                        });
                });

                it('does not write a deprecation warning to the log for a connection that is re-used', () => {
                    const scriptConfig = Object.assign({}, config, baseConfig, { socket: null });
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
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig), { pooling: { maxIdleTime } });
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
                            return process.emitWarning('There are no warnings.', 'NoWarning');
                        });
                });

                it('does not write a deprecation warning to stdout for a connection that is re-used', done => {
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig), { pooling: { maxIdleTime: 0 } });
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
                            return process.emitWarning('There are no warnings.', 'NoWarning');
                        });
                });
            });
        });
    });

    context('server with support for the least secure TLS versions only', () => {
        // container as defined in docker-compose.yml
        // server supports TLSv1 and TLSv1.1
        const baseConfig = { host: 'mysql-with-oldest-tls-versions', schema: 'performance_schema', socket: undefined };

        it('picks the highest version supported in the server by default if the client supports a version range', function () {
            if (!tls.DEFAULT_MAX_VERSION || !tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const expected = 'TLSv1.1';

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the application that is also supported in the server if the client supports a version range', function () {
            if (!tls.DEFAULT_MAX_VERSION || !tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const versions = ['TLSv1.1', 'TLSv1.2'];
            const expected = versions[0];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('picks the highest version provided by the application if is also supported in the server if the client does not support a version range', function () {
            if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const versions = ['TLSv1', 'TLSv1.1'];
            const expected = versions[1];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(session => {
                    return session.sql("select variable_value from session_status where variable_name = 'Mysqlx_ssl_version'")
                        .execute()
                        .then(res => expect(res.fetchOne()[0]).to.equal(expected))
                        .then(() => session.close());
                });
        });

        it('fails to negotiate by default if the client does not support a version range', function () {
            if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true } }))
                .then(() => expect.fail())
                .catch(err => {
                    // OpenSSL: wrong version number
                    expect(err.message).to.not.equal('expect.fail()');
                });
        });

        it('fails to negotiate a lower version provided by the application if the client does not support a version range', function () {
            if (tls.DEFAULT_MAX_VERSION && tls.DEFAULT_MIN_VERSION) {
                return this.skip();
            }

            const versions = ['TLSv1.1', 'TLSv1.2'];

            return mysqlx.getSession(Object.assign({}, config, baseConfig, { tls: { enabled: true, versions } }))
                .then(() => expect.fail())
                .catch(err => {
                    // OpenSSL: wrong version number
                    expect(err.message).to.not.equal('expect.fail()');
                });
        });

        context('using a standalone connection', () => {
            it('writes a deprecation warning to the log for every connection when debug mode is enabled', () => {
                const scriptConfig = Object.assign({}, config, baseConfig, { socket: null });
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

                return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(1);
                        return expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));
                    })
                    .then(() => {
                        return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING });
                    })
                    .then(proc => {
                        expect(proc.logs).to.have.lengthOf(1);
                        expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));
                    });
            });

            it('writes a deprecation warning to stdout for every connection when debug mode is not enabled', done => {
                const tlsConfig = Object.assign({}, config, baseConfig);
                const warningMessages = [];

                process.on('warning', warning => {
                    if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                        warningMessages.push(warning.message);
                    }

                    if (warning.name && warning.name === 'NoWarning') {
                        process.removeAllListeners('warning');

                        expect(warningMessages).to.have.lengthOf(2);
                        expect(warningMessages[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));
                        expect(warningMessages[1]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));

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

        context('using a connection pool', () => {
            context('when debug mode is enabled', () => {
                it('writes a deprecation warning to the log for every new or re-created connection', () => {
                    const scriptConfig = Object.assign({}, config, baseConfig, { socket: null });
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-new.js');

                    return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            expect(proc.logs).to.have.lengthOf(2);
                            expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));
                            return expect(proc.logs[1]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));
                        });
                });

                it('does not write a deprecation warning to the log for a connection that is re-used', () => {
                    const scriptConfig = Object.assign({}, config, baseConfig, { socket: null });
                    const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                    return fixtures.collectLogs('connection:tls.version', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                        .then(proc => {
                            expect(proc.logs).to.have.lengthOf(1);
                            return expect(proc.logs[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));
                        });
                });
            });

            context('when debug mode is not enabled', () => {
                it('writes a deprecation warning to stdout for every new or re-created connection', done => {
                    const maxIdleTime = 100;
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig), { pooling: { maxIdleTime } });
                    const warningMessages = [];

                    process.on('warning', warning => {
                        if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                            warningMessages.push(warning.message);
                        }

                        if (warning.name && warning.name === 'NoWarning') {
                            process.removeAllListeners('warning');

                            expect(warningMessages).to.have.lengthOf(2);
                            expect(warningMessages[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));
                            expect(warningMessages[1]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));

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
                    const pool = mysqlx.getClient(Object.assign({}, config, baseConfig), { pooling: { maxIdleTime: 0 } });
                    const warningMessages = [];

                    process.on('warning', warning => {
                        if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                            warningMessages.push(warning.message);
                        }

                        if (warning.name && warning.name === 'NoWarning') {
                            process.removeAllListeners('warning');

                            expect(warningMessages).to.have.lengthOf(1);
                            expect(warningMessages[0]).to.equal(util.format(warnings.MESSAGES.WARN_DEPRECATED_TLS_VERSION, 'TLSv1.1'));

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
});

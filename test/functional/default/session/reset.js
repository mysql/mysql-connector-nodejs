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

'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');
const path = require('path');

describe('session reset behavior', () => {
    const baseConfig = { schema: undefined };

    context('when using standalone sessions', () => {
        it('new connections are assigned new ids', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            let firstConnectionId, secondConnectionId;

            return mysqlx.getSession(resetConfig)
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            firstConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return mysqlx.getSession(resetConfig);
                })
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            secondConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return expect(firstConnectionId).to.not.equal(secondConnectionId);
                });
        });
    });

    context('when using a connection pool', () => {
        let client;

        beforeEach('create pool', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            client = mysqlx.getClient(resetConfig, { pooling: { maxSize: 1 } });
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        it('idle connections are not assigned a new id', () => {
            let firstConnectionId, secondConnectionId;

            return client.getSession()
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            firstConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return client.getSession();
                })
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            secondConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return expect(firstConnectionId).to.equal(secondConnectionId);
                });
        });
    });

    context('when debug mode is enabled', () => {
        context('with a standalone connection', () => {
            it('logs the expectation pipeline opening', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Open', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('op', 'cond');
                        expect(proc.logs[0].op).to.equal('EXPECT_CTX_COPY_PREV');
                        expect(proc.logs[0].cond).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0].cond[0]).to.have.keys('condition_key', 'condition_value', 'op');
                        expect(proc.logs[0].cond[0].condition_key).to.equal('EXPECT_FIELD_EXIST');
                        expect(proc.logs[0].cond[0].condition_value).to.have.keys('type', 'data');
                        expect(Buffer.from(proc.logs[0].cond[0].condition_value.data).toString()).to.equal('6.1'); // keep_open
                        expect(proc.logs[0].cond[0].op).to.equal('EXPECT_OP_SET');
                    });
            });

            it('logs the expectation pipeline closing', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Close', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                    });
            });

            it('logs the session reset negotiation', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.Reset', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('keep_open');
                        return expect(proc.logs[0].keep_open).to.be.true;
                    });
            });
        });

        context('with a connection pool', () => {
            it('logs the expectation pipeline opening', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Open', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('op', 'cond');
                        expect(proc.logs[0].op).to.equal('EXPECT_CTX_COPY_PREV');
                        expect(proc.logs[0].cond).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0].cond[0]).to.have.keys('condition_key', 'condition_value', 'op');
                        expect(proc.logs[0].cond[0].condition_key).to.equal('EXPECT_FIELD_EXIST');
                        expect(proc.logs[0].cond[0].condition_value).to.have.keys('type', 'data');
                        expect(Buffer.from(proc.logs[0].cond[0].condition_value.data).toString()).to.equal('6.1'); // keep_open
                        expect(proc.logs[0].cond[0].op).to.equal('EXPECT_OP_SET');
                    });
            });

            it('logs the expectation pipeline closing', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Expect.Close', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                    });
            });

            it('logs the session reset negotiation', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'pool-reset.js');

                return fixtures.collectLogs('protocol:outbound:Mysqlx.Session.Reset', script)
                    .then(proc => {
                        expect(proc.logs).to.be.an('array').and.have.lengthOf(1);
                        expect(proc.logs[0]).to.have.keys('keep_open');
                        return expect(proc.logs[0].keep_open).to.be.true;
                    });
            });
        });
    });
});

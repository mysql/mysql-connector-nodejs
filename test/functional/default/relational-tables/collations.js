/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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
const mysqlx = require('../../../../');

describe('collation and charset names', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };
    const defaultCharset = 'utf8mb4';
    const defaultCollation = 'utf8mb4_0900_ai_ci';

    context('with non textual fields', () => {
        let session;

        beforeEach('create session', () => {
            const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

            return mysqlx.getSession(defaultConfig)
                .then(s => { session = s; });
        });

        afterEach('close session', () => {
            return session.close();
        });

        it('metadata is undefined for non-textual fields', () => {
            let metadata = [];

            return session.sql('SELECT 1')
                .execute(() => {}, meta => {
                    metadata = metadata.concat(meta);
                })
                .then(() => {
                    expect(metadata[0].getCollationName()).to.equal(undefined);
                });
        });
    });

    context('with the default collation', () => {
        let session;

        beforeEach('create session', () => {
            const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

            return mysqlx.getSession(defaultConfig)
                .then(s => { session = s; });
        });

        beforeEach('create schema', () => {
            return session.sql(`CREATE DATABASE \`${baseConfig.schema}\``)
                .execute();
        });

        beforeEach('create table', () => {
            return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3))`)
                .execute();
        });

        beforeEach('add fixtures', () => {
            return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                .execute();
        });

        afterEach('drop schema', () => {
            return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                .execute();
        });

        afterEach('close session', () => {
            return session.close();
        });

        it('metadata contains the default collation id', () => {
            let metadata = [];

            return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                .execute(() => {}, meta => {
                    metadata = metadata.concat(meta);
                })
                .then(() => {
                    expect(metadata[0].getCollationName()).to.equal(defaultCollation);
                    expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                });
        });
    });

    context('with a non utf8mb4 collation', () => {
        const customCollation = 'latin1_german1_ci';
        const customCharset = 'latin1';
        const strictCollation = 'utf8mb4_0900_ai_ci';

        context('from the server', () => {
            let session;

            beforeEach('update server collation', () => {
                return fixtures.setServerGlobalVariable('collation_server', customCollation);
            });

            beforeEach('refresh session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('reset server collation', () => {
                return session.sql(`SET GLOBAL collation_server=${defaultCollation}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the strict utf8mb4 collation id selected by the X Plugin', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(strictCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });

        context('from the database', () => {
            let session;

            beforeEach('create session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema with collation', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\` CHARACTER SET ${customCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the strict utf8mb4 collation id selected by the X Plugin', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(strictCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });

        context('from the table', () => {
            let session;

            beforeEach('create session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            beforeEach('create table with collation', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3)) CHARACTER SET ${customCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the strict utf8mb4 collation id selected by the X Plugin', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(strictCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });

        context('from the column', () => {
            let session;

            beforeEach('create session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            beforeEach('create table with column collation', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3) CHARACTER SET ${customCharset} COLLATE ${customCollation})`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the strict utf8mb4 collation id selected by the X Plugin', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(strictCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });
    });

    context('with a custom utf8mb4 collation', () => {
        const customCollation = 'utf8mb4_0900_bin';

        context('from the server', () => {
            let session;

            beforeEach('update server collation', () => {
                return fixtures.setServerGlobalVariable('collation_server', customCollation);
            });

            beforeEach('refresh session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('reset server collation', () => {
                return session.sql(`SET GLOBAL collation_server=${defaultCollation}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the custom collation id', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(customCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });

        context('from the database', () => {
            let session;

            beforeEach('create session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema with collation', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\` CHARACTER SET ${defaultCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the custom collation id', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(customCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });

        context('from the table', () => {
            let session;

            beforeEach('create session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            beforeEach('create table with collation', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3)) CHARACTER SET ${defaultCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the custom collation id', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(customCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });

        context('from the column', () => {
            let session;

            beforeEach('create session', () => {
                const defaultConfig = Object.assign({}, config, baseConfig, { schema: undefined });

                return mysqlx.getSession(defaultConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            beforeEach('create table with column collation', () => {
                return session.sql(`CREATE TABLE \`${baseConfig.schema}\`.test (a_char CHAR(3) CHARACTER SET ${defaultCharset} COLLATE ${customCollation})`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO \`${baseConfig.schema}\`.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE \`${baseConfig.schema}\``)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the custom collation id', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM \`${baseConfig.schema}\`.test`)
                    .execute(() => {}, meta => {
                        metadata = metadata.concat(meta);
                    })
                    .then(() => {
                        expect(metadata[0].getCollationName()).to.equal(customCollation);
                        expect(metadata[0].getCharacterSetName()).to.equal(defaultCharset);
                    });
            });
        });
    });
});

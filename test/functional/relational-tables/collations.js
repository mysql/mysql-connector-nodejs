'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');

describe('collation and charset names', () => {
    const baseConfig = Object.assign({}, config, { schema: undefined });
    const defaultCharset = 'utf8mb4';
    const defaultCollation = 'utf8mb4_0900_ai_ci';

    context('with non textual fields', () => {
        let session;

        beforeEach('create session', () => {
            return mysqlx.getSession(baseConfig)
                .then(s => { session = s; });
        });

        afterEach('close session', () => {
            return session.close();
        });

        it('metadata is undefined for non-textual fields', () => {
            let metadata = [];

            return session.sql(`SELECT 1`)
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
            return mysqlx.getSession(baseConfig)
                .then(s => { session = s; });
        });

        beforeEach('create schema', () => {
            return session.sql(`CREATE DATABASE ${config.schema}`)
                .execute();
        });

        beforeEach('create table', () => {
            return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3))`)
                .execute();
        });

        beforeEach('add fixtures', () => {
            return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                .execute();
        });

        afterEach('drop schema', () => {
            return session.sql(`DROP DATABASE ${config.schema}`)
                .execute();
        });

        afterEach('close session', () => {
            return session.close();
        });

        it('metadata contains the default collation id', () => {
            let metadata = [];

            return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(session => {
                        return session.sql(`SET GLOBAL collation_server=${customCollation}`)
                            .execute()
                            .then(() => session.close());
                    });
            });

            beforeEach('refresh session', () => {
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE ${config.schema}`)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
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

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema with collation', () => {
                return session.sql(`CREATE DATABASE ${config.schema} CHARACTER SET ${customCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the strict utf8mb4 collation id selected by the X Plugin', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE ${config.schema}`)
                    .execute();
            });

            beforeEach('create table with collation', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3)) CHARACTER SET ${customCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the strict utf8mb4 collation id selected by the X Plugin', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE ${config.schema}`)
                    .execute();
            });

            beforeEach('create table with column collation', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3) CHARACTER SET ${customCharset} COLLATE ${customCollation})`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the strict utf8mb4 collation id selected by the X Plugin', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(session => {
                        return session.sql(`SET GLOBAL collation_server=${customCollation}`)
                            .execute()
                            .then(() => session.close());
                    });
            });

            beforeEach('refresh session', () => {
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE ${config.schema}`)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
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

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema with collation', () => {
                return session.sql(`CREATE DATABASE ${config.schema} CHARACTER SET ${defaultCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('create table', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3))`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the custom collation id', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE ${config.schema}`)
                    .execute();
            });

            beforeEach('create table with collation', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3)) CHARACTER SET ${defaultCharset} COLLATE ${customCollation}`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the custom collation id', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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
                return mysqlx.getSession(baseConfig)
                    .then(s => { session = s; });
            });

            beforeEach('create schema', () => {
                return session.sql(`CREATE DATABASE ${config.schema}`)
                    .execute();
            });

            beforeEach('create table with column collation', () => {
                return session.sql(`CREATE TABLE ${config.schema}.test (a_char CHAR(3) CHARACTER SET ${defaultCharset} COLLATE ${customCollation})`)
                    .execute();
            });

            beforeEach('add fixtures', () => {
                return session.sql(`INSERT INTO ${config.schema}.test VALUES ('foo')`)
                    .execute();
            });

            afterEach('drop schema', () => {
                return session.sql(`DROP DATABASE ${config.schema}`)
                    .execute();
            });

            afterEach('close session', () => {
                return session.close();
            });

            it('metadata contains the custom collation id', () => {
                let metadata = [];

                return session.sql(`SELECT * FROM ${config.schema}.test`)
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

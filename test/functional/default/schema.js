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

const config = require('../../config');
const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../..');

describe('session schema', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let session, schema;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(baseConfig.schema);
    });

    beforeEach('create session using default schema', () => {
        const defaulConfig = Object.assign({}, config, baseConfig);

        return mysqlx.getSession(defaulConfig)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getDefaultSchema();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('creating collections', () => {
        context('when the collections do not exist', () => {
            it('allows to create those collections', () => {
                const collections = ['test1', 'test2'];

                return Promise
                    .all([
                        schema.createCollection(collections[0]),
                        schema.createCollection(collections[1])
                    ])
                    .then(() => {
                        return schema.getCollections();
                    })
                    .then(result => {
                        expect(result).to.have.lengthOf(2);
                        expect(result[0].getName()).to.deep.equal(collections[0]);
                        expect(result[1].getName()).to.deep.equal(collections[1]);
                    });
            });
        });

        context('when a collection already exists', () => {
            it('fails to create a collection with the same name', () => {
                return schema.createCollection('test1')
                    .then(() => {
                        return schema.createCollection('test1');
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(errors.ER_TABLE_EXISTS_ERROR);
                    });
            });

            it('does not fail with an hint to re-use an existing collection', () => {
                return schema.createCollection('test1')
                    .then(() => {
                        return schema.createCollection('test1', { reuseExisting: true });
                    })
                    .then(collection => {
                        expect(collection.getName()).to.equal('test1');
                    });
            });
        });
    });

    context('fetching collections', () => {
        it('allows to retrieve a single collection', () => {
            return schema
                .createCollection('foo')
                .then(() => {
                    expect(schema.getCollection('foo').getName()).to.equal('foo');
                });
        });

        it('allows to retrieve the list of existing collections', () => {
            return schema
                .createCollection('foo')
                .then(() => {
                    return schema.getCollections();
                })
                .then(collections => {
                    expect(collections).to.have.lengthOf(1);
                    expect(collections[0].getName()).to.equal('foo');
                });
        });
    });

    context('dropping collections', () => {
        it('allows to drop an existing collection', () => {
            return schema.getCollections()
                .then(actual => expect(actual).to.be.empty)
                .then(() => schema.createCollection('test'))
                .then(() => schema.getCollections())
                .then(actual => expect(actual).to.not.be.empty)
                .then(() => schema.dropCollection('test'))
                .then(() => schema.getCollections())
                .then(actual => expect(actual).to.be.empty);
        });

        it('does not fail to drop non-existent collections', () => {
            return schema.dropCollection('test');
        });

        it('fails to drop a collection with an empty name', () => {
            return schema.dropCollection('')
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.not.equal('expect.fail()'));
        });

        it('fails to drop a collection with an invalid name', () => {
            return schema.dropCollection(' ')
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.not.equal('expect.fail()'));
        });

        it('fails to drop a collection with name set to `null`', () => {
            return schema.dropCollection(null)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.not.equal('expect.fail()'));
        });
    });

    context('fetching tables', () => {
        it('allows to retrieve a single table', () => {
            return session.sql('CREATE TABLE foo (_id SERIAL)')
                .execute()
                .then(() => {
                    expect(schema.getTable('foo').getName()).to.equal('foo');
                });
        });

        it('allows to retrieve the list of existing tables', () => {
            return session.sql('CREATE TABLE foo (_id SERIAL)')
                .execute()
                .then(() => {
                    return schema.getTables();
                })
                .then(tables => {
                    expect(tables).to.have.lengthOf(1);
                    expect(tables[0].getName()).to.equal('foo');
                });
        });

        it('allows to retrieve a collection as a table', () => {
            return schema.createCollection('foo')
                .then(() => {
                    return schema.getCollectionAsTable('foo');
                })
                .then(table => {
                    return table.select().execute();
                })
                .then(res => {
                    return expect(res.fetchAll()).to.be.an('array').and.be.empty;
                });
        });
    });

    context('available collections', () => {
        it('BUG#28745240 checks if a collection exists in a given schema in the presence of other collections', () => {
            return schema.getCollection('noop').existsInDatabase()
                .then(exists => {
                    return expect(exists).to.be.false;
                })
                .then(() => {
                    return schema.createCollection('test');
                })
                .then(() => {
                    return schema.getCollection('noop').existsInDatabase();
                })
                .then(exists => {
                    return expect(exists).to.be.false;
                });
        });

        it('returns the list of existing collections in the precense of regular tables', () => {
            return session.sql('CREATE TABLE foo (_id SERIAL)')
                .execute()
                .then(() => {
                    return schema.createCollection('bar');
                })
                .then(() => {
                    return schema.getCollections();
                })
                .then(collections => {
                    expect(collections).to.be.an('array').and.have.lengthOf(1);
                    expect(collections[0].getName()).to.equal('bar');
                });
        });
    });

    it('available tables', () => {
        it('returns the list of existing collections in the precense of regular tables', () => {
            return session.sql('CREATE TABLE foo (_id SERIAL)')
                .execute()
                .then(() => {
                    return schema.createCollection('bar');
                })
                .then(() => {
                    return schema.getTables();
                })
                .then(collections => {
                    expect(collections).to.be.an('array').and.have.lengthOf(1);
                    expect(collections[0].getName()).to.equal('foo');
                });
        });
    });
});

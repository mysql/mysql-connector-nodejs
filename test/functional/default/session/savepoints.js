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

const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');

describe('savepoints within transactions', () => {
    let session;

    const baseConfig = { schema: undefined };

    beforeEach('create session', () => {
        return fixtures.createSession(baseConfig)
            .then(s => {
                session = s;
            });
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('creates savepoint with a generated name if not provided', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint())
            .then(actual => expect(actual).to.be.a('string').and.not.be.empty);
    });

    it('creates a savepoint with the given name', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(actual => expect(actual).to.equal('foo'));
    });

    it('does not create a savepoint with empty string', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint(''))
            .then(() => {
                expect.fail();
            })
            .catch(err => {
                return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
            });
    });

    it('releases a valid savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(point => session.releaseSavepoint(point));
    });

    it('fails to release a savepoint identified with empty string', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.releaseSavepoint(''))
            .then(() => {
                expect.fail();
            })
            .catch(err => {
                return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
            });
    });

    it('fails to release an non-matching savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.releaseSavepoint('s'))
            .then(() => {
                expect.fail();
            })
            .catch(err => {
                expect(err.info).to.include.keys('code');
                return expect(err.info.code).to.equal(errors.ER_SP_DOES_NOT_EXIST);
            });
    });

    it('rolls back to a valid savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(point => session.rollbackTo(point));
    });

    it('fails to rollback to a savepoint identified by an empty string', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.rollbackTo(''))
            .then(() => {
                expect.fail();
            })
            .catch(err => {
                return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
            });
    });

    it('fails to rollback to a non-matching savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.rollbackTo('s'))
            .then(() => {
                expect.fail();
            })
            .catch(err => {
                expect(err.info).to.include.keys('code');
                return expect(err.info.code).to.equal(errors.ER_SP_DOES_NOT_EXIST);
            });
    });
});

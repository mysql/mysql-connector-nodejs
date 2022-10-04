/*
 * Copyright (c) 2017, 2022, Oracle and/or its affiliates.
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

const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');
const util = require('util');

// subject under test needs to be reloaded with test doubles
let CollectionRemove = require('../../../lib/DevAPI/CollectionRemove');

describe('CollectionRemove', () => {
    let Preparing;

    beforeEach('replace dependencies with test doubles', () => {
        Preparing = td.replace('../../../lib/DevAPI/Preparing');
        // reload module with the replacements
        CollectionRemove = require('../../../lib/DevAPI/CollectionRemove');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('bind()', () => {
        let Binding;

        beforeEach('replace dependencies with test doubles', () => {
            Binding = td.replace('../../../lib/DevAPI/Binding');
            // reload module with the replacements
            CollectionRemove = require('../../../lib/DevAPI/CollectionRemove');
        });

        it('calls the bind() method provided by the Binding mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const bind = td.function();
            const placeholder = 'baz';
            const value = 'qux';

            td.when(Binding()).thenReturn({ bind });
            td.when(bind(placeholder, value)).thenReturn(expected);

            expect(CollectionRemove({ connection }).bind(placeholder, value)).to.equal(expected);
        });
    });

    context('execute()', () => {
        let Result;

        beforeEach('replace dependencies with test doubles', () => {
            Result = td.replace('../../../lib/DevAPI/Result');
            // reload module with the replacements
            CollectionRemove = require('../../../lib/DevAPI/CollectionRemove');
        });

        it('executes a CollectionRemove statement and returns a Result instance with the details provided by the server', () => {
            const context = 'foo';
            const crudRemove = td.function();
            const connection = { getClient: () => ({ crudRemove }), isIdle: () => false, isOpen: () => true };
            const criteria = 'bar';
            const details = 'baz';
            const execute = td.function();
            const expected = 'qux';

            td.when(Preparing({ connection })).thenReturn({ execute });

            const statement = CollectionRemove({ criteria, connection });

            td.when(crudRemove(statement)).thenReturn(context);
            td.when(execute(td.matchers.argThat(fn => fn() === context))).thenResolve(details);
            td.when(Result(details)).thenReturn(expected);

            return statement.execute()
                .then(got => expect(got).to.equal(expected));
        });

        it('fails to execute the CollectionRemove statement when the filtering criteria is not defined', () => {
            return CollectionRemove().execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_DOCUMENT_CRITERIA, 'remove()'));
                });
        });

        it('fails to execute the CollectionRemove statement when the connection is not open', () => {
            const criteria = 'foo';
            const error = new Error('bar');
            const connection = { getError: () => error, isOpen: () => false };

            return CollectionRemove({ criteria, connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('fails to execute the CollectionRemove statement when the connection has expired', () => {
            const criteria = 'foo';
            const error = new Error('bar');
            const connection = { getError: () => error, isIdle: () => true, isOpen: () => true };

            return CollectionRemove({ criteria, connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });
    });

    context('limit()', () => {
        let Limiting;

        beforeEach('replace dependencies with test doubles', () => {
            Limiting = td.replace('../../../lib/DevAPI/Limiting');
            // reload module with the replacements
            CollectionRemove = require('../../../lib/DevAPI/CollectionRemove');
        });

        it('calls the limit() method provided by the Limiting mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const limit = td.function();
            const preparable = 'baz';
            const size = 3;

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Limiting({ preparable })).thenReturn({ limit });
            td.when(limit(size)).thenReturn(expected);

            expect(CollectionRemove({ connection }).limit(size)).to.equal(expected);
        });
    });

    context('sort()', () => {
        let Ordering;

        beforeEach('replace dependencies with test doubles', () => {
            Ordering = td.replace('../../../lib/DevAPI/CollectionOrdering');
            // reload module with the replacements
            CollectionRemove = require('../../../lib/DevAPI/CollectionRemove');
        });

        it('calls the sort() method provided by the CollectionOrdering mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const preparable = 'baz';
            const sort = td.function();
            const sortExpr = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Ordering({ preparable })).thenReturn({ sort });
            td.when(sort(sortExpr)).thenReturn(expected);

            expect(CollectionRemove({ connection }).sort(sortExpr)).to.equal(expected);
        });
    });
});

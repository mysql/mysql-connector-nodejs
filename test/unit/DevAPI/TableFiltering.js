/*
 * Copyright (c) 2019, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

/* eslint-env node, mocha */

const dataModel = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let TableFiltering = require('../../../lib/DevAPI/TableFiltering');

describe('TableFiltering', () => {
    let Preparing, forceRestart;

    beforeEach('replace dependencies with test doubles', () => {
        Preparing = td.replace('../../../lib/DevAPI/Preparing');
        forceRestart = td.function();

        td.when(Preparing()).thenReturn({ forceRestart });
        // reload module with the replacements
        TableFiltering = require('../../../lib/DevAPI/TableFiltering');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('where()', () => {
        let Expr;

        beforeEach('replace dependencies with test doubles', () => {
            Expr = td.replace('../../../lib/DevAPI/Expr');
            // reload module with the replacements
            TableFiltering = require('../../../lib/DevAPI/TableFiltering');
        });

        it('sets the statement filtering criteria using an X DevAPI expression for the given input', () => {
            const constraints = {};
            const criteria = 'foo';
            const forceRestart = td.function();
            const getValue = td.function();
            const searchConditionStr = 'bar';

            td.when(Expr({ dataModel, value: searchConditionStr })).thenReturn({ getValue });
            td.when(getValue()).thenReturn(criteria);

            TableFiltering({ constraints, preparable: { forceRestart } }).where(searchConditionStr);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(constraints).to.deep.equal({ criteria });
        });
    });
});

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

const Expr = require('./Expr');
const Filtering = require('./Filtering');
const dataModel = require('../Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;

/**
 * This mixin grants filtering capabilities to a table statement instance via
 * composition.
 * @mixin
 * @alias TableFiltering
 * @param {Object} [constraints] - An object containing internal statement
 * state such as the filtering criteria.
 * @param {Preparing} preparable - The instance of the underlying prepared
 * statement.
 * @returns {TableFiltering}
 */
function TableFiltering ({ constraints = {}, preparable }) {
    return {
        ...Filtering({ constraints }),

        /**
         * Establishes the filtering criteria for the statement, that
         * determines which records are selected, updated or deleted.
         * This method does not cause the statement to be executed but changes
         * the statement boundaries, which means that if it has been prepared
         * before, it needs to be re-prepared.
         * @function
         * @name TableFiltering#where
         * @param {SearchConditionStr} searchConditionStr - The filtering
         * criteria specified as a string or an X DevAPI expression.
         * @returns {Filtering} The instance of the statement itself
         * following a fluent API convention.
         */
        where (searchConditionStr) {
            preparable.forceRestart();

            constraints.criteria = Expr({ dataModel, value: searchConditionStr }).getValue();

            return this;
        }
    };
}

module.exports = TableFiltering;

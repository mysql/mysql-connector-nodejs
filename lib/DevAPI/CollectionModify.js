/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

'use strict';

const Client = require('../Protocol/Client');
const Expressions = require('../Expressions');
const Result = require('./Result');
const filtering = require('./Filtering');
const limiting = require('./Limiting');

/**
 * CollectionModify factory.
 * @module CollectionModify
 * @mixes Filtering
 * @mixes Limiting
 */

/**
 * @private
 * @alias module:CollectionModify
 * @param {Session} session - session to bind
 * @param {Schema} schema - associated schema
 * @param {string} collection - collection name
 * @param {string} [criteria] - filtering criteria expression
 * @returns {CollectionModify}
 */
function CollectionModify (session, schema, collection, criteria) {
    let state = Object.assign({ operations: [] }, { session, schema, collection });

    return Object.assign({}, limiting(), filtering({ criteria }), {
        /**
         * Append element to an array field.
         * @function
         * @name module:CollectionModify#arrayAppend
         * @param {string} field - document array field
         * @param {} value - value to append
         * @returns {CollectionModify} The operation instance.
         */
        arrayAppend (field, value) {
            state.operations.push(getOperation(Client.updateOperations.ARRAY_APPEND, field, value));

            return this;
        },

        /**
         * Delete element from an array.
         * @function
         * @name module:CollectionModify#arrayDelete
         * @param {string} field - document array field
         * @param {} value - value to delete
         * @returns {CollectionModify} The operation instance.
         */
        arrayDelete (field, expression) {
            state.operations.push(getOperation(Client.updateOperations.ITEM_REMOVE, field, expression));

            return this;
        },

        /**
         * Insert element into an array field.
         * @function
         * @name module:CollectionModify#arrayInsert
         * @param {string} field - document array field
         * @param {} value - value to insert
         * @returns {CollectionModify} The operation instance.
         */
        arrayInsert (field, value) {
            state.operations.push(getOperation(Client.updateOperations.ARRAY_INSERT, field, value));

            return this;
        },

        /**
         * Execute modify operation.
         * @function
         * @name module:CollectionModify#execute
         * @return {Promise.<Result>}
         */
        execute () {
            if (typeof this.getCriteria() !== 'string' || this.getCriteria().trim().length < 1) {
                return Promise.reject(new Error('remove needs a valid condition'));
            }

            return state
                .session
                ._client
                .crudModify(state.schema.getName(), state.collection, Client.dataModel.DOCUMENT, this.getCriteria(), state.operations, this.getLimit(), {})
                .then(state => new Result(state));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:CollectionModify#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'CollectionModify';
        },

        merge () {
            throw new Error('modify.merge currently not implemented');
        },

        /**
         * Set the value of a given document field.
         * @function
         * @name module:CollectionModify#set
         * @param {string} field - document field
         * @param {*} value -  value to assign
         * @returns {CollectionModify} The operation instance.
         */
        set (field, value) {
            state.operations.push(getOperation(Client.updateOperations.ITEM_SET, field, value));

            return this;
        },

        /**
         * Unset the value of document fields.
         * @function
         * @name module:CollectionModify#unset
         * @param {Array.<String>|String} fields
         * @returns {CollectionModify} The operation instance.
         */
        unset (fields) {
            if (typeof fields === 'string') {
                fields = [ fields ];
            }

            fields = fields.map(field => getOperation(Client.updateOperations.ITEM_REMOVE, field));

            state.operations = state.operations.concat(fields);

            return this;
        }
    });
}

/**
 * @private
 */
function getOperation (op, field, expression) {
    const fieldExpression = Expressions.parse(field);

    if (!fieldExpression.expr.identifier) {
        throw new Error(`Field expression has to be identifier while parsing ${field}`);
    }

    const operation = {
        source: fieldExpression.expr.identifier,
        operation: op
    };

    if (expression) {
        operation.value = Expressions.literalOrParsedExpression(expression);
    }

    return operation;
}

module.exports = CollectionModify;

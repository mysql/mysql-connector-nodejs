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
const Result = require('./Result');
const binding = require('./Binding');
const filtering = require('./Filtering');
const limiting = require('./Limiting');

/**
 * CollectionRemove factory.
 * @module CollectionRemove
 * @mixes Filtering
 * @mixes Binding
 * @mixes Limiting
 */

/**
 * @private
 * @alias module:CollectionRemove
 * @param {Session} session - session to bind
 * @param {Schema} schema - associated schema
 * @param {string} collection - collection name
 * @param {string} [criteria] - filtering criteria expression
 * @returns {CollectionRemove}
 */
function CollectionRemove (session, schema, collection, criteria) {
    let state = Object.assign({}, { session, schema, collection });

    return Object.assign({}, filtering({ criteria }), binding(), limiting(), {
        /**
         * Execute remove operation.
         * @function
         * @name module:CollectionRemove#execute
         * @return {Promise.<Result>}
         */
        execute () {
            if (typeof this.getCriteria() !== 'string' || this.getCriteria().trim().length < 1) {
                return Promise.reject(new Error('remove needs a valid condition'));
            }

            return state
                .session
                ._client
                .crudRemove(state.schema.getName(), state.collection, Client.dataModel.DOCUMENT, this.getCriteria(), this.getLimit(), this.getBindings())
                .then(state => new Result(state));
        },

        /**
         * Retrieve the class name (to avoid duck typing).
         * @function
         * @name module:CollectionRemove#getClassName
         * @returns {string} The "class" name.
         */
        getClassName () {
            return 'CollectionRemove';
        }
    });
}

module.exports = CollectionRemove;

/*
 * Copyright (c) 2017, 2020, Oracle and/or its affiliates.
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

/**
 * Mysqlx.Crud outbound message handlers.
 * @private
 * @module handlers.Mysqlx.Crud
 */

const crudDelete = require('../Wrappers/Messages/Crud/Delete');
const crudFind = require('../Wrappers/Messages/Crud/Find');
const crudInsert = require('../Wrappers/Messages/Crud/Insert');
const crudUpdate = require('../Wrappers/Messages/Crud/Update');
const logger = require('../../tool/log');

const log = logger('protocol:outbound:Mysqlx.Crud');

/**
 * Encode a Mysqlx.Crud.Delete protobuf message.
 * @function
 * @name module:Crud#encodeDelete
 * @param {module:CollectionRemove|module:TableDelete} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeDelete = function (query) {
    const outboundDelete = crudDelete.create(query);
    log.info('Delete', outboundDelete);

    return outboundDelete.serialize();
};

/**
 * Encode a Mysqlx.Crud.Find protobuf message.
 * @function
 * @name module:Crud#encodeFind
 * @param {module:CollectionFind|module:TableSelect} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeFind = function (query) {
    const outboundFind = crudFind.create(query);
    log.info('Find', outboundFind);

    return outboundFind.serialize();
};

/**
 * Encode a Mysqlx.Crud.Insert protobuf message.
 * @function
 * @name module:Crud#encodeInsert
 * @param {module:CollectionAdd|module:TableInsert} query - database operation instance
 * @returns {Buffer} The protobuf encoded buffer payload.
 */
exports.encodeInsert = function (query) {
    const outboundInsert = crudInsert.create(query);
    log.info('Insert', outboundInsert);

    return outboundInsert.serialize();
};

/**
 * Encode a Mysqlx.Crud.Update protobuf message.
 * @function
 * @name module:Crud#encodeUpdate
 * @param {module:CollectionModify|module:TableUpdate} query - database operation instance
 * @returns {proto.Mysqlx.Crud.Update} The protobuf encoded object.
 */
exports.encodeUpdate = function (query) {
    const outboundUpdate = crudUpdate.create(query);
    log.info('Update', outboundUpdate);

    return outboundUpdate.serialize();
};

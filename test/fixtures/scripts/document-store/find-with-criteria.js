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

const mysqlx = require('../../../../');

const config = JSON.parse(process.env.MYSQLX_CLIENT_CONFIG);

// required arguments
const schema = process.argv[2];
const collection = process.argv[3];
const criteria = process.argv[4];
const placeholder = process.argv[5];
const assignment = process.argv[6];

const baseConfig = Object.assign({}, config, { schema });

mysqlx.getSession(baseConfig)
    .then(session => {
        return session.getDefaultSchema().getCollection(collection).find(criteria)
            .bind(placeholder, assignment)
            .execute()
            .then(() => {
                return session.close();
            });
    })
    .catch(err => {
        // errors in should be passed as JSON to the parent process via stderr
        console.error(JSON.stringify({ message: err.message, stack: err.stack }));
        process.exit(1);
    });

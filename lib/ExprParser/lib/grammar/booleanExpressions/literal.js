/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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

const Scalar = require('../../stubs/mysqlx_datatypes_pb').Scalar;
const Pa = require('parsimmon');

const parser = options => r => Pa
    .alt(
        r.FLOAT.map(data => {
            const scalar = new Scalar();
            const decimalDigits = data.substring(data.indexOf('.') + 1, data.length);

            if (decimalDigits.length > 7) {
                scalar.setType(Scalar.Type.V_DOUBLE);
                scalar.setVDouble(data);
            } else {
                scalar.setType(Scalar.Type.V_FLOAT);
                scalar.setVFloat(data);
            }

            return scalar;
        }),
        r.INT.map(data => {
            const int = parseInt(data, 10);
            const scalar = new Scalar();

            if (int > Number.MAX_SAFE_INTEGER || int < Number.MIN_SAFE_INTEGER) {
                const str = new Scalar.String();
                /* eslint-disable node/no-deprecated-api */
                str.setValue(new Uint8Array(new Buffer(`${int}`)));
                /* eslint-enable node/no-deprecated-api */

                scalar.setType(Scalar.Type.V_STRING);
                scalar.setVString(str);

                return scalar;
            }

            if (int >= 0) {
                scalar.setType(Scalar.Type.V_UINT);
                scalar.setVUnsignedInt(int);

                return scalar;
            }

            scalar.setType(Scalar.Type.V_SINT);
            scalar.setVSignedInt(int);

            return scalar;
        }),
        r.STRING_DQ.map(data => {
            const str = new Scalar.String();
            const unquoted = data.slice(1, data.length - 1);
            /* eslint-disable node/no-deprecated-api */
            str.setValue(new Uint8Array(new Buffer(unquoted)));
            /* eslint-enable node/no-deprecated-api */

            const scalar = new Scalar();
            scalar.setType(Scalar.Type.V_STRING);
            scalar.setVString(str);

            return scalar;
        }),
        r.STRING_SQ.map(data => {
            const str = new Scalar.String();
            const unquoted = data.slice(1, data.length - 1);
            /* eslint-disable node/no-deprecated-api */
            str.setValue(new Uint8Array(new Buffer(unquoted)));
            /* eslint-enable node/no-deprecated-api */

            const scalar = new Scalar();
            scalar.setType(Scalar.Type.V_STRING);
            scalar.setVString(str);

            return scalar;
        }),
        r.NULL.map(() => {
            const scalar = new Scalar();
            scalar.setType(Scalar.Type.V_NULL);

            return scalar;
        }),
        r.FALSE.map(() => {
            const scalar = new Scalar();
            scalar.setType(Scalar.Type.V_BOOL);
            scalar.setVBool(false);

            return scalar;
        }),
        r.TRUE.map(() => {
            const scalar = new Scalar();
            scalar.setType(Scalar.Type.V_BOOL);
            scalar.setVBool(true);

            return scalar;
        })
    )
    .map(data => ({ output: data }));

module.exports = { name: 'LITERAL', parser };

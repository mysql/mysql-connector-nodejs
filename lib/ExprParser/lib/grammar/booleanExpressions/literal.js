/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
            const scalar = new Scalar();

            if (data >= 0) {
                scalar.setType(Scalar.Type.V_UINT);
                scalar.setVUnsignedInt(data);

                return scalar;
            }

            scalar.setType(Scalar.Type.V_SINT);
            scalar.setVSignedInt(data);

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

/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

var datatypes = require('./Messages/mysqlx_datatypes').messages;
var fieldtypes = require('./Messages/mysqlx_resultset').messages.ColumnMetaData.enums.FieldType;
var varint = require('./protobuf.js/lib/varint');

// TODO - We need to move this somewhere so the user can understand meta data, too
var contentTypes = {
    GEOMETRY: 1,
    JSON: 2,
    XML:  3
};

module.exports.decodeScalar = function (value) {
    // TODO: (large) int handling
    switch (value.type) {
    case datatypes.Scalar.enums.Type.V_STRING:
        // TODO - charset!!!
        return value.v_string.value.toString();
    case datatypes.Scalar.enums.Type.V_NULL:
        return null;
    case datatypes.Scalar.enums.Type.V_OCTETS:
        return value.v_octets.value;
    case datatypes.Scalar.enums.Type.V_SINT:
        return value.v_signed_int;
    case datatypes.Scalar.enums.Type.V_UINT:
        return value.v_unsigned_int;
    case datatypes.Scalar.enums.Type.V_DOUBLE:
        return value.v_double;
    case datatypes.Scalar.enums.Type.V_FLOAT:
        return value.v_float;
    case datatypes.Scalar.enums.Type.V_BOOL:
        return value.v_bool;
    default:
       return "currently unhandled type " + value.type;
    }

};

function decodeDateTimeOrTime(value, timeonly) {
    var pos = 0, retval = "";

    if (timeonly) {
        retval = (value[pos++] === 0x00 ? "" : "-");
    }

    (timeonly ? ["", ":", ":"] : ["", "-", "-", " ", ":", ":"]).forEach(function (prefix) {
        if (value.length <= pos) {
            return;
        }
        var current = varint.read64(value, pos, false),
            currentv = current.value.low;
        retval += prefix + (currentv < 10 ? "0" + currentv : currentv);
        pos += current.length;
    });

    if (value.length > pos) {
        // useconds need padding
        var current = varint.read64(value, pos, false),
            currentv = current.value.low;
        retval += "." + ("000000" + currentv).slice(-6);
    }

    return retval;
}

function decodeDecimal(value) {
    var retval, even, sign, scale = value[0];
    if (value[value.length - 1] & 0x0F) {
        even = false;
        sign = ((value[value.length - 1] & 0x0F) === 0x0C) ? "" : "-";
    } else {
        even = true;
        sign = ((value[value.length - 1] & 0xF0) === 0xC0) ? "" : "-";
    }

    retval = sign;

    var digit,
        total = ((value.length - 2) * 2) + !even,
        commaposition = total - scale;

    for (digit = 0; digit < total; ++digit) {
        var offset = 1 + (digit >> 1);
        if (digit === commaposition) {
            retval += ".";
        }
        retval += (digit & 0x01) ? (value[offset] & 0x0F) : (value[offset] >> 4);
    }
    return retval;
}

module.exports.decodeField = function (value, meta) {
    let retval;

    if (!meta.type) {
        throw new Error("No valid type requested");
    }

    if (value.length === 0) {
        return null;
    }

    switch (meta.type) {
    case fieldtypes.FLOAT:
        return value.readFloatLE(0);
    case fieldtypes.DOUBLE:
        return value.readDoubleLE(0);
    case fieldtypes.SINT:
    case fieldtypes.UINT:
    case fieldtypes.BIT:
        retval = varint.read64(value, 0, true);
        return varint.dezigzag64(retval.value).low;
    case fieldtypes.BYTES:
    case fieldtypes.ENUM:
        retval = value.slice(0, -1).toString();
        return (meta.content_type === contentTypes.JSON) ? JSON.parse(retval) : retval;
    case fieldtypes.TIME:
        return decodeDateTimeOrTime(value, true);
    case fieldtypes.DATETIME:
        return decodeDateTimeOrTime(value, false);
    case fieldtypes.DECIMAL:
        return decodeDecimal(value);
    case fieldtypes.SET:
            return value;
    default:
            throw new Error("Invalid type");
    }
};

module.exports.decodeAny = function (value) {
    switch (value.type) {
    case datatypes.Any.enums.Type.SCALAR:
        return module.exports.decodeScalar(value.scalar);
    case datatypes.Any.enums.Type.ARRAY:
        var retval = [];
        for (var key in value.array.value) {
            retval.push(module.exports.decodeAny(value.array.value[key]));
        }
        return retval;
    case datatypes.Any.enums.Type.OBJECT:
        //console.log(value);
    default:
        //console.log(value);
        return "Unhandled type!";
    }
};
module.exports.encodeScalar = function (value) {
    var retval = {};

    if (!value) {
        retval.type = datatypes.Scalar.enums.Type.V_NULL;
    }

    switch (typeof(value)) {
        case "string":
            retval.type = datatypes.Scalar.enums.Type.V_STRING;
            retval.v_string =  { value: value };
            break;
        case "number":
            retval.type = datatypes.Scalar.enums.Type.V_SINT;
            retval.v_signed_int =  value;
            break;
        case "boolean":
            retval.type = datatypes.Scalar.enums.Type.V_BOOL;
            retval.v_bool = value;
            break;
    }
    return retval;
};

module.exports.encode = function (value) {
    var retval = {};

    if (value === null) {
        retval.type = datatypes.Any.enums.Type.SCALAR;
        retval.scalar = module.exports.encodeScalar(value);
        return retval;
    }

    switch (typeof(value)) {
        case "string":
        case "number":
        case "boolean":
            retval.type = datatypes.Any.enums.Type.SCALAR;
            retval.scalar = module.exports.encodeScalar(value);
            break;
        case "object":
            /*
            Object.prototype.toString.call( someVar ) === '[object Array]'   might be more "correct" but this is
            called often and this is notably faster
             */
            if (value.constructor === Array) {
                retval.type = datatypes.Any.enums.Type.ARRAY;
                retval.array = [];//{ array: [] };
                value.forEach(function(v,k) {
                    retval.array[k] = module.exports.encode(v);
                });
            } else {
                retval.type = datatypes.Any.enums.Type.OBJECT;
                retval.obj = {
                    fld: [
                    ]
                };
                Object.keys(value).forEach(function (prop) {
                    retval.obj.fld.push({
                        key: prop,
                        value: module.exports.encode(value[prop])
                    });
                });
            }
    }
    return retval;
};

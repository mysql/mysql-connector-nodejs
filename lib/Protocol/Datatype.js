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
        return value.v_opaque;
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
    case datatypes.Scalar.enums.Type.V_OCTETS:
        return value.v_string;
    default:
       return "currently unhandled type " + value.type;
    }

};

module.exports.decodeField = function (value, meta) {
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
        var retval = varint.read64(value, 0, true);
        return varint.dezigzag64(retval.value).low;
    case fieldtypes.BYTES:
    case fieldtypes.ENUM:
        var retval = value.slice(0, -1).toString();
        return (meta.content_type === contentTypes.JSON) ? JSON.parse(retval) : retval;
    case fieldtypes.TIME:
    case fieldtypes.DATETIME:
    case fieldtypes.DECIMAL:
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
        };
        return retval;
    case datatypes.Any.enums.Type.OBJECT:
        console.log(value);
    default:
        console.log(value);
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
            retval.type = datatypes.Any.enums.Type.SCALAR;
            retval.scalar = module.exports.encodeScalar(value);
            break;
        case "object":
            /*
            Object.prototype.toString.call( someVar ) === '[object Array]'   might be more "correct" but this is
            called often and this is notably faster
             */
            if (value.constructor == Array) {
                retval.type = datatypes.Any.enums.Type.ARRAY;
                retval.array = [];//{ array: [] };
                value.forEach(function(v,k) {
                    retval.array[k] = module.exports.encode(v);
                })
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
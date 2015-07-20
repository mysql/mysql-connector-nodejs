"use strict";

var datatypes = require('./Messages/mysqlx_datatypes').messages;

module.exports.decodeScalar = function (value) {
    switch (value.type) {
    case datatypes.Scalar.enums.Type.V_STRING:
        // TODO - charset!!!
        return value.v_string.value.toString();
    case datatypes.Scalar.enums.Type.V_NULL:
        return null;
    case datatypes.Scalar.enums.Type.V_OCTETS:
        return value.v_opaque;
    case datatypes.Scalar.enums.Type.V_SINT:
    case datatypes.Scalar.enums.Type.V_UINT:
    case datatypes.Scalar.enums.Type.V_OCTETS:
    case datatypes.Scalar.enums.Type.V_DOUBLE:
    case datatypes.Scalar.enums.Type.V_FLOAT:
    case datatypes.Scalar.enums.Type.V_BOOL:
    default:
       return "currently unhandled type " + value.type;
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
    switch (typeof(value)) {
        case "string":
            retval.type = datatypes.Scalar.enums.Type.V_STRING;
            retval.v_string =  { value: value };
    }
    return retval;
};

module.exports.encode = function (value) {
    var retval = {};
    switch (typeof(value)) {
        case "string":
            retval.type = datatypes.Any.enums.Type.SCALAR;
            retval.scalar = module.exports.encodeScalar(value);
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

            }
    }
    return retval;
};
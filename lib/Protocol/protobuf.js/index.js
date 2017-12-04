"use strict";

var long = require('./lib/Long');
var varint = require('./lib/varint');

function Protobuf(schema) {
    this.schema = schema;
}

Protobuf.prototype._findField = function (message, tag) {
    var field, key;

    for (key in this.schema.messages[message].fields) {
        if (this.schema.messages[message].fields[key].tag === tag) {
            field = this.schema.messages[message].fields[key];
            field.name = key;
        }
    }

    return field;
};

Protobuf.prototype.decode = function (message, data) {
    if (!Buffer.isBuffer(data)) {
        throw new Error('Data must be a buffer');
    }
    if (!this.schema.messages[message]) {
        throw new Error('Unknown Protobuffer message: ' + message);
    }

    var mc, type, tag, field, value, repeated, meta, low, high;
    var enums = this.schema.messages[message].enums;
    var position = 0;
    var length = data.length;
    var result = {};

    while (position < length) {
        mc = varint.read(data, position);
        type = mc.value & 0x07;
        tag = mc.value >> 3;
        position += mc.length;
        field = this._findField(message, tag);
        if (!field) {
            throw new Error('Encountered unknown message tag ' + tag);
        }

        repeated = field.rule === 'repeated';
        if (!result.hasOwnProperty(field.name) && repeated) result[field.name] = [];

        switch (field.type) {
            case 'uint32':
            case 'bool':
                // read varint
                value = varint.read(data, position);
                position += value.length;
                value = value.value;
                // coerce to boolean if correct
                if (field.type === 'bool') {
                    value = Boolean(value);
                }
                break;

            case 'int32':
                value = varint.read(data, position, true);
                position += value.length;
                value = value.value;
                break;

            case 'sint32':
                // read zigzag encoded varint
                value = varint.read(data, position, true);
                position += value.length;
                value = varint.dezigzag(value.value);
                break;

            case 'uint64':
                // read 64 bit varint
                value = varint.read64(data, position);
                position += value.length;
                value = value.value;
                break;

            case 'int64':
                value = varint.read64(data, position, true);
                position += value.length;
                value = value.value;
                break;

            case 'sint64':
                // read zigzag encoded 64 bit varint
                value = varint.read64(data, position, true);
                position += value.length;
                value = varint.dezigzag64(value.value);
                break;

            case 'fixed64':
            case 'sfixed64':
            case 'double':
                // read 64 bit number
                low = data.readUInt32LE(position);
                high = data.readUInt32LE(position + 4);
                value = new long(low, high, field.type !== 'sfixed64');
                position += 8;
                break;

            case 'bytes':
            case 'string':
                // read raw bytes
                meta = varint.read(data, position);
                position += meta.length;
                value = new Buffer(meta.value);
                data.copy(value, 0, position, position + meta.value);
                position += meta.value;
                // stringify raw bytes if string
                if (field.type === 'string') value = value.toString();
                break;

            case 'fixed32':
            case 'sfixed32':
            case 'float':
                // read 32 bit number
                value = data.readInt32LE(position);
                position += 4;
                break;

            default:
                // check if it's an enum
                if ((enums && enums[field.type]) || (this.schema.enums && this.schema.enums[field.type])) {
                    value = varint.read(data, position);
                    position += value.length;
                    value = value.value;
                } else {
                    var submessage = field.type;
                    if (!this.schema.messages[submessage]) {
                        if (this.schema.messages[message + "." + submessage]) {
                            submessage = message + "." + submessage;
                        } else {
                            submessage = message.slice(0, message.lastIndexOf('.')) + '.' + submessage;
                        }
                    }

                    // decode embedded message
                    meta = varint.read(data, position);
                    position += meta.length;
                    value = this.decode(submessage, data.slice(position, position + meta.value));
                    position += meta.value;
                }
                break;
        }


        if (repeated) {
            result[field.name].push(value);
        } else {
            result[field.name] = value;
        }
    }

    return result;
};

Protobuf.prototype.encode = function (message, data, extrasize, offset) {
    if (!this.schema.messages[message]) {
        throw new Error('Unknown message ' + message);
    }

    extrasize = extrasize || 0;
    offset = offset || 0;

    if (offset > extrasize) {
        throw new Error('Offset can\'t be larger than extrasize');
    }

    var self = this;
    var repeated, value;
    var result = null;
    var position = 0;
    var fields = this.schema.messages[message].fields;
    var enums = this.schema.messages[message].enums;

    function encodeField(key, item) {
        if (item === undefined) {
            return;
        }
        switch (fields[key].type) {
            case 'int32':
            case 'uint32':
            case 'sint32':
            case 'bool':
                if (fields[key].type === 'bool') {
                    value = Number(!!item);
                } else if (fields[key].type === 'sint32') {
                    value = varint.zigzag(item);
                } else {
                    value = item;
                }

                position += varint.write(result, fields[key].tag << 3, position);
                position += varint.write(result, value, position);
                break;

            case 'int64':
            case 'uint64':
            case 'sint64':
                if (typeof item === 'number') {
                    value = long.fromNumber(item, fields[key].type === 'uint64');
                } else if (typeof item === 'string') {
                    value = long.fromString(item, fields[key].type === 'uint64');
                } else {
                    value = item;
                }

                if (fields[key].type === 'sint64') {
                    value = varint.zigzag64(value);
                }

                position += varint.write(result, fields[key].tag << 3, position);
                position += varint.write64(result, value, position);
                break;

            case 'fixed64':
            case 'sfixed64':
            case 'double':
                if (typeof item === 'number') {
                    item = long.fromNumber(item, fields[key].type !== 'sfixed64');
                } else if (typeof item === 'string') {
                    item = long.fromString(item, fields[key].type !== 'sfixed64');
                }

                position += varint.write(result, (fields[key].tag << 3) + 1, position);

                if (fields[key].type === 'sfixed64') {
                    if (result) {
                        result.writeInt32LE(item.getLowBitsUnsigned(), position);
                    }
                    position += 4;
                    if (result) {
                        result.writeInt32LE(item.getHighBitsUnsigned(), position);
                    }
                    position += 4;
                } else {
                    if (result) {
                        result.writeInt32LE(item.getLowBits(), position);
                    }
                    position += 4;
                    if (result) {
                        result.writeInt32LE(item.getHighBits(), position);
                    }
                    position += 4;
                }
                break;

            case 'fixed32':
            case 'sfixed32':
            case 'float':
                if (typeof item !== 'number') {
                    item = Number(item);
                }

                position += varint.write(result, (fields[key].tag << 3) + 5, position);
                if (result) {
                    result.writeInt32LE(item, position);
                }
                position += 4;
                break;

            case 'bytes':
            case 'string':
                if (!Buffer.isBuffer(item)) {
                    if (typeof item !== 'string') {
                        item = String(item);
                    }
                    value = new Buffer(item, 'utf8');
                } else {
                    value = item;
                }

                position += varint.write(result, (fields[key].tag << 3) + 2, position);
                position += varint.write(result, value.length, position);
                if (result) {
                    value.copy(result, position);
                }
                position += value.length;
                break;

            default:
                if ((enums && enums[fields[key].type]) || (self.schema.enums && self.schema.enums[fields[key].type])) {
                    value = item;

                    position += varint.write(result, fields[key].tag << 3, position);
                    position += varint.write(result, value, position);
                } else {
                    var submessage = fields[key].type;
                    if (!self.schema.messages[submessage]) {
                        if (self.schema.messages[message + "." + submessage]) {
                            submessage = message + "." + submessage;
                        } else {
                            submessage = message.slice(0, message.lastIndexOf('.')) + '.' + submessage;
                        }
                    }
                    value = self.encode(submessage, item);

                    position += varint.write(result, (fields[key].tag << 3) + 2, position);
                    position += varint.write(result, value.length, position);
                    if (result) {
                        value.copy(result, position);
                    }
                    position += value.length;
                }
                break;
        }
    }

    function walkFields() {
        var key;
        for (key in data) {
            if (!fields[key]) {
                throw new Error('Unknown field "' + key + '" expected one of "' + Object.getOwnPropertyNames(fields).join('", "') + '" while encoding ' + message);
            }
            repeated = fields[key].rule === 'repeated';

            if (repeated) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].forEach(function (item) {
                    encodeField(key, item);
                });
            } else {
                encodeField(key, data[key]);
            }
        }
    }

    walkFields();
    result = new Buffer(position + extrasize);
    position = offset;
    walkFields();

    return result;
};

module.exports = Protobuf;

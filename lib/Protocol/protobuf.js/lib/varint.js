var long = require('./Long');

exports.dezigzag = function (value) {
    return (value >>> 1) ^ -(value & 1);
};

exports.read = function (buffer, offset, signed) {
    var byte, temp;
    var result = 0;
    var position = offset || 0;
    var shift = 0;

    do {
        byte = buffer[position];
        result += (byte & 0x7F) << shift;
        shift += 7;
        position++;
    } while (byte >= 0x80);

    if (!signed) result = result >>> 0;

    return { length: (position - offset), value: result };
};

exports.dezigzag64 = function (value) {
    return value.shiftRightUnsigned(1).xor(value.and(long.fromNumber(1)).negate());
};

exports.read64 = function (buffer, offset, signed) {
    var byte;
    var result = long.fromNumber(0);
    var position = offset || 0;
    var shift = 0;

    do {
        byte = buffer[position];
        result = result.add(long.fromNumber(byte & 0x7F).shiftLeft(shift));
        shift += 7;
        position++;
    } while (byte >= 0x80);

    if (!signed) result = result.toUnsigned();

    return { length: (position - offset), value: result };
};

exports.zigzag = function (value) {
    return (value << 1) ^ (value >> 31);
};

exports.write = function (buffer, number, offset) {
    offset = offset || 0;
    var position = offset || 0;

    number = number >>> 0;

    while ((number & ~0x7F) >>> 0) {
        if (buffer) buffer[position] = ((number & 0xFF) >>> 0) | 0x80;
        number = number >>> 7;
        position++;
    }

    if (buffer) buffer[position] = number;

    return position - offset + 1;
};

exports.zigzag64 = function (value) {
    return value.shiftLeft(1).xor(value.shiftRight(63));
};

exports.write64 = function (buffer, number, offset) {
    offset = offset || 0;
    var position = offset || 0;

    number = number.toUnsigned();

    while (number.and(long.fromNumber(~0x7F)).greaterThan(long.fromNumber(0))) {
        if (buffer) buffer[position] = number.and(long.fromNumber(0xFF)).or(long.fromNumber(0x80)).toNumber();
        number = number.shiftRightUnsigned(7);
        position++;
    }

    if (buffer) buffer[position] = number.toNumber();

    return position - offset + 1;
};

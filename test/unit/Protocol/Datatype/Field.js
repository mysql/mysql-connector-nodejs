var decode = require('../../../../lib/Protocol/Datatype').decodeField;
var fieldtypes = require('../../../../lib/Protocol/Messages/mysqlx_resultset').messages.ColumnMetaData.enums.FieldType;

/** TODO: Move - see also Datatype.js */
var contentTypes = {
    GEOMETRY: 1,
    JSON: 2,
    XML:  3
};

var should = require('chai').should();

var emptyBuffer = new Buffer(0);

describe('MySQL Field encoding', function () {
    describe('Decode', function () {
        it('should decode an empty buffer as NULL', function () {
            should.not.exist(decode(emptyBuffer, { type: fieldtypes.SINT }));
            should.not.exist(decode(emptyBuffer, { type: fieldtypes.UINT }));
            should.not.exist(decode(emptyBuffer, { type: fieldtypes.DOUBLE }));
            should.not.exist(decode(emptyBuffer, { type: fieldtypes.ENUM }));
            should.not.exist(decode(emptyBuffer, { type: fieldtypes.BYTES, content_type: contentTypes.GEOMETRY }));
            should.not.exist(decode(emptyBuffer, { type: fieldtypes.BYTES, content_type: contentTypes.JSON }));
            should.not.exist(decode(emptyBuffer, { type: fieldtypes.BYTES, content_type: contentTypes.XML }));
        });
        it('should throw if an undefined type is requestd', function () {
            (function () {
                decode(emptyBuffer, { type: fieldtypes.NOT_EXISTING });

            }).should.throw(/No valid type/);
        });
        it('should throw if an unknown type is requested', function () {
            (function () {
                decode(emptyBuffer, -1);
            }).should.throw();
        });

        [
            { in: new Buffer([0x2d]), exp: -23, type: fieldtypes.SINT },
            //{ in: new Buffer([0xf8, 0x97, 0xd9, 0xf7, 0xc7, 0x14]), exp: 353252353532, type: fieldtypes.SINT },
            { in: new Buffer([0xa4, 0x13]), exp: 1234, type: fieldtypes.UINT },
            { in: new Buffer([0x66, 0x32, 0x00]), exp: 'f2', type: fieldtypes.ENUM }
        ].forEach(function(test) {
            it('correctly decodes ' + test.exp, function () {
                decode(test.in, {type: test.type}).should.equal(test.exp);
            });
        });

        [
            { in: new Buffer([0x8a, 0x0e, 0x49, 0x40]), exp: 3.14151, type: fieldtypes.FLOAT },
            { in: new Buffer([0xcb, 0x0a, 0x6e, 0x39, 0xd1, 0x21, 0x09, 0x40]), exp: 3.141512345, type: fieldtypes.DOUBLE }
        ].forEach(function (test) {
            it('correctly decodes ~' + test.exp, function () {
                decode(test.in, {type: test.type}).should.be.closeTo(test.exp, 0.00001);
            });
        });

        [
            { in: new Buffer([0x00]), exp: "", type: fieldtypes.TIME, description: "empty positive time" },
            { in: new Buffer([0x01]), exp: "-", type: fieldtypes.TIME, description: "empty negative time" },
            { in: new Buffer([0x00, 0x02]), exp: "02", type: fieldtypes.TIME, description: "prefix hours <10" },
            { in: new Buffer([0x00, 0x0A]), exp: "10", type: fieldtypes.TIME, description: "not prefix hours >=10"},
            { in: new Buffer([0x00, 0x02, 0x02]), exp: "02:02", type: fieldtypes.TIME, description: "prefix minutes <10" },
            { in: new Buffer([0x00, 0x02, 0x0A]), exp: "02:10", type: fieldtypes.TIME, description: "not prefix minutes >=10"},
            { in: new Buffer([0x00, 0x02, 0x02, 0x02]), exp: "02:02:02", type: fieldtypes.TIME, description: "prefix seconds <10" },
            { in: new Buffer([0x00, 0x02, 0x02, 0x0A]), exp: "02:02:10", type: fieldtypes.TIME, description: "not prefix seconds >=10"},
            { in: new Buffer([0x00, 0x02, 0x02, 0x02, 0xA0, 0x9c, 0x01]), exp: "02:02:02.020000", type: fieldtypes.TIME, description: "handle optional useconds" },
            { in: new Buffer([0x01, 0x02, 0x02, 0x02, 0xA0, 0x9c, 0x01]), exp: "-02:02:02.020000", type: fieldtypes.TIME, description: "handle negative time with useconds" }
        ].forEach(function (test) {
            it('should decode TIME: ' + test.description + "(" + test.exp + ")", function () {
                decode(test.in, {type: test.type}).should.equal(test.exp);
            });
        });
        [
            { in: new Buffer([0xDF, 0x0F]), exp: "2015", type: fieldtypes.DATETIME, description: "year only" },
            { in: new Buffer([0xDF, 0x0F, 0x02]), exp: "2015-02", type: fieldtypes.DATETIME, description: "year and month < 10" },
            { in: new Buffer([0xDF, 0x0F, 0x0A]), exp: "2015-10", type: fieldtypes.DATETIME, description: "year and month = 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02]), exp: "2015-02-02", type: fieldtypes.DATETIME, description: "year, month and day < 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x0A]), exp: "2015-02-10", type: fieldtypes.DATETIME, description: "year, month and day = 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02, 0x02]), exp: "2015-02-02 02", type: fieldtypes.DATETIME, description: "date with hour < 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02, 0x0A]), exp: "2015-02-02 10", type: fieldtypes.DATETIME, description: "date with hour = 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02, 0x02, 0x02]), exp: "2015-02-02 02:02", type: fieldtypes.DATETIME, description: "date with minute < 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02, 0x02, 0x0A]), exp: "2015-02-02 02:10", type: fieldtypes.DATETIME, description: "date with minute = 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02, 0x02, 0x02, 0x02]), exp: "2015-02-02 02:02:02", type: fieldtypes.DATETIME, description: "date with second < 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02, 0x02, 0x02, 0x0A]), exp: "2015-02-02 02:02:10", type: fieldtypes.DATETIME, description: "date with second = 10" },
            { in: new Buffer([0xDF, 0x0F, 0x02, 0x02, 0x02, 0x02, 0x02, 0xA0, 0x9c, 0x01]), exp: "2015-02-02 02:02:02.020000", type: fieldtypes.DATETIME, description: "datetime with useconds" }
        ].forEach(function (test) {
            it('should decode DATETIME: ' + test.description + "(" + test.exp + ")", function () {
                decode(test.in, {type: test.type}).should.equal(test.exp);
            });
        });

        [
            { in: new Buffer([0x04, 0x12, 0x34, 0x01, 0xd0]), exp: "-12.3401"},
            { in: new Buffer([0x0f, 0x12, 0x34, 0x56, 0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0c]), exp: "1234.567800000000000"},
            { in: new Buffer([0x0f, 0x12, 0x34, 0x56, 0x78, 0x98, 0x76, 0x54, 0x32, 0x10, 0x1c]), exp: "1234.567898765432101"}
        ].forEach(function (test) {
            it('should decode DECIMAL ' + test.exp, function () {
                decode(test.in, {type: fieldtypes.DECIMAL}).should.equal(test.exp);
            });
        });
        it('should decode SET fields');

        it('should decode a zero-length string', function () {
            var buffer = new Buffer("\x00");
            decode(buffer, { type: fieldtypes.BYTES }).should.equal("");
        });
        it('should decode a string', function () {
            var buffer = new Buffer("Hello World\x00");
            decode(buffer, { type: fieldtypes.BYTES }).should.equal("Hello World");
        });
        it('should decode a string with \\0 in between', function () {
            var buffer = new Buffer("Hello\x00World\x00");
            decode(buffer, { type: fieldtypes.BYTES }).should.equal("Hello\x00World");
        });
        it('should decode simple JSON', function () {
            var buffer = new Buffer("{}\x00");
            decode(buffer, { type: fieldtypes.BYTES, content_type: contentTypes.JSON }).should.deep.equal({});
        });
    });
    //describe('Encode');
});
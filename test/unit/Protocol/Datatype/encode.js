"use strict";

var encode = require('../../../../lib/Protocol/Datatype').encode;
require('chai').should();

describe('Data encoding', function () {
    [
        {
            should: "encode NULL",
            in: null,
            exp: {
                type: 1,
                scalar: {
                    type: 3
                }
            }
        },
        {
            should: "encode zero",
            in: 0,
            exp: {
                type: 1,
                scalar: {
                    type: 1,
                    v_signed_int: 0
                }
            }
        },
        {
            should: "encode small positive number",
            in: 1,
            exp: {
                type: 1,
                scalar: {
                    type: 1,
                    v_signed_int: 1
                }
            }
        },
        {
            should: "encode a simple string",
            in: "some string",
            exp: {
                type: 1,
                scalar: {
                    type: 8,
                    v_string: {
                        value: "some string"
                    }
                }
            }
        },
        {
            should: "encode a string with \\0 byte",
            in: "some\0string",
            exp: {
                type: 1,
                scalar: {
                    type: 8,
                    v_string: {
                        value: "some\0string"
                    }
                }
            }
        },
        {
            should: "encode a string with Umlauts",
            in: "some äöüß string",
            exp: {
                type: 1,
                scalar: {
                    type: 8,
                    v_string: {
                        value: "some äöüß string"
                    }
                }
            }
        },
        {
            should: "encode an array of string",
            in: [ "aaa", "bbb", "ccc"],
            exp: {
                type: 3,
                array: [
                    /* Don't trust string encoding enough? - Add more tests above! */
                    encode("aaa"),
                    encode("bbb"),
                    encode("ccc")
                ]
            }
        },
        {
            should: "encode an object of strings",
            in: { "1": "aaa", "b": "bbb", "weird\"key": "ccc" },
            exp: {
                type: 2,
                obj: {
                    fld: [
                        {
                            key: "1",
                            value: encode("aaa")
                        },
                        {
                            key: "b",
                            value: encode("bbb")
                        },
                        {
                            key: "weird\"key",
                            value: encode("ccc")
                        }
                    ]
                }
            }
        }
    ].forEach(function (input) {
            it('should ' + input.should, function () {
                encode(input.in).should.deep.equal(input.exp);
            });
        });
});
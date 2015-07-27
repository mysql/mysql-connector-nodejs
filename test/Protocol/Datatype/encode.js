"use strict";

var encode = require('../../../lib/Protocol/Datatype').encode;
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
                    {
                        type: 1,
                        scalar: {
                            type: 8,
                            v_string: {
                                value: "aaa"
                            }
                        }
                    },
                    {
                        type: 1,
                        scalar: {
                            type: 8,
                            v_string: {
                                value: "bbb"
                            }
                        }
                    },
                    {
                        type: 1,
                        scalar: {
                            type: 8,
                            v_string: {
                                value: "ccc"
                            }
                        }
                    }
                ]
            }
        }
    ].forEach(function (input) {
            it('should ' + input.should, function () {
                encode(input.in).should.deep.equal(input.exp);
            });
        });
});
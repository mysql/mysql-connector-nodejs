"use strict";

var encode = require('../../../lib/Protocol/Datatype').encode;
require('chai').should();

describe('Data encoding', function () {
    [
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
        }
    ].forEach(function (input) {
            it('should ' + input.should, function () {
                encode(input.in).should.deep.equal(input.exp);
            });
        });
});
"use strict";

var Datatype = require('../../lib/Protocol/Datatype');
var parse = require('../../lib/Expressions').parse;
require('chai').should();


describe('MySQLx Expression parsing', function () {
    [
        {
            should: 'return empty tree for empty string',
            in: '',
            exp: {}
        },
        {
            should: 'return operator tree for comparison',
            in: '@.name == "Johannes"',
            exp: {
                type: 5,
                operator: {
                    name: '==',
                    param: [
                        {
                            type: 1,
                            identifier: {
                                /*name: "doc",*/
                                document_path: {
                                    type: 1,
                                    value: "name"
                                }
                            }
                        },
                        {
                            type: 2,
                            constant: Datatype.encode("Johannes")
                        }
                    ]
                }
            }
        }
    ].forEach(function (expression) {
            it('should ' + expression.should + ' (' + expression.in + ')', function () {
                parse(expression.in).should.deep.equal(expression.exp);
            });
        });
});
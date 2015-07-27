"use strict";

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
            in: '@name == "Johannes"',
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
                            constant: {
                                type: 1,
                                scalar: {
                                    type: 8,
                                    v_string: {
                                        value: "Johannes"
                                    }
                                }
                            }
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
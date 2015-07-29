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
        },
        {
            should: 'allow functions without arguments',
            in: 'concat()',
            exp: {
                type: 4,
                function_call: {
                    name: {
                        name: "concat"
                    },
                    param: []
                }
            }
        },
        {
            should: 'allow functions with single argument',
            in: 'concat("foo")',
            exp: {
                type: 4,
                function_call: {
                    name: {
                        name: "concat"
                    },
                    param: [
                        {
                            type: 2,
                            constant: Datatype.encode("foo")
                        }
                    ]
                }
            }
        },
        {
            should: 'allow functions with multiple arguments',
            in: 'concat("foo", "bar")',
            exp: {
                type: 4,
                function_call: {
                    name: {
                        name: "concat"
                    },
                    param: [
                        {
                            type: 2,
                            constant: Datatype.encode("foo")
                        },
                        {
                            type: 2,
                            constant: Datatype.encode("bar")
                        }
                    ]
                }
            }
        },
        {
            should: 'allow nested function calls',
            in: 'concat("foo", concat("bar"))',
            exp: {
                type: 4,
                function_call: {
                    name: {
                        name: "concat"
                    },
                    param: [
                        {
                            type: 2,
                            constant: Datatype.encode("foo")
                        },
                        {
                            type: 4,
                            function_call: {
                                name: {
                                    name: "concat"
                                },
                                param: [
                                    {
                                        type: 2,
                                        constant: Datatype.encode("bar")
                                    }
                                ]
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
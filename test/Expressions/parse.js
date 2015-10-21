"use strict";

var Datatype = require('../../lib/Protocol/Datatype');
var parse = require('../../lib/Expressions').parse;
require('chai').should();


describe('MySQLx Expression parsing', function () {
    [
        {
            should: 'return empty tree for empty input',
            in: '',
            exp: {}
        },
        {
            should: 'allow whitespaces within strings',
            in: '"foo bar"',
            exp: {

                type: 2,
                literal: Datatype.encodeScalar("foo bar")
            }
        },
        {
            should: 'allow tabs within strings',
            in: '"foo\\tbar"',
            exp: {

                type: 2,
                literal: Datatype.encodeScalar("foo\tbar")
            }
        },
        {
            should: 'allow single quoted strings',
            in: "'foo bar'",
            exp: {

                type: 2,
                literal: Datatype.encodeScalar("foo bar")
            }
        },
        {
            should: 'allow escaped quotes within strings',
            in: '"foo\\\"bar"',
            exp: {

                type: 2,
                literal: Datatype.encodeScalar("foo\"bar")
            }
        },
        {
            should: 'return operator tree for comparison',
            in: '$.name == "Johannes"',
            exp: {
                type: 5,
                operator: {
                    name: '==',
                    param: [
                        {
                            type: 1,
                            identifier: {
                                document_path: [
                                    {
                                        type: 1,
                                        value: "name"
                                    }
                                ]
                            }
                        },
                        {
                            type: 2,
                            literal: Datatype.encodeScalar("Johannes")
                        }
                    ]
                }
            }
        },
        {
            should: 'return operator tree for comparison',
            in: '$.name.first == "Johannes"',
            exp: {
                type: 5,
                operator: {
                    name: '==',
                    param: [
                        {
                            type: 1,
                            identifier: {
                                document_path: [
                                    {
                                        type: 1,
                                        value: "name"
                                    },
                                    {
                                        type: 1,
                                        value: "first"
                                    }
                                ]
                            }
                        },
                        {
                            type: 2,
                            literal: Datatype.encodeScalar("Johannes")
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
                    }
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
                            literal: Datatype.encodeScalar("foo")
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
                            literal: Datatype.encodeScalar("foo")
                        },
                        {
                            type: 2,
                            literal: Datatype.encodeScalar("bar")
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
                            literal: Datatype.encodeScalar("foo")
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
                                        literal: Datatype.encodeScalar("bar")
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
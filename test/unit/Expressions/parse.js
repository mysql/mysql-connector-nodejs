"use strict";

var Datatype = require('../../../lib/Protocol/Datatype');
var parse = require('../../../lib/Expressions').parse;
require('chai').should();


describe('MySQLx Expression parsing', function () {
    [
        {
            should: 'return empty tree for empty input',
            in: '',
            exp: {}
        },
        {
            should: 'allow booleans',
            in: 'true',
            exp: {

                type: 2,
                literal: Datatype.encodeScalar(true)
            }
        },
        {
            should: 'allow booleans',
            in: 'false',
            exp: {

                type: 2,
                literal: Datatype.encodeScalar(false)
            }
        },
        {
            should: 'allow lowercase null',
            in: 'null',
            exp: {
                type: 2,
                literal: Datatype.encodeScalar(null)
            }
        },
        {
            should: 'allow uppercase null',
            in: 'NULL',
            exp: {
                type: 2,
                literal: Datatype.encodeScalar(null)
            }
        },
        {
            should: 'allow zero',
            in: '0',
            exp: {
                type: 2,
                literal: Datatype.encodeScalar(0)
            }
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
            should: 'allow empty quoted strings',
            in: "''",
            exp: {

                type: 2,
                literal: Datatype.encodeScalar('')
            }
        },
        {
            should: 'allow empty double quoted strings',
            in: '""',
            exp: {

                type: 2,
                literal: Datatype.encodeScalar('')
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
            should: 'parse LIKE',
            in: '"abc" LIKE "%b_"',
            exp: {
                type: 5,
                operator: {
                    name: 'like',
                    param: [
                        {
                            type: 2,
                            literal: Datatype.encodeScalar("abc")
                        },
                        {
                            type: 2,
                            literal: Datatype.encodeScalar("%b_")
                        }
                    ]
                }
            }
        },
        {
            should: 'parse NOT LIKE',
            in: '"abc" NOT LIKE "%b_"',
            exp: {
                type: 5,
                operator: {
                    name: 'not_like',
                    param: [
                        {
                            type: 2,
                            literal: Datatype.encodeScalar("abc")
                        },
                        {
                            type: 2,
                            literal: Datatype.encodeScalar("%b_")
                        }
                    ]
                }
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
            should: 'allow negation',
            in: '!false',
            exp: {

                type: 5,
                operator: {
                    name: '!',
                    param: [
                        {
                            type: 2,
                            literal: Datatype.encodeScalar(false)
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
        },
        {
            should: 'compare field and integer with backtick',
            in: '`foo` > 200',
            exp: {
                type: 5,
                operator: {
                    name: '>',
                    param: [
                        {
                            type: 1,
                            identifier: {
                                name: "foo"
                            }
                        },
                        {
                            type: 2,
                            literal: Datatype.encodeScalar(200)
                        }
                    ]
                }
            }
        },
        {
            should: 'parse named placeholders',
            in: ':foo',
            exp: {
                type: 6,
                position: 0
            }
        },
        {
            should: 'parse multiple named placeholders',
            in: 'concat(:foo, :bar)',
            exp: {
                type: 4,
                function_call: {
                    name: {
                        name: "concat"
                    },
                    param: [
                        {
                            type: 6,
                            position: 0
                        },
                        {
                            type: 6,
                            position: 1
                        }
                    ]
                }
            }
        },
        {
            should: 'parse ordinal placeholders',
            in: '?',
            exp: {
                type: 6,
                position: 0
            }
        },
        {
            should: 'parse multiple ordinal placeholders',
            in: 'concat(?, ?)',
            exp: {
                type: 4,
                function_call: {
                    name: {
                        name: "concat"
                    },
                    param: [
                        {
                            type: 6,
                            position: 0
                        },
                        {
                            type: 6,
                            position: 1
                        }
                    ]
                }
            }
        }
    ].forEach(function (expression) {
            it('should ' + expression.should + ' (' + expression.in + ')', function () {
                parse(expression.in).expr.should.deep.equal(expression.exp);
            });
        });
});

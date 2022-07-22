/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const Parser = require('../../../lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('columnIdent', () => {
        const type = Parser.Type.COLUMN_IDENT;
        const mode = Parser.Mode.TABLE;

        it('parses an identifier containing the column name', () => {
            return expect(Parser.parse('foo', { type, mode })).to.deep.equal({
                type: 'columnIdent',
                value: {
                    documentPath: [],
                    name: 'foo'
                }
            });
        });

        it('parses an identifier containing the column name and a document path using a json_extract shortcut', () => {
            const singleMemberAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{ type: 'memberAsterisk' }],
                    name: 'foo'
                }
            };

            expect(Parser.parse("foo->'$.*'", { type, mode })).to.deep.equal(singleMemberAsterisk);

            const singleMember = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'bar'
                    }],
                    name: 'foo'
                }
            };

            expect(Parser.parse("foo->'$.bar'", { type, mode })).to.deep.equal(singleMember);

            const doubleMember = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'bar'
                    }, {
                        type: 'member',
                        value: 'baz'
                    }],
                    name: 'foo'
                }
            };

            expect(Parser.parse("foo->'$.bar.baz'", { type, mode })).to.deep.equal(doubleMember);

            const singleArrayIndex = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'bar'
                    }, {
                        type: 'arrayIndex',
                        value: 3
                    }],
                    name: 'foo'
                }
            };

            expect(Parser.parse("foo->'$.bar[3]'", { type, mode })).to.deep.equal(singleArrayIndex);

            const singleArrayIndexAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'bar'
                    }, {
                        type: 'arrayIndexAsterisk'
                    }],
                    name: 'foo'
                }
            };

            expect(Parser.parse("foo->'$.bar[*]'", { type, mode })).to.deep.equal(singleArrayIndexAsterisk);

            const doubleAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'bar'
                    }, {
                        type: 'doubleAsterisk'
                    }, {
                        type: 'member',
                        value: 'baz'
                    }],
                    name: 'foo'
                }
            };

            expect(Parser.parse("foo->'$.bar**.baz'", { type, mode })).to.deep.equal(doubleAsterisk);
        });

        it('parses an identifier containing the column name and a document path using a json_unquote shortcut', () => {
            const singleMemberAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{ type: 'memberAsterisk' }],
                            name: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo->>'$.*'", { type, mode })).to.deep.equal(singleMemberAsterisk);

            const singleMember = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'bar'
                            }],
                            name: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo->>'$.bar'", { type, mode })).to.deep.equal(singleMember);

            const doubleMember = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'bar'
                            }, {
                                type: 'member',
                                value: 'baz'
                            }],
                            name: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo->>'$.bar.baz'", { type, mode })).to.deep.equal(doubleMember);

            const singleArrayIndex = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'bar'
                            }, {
                                type: 'arrayIndex',
                                value: 3
                            }],
                            name: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo->>'$.bar[3]'", { type, mode })).to.deep.equal(singleArrayIndex);

            const singleArrayIndexAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'bar'
                            }, {
                                type: 'arrayIndexAsterisk'
                            }],
                            name: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo->>'$.bar[*]'", { type, mode })).to.deep.equal(singleArrayIndexAsterisk);

            const doubleAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'bar'
                            }, {
                                type: 'doubleAsterisk'
                            }, {
                                type: 'member',
                                value: 'baz'
                            }],
                            name: 'foo'
                        }
                    }]
                }
            };

            return expect(Parser.parse("foo->>'$.bar**.baz'", { type, mode })).to.deep.equal(doubleAsterisk);
        });

        it('parses an identifier containing the table and column names', () => {
            return expect(Parser.parse('foo.bar', { type, mode })).to.deep.equal({
                type: 'columnIdent',
                value: {
                    documentPath: [],
                    name: 'bar',
                    table: 'foo'
                }
            });
        });

        it('parses an identifier containing the table and column names, and a document path using a json_extract shortcut', () => {
            const singleMemberAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{ type: 'memberAsterisk' }],
                    name: 'bar',
                    table: 'foo'
                }
            };

            expect(Parser.parse("foo.bar->'$.*'", { type, mode })).to.deep.equal(singleMemberAsterisk);

            const singleMember = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'baz'
                    }],
                    name: 'bar',
                    table: 'foo'
                }
            };

            expect(Parser.parse("foo.bar->'$.baz'", { type, mode })).to.deep.equal(singleMember);

            const doubleMember = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'baz'
                    }, {
                        type: 'member',
                        value: 'qux'
                    }],
                    name: 'bar',
                    table: 'foo'
                }
            };

            expect(Parser.parse("foo.bar->'$.baz.qux'", { type, mode })).to.deep.equal(doubleMember);

            const singleArrayIndex = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'baz'
                    }, {
                        type: 'arrayIndex',
                        value: 3
                    }],
                    name: 'bar',
                    table: 'foo'
                }
            };

            expect(Parser.parse("foo.bar->'$.baz[3]'", { type, mode })).to.deep.equal(singleArrayIndex);

            const singleArrayIndexAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'baz'
                    }, {
                        type: 'arrayIndexAsterisk'
                    }],
                    name: 'bar',
                    table: 'foo'
                }
            };

            expect(Parser.parse("foo.bar->'$.baz[*]'", { type, mode })).to.deep.equal(singleArrayIndexAsterisk);

            const doubleAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'baz'
                    }, {
                        type: 'doubleAsterisk'
                    }, {
                        type: 'member',
                        value: 'qux'
                    }],
                    name: 'bar',
                    table: 'foo'
                }
            };

            return expect(Parser.parse("foo.bar->'$.baz**.qux'", { type, mode })).to.deep.equal(doubleAsterisk);
        });

        it('parses an identifier containing the table and column names, and a document path using a json_unquote shortcut', () => {
            const singleMemberAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{ type: 'memberAsterisk' }],
                            name: 'bar',
                            table: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar->>'$.*'", { type, mode })).to.deep.equal(singleMemberAsterisk);

            const singleMember = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'baz'
                            }],
                            name: 'bar',
                            table: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar->>'$.baz'", { type, mode })).to.deep.equal(singleMember);

            const doubleMember = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'baz'
                            }, {
                                type: 'member',
                                value: 'qux'
                            }],
                            name: 'bar',
                            table: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar->>'$.baz.qux'", { type, mode })).to.deep.equal(doubleMember);

            const singleArrayIndex = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'baz'
                            }, {
                                type: 'arrayIndex',
                                value: 3
                            }],
                            name: 'bar',
                            table: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar->>'$.baz[3]'", { type, mode })).to.deep.equal(singleArrayIndex);

            const singleArrayIndexAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'baz'
                            }, {
                                type: 'arrayIndexAsterisk'
                            }],
                            name: 'bar',
                            table: 'foo'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar->>'$.baz[*]'", { type, mode })).to.deep.equal(singleArrayIndexAsterisk);

            const doubleAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'baz'
                            }, {
                                type: 'doubleAsterisk'
                            }, {
                                type: 'member',
                                value: 'qux'
                            }],
                            name: 'bar',
                            table: 'foo'
                        }
                    }]
                }
            };

            return expect(Parser.parse("foo.bar->>'$.baz**.qux'", { type, mode })).to.deep.equal(doubleAsterisk);
        });

        it('parses an identifier containing the schema, table and column names', () => {
            return expect(Parser.parse('foo.bar.baz', { type, mode })).to.deep.equal({
                type: 'columnIdent',
                value: {
                    documentPath: [],
                    name: 'baz',
                    schema: 'foo',
                    table: 'bar'
                }
            });
        });

        it('parses an identifier containing the schema, table and column names, and a document path using a json_extract shortcut', () => {
            const singleMemberAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'memberAsterisk'
                    }],
                    name: 'baz',
                    schema: 'foo',
                    table: 'bar'
                }
            };

            expect(Parser.parse("foo.bar.baz->'$.*'", { type, mode })).to.deep.equal(singleMemberAsterisk);

            const singleMember = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'qux'
                    }],
                    name: 'baz',
                    schema: 'foo',
                    table: 'bar'
                }
            };

            expect(Parser.parse("foo.bar.baz->'$.qux'", { type, mode })).to.deep.equal(singleMember);

            const doubleMember = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'qux'
                    }, {
                        type: 'member',
                        value: 'quux'
                    }],
                    name: 'baz',
                    schema: 'foo',
                    table: 'bar'
                }
            };

            expect(Parser.parse("foo.bar.baz->'$.qux.quux'", { type, mode })).to.deep.equal(doubleMember);

            const singleArrayIndex = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'qux'
                    }, {
                        type: 'arrayIndex',
                        value: 3
                    }],
                    name: 'baz',
                    schema: 'foo',
                    table: 'bar'
                }
            };

            expect(Parser.parse("foo.bar.baz->'$.qux[3]'", { type, mode })).to.deep.equal(singleArrayIndex);

            const singleArrayIndexAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'qux'
                    }, {
                        type: 'arrayIndexAsterisk'
                    }],
                    name: 'baz',
                    schema: 'foo',
                    table: 'bar'
                }
            };

            expect(Parser.parse("foo.bar.baz->'$.qux[*]'", { type, mode })).to.deep.equal(singleArrayIndexAsterisk);

            const doubleAsterisk = {
                type: 'columnIdent',
                value: {
                    documentPath: [{
                        type: 'member',
                        value: 'qux'
                    }, {
                        type: 'doubleAsterisk'
                    }, {
                        type: 'member',
                        value: 'quux'
                    }],
                    name: 'baz',
                    schema: 'foo',
                    table: 'bar'
                }
            };

            return expect(Parser.parse("foo.bar.baz->'$.qux**.quux'", { type, mode })).to.deep.equal(doubleAsterisk);
        });

        it('parses an identifier containing the schema, table and column names, and a document path using a json_unquote shortcut', () => {
            const singleMemberAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'memberAsterisk'
                            }],
                            name: 'baz',
                            schema: 'foo',
                            table: 'bar'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar.baz->>'$.*'", { type, mode })).to.deep.equal(singleMemberAsterisk);

            const singleMember = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'qux'
                            }],
                            name: 'baz',
                            schema: 'foo',
                            table: 'bar'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar.baz->>'$.qux'", { type, mode })).to.deep.equal(singleMember);

            const doubleMember = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'qux'
                            }, {
                                type: 'member',
                                value: 'quux'
                            }],
                            name: 'baz',
                            schema: 'foo',
                            table: 'bar'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar.baz->>'$.qux.quux'", { type, mode })).to.deep.equal(doubleMember);

            const singleArrayIndex = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'qux'
                            }, {
                                type: 'arrayIndex',
                                value: 3
                            }],
                            name: 'baz',
                            schema: 'foo',
                            table: 'bar'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar.baz->>'$.qux[3]'", { type, mode })).to.deep.equal(singleArrayIndex);

            const singleArrayIndexAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'qux'
                            }, {
                                type: 'arrayIndexAsterisk'
                            }],
                            name: 'baz',
                            schema: 'foo',
                            table: 'bar'
                        }
                    }]
                }
            };

            expect(Parser.parse("foo.bar.baz->>'$.qux[*]'", { type, mode })).to.deep.equal(singleArrayIndexAsterisk);

            const doubleAsterisk = {
                type: 'functionCall',
                value: {
                    name: {
                        name: 'json_unquote'
                    },
                    params: [{
                        type: 'columnIdent',
                        value: {
                            documentPath: [{
                                type: 'member',
                                value: 'qux'
                            }, {
                                type: 'doubleAsterisk'
                            }, {
                                type: 'member',
                                value: 'quux'
                            }],
                            name: 'baz',
                            schema: 'foo',
                            table: 'bar'
                        }
                    }]
                }
            };

            return expect(Parser.parse("foo.bar.baz->>'$.qux**.quux'", { type, mode })).to.deep.equal(doubleAsterisk);
        });

        it('fails to parse an invalid identifier', () => {
            expect(() => Parser.parse("[<doc->'$.foo', bar>]", { type, mode })).to.throw();
            expect(() => Parser.parse('[<"foo", 1>]', { type, mode })).to.throw();
            return expect(() => Parser.parse("{<doc->'$.foobar'>}", { type, mode })).to.throw();
        });

        it('fails to parse an invalid column name', () => {
            expect(() => Parser.parse('$foo', { type, mode })).to.throw();
            expect(() => Parser.parse('foo$', { type, mode })).to.throw();
            expect(() => Parser.parse('*foo', { type, mode })).to.throw();
            expect(() => Parser.parse('foo*', { type, mode })).to.throw();
            expect(() => Parser.parse('[1]foo', { type, mode })).to.throw();
            expect(() => Parser.parse('foo[1]', { type, mode })).to.throw();
            expect(() => Parser.parse('[*]foo', { type, mode })).to.throw();
            expect(() => Parser.parse('foo[*]', { type, mode })).to.throw();
            expect(() => Parser.parse('**foo', { type, mode })).to.throw();
            return expect(() => Parser.parse('foo**', { type, mode })).to.throw();
        });

        it('fails to parse invalid table and column names', () => {
            expect(() => Parser.parse('foo.$bar', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar$', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.*bar', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar*', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.[1]bar', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar[1]', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.[*]bar', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar[*]', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.**bar', { type, mode })).to.throw();
            return expect(() => Parser.parse('foo.bar**', { type, mode })).to.throw();
        });

        it('fails to parse invalid schema, table and column names', () => {
            expect(() => Parser.parse('foo.bar.$baz', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.baz$', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.*baz', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.baz*', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.[1]baz', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.baz[1]', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.[*]baz', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.baz[*]', { type, mode })).to.throw();
            expect(() => Parser.parse('foo.bar.**baz', { type, mode })).to.throw();
            return expect(() => Parser.parse('foo.bar.baz**', { type, mode })).to.throw();
        });

        it('fails to parse an identifier containing an invalid document path', () => {
            expect(() => Parser.parse("foo->'$bar'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$..'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$*'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$..'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$foo[1]'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$foo.[1]'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$foo*[1]'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$foo.*[1]'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$**'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$foo**bar'", { type, mode })).to.throw();
            expect(() => Parser.parse("foo->'$foo.**bar'", { type, mode })).to.throw();
            expect(() => Parser.parse("doc->'foo**.bar'", { type, mode })).to.throw();
            expect(() => Parser.parse("doc->'foo[*].bar", { type, mode })).to.throw();
            expect(() => Parser.parse("doc->'_**._'", { type, mode })).to.throw();
            expect(() => Parser.parse("doc->'_**[*]._'", { type, mode })).to.throw();
            return expect(() => Parser.parse("doc->_**[*]._**._'", { type, mode })).to.throw();
        });

        it('fails to parse identifiers that are only valid in document mode', () => {
            expect(() => Parser.parse('foo**.bar', { type, mode })).to.throw();
            expect(() => Parser.parse('foo[*].bar', { type, mode })).to.throw();
            expect(() => Parser.parse('_**._', { type, mode })).to.throw();
            expect(() => Parser.parse('_**[*]._', { type, mode })).to.throw();
            expect(() => Parser.parse('_**[*]._**._', { type, mode })).to.throw();
            expect(() => Parser.parse('$.foo.bar[*]', { type, mode })).to.throw();
            expect(() => Parser.parse('$ = {"a":1}', { type, mode })).to.throw();
            expect(() => Parser.parse('$." ".bar', { type, mode })).to.throw();
            expect(() => Parser.parse('$.a[0].b[0]', { type, mode })).to.throw();
            expect(() => Parser.parse('$.a[0][0]', { type, mode })).to.throw();
            expect(() => Parser.parse('$.a[*][*]', { type, mode })).to.throw();
            expect(() => Parser.parse('$.a[*].z', { type, mode })).to.throw();
            expect(() => Parser.parse('$."foo bar"."baz**" = $', { type, mode })).to.throw();
            expect(() => Parser.parse('$.foo**.bar', { type, mode })).to.throw();
            expect(() => Parser.parse('$."foo bar"**.baz', { type, mode })).to.throw();
            expect(() => Parser.parse('$."foo"**."bar"', { type, mode })).to.throw();
            expect(() => Parser.parse('$."foo."**."bar"', { type, mode })).to.throw();
            expect(() => Parser.parse('$."foo."**.".bar"', { type, mode })).to.throw();
            expect(() => Parser.parse('$.""', { type, mode })).to.throw();
            expect(() => Parser.parse('$**.bar', { type, mode })).to.throw();
            expect(() => Parser.parse('$**[0]', { type, mode })).to.throw();
            expect(() => Parser.parse('$**.foo', { type, mode })).to.throw();
            expect(() => Parser.parse('$.a**[0]', { type, mode })).to.throw();
            expect(() => Parser.parse('$.a**[*]', { type, mode })).to.throw();
            return expect(() => Parser.parse('$.a**.foo', { type, mode })).to.throw();
        });
    });
});

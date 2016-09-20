/*global describe, it */

"use strict";

const parseLinkResolver = require('../../../../lib/DevAPI/Util/parseLinkResolver'),
    joinOperations = require('../../../../lib/Protocol/Client').joinOperatios;
require('chai').should();

describe('MySQLx Link Resolve Expression parsing', function () {
    [
        {
            should: 'parse only a link name',
            in: 'foobar',
            exp: {
                links: [{ link: "foobar" }]
            }
        },
        {
            should: 'parse aliased left join',
            in: 'alias --> link',
            exp: {
                alias: 'alias',
                links: [{
                    linkname: 'link',
                    operation: joinOperations.LEFT
                }]
            }
        },
        {
            should: 'parse aliased left join without space',
            in: 'alias-->link',
            exp: {
                alias: 'alias',
                links: [{
                    linkname: 'link',
                    operation: joinOperations.LEFT
                }]
            }
        },
        {
            should: 'parse aliased left join, with aliased link',
            in: 'alias --> link linkalias',
            exp: {
                alias: 'alias',
                links: [{
                    linkname: 'link',
                    alias: 'linkalias',
                    operation: joinOperations.LEFT
                }]
            }
        },
        {
            should: 'parse aliased left join, with aliased link, with as',
            in: 'alias --> link as linkalias',
            exp: {
                alias: 'alias',
                links: [{
                    linkname: 'link',
                    alias: 'linkalias',
                    operation: joinOperations.LEFT
                }]
            }
        },
        {
            should: 'parse aliased left join with backtick',
            in: '`alias` -->  `-->`',
            exp: {
                alias: 'alias',
                links: [{
                    linkname: '-->',
                    operation: joinOperations.LEFT
                }]
            }
        },
        {
            should: 'parse aliased left join and inner join with aliased link, with as',
            in: 'alias --> link1 ==> link2 as linkalias',
            exp: {
                alias: 'alias',
                links: [
                    {
                        linkname: 'link1',
                        operation: joinOperations.LEFT
                    },
                    {
                        linkname: 'link2',
                        alias: 'linkalias',
                        operation: joinOperations.INNER
                    }
                ]
            }
        }    ].forEach(function (expression) {
        it('should ' + expression.should + ' (' + expression.in + ')', function () {
            parseLinkResolver(expression.in).should.deep.equal(expression.exp);
        });
    });
});
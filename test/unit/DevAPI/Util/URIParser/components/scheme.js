'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseUri = require('../../../../../../lib/DevAPI/Util/URIParser');

describe('parsing the scheme', () => {
    it('fails if an unknown scheme extension is provided', () => {
        expect(() => parseUri('mysqlx+foo://user:password@host:33060')).to.throw('Scheme mysqlx+foo is not valid.');
    });

    it('enables SRV resolution when the proper scheme is used', () => {
        expect(parseUri('mysqlx+srv://user:password@host:33060')).to.deep.include({ resolveSrv: true });
    });

    it('does not enable SRV resolution when the proper scheme is not used', () => {
        expect(parseUri('mysqlx://user:password@host:33060')).to.deep.include({ resolveSrv: false });
    });
});

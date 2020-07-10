'use strict';

/* eslint-env node, mocha */

const Expr = require('../../../lib/Protocol/Stubs/mysqlx_expr_pb').Expr;
const config = require('../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../');
const pkg = require('../../../package.json');

describe('client API entrypoint', () => {
    const baseConfig = { schema: undefined };

    context('expr()', () => {
        it('parses a string into a document-mode expression by default', () => {
            const expression = mysqlx.expr('foo');
            const typed = new Expr(expression.toArray());

            // string describes an identifier document path
            expect(typed.getType()).to.equal(1);
            const documentPath = typed.getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType(1)).to.equal(1);
            expect(documentPath[0].getValue()).to.equal('foo');
        });

        it('parses a string into a table-mode expression if explicitely requested', () => {
            const expression = mysqlx.expr('foo', { mode: mysqlx.Mode.TABLE });
            const typed = new Expr(expression.toArray());

            // string describes an identifier name
            expect(typed.getType()).to.equal(1);
            expect(typed.getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
            expect(typed.getIdentifier().getName()).to.equal('foo');
        });
    });

    context('getSession()', () => {
        context('when the connection definition is not valid', () => {
            it('fails using something other then an object or string', () => {
                return mysqlx.getSession(false)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('fails using a null configuration object', () => {
                return mysqlx.getSession(null)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('fails using an empty string', () => {
                return mysqlx.getSession('')
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('fails using an invalid URI or JSON string', () => {
                return mysqlx.getSession('foo')
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });
        });

        context('when the port is out of bounds', () => {
            it('fails using a configuration object', () => {
                const failureConfig = Object.assign({}, config, baseConfig, { port: -1 });

                return mysqlx.getSession(failureConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Port must be between 0 and 65536'));
            });

            it('fails using a URI', () => {
                const failureConfig = Object.assign({}, config, baseConfig, { port: 65537 });
                const uri = `${failureConfig.user}:${failureConfig.password}@${failureConfig.host}:${failureConfig.port}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Port must be between 0 and 65536'));
            });
        });
    });

    context('getVersion()', () => {
        it('returns the client version', () => {
            expect(mysqlx.getVersion()).to.equal(pkg.version);
        });
    });
});

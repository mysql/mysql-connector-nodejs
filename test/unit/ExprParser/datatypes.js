'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Parser = require('lib/ExprParser');
const Scalar = require('lib/ExprParser/lib/stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('available datatypes', () => {
        const type = Parser.Type.LITERAL;

        it('should parse double-quoted strings', () => {
            const literal = Parser.parse('"foo"', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_STRING);
            /* eslint-disable node/no-deprecated-api */
            expect(new Buffer(literal.output.getVString().getValue()).toString()).to.equal('foo');
            /* eslint-enable node/no-deprecated-api */
        });

        it('should parse single-quoted strings', () => {
            const literal = Parser.parse("'bar'", { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_STRING);
            /* eslint-disable node/no-deprecated-api */
            expect(new Buffer(literal.output.getVString().getValue()).toString()).to.equal('bar');
            /* eslint-enable node/no-deprecated-api */
        });

        it('should parse integers', () => {
            const literal = Parser.parse('1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_UINT);
            expect(literal.output.getVUnsignedInt()).to.equal(1);
        });

        it('should parse negative integers', () => {
            const literal = Parser.parse('-1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_SINT);
            expect(literal.output.getVSignedInt()).to.equal(-1);
        });

        it('should parse doubles', () => {
            const literal = Parser.parse('1.11111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(1.11111111);
        });

        it('should parse negative doubles', () => {
            const literal = Parser.parse('-1.11111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_DOUBLE);
            expect(literal.output.getVDouble()).to.equal(-1.11111111);
        });

        it('should parse floats', () => {
            let literal = Parser.parse('1.1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_FLOAT);
            expect(literal.output.getVFloat()).to.equal(1.1);

            literal = Parser.parse('1.1111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_FLOAT);
            expect(literal.output.getVFloat()).to.equal(1.1111111);
        });

        it('should parse negative floats', () => {
            let literal = Parser.parse('-1.1', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_FLOAT);
            expect(literal.output.getVFloat()).to.equal(-1.1);

            literal = Parser.parse('-1.1111111', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_FLOAT);
            expect(literal.output.getVFloat()).to.equal(-1.1111111);
        });

        it('should parse booleans', () => {
            let literal = Parser.parse('true', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_BOOL);
            expect(literal.output.getVBool()).to.equal(true);

            literal = Parser.parse('false', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_BOOL);
            expect(literal.output.getVBool()).to.equal(false);
        });

        it('should parse `null`', () => {
            const literal = Parser.parse('null', { type });
            expect(literal.output.getType()).to.equal(Scalar.Type.V_NULL);
        });
    });
});

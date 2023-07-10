/*
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
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

const assertDateIntervalExpr = (expr, { datetimeFunction, interval, unit }) => {
    expect(Parser({ type: Parser.Type.INTERVAL_EXPR }).parse(expr)).to.deep.equal({
        type: 'intervalExpr',
        value: {
            name: datetimeFunction,
            params: [{
                type: 'functionCall',
                value: {
                    name: {
                        name: 'CURDATE'
                    },
                    params: []
                }
            }, {
                type: 'literal',
                value: interval
            }, {
                type: 'intervalUnit',
                value: unit
            }]
        }
    });
};

const assertTimeIntervalExpr = (expr, { datetimeFunction, interval, unit }) => {
    expect(Parser({ type: Parser.Type.INTERVAL_EXPR }).parse(expr)).to.deep.equal({
        type: 'intervalExpr',
        value: {
            name: datetimeFunction,
            params: [{
                type: 'functionCall',
                value: {
                    name: {
                        name: 'CURTIME'
                    },
                    params: []
                }
            }, {
                type: 'literal',
                value: interval
            }, {
                type: 'intervalUnit',
                value: unit
            }]
        }
    });
};

const assertDateAddExpr = (expr, { interval, unit }) => {
    return assertDateIntervalExpr(expr, { datetimeFunction: 'date_add', interval, unit });
};

const assertDateSubExpr = (expr, { interval, unit }) => {
    return assertDateIntervalExpr(expr, { datetimeFunction: 'date_sub', interval, unit });
};

const assertTimeAddExpr = (expr, { interval, unit }) => {
    return assertTimeIntervalExpr(expr, { datetimeFunction: 'date_add', interval, unit });
};

const assertTimeSubExpr = (expr, { interval, unit }) => {
    return assertTimeIntervalExpr(expr, { datetimeFunction: 'date_sub', interval, unit });
};

describe('ExprParser', () => {
    context('intervalExpr', () => {
        it('parses datetime functions in the microsecond range', () => {
            assertTimeAddExpr('CURTIME() + INTERVAL 12345 MICROSECOND', { interval: 12345, unit: 'MICROSECOND' });
            return assertTimeSubExpr('CURTIME() - INTERVAL 12345 MICROSECOND', { interval: 12345, unit: 'MICROSECOND' });
        });

        it('parses datetime functions in the second range', () => {
            assertTimeAddExpr('CURTIME() + INTERVAL 2 SECOND', { interval: 2, unit: 'SECOND' });
            return assertTimeSubExpr('CURTIME() - INTERVAL 2 SECOND', { interval: 2, unit: 'SECOND' });
        });

        it('parses datetime functions in the minute range', () => {
            assertTimeAddExpr('CURTIME() + INTERVAL 2 MINUTE', { interval: 2, unit: 'MINUTE' });
            return assertTimeSubExpr('CURTIME() - INTERVAL 2 MINUTE', { interval: 2, unit: 'MINUTE' });
        });

        it('parses datetime functions in the hourly range', () => {
            assertTimeAddExpr('CURTIME() + INTERVAL 2 HOUR', { interval: 2, unit: 'HOUR' });
            return assertTimeSubExpr('CURTIME() - INTERVAL 2 HOUR', { interval: 2, unit: 'HOUR' });
        });

        it('parses datetime functions in the daily range', () => {
            assertDateAddExpr('CURDATE() + INTERVAL 2 DAY', { interval: 2, unit: 'DAY' });
            return assertDateSubExpr('CURDATE() - INTERVAL 2 DAY', { interval: 2, unit: 'DAY' });
        });

        it('parses datetime functions in the weekly range', () => {
            assertDateAddExpr('CURDATE() + INTERVAL 2 WEEK', { interval: 2, unit: 'WEEK' });
            return assertDateSubExpr('CURDATE() - INTERVAL 2 WEEK', { interval: 2, unit: 'WEEK' });
        });

        it('parses datetime functions in the monthly range', () => {
            assertDateAddExpr('CURDATE() + INTERVAL 2 MONTH', { interval: 2, unit: 'MONTH' });
            return assertDateSubExpr('CURDATE() - INTERVAL 2 MONTH', { interval: 2, unit: 'MONTH' });
        });

        it('parses datetime functions in the quarterly range', () => {
            assertDateAddExpr('CURDATE() + INTERVAL 2 QUARTER', { interval: 2, unit: 'QUARTER' });
            return assertDateSubExpr('CURDATE() - INTERVAL 2 QUARTER', { interval: 2, unit: 'QUARTER' });
        });

        it('parses datetime functions in the yearly range', () => {
            assertDateAddExpr('CURDATE() + INTERVAL 2 YEAR', { interval: 2, unit: 'YEAR' });
            return assertDateSubExpr('CURDATE() - INTERVAL 2 YEAR', { interval: 2, unit: 'YEAR' });
        });

        it('parses datetime functions in the second with microsecond range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1.999999' SECOND_MICROSECOND", { interval: '1.999999', unit: 'SECOND_MICROSECOND' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1.999999' SECOND_MICROSECOND", { interval: '1.999999', unit: 'SECOND_MICROSECOND' });
        });

        it('parses datetime functions in the minute with microsecond range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1:1.999999' MINUTE_MICROSECOND", { interval: '1:1.999999', unit: 'MINUTE_MICROSECOND' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1:1.999999' MINUTE_MICROSECOND", { interval: '1:1.999999', unit: 'MINUTE_MICROSECOND' });
        });

        it('parses datetime functions in the minute with second range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1:1' MINUTE_SECOND", { interval: '1:1', unit: 'MINUTE_SECOND' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1:1' MINUTE_SECOND", { interval: '1:1', unit: 'MINUTE_SECOND' });
        });

        it('parses datetime functions in the hourly with microsecond range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1:1:1.999999' HOUR_MICROSECOND", { interval: '1:1:1.999999', unit: 'HOUR_MICROSECOND' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1:1:1.999999' HOUR_MICROSECOND", { interval: '1:1:1.999999', unit: 'HOUR_MICROSECOND' });
        });

        it('parses datetime functions in the hourly with second range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1:1:1' HOUR_SECOND", { interval: '1:1:1', unit: 'HOUR_SECOND' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1:1:1' HOUR_SECOND", { interval: '1:1:1', unit: 'HOUR_SECOND' });
        });

        it('parses datetime functions in the hourly with minute range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1:1' HOUR_MINUTE", { interval: '1:1', unit: 'HOUR_MINUTE' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1:1' HOUR_MINUTE", { interval: '1:1', unit: 'HOUR_MINUTE' });
        });

        it('parses datetime functions in the hourly with minute range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1:1' HOUR_MINUTE", { interval: '1:1', unit: 'HOUR_MINUTE' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1:1' HOUR_MINUTE", { interval: '1:1', unit: 'HOUR_MINUTE' });
        });

        it('parses datetime functions in the dayly with microsecond range', () => {
            assertTimeAddExpr("CURTIME() + INTERVAL '1 1:1:1.999999' DAY_MICROSECOND", { interval: '1 1:1:1.999999', unit: 'DAY_MICROSECOND' });
            return assertTimeSubExpr("CURTIME() - INTERVAL '1 1:1:1.999999' DAY_MICROSECOND", { interval: '1 1:1:1.999999', unit: 'DAY_MICROSECOND' });
        });

        it('parses datetime functions in the daily with microsecond range', () => {
            assertDateAddExpr("CURDATE() + INTERVAL '1 1:1:1.999999' DAY_MICROSECOND", { interval: '1 1:1:1.999999', unit: 'DAY_MICROSECOND' });
            return assertDateSubExpr("CURDATE() - INTERVAL '1 1:1:1.999999' DAY_MICROSECOND", { interval: '1 1:1:1.999999', unit: 'DAY_MICROSECOND' });
        });

        it('parses datetime functions in the daily with second range', () => {
            assertDateAddExpr("CURDATE() + INTERVAL '1 1:1:1' DAY_SECOND", { interval: '1 1:1:1', unit: 'DAY_SECOND' });
            return assertDateSubExpr("CURDATE() - INTERVAL '1 1:1:1' DAY_SECOND", { interval: '1 1:1:1', unit: 'DAY_SECOND' });
        });

        it('parses datetime functions in the daily with minute range', () => {
            assertDateAddExpr("CURDATE() + INTERVAL '1 1:1' DAY_MINUTE", { interval: '1 1:1', unit: 'DAY_MINUTE' });
            return assertDateSubExpr("CURDATE() - INTERVAL '1 1:1' DAY_MINUTE", { interval: '1 1:1', unit: 'DAY_MINUTE' });
        });

        it('parses datetime functions in the daily with hour range', () => {
            assertDateAddExpr("CURDATE() + INTERVAL '1 1' DAY_HOUR", { interval: '1 1', unit: 'DAY_HOUR' });
            return assertDateSubExpr("CURDATE() - INTERVAL '1 1' DAY_HOUR", { interval: '1 1', unit: 'DAY_HOUR' });
        });

        it('parses datetime functions in the YEARLY with monthly range', () => {
            assertDateAddExpr("CURDATE() + INTERVAL '1-1' YEAR_MONTH", { interval: '1-1', unit: 'YEAR_MONTH' });
            return assertDateSubExpr("CURDATE() - INTERVAL '1-1' YEAR_MONTH", { interval: '1-1', unit: 'YEAR_MONTH' });
        });

        it('parses composable datetime functions', () => {
            // date_add(date_add(CURDATE(), 2, "MONTH"), 25, "SECOND")
            return expect(Parser({ type: Parser.Type.INTERVAL_EXPR }).parse('CURDATE() + INTERVAL 2 MONTH + INTERVAL 25 SECOND')).to.deep.equal({
                type: 'intervalExpr',
                value: {
                    name: 'date_add',
                    params: [{
                        type: 'intervalExpr',
                        value: {
                            name: 'date_add',
                            params: [{
                                type: 'functionCall',
                                value: {
                                    name: {
                                        name: 'CURDATE'
                                    },
                                    params: []
                                }
                            }, {
                                type: 'literal',
                                value: 2
                            }, {
                                type: 'intervalUnit',
                                value: 'MONTH'
                            }]
                        }
                    }, {
                        type: 'literal',
                        value: 25
                    }, {
                        type: 'intervalUnit',
                        value: 'SECOND'
                    }]
                }
            });
        });
    });
});

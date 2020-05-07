'use strict';

const SQL_STRING = `SELECT INDEX_TYPE, IS_VISIBLE, EXPRESSION FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`;

module.exports = function (session, schema, table, name) {
    return session.sql(SQL_STRING)
        .bind(schema, table, name)
        .execute()
        .then(res => {
            return res.fetchOne();
        });
};

'use strict';

const SQL_STRING = `SELECT p.statement_id, p.sql_text FROM performance_schema.prepared_statements_instances AS p
    JOIN performance_schema.threads AS t ON p.owner_thread_id = t.thread_id AND t.processlist_id = @@pseudo_thread_id
    WHERE p.statement_id = mysqlx_get_prepared_statement_id(?)`;

module.exports = function (session, id) {
    let statement;

    return session.sql(SQL_STRING)
        .bind(id)
        .execute(row => {
            statement = row;
        })
        .then(() => {
            return statement;
        });
};

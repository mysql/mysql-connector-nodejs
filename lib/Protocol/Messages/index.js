"use strict";

(function () {
    module.exports = {messages: {}};

    [
        require('./mysqlx.json'),
        require('./mysqlx_crud.json'),
        require('./mysqlx_connection.json'),
        require('./mysqlx_expr.json'),
        require('./mysqlx_session.json'),
        require('./mysqlx_datatypes.json'),
        require('./mysqlx_sql.json')
    ].forEach(function (messages) {
            var mypackage = "";
            if (messages.package) {
                mypackage = messages.package + '.';
            }
            for (var name in messages.messages) {
                module.exports.messages[mypackage + name] = messages.messages[name];
            }
        });

    module.exports.ClientMessages = module.exports.messages["Mysqlx.ClientMessages"].enums.Type;
    module.exports.ServerMessages = module.exports.messages["Mysqlx.ServerMessages"].enums.Type;
}());
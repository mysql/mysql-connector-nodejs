"use strict";

function registerMessages(prefix, messages) {
    for (var name in messages.messages) {
        module.exports.messages[prefix + name] = messages.messages[name];
        if (messages.messages[name].messages) {
            registerMessages(prefix + name + '.', messages.messages[name])
        }
    }
}

(function () {
    module.exports = {messages: {}, enums: {}};

    [
        require('./mysqlx.json'),
        require('./mysqlx_crud.json'),
        require('./mysqlx_connection.json'),
        require('./mysqlx_expr.json'),
        require('./mysqlx_session.json'),
        require('./mysqlx_datatypes.json'),
        require('./mysqlx_notice.json'),
        require('./mysqlx_resultset.json'),
        require('./mysqlx_sql.json')
    ].forEach(function (messages) {
            var mypackage = "";
            if (messages.package) {
                mypackage = messages.package + '.';
            }
            registerMessages(mypackage, messages);
            if (messages.enums) {
                for (var name in messages.enums) {
                    module.exports.enums[name] = messages.enums[name];
                }
            }
        });

    module.exports.ClientMessages = module.exports.messages["Mysqlx.ClientMessages"].enums.Type;
    module.exports.ServerMessages = module.exports.messages["Mysqlx.ServerMessages"].enums.Type;
}());
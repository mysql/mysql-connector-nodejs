## Creating a Table

`Session.sql()` API is exposed to the user for the purpose of executing raw SQL commands on the server.
MySQL Tables can be created using this API as shown below:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .sql('CREATE TABLE schemaName.tableName (column INT)')
            .execute()
            .then(() => {
                return session.getSchema('schemaName').getTable('tableName');
            });
    })
    .then(table => {
        // work with the Table object
    })
    .catch(err => {
        // something went wrong
    });
```

## Dropping a Table

Consider a table `testSchema.testTable`.
We can drop this table using the `Session.sql()` API similar to above.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .sql('CREATE TABLE schemaName.tableName (column INT)')
            .execute()
            .then(() => session);
    })
    .then(session => {
        return session
            .sql(`DROP TABLE testSchema.testTable`)
            .execute();
    })
    .then(() => {
        // do other things
    })
    .catch(err => {
        // something went wrong
    });
```

## Handling data in existing tables

Considering a table `testSchema.testTable` such as the following:

```
+------+------+
| name | age  |
+------+------+
| foo  |   23 |
| bar  |   42 |
+------+------+
```

Table rows can be updated or deleted under some specific conditions, as shown below.

To update/delete specific rows from a table, one should provide the appropriate filtering condition when calling `update()` or by additionally calling the `where()` method. For more details about the expression format, please check the [guide](https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchconditionstr).

To update/delete all rows from a table, one should provide any expression that evaluates to `true` (if no expression is provided, executing the operation will result in an error) when calling `delete()` or by appending a call to  `where()`.

### Deleting rows that match a given criteria

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .delete('`name` == "foo"')
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [ [ 'bar', 42 ] ]
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .delete()
            .where('`name` == "foo"')
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [ [ 'bar', 42 ] ]
    });
```

### Deleting all rows

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .delete('true')
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // []
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .delete()
            .where('true')
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // []
    });
```

### Updating rows that match a given criteria

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .update('`name` == "foo"')
            .set('age', 50)
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('name ASC').execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [ [ 'foo', 50 ], [ 'bar', 42 ] ]
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .update()
            .where('`name` == "bar"')
            .set('age', 50)
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('name ASC').execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [ [ 'foo', 23 ] [ 'bar', 50 ] ]
    });
```

### Deleting all rows

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .update('true')
            .set('age', 50)
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('name ASC').execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [ [ 'foo', 50 ] [ 'bar', 50 ] ]
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .update()
            .where('true')
            .set('name', 'qux')
            .execute()
            .then(() => table)
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('age ASC').execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [ [ 'qux', 23 ] [ 'qux', 50 ] ]
    });
```

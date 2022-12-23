#### Creating a Table

`Session.sql()` API is exposed to execute raw SQL commands on the server. MySQL tables can be created using this API as shown below:

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.sql('CREATE TABLE schemaName.tableName (column INT)')
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

#### Listing all the existing tables

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return Promise
            .all([
                session.sql('CREATE TABLE foo.bar (_id SERIAL)').execute(),
                session.sql('CREATE TABLE foo.baz (_id SERIAL)').execute()
            ])
            .then(() => session.getSchema('foo'));
    })
    .then(schema => {
        return schema.getTables();
    })
    .then(tables => {
        console.log(tables[0].getName()); // 'bar'
        console.log(tables[1].getName()); // 'baz'
    })
```

#### Dropping a Table

Dropping a `testSchema.testTable` with the `Session.sql()` API is similar to the above:

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.sql('CREATE TABLE schemaName.tableName (column INT)')
            .execute()
            .then(() => {
                return session.sql('DROP TABLE testSchema.testTable')
                    .execute();
            });
    })
    .catch(err => {
        // something went wrong
    });
```

### Handling data in existing tables

With a table `testSchema.testTable` such as the following:

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

#### Deleting rows that match a given criteria

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.delete()
            .where('name = "foo"')
            .execute()
            .then(() => {
                return table.select()
                    .execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // [ [ 'bar', 42 ] ]
    });
```

#### Deleting all rows

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        // The expression should evaluate to `true`.
        return table.delete()
            .where('true')
            .execute()
            .then(() => {
                return table.select()
                    .execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // []
    });
```

#### Updating rows that match a given criteria

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        // The criteria is defined through the expression.
        return table.update()
            .where('name = "bar"')
            .set('age', 50)
            .execute()
            .then(() => {
                return table.select()
                    .orderBy('name ASC')
                    .execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // [ [ 'foo', 23 ] [ 'bar', 50 ] ]
    });
```

#### Deleting all rows

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        // The expression should evaluate to `true`.
        return table.update().where('true').set('name', 'qux')
            .execute()
            .then(() => {
                return table.select().orderBy('age ASC').execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // [ [ 'qux', 23 ] [ 'qux', 50 ] ]
    });
```

### Cursors

Similarly to the document-based API, iterating over result sets originating from regular relational tables can be done either with `fetchAll()` (as depicted up until now) and with the pull-based `fetchOne()` cursor or the push-based API using callbacks. The only difference in the later is the fact that any callback provided for handling column metadata will be ignored.

#### Pull-based approach

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.select()
            .orderBy('age ASC')
            .execute();
    })
    .then(result => {
        console.log(result.fetchOne()); // [ 'qux', 23 ]
        console.log(result.fetchOne()); // [ 'qux', 50 ]
    });
```

#### Push-based approach

```javascript
const mysqlx = require('@mysql/xdevapi');
const data = [];
const metadata = [];

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.select()
            .orderBy('age ASC')
            .execute(row => data.push(row), meta => metadata.push(meta));
    })
    .then(() => {
        console.log(rows); // [['qux', 23], ['qux', 50]]
        console.log(metadata.map(column => column.getColumnName()); // ['name', 'age']
    });
```

### Iterating over multiple result sets

```javascript
const mysqlx = require('@mysql/xdevapi');

const procedure = `CREATE PROCEDURE proc() BEGIN
    SELECT name, age FROM testSchema.testTable;
    SELECT name, age from testSchema.testTable;
END`;

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.sql(procedure)
            .execute()
            .then(() => {
                return session.sql(`CALL proc()`)
                    .execute()
            })
            .then(result => {
                let item = result.fetchAll();
                console.log(item); // [['qux', 23]]

                result.nextResult();

                item = result.fetchOne();
                console.log(item); // ['qux', 50]
            });
    });
```

### Handling column metadata

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.select()
            .orderBy('age ASC')
            .execute();
    })
    .then(result => {
        const columns = result.getColumns();

        console.log(columns[0].getColumnName()); // 'name'
        console.log(columns[1].getColumnName()); // 'age'
    });
```

### Retrieving the table size

The size of a given table can be retrieved using the `count()` method.

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.getSchema('testSchema').getTable('testTable').count();
    })
    .then(count => {
        console.log(count); // 2
    });
```

### Column Types

It is important to understand how MySQL column types are translated to JavaScript/Node.js native types. One case worth a special mention is the fact that, by default, every possible `number` higher than 2^53 - 1 (the maximum safest integer in JavaScript) or lower than -2^53 + 1 (the minimum safest integer in JavaScript) will be preserved as a `string` in order to avoid loosing precision. However, an application can customize this behaviour by selecting from one of the following alternatives instead:

- all integers are preseved as a `string`
- all integers are preserved as a `BigInt`
- only unsafe integers are preserved as a `BigInt`

Selecting the appropriate strategy for handling unsafe integers in a result set can be done via a corresponding connection option.

**Convert all integers in the result set to a JavaScript `string`**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.STRING, host: 'localhost', user: 'root' })
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // ['1', '18446744073709551615']
    });

mysqlx.getSession('mysqlx://root@localhost?integer-type=string')
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // ['1', '18446744073709551615']
    });
```

**Convert only unsafe integers in the result set to a JavaScript `string` (DEFAULT)**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.UNSAFE_STRING, host: 'localhost', user: 'root' })
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // [1, '18446744073709551615']
    });

mysqlx.getSession('mysqlx://root@localhost?integer-type=unsafe_string')
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // [1, '18446744073709551615']
    });
```

**Convert all integers in the result set to a JavaScript `BigInt`**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.BIGINT, host: 'localhost', user: 'root' })
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // [1n, 18446744073709551615n]
    });

mysqlx.getSession('mysqlx://root@localhost?integer-type=bigint')
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // [1n, 18446744073709551615n]
    });
```

**Convert only unsafe integers in the result set to a JavaScript `BigInt`**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.UNSAFE_BIGINT, host: 'localhost', user: 'root' })
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // [1n, 18446744073709551615n]
    });

mysqlx.getSession('mysqlx://root@localhost?integer-type=unsafe_bigint')
    .then(session => {
        return session.sql(`SELECT 1, 18446744073709551615`)
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // [1, 18446744073709551615n]
    });
```

Statements created and executed by an application that operate with `BIGINT`, `DECIMAL` or `NUMERIC` can also be specified with a JavaScript `string` or `BigInt` (if it is an integer). This is possible on every method and API used as a CRUD statement building block, and additionally, on SQL placeholder assignments, like in the following examples.

Assuming a table `t` within an existing schema `s` created with:

```sql
CREATE TABLE s.t (unsafeNegative BIGINT, unsafePositive BIGINT UNSIGNED);
```

**Insert an unsafe integer in a `BIGINT` column**

```javascript
mysqlx.getSession({ user: 'root', host: 'localhost', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getTable('t')
            .insert('unsafeNegative')
            .values(-9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .execute();
    });

mysqlx.getSession({ user: 'root', host: 'localhost', schema: 's' })
    .then(session => {
        return session.sql(`INSERT INTO s.t (unsafeNegative, unsafePositive) VALUES (?, ?)`)
            .bind('unsafePositive', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    });
```

**Update an unsafe integer in one or more records with a `BIGINT` column**

```javascript
mysqlx.getSession({ user: 'root', host: 'localhost', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getTable('t')
            .update()
            .where('true')
            .set('unsafePositive', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    });
```

The following table depicts a non-comprehensive and possible mapping between data types.

| MySQL             | JavaScript/Node.js                |
|-------------------|-----------------------------------|
| `INTEGER`         | `Number`                          |
| `INT`             | `Number`                          |
| `SMALLINT`        | `Number`                          |
| `TINYINT`         | `Number`                          |
| `MEDIUMINT`       | `Number`                          |
| `BIGINT`          | `Number`, `String`, or `BigInt`   |
| `DECIMAL`         | `Number` or `String`              |
| `NUMERIC`         | `Number` or `String`              |
| `FLOAT`           | `Number`                          |
| `DOUBLE`          | `Number`                          |
| `BIT`             | `String`                          |
| `DATE`            | `Date`                            |
| `DATETIME`        | `Date`                            |
| `TIMESTAMP`       | `Number`                          |
| `TIME`            | `String`                          |
| `CHAR`            | `String`                          |
| `VARCHAR`         | `String`                          |
| `BINARY`          | `String`                          |
| `VARBINARY`       | `String`                          |
| `BLOB`            | `String`                          |
| `TEXT`            | `String`                          |
| `ENUM`            | `String`                          |
| `SET`             | `Array`                           |
| `JSON`            | `Object`                          |
| `SPATIAL`         | `Buffer`                          |

Additionally, except for `JSON` fields, one must also account for the following:
- `Boolean` values (`true` and `false`) will be coerced into any kind of [numeric](https://dev.mysql.com/doc/refman/8.0/en/numeric-types.html) type
- `null` or `undefined` will be coerced into the MySQL [`NULL`](https://dev.mysql.com/doc/refman/8.0/en/working-with-null.html) value

#### Types as column metadata

One of the dimensions provided as part of the column metadata is its type. However, most of the times this type is not a direct match of the SQL data type. This happens not only because MySQL itself extends the set of types defined by the SQL standard but also because not all queries happen over a table with a defined schema. For instance:

```javascript
session.select('SELECT 1 + 2.0')
    .execute()
    .then(res => {
        const columns = res.getColumns();

        console.log(columns[0].getType()); // 'DECIMAL'
    });
```

This query results in one of the values being coerced and the protocol will encode the result set field using the coerced type as inferred by the server. The list of field types is somewhat limited but the protocol encodes additional metadata that allows to extract more details about each column type. The following table depicts the mapping between SQL data types, X Protocol field types and X DevAPI column types.

| SQL Data Type                     | X Protocol Field Type | X DevAPI Column Type  |
|-----------------------------------|-----------------------|-----------------------|
| `BIT`                             | `BIT`                 | `BIT`                 |
| `TINYINT`                         | `SINT`                | `TINYINT`             |
| `TINYINT UNSIGNED`                | `UINT`                | `UNSIGNED TINYINT`    |
| `SMALLINT`                        | `SINT`                | `SMALLINT`            |
| `SMALLINT UNSIGNED`               | `UINT`                | `UNSIGNED SMALLINT`   |
| `MEDIUMINT`                       | `SINT`                | `MEDIUMINT`           |
| `MEDIUMINT UNSIGNED`              | `UINT`                | `UNSIGNED MEDIUMINT`  |
| `INT`                             | `SINT`                | `INT`                 |
| `INT UNSIGNED`                    | `UINT`                | `UNSIGNED INT`        |
| `BIGINT`                          | `SINT`                | `BIGINT`              |
| `BIGINT UNSIGNED`                 | `UINT`                | `UNSIGNED BIGINT`     |
| `FLOAT`                           | `FLOAT`               | `FLOAT`               |
| `FLOAT UNSIGNED`                  | `FLOAT`               | `UNSIGNED FLOAT`      |
| `DECIMAL`                         | `DECIMAL`             | `DECIMAL`             |
| `DECIMAL UNSIGNED`                | `DECIMAL`             | `UNSIGNED DECIMAL`    |
| `DOUBLE`                          | `DOUBLE`              | `DOUBLE`              |
| `DOUBLE UNSIGNED`                 | `DOUBLE`              | `UNSIGNED DOUBLE`     |
| `JSON`                            | `BYTES`               | `JSON`                |
| `CHAR`, `VARCHAR`, ...            | `BYTES`               | `STRING`              |
| `BLOB`, `BINARY`, `GEOMETRY`, ... | `BYTES`               | `BYTES`               |
| `TIME`                            | `TIME`                | `TIME`                |
| `DATE`                            | `DATETIME`            | `DATE`                |
| `DATETIME`                        | `DATETIME`            | `DATETIME`            |
| `TIMESTAMP`                       | `DATETIME`            | `TIMESTAMP`           |
| `SET`                             | `SET`                 | `SET`                 |
| `ENUM`                            | `ENUM`                | `ENUM`                |

In a nutshell, every other type not listed maps, in X DevAPI, to `STRING` in case the column `charset` is not `binary`, otherwise it maps to `BYTES`.

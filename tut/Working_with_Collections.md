## Handling documents in existing collections

Considering a collection `testSchema.testCollection` containing the following documents:

```json
[{
    "_id": 1,
    "name": "foo"
}, {
    "_id": 2,
    "name": "bar"
}]
```

These documents can be modified or removed under some specific conditions, as shown below.

To modify/remove specific documents from a collection, one should provide the appropriate filtering condition when calling `modify()` or `remove()`. For more details about the expression format, please check the [user guide](https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchconditionstr).

To modify/remove all documents from a collection, one should provide any expression that evaluates to `true` (if no expression is provided, executing the operation will result in an error) when calling `modify()` or `remove()`.

### Removing documents that match a given criteria

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The criteria is defined through the expression.
            .remove('$.name == "foo"')
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [{ _id: 2, name: 'bar' }]
    });
```

### Removing all documents

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The expression should evaluate to `true`.
            .remove('true')
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // []
    });
```

### Modifying documents that match a given criteria

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The criteria is defined through the expression.
            .modify('$._id == 1')
            .set('$.name', 'baz')
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [{ _id: 1, name: 'baz' }, { _id: 2, name: 'bar' }]
    });
```

### Modifying all documents

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The expression should evaluate to `true`.
            .modify('true')
            .set('$.name', 'baz')
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [{ _id: 1, name: 'baz' }, { _id: 2, name: 'baz' }]
    });
```

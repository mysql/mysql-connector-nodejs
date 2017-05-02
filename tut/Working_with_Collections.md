## Removing documents from a collection

### Removing documents that match a given criteria

To remove a specific document from a collection, one should provide the appropriate filtering condition. For more details about the expression format, please check [this](https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchconditionstr).

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.createSchema('testSchema');
    })
    .then(schema => {
        return schema.createCollection('testCollection');
    })
    .then(collection => {
        const query = collection.add([{ _id: 1, name: 'foo' }, { _id: 2, name: 'bar' }])

        return query.execute().then(() => collection)
    })
    .then(collection => {
        // The criteria is defined through the expression.
        const query = collection.remove('$.name == "foo"');

        return query.execute().then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [{ _id: 2, name: 'bar' }]
    })
    .catch(err => {
        console.error(err);
    });
```

### Removing all documents

To remove all documents from a collection, one should provide any expression that evaluates to `true` (if no expression is provided, the query builder will throw an error).

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.createSchema('testSchema');
    })
    .then(schema => {
        return schema.createCollection('testCollection');
    })
    .then(collection => {
        const query = collection.add([{ name: 'foo' }, { name: 'bar' }])

        return query.execute().then(() => collection)
    })
    .then(collection => {
        const query = collection.remove('true');

        return query.execute().then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // []
    })
    .catch(err => {
        console.error(err);
    });
```

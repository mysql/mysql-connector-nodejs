The X DevAPI provides an APIs for creating collections and relational
tables. In this tutorial the Connector/Node.JS implementations of this
API are presented.

All following examples assume a session was created and a `session`
object exists. If you don't know how to create a session see the
{@tutorial Getting_Started} tutorial.

## Creating Collections

A collection is a special-purpose table for storing documents. For
creating a collection the user only has to provide a name to
{@link Schema#createCollection}:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema("test");
            .createCollection("collname");
    .then(collection => {
        // ... work with the Collection object ...
    }).catch(err => {
        // ... something went wrong ...
    });
```

As you can see the`createColletion` function returns a Promise
which resolves to a {@link Collection} object on success.

### Dropping a collection

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        const schema = session.getSchema('foo');
        return schema.createCollection('bar').then(() => schema);
    })
    .then(schema => {
        return schema.dropCollection('bar');
    });
```

## Handling documents in existing collections

Considering a collection `testSchema.testCollection` containing the following documents:

```json
[{
    "_id": 1,
    "name": "foo",
    "meta": {
        "nested": "bar"
    }
}, {
    "_id": 2,
    "name": "bar",
    "meta": {
        "nested": "baz"
    }
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
            .remove('name = "foo"')
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result); // [{ _id: 2, name: 'bar', meta: { nested: 'baz' } }]
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
            .modify('_id = 1')
            .set('name', 'baz')
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result);
        // [
        //      { _id: 1, name: 'baz', meta: { nested: 'bar' } },
        //      { _id: 2, name: 'bar', meta: { nested: 'baz' } }
        // ]
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
            .set('name', 'baz')
            .set('meta.nested', 'quux')
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result);
        // [
        //      { _id: 1, name: 'baz', meta: { nested: 'quux' } },
        //      { _id: 2, name: 'baz', meta: { nested: 'quux' } }
        // ]
    });
```

### Bulk-updating multiple document properties

Additionaly, instead of explicitly updating individual document properties using `set()`, you can update multiple properties in a single call, by using `patch()`.

Using `patch()` will, remove properties set to `null`, add previously nonexisting properties and update the existing ones. This behavior also applies to nested properties.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            .modify('_id = 1')
            .patch({ name: 'qux', meta: { nested: null, other: 'quux' } })
            .execute()
            .then(() => collection)
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet)
    })
    .then(result => {
        console.log(result);
        // [
        //      { _id: 1, name: 'qux', meta: { other: 'quux' } },
        //      { _id: 2, name: 'bar', meta: { nested: 'baz' } }
        // ]
    });
```

Note: the criteria expression string provided via `modify()` establishes the filtering rules, thus any `_id` value provided as part of the properties to be updated will simply be ignored (and will not be updated).

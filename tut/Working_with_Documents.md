## UUID generation

When adding documents to a collection, if a document does not contain an `_id`, it will be automatically assigned a UUID-like value. This value does not strictly follow the format described by [RFC 4222](http://www.ietf.org/rfc/rfc4122.txt), but instead adheres to the following convention.

```txt
RFC 4122 UUID: 5C99CDfE-48CB-11E6-94F3-4A383B7fCC8B

MySQL Document ID: 4A383B7FCC8B-94F3-11E6-48CB-5C99CDFE
```

One can however provide a static `_id` for each document, or even provide a custom function to generate them in using some sort of special convention.

### Using automatically assigned values

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/testSchema')
    .then(session => {
        return session
            .getSchema('testSchema')
            .createCollection('testCollection');
    })
    .then(collection => {
        let docs = [];

        return Promise
            .all([
                collection.add({ name: 'foo' }).execute(),
                collection.find().execute(doc => docs.push(doc))
            ])
            .then(() => docs);
    })
    .then(docs => {
        // the `_id` value is just an example in this case
        console.log(docs); // [{ _id: '4A383B7FCC8B-94F3-11E6-48CB-5C99CDFE', name: 'foo' }]
    })
```

### Using static values

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/testSchema')
    .then(session => {
        return session
            .getSchema('testSchema')
            .createCollection('testCollection');
    })
    .then(collection => {
        let docs = [];

        return Promise
            .all([
                collection.add({ _id: 1, name: 'foo' }).execute(),
                collection.find().execute(doc => docs.push(doc))
            ])
            .then(() => docs);
    })
    .then(docs => {
        console.log(docs); // [{ _id: 1, name: 'foo' }]
    })
```

### Using a generator function

```js
const crypto = require('crypto');
const mysqlx = require('@mysqlx/xdevapi');

const options = {
    dbHost: 'localhost',
    dbPort: 33060,
    idGenerator: () => crypto.randomBytes(4).toString('hex'),
    schema: 'testSchema'
};

mysqlx
    .getSession(options)
    .then(session => {
        return session
            .getSchema('testSchema')
            .createCollection('testCollection');
    })
    .then(collection => {
        let docs = [];

        return Promise
            .all([
                collection.add({ name: 'foo' }).execute(),
                collection.find().execute(doc => docs.push(doc))
            ])
            .then(() => docs);
    })
    .then(docs => {
        // the `_id` value is just an example in this case
        console.log(docs); // [{ _id: 'ccdef991', name: 'foo' }]
    })
```

Node: the id generator function can only be provided through a session configuration object.

## Single document CRUD

C/Node.js provides a set of utility methods that can be used to add, remove, replace or retrieve a single specific document via its `_id` property.

Consider a collection `test_schema.test_collection` containing the following documents:

```json
[{
    "_id": "1",
    "name": "foo"
}, {
    "_id": "2",
    "name": "bar"
}]
```

The following scenarios are possible.

### Replacing a single document

If a document with a given `_id` already exists in the database, it can be replaced via the `Collection.replaceOne()` method.

```js
const mysqlx = require('@mysql/xdevapi');

let data = [];

mysqlx
    .getSession('mysqlx://localhost:33060/test_schema')
    .then(session => {
        return session
            .getSchema('test_schema')
            .getCollection('test_collection')
            .replaceOne('1', { name: 'baz', age: 23 });
    })
    .then(result => {
        console.log(result.getAffectedItemsCount()); // 1

        return collection
            .find()
            .execute(doc => data.push(doc));
    })
    .then(() => {
        console.log(data); // [ { _id: '1', age: 23 }, { _id: '2', name: 'bar' } ]
    });
```

If no such document exists, the method will neither fail nor have any effect.

```js
const mysqlx = require('@mysql/xdevapi');

let data = [];

mysqlx
    .getSession('mysqlx://localhost:33060/test_schema')
    .then(session => {
        return session
            .getSchema('test_schema')
            .getCollection('test_collection')
            .replaceOne('3', { name: 'baz', age: 23 });
    })
    .then(result => {
        console.log(result.getAffectedItemsCount()); // 0

        return collection
            .find()
            .execute(doc => data.push(doc));
    })
    .then(() => {
        console.log(data); // [ { _id: '1', name: 'foo' }, { _id: '2', name: 'bar' } ]
    });
```

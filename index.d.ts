// Definitions by: Chirag Shah <https://github.com/chiragshahklc>

export = MySqlx;
declare namespace MySqlx {
  /**
   * Locking modes.
   * @type {LockContention}
   * @const
   * @example
   * MySqlx.LockContention.NOWAIT
   * MySqlx.LockContention.SKIP_LOCKED
   */
  const LockContention: LockContention;

  /**
   * Database entity types.
   * @type {Mode}
   * @const
   * @example
   * MySqlx.Mode.TABLE
   * MySqlx.Mode.DOCUMENT
   */
  const Mode: Mode;

  /**
   * Parse an expression string into a Mysqlx.Expr.Expr.
   * @param {string} expr - expression string
   * @param {ParserOptions} options - additional options
   * @return {any} The protobuf encoded object.
   */
  function expr(expr: string, options: ParserOptions): any;

  /**
   * Additional parser options.
   */
  type ParserOptions = {
    mode?: any;
  };
  /**
   * Load a new or existing session.
   * @param {SessionOptions} options - session properties
   * @returns {Promise<Session>} Promise<Session>
   */
  function getSession(options: SessionOptions | string): Promise<Session>;
  /**
   * Load a new or existing session.
   * @param {string} connectionString - session properties
   * @returns {Promise<Session>} Promise<Session>
   */
  function getSession(connectionString: string): Promise<Session>;

  /**
   * Retrieve the connector version number (from package.json).
   * @return {String} string
   */
  function getVersion(): string;

  type LockContention = {
    NOWAIT: 1;
    SKIP_LOCKED: 2;
  };

  type Mode = {
    DOCUMENT: 1;
    TABLE: 2;
  };

  type SessionOptions = {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    auth?: string;
    socketFactory?: any; //
    ssl?: boolean;
    sslOptions?: any;
  };
  interface Session {
    close(): Promise<any>;
    commit(): Promise<boolean>;

    /**
     * Connect to the database
     * @returns {Promise<Session>} Promise<Session> - Promise resolving to myself
     */
    connect(): Promise<Session>;

    createSchema(schemaName: string): Promise<Schema>;
    dropSchema(schemaName: string): Promise<boolean>;
    /**
     *
     * @param sqlQuery
     * @param args
     * @deprecated since version 8.0.12. Will be removed in future versions. Use {@link Session.sql()} instead.
     */
    executeSql(sqlQuery: string, ...args: Array<any>): SqlExecute;

    /**
     * Get the default schema instance.
     * @returns {Schema} Schema -  The default schema bound to the current session.
     */
    getDefaultSchema(): Schema;

    /**
     * Get instance of Schema object for a specific database schema
     *
     * This will always succeed, even if the schema doesn't exist. Use {@link Schema#existsInDatabase} on the returned
     * object to verify the schema exists.
     *
     * @param {string} schemaName - Name of the schema (database)
     * @returns {Schema} Schema
     */
    getSchema(schemaName: string): Schema;

    /**
     * Get schemas
     * @returns {Promise<Array<Schema>>} Promise resolving to a list of Schema instances.
     */
    getSchemas(): Promise<Array<Schema>>;

    releaseSavepoint(savePointName?: string): Promise<any>;
    rollback(): Promise<boolean>;
    rollbackTo(savePointName?: string): Promise<any>;
    setSavepoint(savePointName?: string): Promise<string>;
    sql(sqlQuery: string): SqlExecute;
    startTransaction(): Promise<boolean>;
    //Not available in official documentation. https://dev.mysql.com/doc/dev/connector-nodejs/8.0/Session.html
    insepct(): Object;
  }
  interface Schema {
    createCollection(
      collectionName: string,
      options?: CreateCollectionOptions
    ): Promise<Collection>;
    dropCollection(collectionName: string): Promise<boolean>;
    existsInDatabase(): Promise<boolean>;
    getClassName(): string;
    getCollection(collectionName: string): Collection;
    getCollectionAsTable(collectionName: string): Table;
    getCollections(): Promise<Array<Collection>>;
    getName(): string;
    getTable(tableName: string): Table;
    getTables(): Promise<Array<Table>>;
    inspect(): Object;
  }
  type CreateCollectionOptions = {
    ReuseExistingObject?: boolean;
  };
  interface SqlExecute {
    bind(...args: Array<any>): SqlExecute;
    execute(
      rowcb: (items: Array<any>) => any,
      metacb?: (metadata: Array<Object>) => any
    ): Promise<any>;
    getClassName(): string;
  }
  interface StatementType {
    CLASSIC: "sql";
    X_PLUGIN: "mysqlx";
  }
  interface Collection {
    add(...args: Array<Object | JSON>): CollectionAdd;
    add(args: Array<Object | JSON>): CollectionAdd;
    addOrReplaceOne(
      documentId: string,
      documentProperties: Object
    ): Promise<Result>;
    /**
     * @deprecated since version 8.0.12. Will be removed in future versions.
     */
    count(): Promise<number>;
    createIndex(
      indexName: string,
      constraint: IndexDefinition
    ): Promise<boolean>;
    dropIndex(indexName: string): Promise<boolean>;
    existsInDatabase(): Promise<boolean>;
    find(expr: SearchConditionStr): CollectionFind;
    getName(): string;
    getOne(documentId: string): Object;
    getSchema(): Schema;
    inspect(): Object;
    modify(expr: SearchConditionStr): CollectionModify;
    remove(expr: SearchConditionStr): CollectionRemove;
    removeOne(documentId: string): Promise<Result>;
    replaceOne(documentId: string, documentProperties: Object): Promise<Result>;
  }
  type IndexDefinition = {
    type?: string;
    fileds: Array<FieldDefinition>;
  };
  type FieldDefinition = {
    field: string;
    type: string;
    required?: boolean;
    options?: number;
    srid?: number;
  };
  type SearchConditionStr = string;
  interface CollectionAdd {
    add(...input: Array<Object>): CollectionAdd;
    add(input: Array<Object>): CollectionAdd;
    execute(): Promise<Result>;
    //
    getClassName(): string;
  }
  type CollectionAddOptions = {
    upsert: boolean;
  };
  interface CollectionFind {
    execute(rowcb?: (result: any) => any): Promise<Result>;
    fields(projections: string | Array<string>): CollectionFind;
    //
    getClassName(): string;
  }
  interface CollectionModify {
    arrayAppend(field: string, value: any): CollectionModify;
    /**
     *
     * @param field
     * @deprecated since version 8.0.12. Will be removed in future versions. Use {@link |CollectionModify.unset()} instead.
     */
    arrayDelete(field: string): CollectionModify;
    arrayInsert(field: string, value: any): CollectionModify;
    execute(): Promise<Result>;
    getClassName(): string;
    patch(properties: Object): CollectionModify;
    set(field: string, value: any): CollectionModify;
    unset(fields: string | Array<string>): CollectionModify;
  }
  interface CollectionRemove {
    execute(): Promise<Result>;
    getClassName(): string;
  }
  interface Result {
    getAffectedItemsCount(): number;
    getAffectedRowsCount(): number;
    getAutoIncrementValue(): number;
    getGeneratedIds(): Array<string>;
    getWarnings(): Array<Warning>;
    getWarningsCount(): number;
  }
  type Warning = {
    level: number;
    code: number;
    msg: string;
  };
  interface Table {
    /**
     * @deprecated since version 8.0.12. Will be removed in future versions.
     */
    count(): Promise<number>;
    delete(expr?: SearchConditionStr): TableDelete;
    existsInDatabase(): Promise<boolean>;
    getName(): string;
    getSchema(): Schema;
    insert(fields: Object | Array<string>): TableInsert;
    insert(...fields: Array<string>): TableInsert;
    inspect(): Object;
    isView(): Promise<boolean>;
    select(expr: Array<string>): TableSelect;
    select(...expr: Array<string>): TableSelect;
    update(expr?: string): TableUpdate;
  }
  interface TableDelete {
    execute(): Promise<Result>;
    //
    getClassName(): string;
  }
  interface TableInsert {
    execute(): Promise<Result>;
    values(...ExprOrLiteral: Array<string>): TableInsert;
    values(ExprOrLiteral: Array<string>): TableInsert;
    //
    getClassName(): string;
  }
  interface TableSelect {
    execute(
      rowcb?: (items: Array<any>) => any,
      metacb?: (metadata: Array<Object>) => any
    ): Promise<Result>;
    getViewDefinition(): string;
    //
    getClassName(): string;
  }
  interface TableUpdate {
    execute(): Promise<Result>;
    getClassName(): string;
    set(field: string, valueExpression: string): TableUpdate;
  }
}

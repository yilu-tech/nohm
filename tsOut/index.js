"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Debug = require("debug");
const events_1 = require("events");
const redis = require("redis");
const LinkError_1 = require("./errors/LinkError");
exports.LinkError = LinkError_1.LinkError;
const ValidationError_1 = require("./errors/ValidationError");
exports.ValidationError = ValidationError_1.ValidationError;
const helpers_1 = require("./helpers");
const middleware_1 = require("./middleware");
const model_1 = require("./model");
const model_header_1 = require("./model.header");
exports.boolProperty = model_header_1.boolProperty;
exports.dateProperty = model_header_1.dateProperty;
exports.floatProperty = model_header_1.floatProperty;
exports.integerProperty = model_header_1.integerProperty;
exports.jsonProperty = model_header_1.jsonProperty;
exports.numberProperty = model_header_1.numberProperty;
exports.stringProperty = model_header_1.stringProperty;
exports.timeProperty = model_header_1.timeProperty;
exports.timestampProperty = model_header_1.timestampProperty;
const typed_redis_helper_1 = require("./typed-redis-helper");
const debug = Debug('nohm:index');
const debugPubSub = Debug('nohm:pubSub');
const PUBSUB_ALL_PATTERN = '*:*';
// this is the exported extendable version - still needs to be registered to receive proper methods
class NohmModelExtendable extends model_1.NohmModel {
    /**
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    _initOptions() {
        // overwritten in NohmClass.model/register
        throw new Error('Class is not extended properly. Use the return Nohm.register() instead of your class directly.');
    }
    /**
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    prefix(_prefix) {
        // overwritten in NohmClass.model/register
        throw new Error('Class is not extended properly. Use the return Nohm.register() instead of your class directly.');
    }
    /**
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    rawPrefix() {
        // overwritten in NohmClass.model/register
        throw new Error('Class is not extended properly. Use the return Nohm.register() instead of your class directly.');
    }
}
exports.NohmModel = NohmModelExtendable;
function staticImplements() {
    return (_constructor) => {
        // no op decorator
    };
}
/**
 * Some generic definitions for Nohm
 *
 * @namespace Nohm
 */
/**
 * Nohm specific Errors
 *
 * @namespace NohmErrors
 */
/**
 * Main Nohm class. Holds models, generic configuration and can generate the middleware for client validations.
 *
 * Can be instantiated multiple times if you want different configurations, but usually you only need the default
 * that is exported as `require('nohm').nohm`.
 *
 * @example
 * // To instantiate another you can do this:
 * const NohmClass = require('nohm').NohmClass;
 * const myNohm = new NohmClass({ prefix: 'SomePrefix' });
 *
 * @class NohmClass
 */
class NohmClass {
    constructor({ prefix, client, meta, publish }) {
        this.LinkError = LinkError_1.LinkError;
        this.ValidationError = ValidationError_1.ValidationError;
        this.publish = false;
        debug('Creating NohmClass.', arguments);
        this.setPrefix(prefix);
        if (client) {
            this.setClient(client);
        }
        this.modelCache = {};
        this.extraValidators = [];
        this.meta = meta || true;
        this.isPublishSubscribed = false;
        if (typeof publish !== 'undefined') {
            if (typeof publish !== 'boolean') {
                this.setPublish(true);
                this.setPubSubClient(publish);
            }
            else {
                this.setPublish(publish);
            }
        }
    }
    /**
     * Set the Nohm global redis client.
     * Note: this will not affect models that have a client set on their own.
     */
    setPrefix(prefix = 'nohm') {
        debug('Setting new prefix.', prefix);
        this.prefix = helpers_1.getPrefix(prefix);
    }
    /**
     * Set the Nohm global redis client.
     * Note: this will not affect models that have a client set on their own.
     */
    setClient(client) {
        debug('Setting new redis client. Connected: %s; Address: %s.', client && (client.connected || client.status === 'ready'), client && client.address);
        // ioredis uses .status string instead of .connected boolean
        if (client && !(client.connected || client.status === 'ready')) {
            this
                .logError(`WARNING: setClient() received a redis client that is not connected yet.
Consider waiting for an established connection before setting it. Status (if ioredis): ${client.status}
, connected (if node_redis): ${client.connected}`);
        }
        else if (!client) {
            // TODO: maybe remove this, since it is also creating an unconnected client and is the only reason
            // why we have the hard dependency on the "redis" package.
            client = redis.createClient();
        }
        this.client = client;
    }
    logError(err) {
        if (err) {
            console.error({
                // TODO: Make this a wrapped NohmError if not already an error
                message: err,
                name: 'Nohm Error',
            });
        }
    }
    /**
     * Creates and returns a new model class with the given name and options.
     *  If you're using Typescript it is strongly advised to use Nohm.register() instead.
     *
     * @param {string} modelName Name of the model. This needs to be unique and is used in data storage.
     *                      Thus <b>changing this will invalidate existing data</b>!
     * @param {IModelDefinitions} options This is an object containing the actual model definitions.
     *                                    These are: properties, methods (optional) and the client (optional) to be used.
     * @param {boolean} temp When true, this model is not added to the internal model cache,
     *                        meaning methods like factory() and getModels() cannot access them.
     *                        This is mostly useful for meta things like migrations.
     * @returns {NohmStaticModel}
     */
    model(modelName, options, temp = false) {
        if (!modelName) {
            this.logError('When creating a new model you have to provide a name!');
        }
        debug('Registering new model using model().', modelName, options, temp);
        // tslint:disable-next-line:no-this-assignment
        const self = this; // well then...
        let metaVersion = '';
        /**
         * The static Model Class, used to get instances or operate on multiple records.
         *
         * @class NohmStaticModel
         */
        let CreatedClass = 
        // tslint:disable-next-line:max-classes-per-file
        class CreatedClass extends NohmModelExtendable {
            /**
             * Creates an instance of CreatedClass.
             *
             * @ignore
             * @memberof NohmStaticModel
             */
            constructor() {
                super();
                /**
                 * Redis client that is set for this Model.
                 * Defaults to the NohmClass client it was registered in.
                 *
                 * @memberof NohmStaticModel
                 * @type {RedisClient}
                 */
                this.client = self.client;
                this.nohmClass = self;
                this.options = options;
                /**
                 * Name of the model, used for database keys and relation values
                 *
                 * @memberof NohmStaticModel
                 * @type {string}
                 */
                this.modelName = modelName;
                if (self.meta) {
                    if (!metaVersion) {
                        // cache it to prevent constant regeneration
                        metaVersion = this.generateMetaVersion();
                    }
                    this.meta = {
                        inDb: false,
                        properties: this.options.properties,
                        version: metaVersion,
                    };
                }
            }
            /* This (and .register()) is the only place where this method should exist.
            An alternative would be to pass the options as a special argument to super, but that would have the downside
            of making subclasses of subclasses impossible and restricting constructor argument freedom. */
            _initOptions() {
                this.options = options || { properties: {} };
                Object.getPrototypeOf(this).definitions = this.options.properties;
                this.meta = {
                    inDb: false,
                    properties: {},
                    version: '',
                };
                if (!this.client) {
                    this.client = self.client;
                }
            }
            prefix(prefix) {
                return self.prefix[prefix] + modelName;
            }
            rawPrefix() {
                return self.prefix;
            }
            /**
             * Creates a new model instance and loads it with the given id.
             *
             * @static
             * @param {*} id ID of the model to be loaded
             * @throws {Error('not found')} If no record exists of the given id,
             * an error is thrown with the message 'not found'
             * @alias load
             * @memberof! NohmStaticModel
             * @returns {Promise<NohmModel>}
             */
            static async load(id) {
                const model = await self.factory(modelName);
                await model.load(id);
                return model;
            }
            /**
             * Loads an Array of NohmModels via the given ids. Any ids that do not exist will just be ignored.
             * If any of the ids do not exist in the database, they are left out instead of throwing an error.
             * Thus if no ids exist an empty error is returned.
             *
             * @static
             * @param {Array<string>} ids Array of IDs of the models to be loaded
             * @alias loadMany
             * @memberof! NohmStaticModel
             * @returns {Promise<NohmModel>}
             */
            static async loadMany(ids) {
                if (!Array.isArray(ids) || ids.length === 0) {
                    return [];
                }
                const loadPromises = ids.map(async (id) => {
                    try {
                        return await self.factory(modelName, id);
                    }
                    catch (err) {
                        if (err && err.message === 'not found') {
                            return;
                        }
                        else {
                            throw err;
                        }
                    }
                });
                const loadedModels = await Promise.all(loadPromises);
                return loadedModels.filter((model) => typeof model !== 'undefined');
            }
            /**
             * Finds ids of objects and loads them into full NohmModels.
             *
             * @static
             * @param {ISearchOptions} searches
             * @alias findAndLoad
             * @memberof! NohmStaticModel
             * @returns {Promise<Array<NohmModel>>}
             */
            static async findAndLoad(searches) {
                const dummy = await self.factory(modelName);
                const ids = await dummy.find(searches);
                if (ids.length === 0) {
                    return [];
                }
                const loadPromises = ids.map((id) => {
                    return self.factory(modelName, id);
                });
                return Promise.all(loadPromises);
            }
            /**
             * Sort the given ids or all stored ids by their SortOptions
             *
             * @static
             * @see NohmModel.sort
             * @param {ISortOptions<IDictionary>} [sortOptions={}] Search options
             * @alias sort
             * @memberof! NohmStaticModel
             * @returns {Promise<Array<string>>} Array of ids
             */
            static async sort(sortOptions = {}, ids = false) {
                const dummy = await self.factory(modelName);
                return dummy.sort(sortOptions, ids);
            }
            /**
             * Search for ids
             *
             * @static
             * @see NohmModel.find
             * @param {ISearchOptions} [searches={}] Search options
             * @alias find
             * @memberof NohmStaticModel
             * @returns {Promise<Array<string>>} Array of ids
             */
            static async find(searches = {}) {
                const dummy = await self.factory(modelName);
                return dummy.find(searches);
            }
            /**
             * Loads a NohmModels via the given id.
             *
             * @static
             * @param {*} id ID of the model to be loaded
             * @alias remove
             * @memberof NohmStaticModel
             * @returns {Promise<NohmModel>}
             */
            static async remove(id, silent) {
                const model = await self.factory(modelName);
                model.id = id;
                await model.remove(silent);
            }
        };
        CreatedClass = __decorate([
            staticImplements()
            // tslint:disable-next-line:max-classes-per-file
        ], CreatedClass);
        if (!temp) {
            this.modelCache[modelName] = CreatedClass;
        }
        return CreatedClass;
    }
    /**
     * Creates, registers and returns a new model class from a given class.
     * When using Typescript this is the preferred method of creating new models over using Nohm.model().
     *
     * @param {NohmModel} subClass Complete model class, needs to extend NohmModel.
     * @param {boolean} temp When true, this model is not added to the internal model cache,
     *                        meaning methods like factory() and getModels() cannot access them.
     *                        This is mostly useful for meta things like migrations.
     * @returns {NohmStaticModel}
     *
     * @example
     *   // Typescript
     *   import { Nohm, NohmModel, TTypedDefinitions } from 'nohm';
     *
     *   // this interface is useful for having typings in .property() and .allProperties() etc. but is optional
     *   interface IUserModelProps {
     *    name: string;
     *   }
     *
     *   class UserModelClass extends NohmModel<IUserModelProps> {
     *     protected static modelName = 'user'; // used in redis to store the keys
     *
     *     // the TTypedDefinitions generic makes sure that our definitions have the same keys as
     *     // defined in our property interface.
     *     // If you don't want to use the generic, you have to use the exported {type}Property types
     *     // to get around the tsc throwing an error.
     *     // TODO: look into the error thrown by tsc when leaving out TTypedDefinitions and using 'sometype' as type
     *     protected static definitions: TTypedDefinitions<IUserModelProps> = {
     *       name: {
     *         defaultValue: 'testName',
     *         type: 'string', // you have to manually make sure this matches the IUserModelProps type!
     *         validations: [
     *           'notEmpty',
     *         ],
     *       },
     *     };
     *     public async foo() {
     *       const test = bar.property('name'); // no error and test typed to string
     *
     *       await bar.validate();
     *       bar.errors.name; // no error and typed
     *
     *       // accessing unknown props does not work,
     *       // because we specified that UserModel only has properties of IUserModelProps
     *       bar.property('foo'); // typescript errors
     *       bar.errors.foo; // typescript error
     *     };
     *   }
     *   const userModel = Nohm.register(UserModelClass);
     *   // typescript now knows about bar.foo() and all the standard nohm methods like bar.property();
     *   const bar = new userModel();
     *   bar.foo(); // no error
     *   bar.allProperties().name === 'testName'; // no error
     */
    register(subClass, temp = false) {
        var CreatedClass_1;
        // tslint:disable-next-line:no-this-assignment
        const self = this; // well then...
        const modelName = subClass.modelName;
        if (!modelName) {
            throw new Error('A class passed to nohm.register() did not have static a modelName property.');
        }
        if (!subClass.definitions) {
            throw new Error('A class passed to nohm.register() did not have static property definitions.');
        }
        debug('Registering new model using register().', modelName, subClass.definitions, temp);
        let metaVersion = '';
        // tslint:disable-next-line:max-classes-per-file
        let CreatedClass = CreatedClass_1 = class CreatedClass extends subClass {
            constructor(...args) {
                super(...args);
                this.nohmClass = self;
                this.modelName = modelName;
                if (self.meta) {
                    if (!metaVersion) {
                        // cache it to prevent constant regeneration
                        metaVersion = this.generateMetaVersion();
                    }
                    this.meta = {
                        inDb: false,
                        properties: this.options.properties,
                        version: metaVersion,
                    };
                }
            }
            /* This (and .model()) is the only place where this method should exist.
            An alternative would be to pass the options as a special argument to super, but that would have the downside
            of making subclasses of subclasses impossible. */
            _initOptions() {
                this.options = {
                    idGenerator: subClass.idGenerator,
                    properties: {},
                };
                if (!this.client) {
                    this.client = self.client;
                }
                this.meta = {
                    inDb: false,
                    properties: {},
                    version: '',
                };
                if (!this.options.idGenerator) {
                    this.options.idGenerator = 'default';
                }
            }
            prefix(prefix) {
                return self.prefix[prefix] + this.modelName;
            }
            rawPrefix() {
                return self.prefix;
            }
            getDefinitions() {
                const definitions = CreatedClass_1.definitions;
                if (!definitions) {
                    throw new Error(`Model was not defined with proper static definitions: '${modelName}'`);
                }
                return definitions;
            }
            /**
             * Loads a NohmModels via the given id.
             *
             * @param {*} id ID of the model to be loaded
             * @returns {Promise<NohmModel|void>}
             */
            static async load(id) {
                const model = await self.factory(modelName);
                await model.load(id);
                return model;
            }
            /**
             * Loads an Array of NohmModels via the given ids. Any ids that do not exist will just be ignored.
             *
             * @param {Array<string>} ids Array of IDs of the models to be loaded
             * @returns {Promise<NohmModel>}
             */
            static async loadMany(ids) {
                if (!Array.isArray(ids) || ids.length === 0) {
                    return [];
                }
                const loadPromises = ids.map(async (id) => {
                    try {
                        return await self.factory(modelName, id);
                    }
                    catch (err) {
                        if (err && err.message === 'not found') {
                            return;
                        }
                        else {
                            throw err;
                        }
                    }
                });
                const loadedModels = await Promise.all(loadPromises);
                return loadedModels.filter((model) => typeof model !== 'undefined');
            }
            /**
             * Finds ids of objects and loads them into full NohmModels.
             *
             * @param {ISearchOptions} searches
             * @returns {Promise<Array<NohmModel>>}
             */
            static async findAndLoad(searches) {
                const dummy = await self.factory(modelName);
                const ids = await dummy.find(searches);
                if (ids.length === 0) {
                    return [];
                }
                const loadPromises = ids.map((id) => {
                    return self.factory(dummy.modelName, id);
                });
                return Promise.all(loadPromises);
            }
            /**
             * Sort the given ids or all stored ids by their SortOptions
             *
             * @see NohmModel.sort
             * @static
             * @param {ISortOptions<IDictionary>} [sortOptions={}] Search options
             * @returns {Promise<Array<string>>} Array of ids
             */
            static async sort(options = {}, ids = false) {
                const dummy = await self.factory(modelName);
                return dummy.sort(options, ids);
            }
            /**
             * Search for ids
             *
             * @see NohmModel.find
             * @static
             * @param {ISearchOptions} [searches={}] Search options
             * @returns {Promise<Array<string>>} Array of ids
             */
            static async find(searches = {}) {
                const dummy = await self.factory(modelName);
                return dummy.find(searches);
            }
            /**
             * Loads a NohmModels via the given id.
             *
             * @param {*} id ID of the model to be loaded
             * @returns {Promise<NohmModel>}
             */
            static async remove(id, silent) {
                const model = await self.factory(modelName);
                model.id = id;
                await model.remove(silent);
            }
        };
        CreatedClass = CreatedClass_1 = __decorate([
            staticImplements()
        ], CreatedClass);
        if (!temp) {
            this.modelCache[modelName] = CreatedClass;
        }
        return CreatedClass;
    }
    /**
     * Get all model classes that are registered via .register() or .model()
     *
     * @returns {Array<NohmModelStatic>}
     */
    getModels() {
        return this.modelCache;
    }
    /**
     * Creates a new instance of the model with the given modelName.
     * When given an id as second parameter it also loads it.
     *
     * @param {string} name Name of the model, must match the modelName of one of your defined models.
     * @param {*} [id] ID of a record you want to load.
     * @returns {Promise<NohmModel>}
     * @throws {Error('Model %name not found.')} Rejects when there is no registered model with the given modelName.
     * @throws {Error('not found')} If no record exists of the given id,
     * an error is thrown with the message 'not found'
     * @memberof NohmClass
     */
    async factory(name, id) {
        if (typeof arguments[1] === 'function' ||
            typeof arguments[2] === 'function') {
            throw new Error('Not implemented: factory does not support callback method anymore.');
        }
        else {
            debug(`Factory is creating a new instance of '%s' with id %s.`, name, id);
            const model = this.modelCache[name];
            if (!model) {
                throw new Error(`Model '${name}' not found.`);
            }
            const instance = new model();
            if (id) {
                await instance.load(id);
                return instance;
            }
            else {
                return instance;
            }
        }
    }
    /**
     * DO NOT USE THIS UNLESS YOU ARE ABSOLUTELY SURE ABOUT IT!
     *
     * Deletes any keys from the db that start with the set nohm prefixes.
     *
     * DO NOT USE THIS UNLESS YOU ARE ABSOLUTELY SURE ABOUT IT!
     *
     * @param {Object} [client] You can specify the redis client to use. Default: Nohm.client
     */
    async purgeDb(client = this.client) {
        async function delKeys(prefix) {
            const foundKeys = await typed_redis_helper_1.keys(client, prefix + '*');
            if (foundKeys.length === 0) {
                return;
            }
            await typed_redis_helper_1.del(client, foundKeys);
        }
        const deletes = [];
        debug(`PURGING DATABASE!`, client && client.connected, client && client.address, this.prefix);
        Object.keys(this.prefix).forEach((key) => {
            const prefix = this.prefix[key];
            if (typeof prefix === 'object') {
                Object.keys(prefix).forEach((innerKey) => {
                    const innerPrefix = prefix[innerKey];
                    deletes.push(delKeys(innerPrefix));
                });
            }
            else {
                deletes.push(delKeys(prefix));
            }
        });
        await Promise.all(deletes);
    }
    setExtraValidations(files) {
        debug(`Setting extra validation files`, files);
        if (!Array.isArray(files)) {
            files = [files];
        }
        files.forEach((path) => {
            if (this.extraValidators.indexOf(path) === -1) {
                this.extraValidators.push(path);
                const validators = require(path);
                Object.keys(validators).forEach((_name) => {
                    // TODO for v1: check if this needs to be implemented
                    // this.__validators[name] = validators[name];
                });
            }
        });
    }
    getExtraValidatorFileNames() {
        return this.extraValidators;
    }
    middleware(options) {
        return middleware_1.middleware(options, this);
    }
    getPublish() {
        return this.publish;
    }
    setPublish(publish) {
        debug(`Setting publish mode to '%o'.`, !!publish);
        this.publish = !!publish;
    }
    getPubSubClient() {
        return this.publishClient;
    }
    setPubSubClient(client) {
        debug(`Setting pubSub client. Connected: '%s'; Address: '%s'.`, client && client.connected, client && client.address);
        this.publishClient = client;
        return this.initPubSub();
    }
    async initPubSub() {
        if (!this.getPubSubClient()) {
            throw new Error('A second redis client must set via nohm.setPubSubClient before using pub/sub methods.');
        }
        else if (this.isPublishSubscribed === true) {
            // already in pubsub mode, don't need to initialize it again.
            return;
        }
        this.publishEventEmitter = new events_1.EventEmitter();
        this.publishEventEmitter.setMaxListeners(0); // TODO: check if this is sensible
        this.isPublishSubscribed = true;
        await typed_redis_helper_1.psubscribe(this.publishClient, this.prefix.channel + PUBSUB_ALL_PATTERN);
        debugPubSub(`Redis PSUBSCRIBE for '%s'.`, this.prefix.channel + PUBSUB_ALL_PATTERN);
        this.publishClient.on('pmessage', (_pattern, channel, message) => {
            const suffix = channel.slice(this.prefix.channel.length);
            const parts = suffix.match(/([^:]+)/g); // Pattern = _prefix_:channel:_modelname_:_action_
            if (!parts) {
                this.logError(`An erroneous channel has been captured: ${channel}.`);
                return;
            }
            const modelName = parts[0];
            const action = parts[1];
            let payload = {};
            try {
                payload = message ? JSON.parse(message) : {};
                debugPubSub(`Redis published message for model '%s' with action '%s' and message: '%j'.`, modelName, action, payload);
            }
            catch (e) {
                this.logError(`A published message is not valid JSON. Was : "${message}"`);
                return;
            }
            this.publishEventEmitter.emit(`${modelName}:${action}`, payload);
        });
    }
    async subscribeEvent(eventName, callback) {
        await this.initPubSub();
        debugPubSub(`Redis subscribing to event '%s'.`, eventName);
        this.publishEventEmitter.on(eventName, callback);
    }
    async subscribeEventOnce(eventName, callback) {
        await this.initPubSub();
        debugPubSub(`Redis subscribing once to event '%s'.`, eventName);
        this.publishEventEmitter.once(eventName, callback);
    }
    unsubscribeEvent(eventName, fn) {
        if (this.publishEventEmitter) {
            debugPubSub(`Redis unsubscribing from event '%s' with fn?: %s.`, eventName, fn);
            if (!fn) {
                this.publishEventEmitter.removeAllListeners(eventName);
            }
            else {
                this.publishEventEmitter.removeListener(eventName, fn);
            }
        }
    }
    async closePubSub() {
        if (this.isPublishSubscribed === true) {
            debugPubSub(`Redis PUNSUBSCRIBE for '%s'.`, this.prefix.channel + PUBSUB_ALL_PATTERN);
            this.isPublishSubscribed = false;
            await typed_redis_helper_1.punsubscribe(this.publishClient, this.prefix.channel + PUBSUB_ALL_PATTERN);
        }
        return this.publishClient;
    }
}
exports.NohmClass = NohmClass;
const nohm = new NohmClass({});
exports.nohm = nohm;
exports.Nohm = nohm;
exports.default = nohm;
//# sourceMappingURL=index.js.map
import * as redis from 'redis';
import { LinkError } from './errors/LinkError';
import { ValidationError } from './errors/ValidationError';
import { INohmPrefixes } from './helpers';
import { IMiddlewareOptions, TRequestHandler } from './middleware';
import { IDictionary, ILinkOptions, IModelOptions, IModelPropertyDefinition, IModelPropertyDefinitions, ISortOptions, NohmModel, TLinkCallback } from './model';
import { boolProperty, dateProperty, floatProperty, IChangeEventPayload, IDefaultEventPayload, integerProperty, IRelationChangeEventPayload, IStaticMethods, jsonProperty, numberProperty, stringProperty, timeProperty, timestampProperty, TTypedDefinitions } from './model.header';
export { boolProperty, dateProperty, floatProperty, IChangeEventPayload, IDefaultEventPayload, IDictionary, ILinkOptions, IModelOptions, IModelPropertyDefinition, IModelPropertyDefinitions, INohmPrefixes, integerProperty, IRelationChangeEventPayload, ISortOptions, IStaticMethods, jsonProperty, LinkError, NohmModelExtendable as NohmModel, numberProperty, stringProperty, timeProperty, timestampProperty, TLinkCallback, TTypedDefinitions, ValidationError, };
export { nohm, nohm as Nohm };
declare abstract class NohmModelExtendable<TProps = any> extends NohmModel<TProps> {
    client: redis.RedisClient;
    protected nohmClass: NohmClass;
    /**
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    protected _initOptions(): void;
    /**
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    protected prefix(_prefix: keyof INohmPrefixes): string;
    /**
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    protected rawPrefix(): INohmPrefixes;
}
export interface INohmOptions {
    prefix?: string;
    client?: redis.RedisClient;
    meta?: boolean;
    publish?: boolean | redis.RedisClient;
}
export declare type Constructor<T> = new (...args: Array<any>) => T;
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
export declare class NohmClass {
    /**
     * The redis prefixed key object.
     * Defaults to prefixing with 'nohm' which then creates keys like 'nohm:idsets:someModel'.
     */
    prefix: INohmPrefixes;
    /**
     * The current global nohm redis client
     */
    client: redis.RedisClient;
    readonly LinkError: typeof LinkError;
    readonly ValidationError: typeof ValidationError;
    /**
     * Whether to store the meta values about models.
     * This is used for example by the admin app.
     * Defaults to true.
     */
    private meta;
    private publish;
    private publishClient;
    private isPublishSubscribed;
    private publishEventEmitter;
    private modelCache;
    private extraValidators;
    constructor({ prefix, client, meta, publish }: INohmOptions);
    /**
     * Set the Nohm global redis client.
     * Note: this will not affect models that have a client set on their own.
     */
    setPrefix(prefix?: string): void;
    /**
     * Set the Nohm global redis client.
     * Note: this will not affect models that have a client set on their own.
     */
    setClient(client?: redis.RedisClient): void;
    logError(err: string | Error | null): void;
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
    model<TAdditionalMethods>(modelName: string, options: IModelOptions & {
        properties: IModelPropertyDefinitions;
    }, temp?: boolean): Constructor<NohmModelExtendable<IDictionary> & TAdditionalMethods> & IStaticMethods<NohmModel>;
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
    register<T extends Constructor<NohmModelExtendable<IDictionary>>>(subClass: T, temp?: boolean): T & IStaticMethods<NohmModel>;
    /**
     * Get all model classes that are registered via .register() or .model()
     *
     * @returns {Array<NohmModelStatic>}
     */
    getModels(): {
        [name: string]: Constructor<NohmModel<any>>;
    };
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
    factory<T extends NohmModel<any>>(name: string, id?: any): Promise<T>;
    /**
     * DO NOT USE THIS UNLESS YOU ARE ABSOLUTELY SURE ABOUT IT!
     *
     * Deletes any keys from the db that start with the set nohm prefixes.
     *
     * DO NOT USE THIS UNLESS YOU ARE ABSOLUTELY SURE ABOUT IT!
     *
     * @param {Object} [client] You can specify the redis client to use. Default: Nohm.client
     */
    purgeDb(client?: redis.RedisClient): Promise<void>;
    setExtraValidations(files: string | Array<string>): void;
    getExtraValidatorFileNames(): Array<string>;
    middleware(options: IMiddlewareOptions): TRequestHandler;
    getPublish(): boolean;
    setPublish(publish: boolean): void;
    getPubSubClient(): redis.RedisClient;
    setPubSubClient(client: redis.RedisClient): Promise<void>;
    private initPubSub;
    subscribeEvent(eventName: string, callback: (payload: any) => void): Promise<void>;
    subscribeEventOnce(eventName: string, callback: (payload: any) => void): Promise<void>;
    unsubscribeEvent(eventName: string, fn?: any): void;
    closePubSub(): Promise<redis.RedisClient>;
}
declare const nohm: NohmClass;
export default nohm;
//# sourceMappingURL=index.d.ts.map
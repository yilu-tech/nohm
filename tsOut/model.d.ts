import * as redis from 'redis';
import { INohmPrefixes, NohmClass } from '.';
import { IChangeEventPayload, IDefaultEventPayload, IDictionary, ILinkOptions, IModelOptions, IModelPropertyDefinition, IModelPropertyDefinitions, IProperty, IPropertyDiff, IRelationChangeEventPayload, ISaveOptions, ISearchOption, ISortOptions, TLinkCallback } from './model.header';
export { IDictionary, ILinkOptions, IModelPropertyDefinition, IModelPropertyDefinitions, IModelOptions, ISortOptions, TLinkCallback, };
export { NohmModel };
export declare type TAllowedEventNames = 'create' | 'save' | 'update' | 'remove' | 'link' | 'unlink';
/**
 * Redis client for this model
 *
 * @type {redis.RedisClient}
 * @name client
 * @memberof NohmModel#
 */
/**
 * Validation errors that were set during the last call to {@link NohmModel#validate}. (so also during save())
 *
 * The type is an object with property names as keys and then an array with validation
 * names of the validations that failed
 *
 * @type { Object.<string, Array<string>> }
 * @name errors
 * @memberof NohmModel#
 */
/**
 * Name of the model, used for database keys and relation values
 *
 * @type {string}
 * @name modelName
 * @memberof NohmModel#
 */
/**
 * A nohm model class.
 *
 * @abstract
 * @class NohmModel
 */
declare abstract class NohmModel<TProps extends IDictionary = IDictionary> {
    /**
     * Redis client for this model
     *
     * @type {redis.RedisClient}
     */
    client: redis.RedisClient;
    errors: {
        [key in keyof TProps]: Array<string>;
    };
    meta: {
        inDb: boolean;
        properties: IModelPropertyDefinitions;
        version: string;
    };
    readonly modelName: string;
    protected properties: Map<keyof TProps, IProperty>;
    protected options: IModelOptions;
    protected publish: null | boolean;
    protected static readonly definitions: IModelPropertyDefinitions;
    protected abstract nohmClass: NohmClass;
    private _id;
    private _isLoaded;
    private _isDirty;
    private allPropertiesCache;
    private inDb;
    private tmpUniqueKeys;
    private relationChanges;
    constructor();
    private __resetProp;
    private addMethods;
    private updateMeta;
    /**
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    protected abstract _initOptions(): any;
    /**
     * Returns the a redis key prefix string (including the modelName but without trailing ':'!)
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    protected abstract prefix(prefix: keyof INohmPrefixes): string;
    /**
     * Returns an object with the redis key prefix strings (including the trailing ':')
     * DO NOT OVERWRITE THIS; USED INTERNALLY
     *
     * @protected
     */
    protected abstract rawPrefix(): INohmPrefixes;
    protected generateMetaVersion(): string;
    p(keyOrValues: any, value?: any): any;
    prop(keyOrValues: any, value?: any): any;
    /**
     * Checks if key is a string, nothing else. Used as a type guard
     *
     * @private
     * @param {*} key
     * @returns {string} Name of a property
     */
    private isPropertyKey;
    property<TProp extends keyof TProps>(key: TProp): TProps[TProp];
    property<TProp extends keyof TProps>(key: TProp, value: any): TProps[TProp];
    property(valuesObject: Partial<{
        [key in keyof TProps]: any;
    }>): Partial<{
        [key in keyof TProps]: TProps[key];
    }>;
    private getProperty;
    private setProperty;
    private castProperty;
    /**
     * Returns an array of all the properties that have been changed since init/load/save.
     *
     * @example
     *   user.propertyDiff('country') ===
     *    [{
     *      key: 'country',
     *      before: 'GB',
     *      after: 'AB'
     *    }]
     */
    propertyDiff(key?: keyof TProps): Array<void | IPropertyDiff<keyof TProps>>;
    private onePropertyDiff;
    /**
     * Resets a property to its state as it was at last init/load/save.
     *
     * @param {string} [key] If given only this key is reset
     */
    propertyReset(key?: keyof TProps): void;
    /**
     *  Get all properties with values either as an array or as json (param true).
     */
    allProperties(): TProps & {
        id: any;
    };
    /**
     * Save an instance to the database. Updating or Creating as needed depending on if the instance already has an id.
     *
     * @param {ISaveOptions} [options={
     *     silent: false,
     *     skip_validation_and_unique_indexes: false,
     *   }]
     * @returns {Promise<void>}
     */
    save(options?: ISaveOptions): Promise<void>;
    private create;
    private generateId;
    /**
     * Sets the unique ids of all unique property values in this instance to the given id.
     * Warning: Only use this during create() when overwriting temporary ids!
     */
    private setUniqueIds;
    private update;
    private storeLinks;
    private getRelationKey;
    private saveLinkRedis;
    private setIndices;
    valid(property?: keyof TProps, setDirectly?: boolean): Promise<boolean>;
    /**
     * Check if one or all properties are valid and optionally set the unique indices immediately.
     * If a property is invalid the {@link NohmModel#errors} object will be populated with error messages.
     *
     * @param {string} [property] Property name if you only want to check one property for validity or
     * null for all properties
     * @param {boolean} [setDirectly=false] Set to true to immediately set the unique indices while checking.
     * This prevents race conditions but should probably only be used internally
     * @returns {Promise<boolean>} Promise resolves to true if checked properties are valid.
     */
    validate(property?: keyof TProps, setDirectly?: boolean): Promise<boolean>;
    private validateProperty;
    private getValidationObject;
    private isUpdatedUnique;
    private isUniqueKeyFree;
    private getUniqueKey;
    private checkUniques;
    /**
     * Used after a failed validation with setDirectly=true to remove the temporary unique keys
     *
     * @private
     * @param {string} key
     * @param {IProperty} property
     * @returns {Promise<void>}
     */
    private clearTemporaryUniques;
    /**
     *  Remove an object from the database.
     *  Note: Does not destroy the js object or its properties itself!
     *
     * @param {boolean} [silent=false] Fire PubSub events or not
     * @returns {Promise<void>}
     */
    remove(silent?: boolean): Promise<void>;
    private deleteDbCall;
    /**
     * Returns a Promise that resolves to true if the given id exists for this model.
     *
     * @param {*} id
     * @returns {Promise<boolean>}
     */
    exists(id: any): Promise<boolean>;
    private getHashAll;
    /**
     * Loads the record from the database.
     *
     * @param {*} id
     * @returns {Object} Resolves with the return of {@link NohmModel.allProperties}
     * of {@link NohmModel.allProperties} after loading
     * @throws {Error('not found')} If no record exists of the given id,
     * an error is thrown with the message 'not found'
     * @memberof NohmModel
     */
    load(id: any): Promise<TProps & {
        id: any;
    }>;
    link<T extends NohmModel>(other: T, callback?: TLinkCallback<T>): void;
    link<T extends NohmModel>(other: NohmModel, optionsOrNameOrCallback: string | ILinkOptions, callback?: TLinkCallback<T>): void;
    unlink<T extends NohmModel>(other: T, callback?: TLinkCallback<T>): void;
    unlink<T extends NohmModel>(other: NohmModel, optionsOrNameOrCallback: string | ILinkOptions, callback?: TLinkCallback<T>): void;
    private getLinkOptions;
    private isMultiClient;
    /**
     * Unlinks all relations a record has to all other models.
     *
     * @param {(redis.RedisClient | redis.Multi)} [givenClient]
     * @returns {Promise<void>}
     * @memberof NohmModel
     */
    unlinkAll(givenClient?: redis.RedisClient | redis.Multi): Promise<void>;
    private removeIdFromOtherRelations;
    /**
     * Resolves with true if the given object has a relation (optionally with the given relation name) to this.
     *
     * @param {NohmModel} obj
     * @param {string} [relationName='default']
     * @returns {Promise<boolean>}
     */
    belongsTo(obj: NohmModel, relationName?: string): Promise<boolean>;
    /**
     * Returns an array of the ids of all objects that are linked with the given relation.
     *
     * @param {string} otherModelName
     * @param {string} [relationName='default']
     * @returns {Promise<Array<any>>}
     */
    getAll(otherModelName: string, relationName?: string): Promise<Array<any>>;
    /**
     * Returns the number of links of a specified relation (or the default) an instance has to
     * models of a given modelName.
     *
     * @param {string} otherModelName Name of the model on the other end of the relation.
     * @param {string} [relationName='default'] Name of the relation
     * @returns {Promise<number>}
     */
    numLinks(otherModelName: string, relationName?: string): Promise<number>;
    /**
     * Finds ids of objects by search arguments
     *
     * @see https://maritz.github.io/nohm/#finding
     * @param {ISearchOptions} searches
     * @returns {Promise<Array<any>>}
     */
    find(searches?: Partial<{
        [key in keyof TProps]: string | number | boolean | Partial<ISearchOption>;
    }>): Promise<Array<string>>;
    private createStructuredSearchOptions;
    private uniqueSearch;
    private setSearch;
    private zSetSearch;
    private singleZSetSearch;
    /**
     * Sort records by some criteria and return the sorted ids.
     *
     * @see https://maritz.github.io/nohm/#sorting
     * @param {Object} [options={}]
     * @param {(Array<string> | false)} [ids=false]
     * @returns {Promise<Array<string>>}
     */
    sort(options?: ISortOptions<TProps>, ids?: Array<string | number> | false): Promise<Array<string>>;
    /**
     * Returns the property definitions of this model.
     *
     * @returns {Object}
     */
    getDefinitions(): {
        [key in keyof TProps]: IModelPropertyDefinition;
    };
    private fireEvent;
    private getPublish;
    subscribe<TPayloadProps extends TProps>(eventName: 'create' | 'remove', callback: (payload: IDefaultEventPayload<TPayloadProps>) => void): Promise<void>;
    subscribe<TPayloadProps extends TProps>(eventName: 'save' | 'update', callback: (payload: IChangeEventPayload<TPayloadProps>) => void): Promise<void>;
    subscribe<TPayloadProps extends TProps>(eventName: 'link' | 'unlink', callback: (payload: IRelationChangeEventPayload<TPayloadProps>) => void): Promise<void>;
    /**
     * Subscribe to only the next occurrence of an event for this model.
     *
     * @param {string} eventName One of 'create', 'update', 'save', 'remove', 'unlink', 'link'
     * @param {function} callback
     * @returns {Promise<void>} Resolves after the subscription has been set up.
     * @memberof NohmModel
     */
    subscribeOnce(eventName: TAllowedEventNames, callback: (payload: any) => void): Promise<void>;
    /**
     * Unsubscribe from an event.
     *
     * @param {string} eventName One of 'create', 'update', 'save', 'remove', 'unlink', 'link'
     * @param {function} [fn] If a function is given, only that function is removed as a listener.
     * @memberof NohmModel
     */
    unsubscribeEvent(eventName: string, fn?: any): void;
    /**
    * ID of the record.
    * You can manually set it, but that doesn't automatically load it.
    *
    * @memberof NohmModel
    */
    id: null | string;
    private stringId;
    /**
     * Returns true if the model has been loaded from the database.
     *
     * @readonly
     * @type {boolean}
     * @memberof NohmModel
     */
    readonly isLoaded: boolean;
    /**
     * True if there are any unsaved changes. This is triggered by changing the id manually,
     * using .link()/.unlink() and changing properties from their stored state.
     */
    readonly isDirty: boolean;
}
export default NohmModel;
//# sourceMappingURL=model.d.ts.map
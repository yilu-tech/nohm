import { NohmModel } from './model';
import * as redis from 'redis';
export declare type TPropertyTypeNames = 'string' | 'bool' | 'boolean' | 'integer' | 'int' | 'float' | 'number' | 'date' | 'time' | 'timestamp' | 'json';
export declare const stringProperty: TPropertyTypeNames;
export declare const boolProperty: TPropertyTypeNames;
export declare const integerProperty: TPropertyTypeNames;
export declare const floatProperty: TPropertyTypeNames;
export declare const numberProperty: TPropertyTypeNames;
export declare const dateProperty: TPropertyTypeNames;
export declare const timeProperty: TPropertyTypeNames;
export declare const timestampProperty: TPropertyTypeNames;
export declare const jsonProperty: TPropertyTypeNames;
export interface IDictionary {
    [index: string]: any;
}
export declare type PropertyBehavior = <TModel extends NohmModel>(this: TModel, newValue: string, key: string, oldValue: string) => any;
export interface IStaticMethods<T extends NohmModel> {
    new (): T;
    load<P extends NohmModel>(id: any): Promise<P>;
    loadMany<P extends NohmModel>(id: Array<string>): Promise<Array<P>>;
    findAndLoad<P extends NohmModel, TProps extends IDictionary = {}>(searches?: Partial<{
        [key in keyof TProps]: string | number | boolean | Partial<ISearchOption>;
    }>): Promise<Array<P>>;
    sort(sortOptions: ISortOptions<IDictionary>, ids?: Array<string | number> | false): Promise<Array<string>>;
    find<TProps extends IDictionary = {}>(searches: Partial<{
        [key in keyof TProps]: string | number | boolean | Partial<ISearchOption>;
    }>): Promise<Array<string>>;
    remove(id: any): Promise<void>;
}
export declare type validatiorFunction = (value: any, options: any) => Promise<boolean>;
export interface IValidationObject {
    name: string;
    options: {
        [index: string]: any;
    };
    validator: validatiorFunction;
}
export declare type TValidationDefinition = string | {
    name: string;
    options: any;
} | validatiorFunction;
export interface IModelPropertyDefinition {
    /**
     * Whether the property should be indexed. Depending on type this creates different keys/collections.
     * Does not work for all types. TODO: specify here which types.
     *
     * @type {boolean}
     * @memberof IModelPropertyDefinition
     */
    index?: boolean;
    defaultValue?: any;
    load_pure?: boolean;
    type: TPropertyTypeNames | PropertyBehavior;
    unique?: boolean;
    validations?: Array<TValidationDefinition>;
}
export declare type TTypedDefinitions<TProps extends IDictionary> = {
    [props in keyof TProps]: IModelPropertyDefinition;
};
export interface IModelPropertyDefinitions {
    [propName: string]: IModelPropertyDefinition;
}
export declare type TIdGenerators = 'default' | 'increment';
export interface IModelOptions {
    metaCallback?: (error: string | Error | null, version?: string) => any;
    methods?: {
        [name: string]: (this: NohmModel, ...args: Array<any>) => any;
    };
    properties: IModelPropertyDefinitions;
    publish?: boolean;
    idGenerator?: TIdGenerators | (() => any);
}
export interface ISaveOptions {
    silent?: boolean;
    skip_validation_and_unique_indexes?: boolean;
    redisMulti?: redis.Multi;
}
export interface IProperty {
    value: any;
    __updated: boolean;
    __oldValue: any;
    __numericIndex: boolean;
}
export interface IPropertyDiff<TKeys = string> {
    key: TKeys;
    before: any;
    after: any;
}
export interface IValidationResult {
    key: string;
    valid: boolean;
    errors?: Array<string>;
}
export interface IRelationChange {
    action: 'link' | 'unlink';
    callback?: (...args: Array<any>) => any;
    object: NohmModel;
    options: ILinkOptionsWithName;
}
export interface ILinkOptions {
    error?: (err: Error | string, otherObject: NohmModel) => any;
    name?: string;
    silent?: boolean;
}
export interface ILinkOptionsWithName extends ILinkOptions {
    name: string;
}
export interface ILinkSaveResult {
    success: boolean;
    child: NohmModel;
    parent: NohmModel;
    error: null | Error;
}
export interface IUnlinkKeyMapItem {
    ownIdsKey: string;
    otherIdsKey: string;
}
export interface ISearchOption {
    endpoints: '()' | '[]' | '[)' | '(]' | '(' | ')';
    limit: number;
    min: number | '-inf' | '+inf';
    max: number | '-inf' | '+inf';
    offset: number;
}
export declare type TKey<TProps extends IDictionary> = keyof TProps;
export interface IStructuredSearch<TProps extends IDictionary> {
    type: 'undefined' | 'unique' | 'set' | 'zset';
    options: Partial<ISearchOption>;
    key: keyof TProps;
    value: any;
}
export interface ISortOptions<TProps extends IDictionary> {
    alpha?: 'ALPHA' | '';
    direction?: 'ASC' | 'DESC';
    field?: keyof TProps;
    limit?: Array<number>;
}
export declare type TLinkCallback<T> = (action: string, ownModelName: string, relationName: string, other: T) => void;
export interface IDefaultEventPayload<TProps extends IDictionary> {
    target: {
        id: null | string;
        modelName: string;
        properties: TProps & {
            id: string;
        };
    };
}
export interface IChangeEventPayload<TProps extends IDictionary> {
    target: {
        id: string;
        modelName: string;
        properties: TProps;
        diff: Array<void | IPropertyDiff<TKey<TProps>>>;
    };
}
export interface IRelationChangeEventPayload<TProps extends IDictionary> {
    child: IDefaultEventPayload<TProps>['target'];
    parent: IDefaultEventPayload<IDictionary>['target'];
    relation: string;
}
//# sourceMappingURL=model.header.d.ts.map
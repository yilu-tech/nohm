import { Multi, RedisClient } from 'redis';
export declare const errorMessage = "Supplied redis client does not have the correct methods.";
export declare function get(client: RedisClient | Multi, key: string): Promise<string>;
export declare function exists(client: RedisClient | Multi, key: string): Promise<number>;
export declare function del(client: RedisClient | Multi, key: string | Array<string>): Promise<void>;
export declare function set(client: RedisClient | Multi, key: string, value: string): Promise<void>;
export declare function mset(client: RedisClient | Multi, keyValueArrayOrString: string | Array<string>, ...keyValuePairs: Array<string>): Promise<void>;
export declare function setnx(client: RedisClient | Multi, key: string, value: string): Promise<number>;
export declare function smembers(client: RedisClient | Multi, key: string): Promise<Array<string>>;
export declare function scard(client: RedisClient | Multi, key: string): Promise<number>;
export declare function sismember(client: RedisClient | Multi, key: string, value: string): Promise<number>;
export declare function sadd(client: RedisClient | Multi, key: string, value: string): Promise<number>;
export declare function sinter(client: RedisClient | Multi, keyArrayOrString: string | Array<string>, ...intersectKeys: Array<string>): Promise<Array<string>>;
export declare function hgetall(client: RedisClient | Multi, key: string): Promise<{
    [key: string]: string;
}>;
export declare function exec<T>(client: Multi): Promise<Array<T>>;
export declare function psubscribe(client: RedisClient, patternOrPatternArray: string | Array<string>, ...patterns: Array<string>): Promise<void>;
export declare function punsubscribe(client: RedisClient, patternOrPatternArray: string | Array<string>, ...patterns: Array<string>): Promise<void>;
export declare function keys(client: RedisClient | Multi, searchString: string): Promise<Array<string>>;
export declare function zscore(client: RedisClient | Multi, key: string, member: string): Promise<number>;
export declare function hset(client: RedisClient | Multi, key: string, field: string, value: string): Promise<number>;
export declare function hget(client: RedisClient | Multi, key: string, field: string): Promise<string>;
//# sourceMappingURL=typed-redis-helper.d.ts.map
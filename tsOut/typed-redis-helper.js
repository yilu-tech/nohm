"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IORedis = require("ioredis");
exports.errorMessage = 'Supplied redis client does not have the correct methods.';
function get(client, key) {
    return new Promise((resolve, reject) => {
        if (!client.get) {
            return reject(new Error(exports.errorMessage));
        }
        client.get(key, (err, value) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(value);
            }
        });
    });
}
exports.get = get;
function exists(client, key) {
    return new Promise((resolve, reject) => {
        if (!client.exists) {
            return reject(new Error(exports.errorMessage));
        }
        client.exists(key, (err, reply) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(reply);
            }
        });
    });
}
exports.exists = exists;
function del(client, key) {
    return new Promise((resolve, reject) => {
        if (!client.del) {
            return reject(new Error(exports.errorMessage));
        }
        client.del(key, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.del = del;
function set(client, key, value) {
    return new Promise((resolve, reject) => {
        if (!client.set) {
            return reject(new Error(exports.errorMessage));
        }
        client.set(key, value, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.set = set;
function mset(client, keyValueArrayOrString, ...keyValuePairs) {
    return new Promise((resolve, reject) => {
        if (!client.mset) {
            return reject(new Error(exports.errorMessage));
        }
        client.mset.apply(client, [
            keyValueArrayOrString,
            ...keyValuePairs,
            (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            },
        ]);
    });
}
exports.mset = mset;
function setnx(client, key, value) {
    return new Promise((resolve, reject) => {
        if (!client.setnx) {
            return reject(new Error(exports.errorMessage));
        }
        client.setnx(key, value, (err, reply) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(reply);
            }
        });
    });
}
exports.setnx = setnx;
function smembers(client, key) {
    return new Promise((resolve, reject) => {
        if (!client.smembers) {
            return reject(new Error(exports.errorMessage));
        }
        client.smembers(key, (err, values) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(values);
            }
        });
    });
}
exports.smembers = smembers;
function scard(client, key) {
    return new Promise((resolve, reject) => {
        if (!client.scard) {
            return reject(new Error(exports.errorMessage));
        }
        client.scard(key, (err, value) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(value);
            }
        });
    });
}
exports.scard = scard;
function sismember(client, key, value) {
    return new Promise((resolve, reject) => {
        if (!client.sismember) {
            return reject(new Error(exports.errorMessage));
        }
        client.sismember(key, value, (err, numFound) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(numFound);
            }
        });
    });
}
exports.sismember = sismember;
function sadd(client, key, value) {
    return new Promise((resolve, reject) => {
        if (!client.sadd) {
            return reject(new Error(exports.errorMessage));
        }
        client.sadd(key, value, (err, numInserted) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(numInserted);
            }
        });
    });
}
exports.sadd = sadd;
function sinter(client, keyArrayOrString, ...intersectKeys) {
    return new Promise((resolve, reject) => {
        if (!client.sinter) {
            return reject(new Error(exports.errorMessage));
        }
        client.sinter.apply(client, [
            keyArrayOrString,
            ...intersectKeys,
            (err, values) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(values);
                }
            },
        ]);
    });
}
exports.sinter = sinter;
function hgetall(client, key) {
    return new Promise((resolve, reject) => {
        if (!client.hgetall) {
            return reject(new Error(exports.errorMessage));
        }
        client.hgetall(key, (err, values) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(values);
            }
        });
    });
}
exports.hgetall = hgetall;
function exec(client) {
    return new Promise((resolve, reject) => {
        if (!client.exec) {
            return reject(new Error(exports.errorMessage));
        }
        client.exec((err, results) => {
            if (err) {
                return reject(err);
            }
            else {
                // detect if it's ioredis, which has a different return structure.
                // better methods for doing this would be very welcome!
                if (Array.isArray(results[0]) &&
                    (results[0][0] === null ||
                        // once ioredis has proper typings, this any casting can be changed
                        results[0][0] instanceof IORedis.ReplyError)) {
                    // transform ioredis format to node_redis format
                    results = results.map((result) => {
                        const error = result[0];
                        if (error instanceof IORedis.ReplyError) {
                            return error.message;
                        }
                        return result[1];
                    });
                }
                resolve(results);
            }
        });
    });
}
exports.exec = exec;
function psubscribe(client, patternOrPatternArray, ...patterns) {
    return new Promise((resolve, reject) => {
        if (!client.psubscribe) {
            return reject(new Error(exports.errorMessage));
        }
        client.psubscribe.apply(client, [
            patternOrPatternArray,
            ...patterns,
            (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            },
        ]);
    });
}
exports.psubscribe = psubscribe;
function punsubscribe(client, patternOrPatternArray, ...patterns) {
    return new Promise((resolve, reject) => {
        if (!client.punsubscribe) {
            return reject(new Error(exports.errorMessage));
        }
        client.punsubscribe.apply(client, [
            patternOrPatternArray,
            ...patterns,
            (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            },
        ]);
    });
}
exports.punsubscribe = punsubscribe;
function keys(client, searchString) {
    return new Promise((resolve, reject) => {
        if (!client.keys) {
            return reject(new Error(exports.errorMessage));
        }
        client.keys(searchString, (err, value) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(value);
            }
        });
    });
}
exports.keys = keys;
function zscore(client, key, member) {
    return new Promise((resolve, reject) => {
        if (!client.zscore) {
            return reject(new Error(exports.errorMessage));
        }
        client.zscore(key, member, (err, value) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(parseFloat(value));
            }
        });
    });
}
exports.zscore = zscore;
function hset(client, key, field, value) {
    return new Promise((resolve, reject) => {
        if (!client.hset) {
            return reject(new Error(exports.errorMessage));
        }
        client.hset(key, field, value, (err, numAdded) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(numAdded);
            }
        });
    });
}
exports.hset = hset;
function hget(client, key, field) {
    return new Promise((resolve, reject) => {
        if (!client.hget) {
            return reject(new Error(exports.errorMessage));
        }
        client.hget(key, field, (err, value) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(value);
            }
        });
    });
}
exports.hget = hget;
//# sourceMappingURL=typed-redis-helper.js.map
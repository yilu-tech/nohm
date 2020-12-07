/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { NohmClass } from '.';
export interface IExclusionsOption {
    [key: string]: Array<number | boolean> | boolean;
}
export declare type TRequestHandler = (req: IncomingMessage, res: ServerResponse, next?: any) => void;
export interface IMiddlewareOptions {
    url?: string;
    namespace?: string;
    maxAge?: number;
    exclusions?: {
        [key: string]: IExclusionsOption | boolean;
    };
    extraFiles?: string | Array<string>;
    uglify?: any;
}
/**
 * Returns a middleware that can deliver the validations as a javascript file
 * and the modelspecific validations as a JSON object to the browser.
 * This is useful if you want to save some bandwith by doing the validations
 * in the browser before saving to the server.
 *
 * Example:
 *
 * ```
 *    server.use(nohm.middleware(
 *      // options object
 *      {
 *        url: '/nohm.js',
 *        namespace: 'nohm',
 *        exclusions: {
 *
 *          User: { // modelName
 *
 *            // this will ignore the second validation in the validation definition array for
 *            // the property 'name' in the model definition
 *            name: [false, true],
 *
 *            // this will completely ignore all validations for the salt property
 *            salt: true
 *          },
 *
 *          Privileges: true // this will completely ignore the Priviledges model
 *        }
 *      }
 *    ));
 * ```
 *
 * @see https://maritz.github.io/nohm/#browser-validation
 * @param {Object} options Options for the middleware
 * @param {string} [options.url='/nomValidations.js'] Url under which the js file will be available.
 * @param {object.<string, object | boolean>} [options.exclusions={}] Object containing exclusions for the
 * validations export - see example for details
 * @param {string} [options.namespace='nomValidations'] Namespace to be used by the js file in the browser.
 * @param {string} [options.extraFiles=[]] Extra files containing validations.
 * You should only use this if they are not already set via Nohm.setExtraValidations
 * as this automatically includes those.
 * @param {number} [options.maxAge=3600] Cache control in seconds. (Default is one hour)
 * @param {boolean} [options.uglify=false] True to enable minification.
 * Requires uglify-js to be installed in your project!
 * @return {Middleware~callback}
 * @instance
 * @memberof NohmClass
 */
export declare function middleware(options: IMiddlewareOptions, nohm?: NohmClass): TRequestHandler;
//# sourceMappingURL=middleware.d.ts.map
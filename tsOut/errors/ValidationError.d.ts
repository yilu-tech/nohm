import { IDictionary } from '../model.header';
export interface IValidationError<TProps extends IDictionary> extends Error {
    modelName: string;
    errors: {
        [key in keyof TProps]?: Array<string>;
    };
}
/**
 * Details about which properties failed to validate in which way.
 *
 * The type is an object with property names as keys and then an array with validation
 * names of the validations that failed
 *
 * @type { Object.<string, Array<string>> }
 * @name errors
 * @memberof NohmErrors.ValidationError#
 */
/**
 * Error thrown whenever validation failed during {@link NohmModel#validate} or {@link NohmModel#save}.
 *
 * @class ValidationError
 * @memberof NohmErrors
 * @extends {Error}
 */
export declare class ValidationError<TProps extends IDictionary> extends Error implements IValidationError<TProps> {
    readonly errors: IValidationError<TProps>['errors'];
    readonly modelName: string;
    constructor(errors: IValidationError<TProps>['errors'], modelName: string, errorMessage?: string);
}
//# sourceMappingURL=ValidationError.d.ts.map
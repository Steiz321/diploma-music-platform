import {
  ArgumentMetadata,
  Injectable,
  Optional,
  ValidationPipe
} from '@nestjs/common';
import {loadPackage} from '@nestjs/common/utils/load-package.util';
import {ClassTransformOptions} from 'class-transformer';
import {ValidationError, ValidatorOptions} from 'class-validator';

const REWRITE_VALIDATION_OPTIONS = 'metadata:REWRITE_VALIDATION_OPTIONS';

export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  transformOptions?: ClassTransformOptions;
  exceptionFactory?: (errors: ValidationError[]) => any;

  disabled?: boolean;
}

let classValidator: any = {};
let classTransformer: any = {};

@Injectable()
export class SwitchableValidationPipe extends ValidationPipe {
  constructor(@Optional() options?: ValidationPipeOptions) {
    super(options);
    classValidator = loadPackage('class-validator', 'ValidationPipe', () =>
      require('class-validator')
    );
    classTransformer = loadPackage('class-transformer', 'ValidationPipe', () =>
      require('class-transformer')
    );
  }

  public async transform(value: any, metadata: ArgumentMetadata) {
    const {metatype} = metadata;
    if (!metatype || !this.toValidate(metadata)) {
      return value;
    }
    const localOptions = Reflect.getMetadata(
      REWRITE_VALIDATION_OPTIONS,
      metadata.metatype
    );
    const entity = classTransformer.plainToClass(
      metatype,
      this.toEmptyIfNil(value, metatype),
      this.transformOptions
    );
    if (localOptions && localOptions.disabled) {
      return this.isTransformEnabled
        ? entity
        : Object.keys(this.validatorOptions).length > 0
          ? classTransformer.classToPlain(entity, this.transformOptions)
          : value;
    }
    const errors = await classValidator.validate(entity, this.validatorOptions);
    if (errors.length > 0) {
      throw this.exceptionFactory(errors);
    }
    return this.isTransformEnabled
      ? entity
      : Object.keys(this.validatorOptions).length > 0
        ? classTransformer.classToPlain(entity, this.transformOptions)
        : value;
  }
}

export function DisableAutoValidation() {
  return function (target) {
    Reflect.defineMetadata(
      REWRITE_VALIDATION_OPTIONS,
      {disabled: true},
      target
    );
  };
}

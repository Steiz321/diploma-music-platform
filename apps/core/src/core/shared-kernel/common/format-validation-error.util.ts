import {BadRequestException} from '@nestjs/common';
import {ValidationError} from 'class-validator';

const findNestedValidationError = (errorObject: ValidationError) => {
  return errorObject.constraints && Object.keys(errorObject.constraints).length
    ? Object.values(errorObject.constraints)[0]
    : findNestedValidationError(errorObject.children[0]);
};

export const formatValidationError = (errors: ValidationError[]) => {
  // we will always receive only 1 error here because in ValidatorPipe options
  // there's a flag { stopAtFirstError: true }
  const message = findNestedValidationError(errors[0]);

  return new BadRequestException(message);
};

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function RequireAtLeastOne(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'requireAtLeastOne',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [fields],
      options: {
        message: `At least one of [${fields.join(', ')}] must be provided`,
        ...validationOptions,
      },
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          return fields.some((field) => {
            const val = obj[field];
            return typeof val === 'string' ? val.trim().length > 0 : !!val;
          });
        },
      },
    });
  };
}

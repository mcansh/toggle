import type { ValidationError } from 'yup';

function yupToObject<Schema>(errors: ValidationError) {
  if (!errors.inner || errors.inner.length === 0) {
    console.error(
      "We didn't get any errors, did you pass `{ abortEarly: false }` to your validate function?"
    );

    return {};
  }

  return errors.inner.reduce<Partial<Schema>>((validationErrors, error) => {
    if (!error.path) return validationErrors;

    return {
      ...validationErrors,
      [error.path]: error.message,
    };
  }, {});
}

export { yupToObject };

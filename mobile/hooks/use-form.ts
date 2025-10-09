import { useState, useCallback, useMemo } from "react";

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (name: keyof T, value: any) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (
    onSubmit: (values: T) => Promise<void> | void,
  ) => Promise<void>;
  reset: () => void;
  setValues: (values: T) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, touched: boolean) => void;
}

/**
 * Hook for managing form state with validation
 *
 * @param initialValues - Initial form values
 * @param validate - Optional validation function that returns errors
 * @returns Object with form state and handlers
 *
 * @example
 * const { values, errors, handleChange, handleSubmit } = useForm(
 *   { email: '', password: '' },
 *   (values) => {
 *     const errors: any = {};
 *     if (!values.email) errors.email = 'Email is required';
 *     if (!values.password) errors.password = 'Password is required';
 *     return errors;
 *   }
 * );
 *
 * // In your JSX
 * <TextInput
 *   value={values.email}
 *   onChangeText={(text) => handleChange('email', text)}
 * />
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => Partial<Record<keyof T, string>>,
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors],
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate on blur if validation function provided
      if (validate) {
        const validationErrors = validate(values);
        if (validationErrors[name]) {
          setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
        }
      }
    },
    [values, validate],
  );

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      // Validate all fields
      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
          // Mark all fields as touched
          const allTouched = Object.keys(values).reduce(
            (acc, key) => ({
              ...acc,
              [key]: true,
            }),
            {},
          );
          setTouched(allTouched);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback(
    (name: keyof T, value: any) => {
      handleChange(name, value);
    },
    [handleChange],
  );

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T, touched: boolean) => {
    setTouched((prev) => ({ ...prev, [name]: touched }));
  }, []);

  return useMemo(
    () => ({
      values,
      errors,
      touched,
      isSubmitting,
      handleChange,
      handleBlur,
      handleSubmit,
      reset,
      setValues,
      setErrors,
      setFieldValue,
      setFieldError,
      setFieldTouched,
    }),
    [
      values,
      errors,
      touched,
      isSubmitting,
      handleChange,
      handleBlur,
      handleSubmit,
      reset,
      setValues,
      setErrors,
      setFieldValue,
      setFieldError,
      setFieldTouched,
    ],
  );
}

export default useForm;

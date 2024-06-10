# Form コンポーネント

## 使い方

```tsx
import { useState, useCallback } from 'react';
import { Form, FormValues, FormErrors } from '@/components/Form';

export const MyFormScreen = () => {
  const [errors, setErrors] = useState<FormErrors>();

  // onSubmit
  const onSubmit = useCallback(
    async (values: FormValues, errors?: FormErrors) => {
      setErrors(errors);

      // エラー処理
      if (errors) {
        console.log('errors', errors);
        return;
      }

      const name = values.name;
      const email = values.email;

      // do something
    },
    [],
  );

  return (
    <Form
      onSubmit={onSubmit}
      validations={{
        name: [
          { test: /.+/, errorText: 'Name is required' },
          { test: /^[a-zA-Z ]+$/, errorText: 'Name must be alphabets' },
        ],
      }}
    >
      <FormField label="Name">
        <input name="name" />
        {errors?.name && <div className="error">{errors.name}</div>}
      </FormField>
      <FormField label="Email">
        <input name="email" />
      </FormField>

      <FormFooter>
        <Button>Submit</Button>
      </FormFooter>
    </Form>
  );
};
```

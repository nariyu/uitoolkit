import {
  forwardRef,
  HTMLAttributes,
  SyntheticEvent,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { preventDefault } from "../../utils/ElementUtil";
import { getFormValues, getValidationErrors } from "./utils/FormUtil";

export type FormValues = { [key: string]: string };
export type FormErrors = { [key: string]: string };

export type FormValidation = RequiredOne<{
  // 必須チェック
  required?: boolean;

  // 文字列長でチェック
  length?: RequiredOne<{ min?: number; max?: number }>;

  // 数字の範囲でチェック
  range?: RequiredOne<{ min?: number; max?: number }>;

  /** 正規表現もしくは関数でチェック */
  test?: RegExp | ((value: string) => boolean);
}> & {
  errorText?: string;
};

interface FormProps extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  validations?: {
    [key: string]: FormValidation[];
  };
  onSubmit?: (values: FormValues, errors?: FormErrors) => void;
}

export interface FormHandler {
  getValues: () => FormValues;
  submit: () => void;
}

export const Form = forwardRef<FormHandler, FormProps>(
  function Form(props, ref) {
    const { validations, className, onSubmit, ...otherProps } = props;

    const formElemRef = useRef<HTMLFormElement>(null);

    const submit = useCallback(async () => {
      const values = getFormValues(formElemRef.current!);

      const errors = getValidationErrors(values, validations);

      onSubmit?.(values, errors);
    }, [onSubmit, validations]);

    useImperativeHandle(
      ref,
      () => ({
        getValues: () => {
          return getFormValues(formElemRef.current!);
        },
        submit,
      }),
      [submit]
    );

    const onSubmitForm = useCallback(
      (event: SyntheticEvent<HTMLFormElement>) => {
        preventDefault(event);
        submit();
      },
      [submit]
    );

    return (
      <form
        ref={formElemRef}
        className={className}
        onSubmit={onSubmitForm}
        {...otherProps}
      />
    );
  }
);

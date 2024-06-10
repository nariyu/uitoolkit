import { useMainContext } from "@/example/hooks/useContext";
import { Submittable } from "@/lib/components/NavigationController";
import {
  NotificationManager,
  NotificationType,
} from "@/lib/components/Notification";
import { Spinner } from "@/lib/components/Spinner";
import { TextInput, TextInputHandler } from "@/lib/components/TextInput";
import { classNames } from "@/lib/utils/ElementUtil";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { validateEmail } from "../../validators";
import styles from "./EditPage.module.scss";

interface Props {
  onClose: () => void;
}
export const EmailEdit = forwardRef<Submittable, Props>(
  function EmailEdit(props, ref) {
    const { onClose } = props;

    const emailTextInputRef = useRef<TextInputHandler>(null);

    const { userInfo, setUserInfo } = useMainContext();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [errorType, setErrorType] = useState<"" | "email">("");

    // OK
    const submit = useCallback(() => {
      setError("");
      setErrorType("");

      const emailTextInput = emailTextInputRef.current;
      if (!emailTextInput) return;

      const email = emailTextInput.getValue();

      // バリデーション
      if (!email) {
        setErrorType("email");
        setError("Please enter your email.");
        return;
      } else if (!validateEmail(email)) {
        setErrorType("email");
        setError("Please enter your email correctly.");
        return;
      }

      setLoading(true);

      new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
        setLoading(false);
        setUserInfo((userInfo) =>
          userInfo ? { ...userInfo, email } : undefined
        );
        NotificationManager.add("Email is updated.", NotificationType.Info);
        onClose();
      });
    }, [onClose, setUserInfo]);

    useImperativeHandle(ref, () => ({ submit }), [submit]);

    return (
      <div className={styles.component}>
        <div className={styles.field}>
          <TextInput
            ref={emailTextInputRef}
            name="email"
            label="Email"
            placeholder="abc@example.com"
            disabled={loading}
            defaultValue={userInfo?.email}
            labelClassName={classNames(
              errorType === "email" ? styles.errorLabel : undefined
            )}
            inputClassName={classNames(
              errorType === "email" ? styles.errorInput : undefined
            )}
          />
        </div>
        {errorType === "email" && <p className={styles.fieldError}>{error}</p>}
        {loading && <Spinner />}
      </div>
    );
  }
);

export const EmailEditTitle = () => <>Email</>;
export const EmailEditSubmitButton = () => <>Save</>;

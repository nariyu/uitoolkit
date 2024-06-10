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
import styles from "./EditPage.module.scss";

interface Props {
  onClose: () => void;
}
export const UsernameEdit = forwardRef<Submittable, Props>(
  function UsernameEdit(props, ref) {
    const { onClose } = props;

    const usernameTextInputRef = useRef<TextInputHandler>(null);

    const { userInfo, setUserInfo } = useMainContext();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [errorType, setErrorType] = useState<"" | "username">("");

    // OK
    const submit = useCallback(() => {
      setError("");
      setErrorType("");

      const usernameTextInput = usernameTextInputRef.current;
      if (!usernameTextInput) return;

      const username = usernameTextInput.getValue();

      // バリデーション
      if (!username) {
        setErrorType("username");
        setError("Please enter your name.");
        return;
      }

      setLoading(true);

      new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
        setLoading(false);
        setUserInfo((userInfo) =>
          userInfo ? { ...userInfo, username } : undefined
        );
        NotificationManager.add("Username is updated.", NotificationType.Info);
        onClose();
      });
    }, [onClose, setUserInfo]);

    useImperativeHandle(ref, () => ({ submit }), [submit]);

    return (
      <div className={styles.component}>
        <div className={styles.field}>
          <TextInput
            ref={usernameTextInputRef}
            name="username"
            label="Username"
            disabled={loading}
            defaultValue={userInfo?.username}
            labelClassName={classNames(
              errorType === "username" ? styles.errorLabel : undefined
            )}
            inputClassName={classNames(
              errorType === "username" ? styles.errorInput : undefined
            )}
          />
        </div>
        {errorType === "username" && (
          <p className={styles.fieldError}>{error}</p>
        )}
        {loading && <Spinner />}
      </div>
    );
  }
);

export const UsernameEditTitle = () => <>Username</>;
export const UsernameEditSubmitButton = () => <>Save</>;

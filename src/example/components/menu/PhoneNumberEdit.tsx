import { useMainContext } from "@/example/hooks/useMainContext";
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
import { validatePhoneNumber } from "../../validators";
import styles from "./EditPage.module.scss";

interface Props {
  onClose: () => void;
}
export const PhoneNumberEdit = forwardRef<Submittable, Props>(
  function PhoneNumberEdit(props, ref) {
    const { onClose } = props;

    const { userInfo, setUserInfo } = useMainContext();

    const phoneNumberTextInputRef = useRef<TextInputHandler>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [errorType, setErrorType] = useState<"" | "phonenumber">("");

    // OK
    const submit = useCallback(() => {
      setError("");
      setErrorType("");

      const phoneNumberTextInput = phoneNumberTextInputRef.current;
      if (!phoneNumberTextInput) return;

      const phoneNumber = phoneNumberTextInput.getValue();

      // バリデーション
      if (!phoneNumber) {
        setErrorType("phonenumber");
        setError("Please enter your phone number.");
        return;
      }
      if (!validatePhoneNumber(phoneNumber)) {
        setErrorType("phonenumber");
        setError("Please enter your phone number correctly.");
        return;
      }

      setLoading(true);

      new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
        setLoading(false);
        setUserInfo((userInfo) =>
          userInfo ? { ...userInfo, phoneNumber } : undefined
        );
        NotificationManager.add(
          "Phone number is updated.",
          NotificationType.Info
        );
        onClose();
      });
    }, [onClose, setUserInfo]);

    useImperativeHandle(ref, () => ({ submit }), [submit]);

    return (
      <div className={styles.component}>
        <div className={styles.field}>
          <TextInput
            ref={phoneNumberTextInputRef}
            name="phonenumber"
            label="Phone Number"
            placeholder="09012345678"
            pattern="\d*"
            defaultValue={userInfo?.phoneNumber}
            disabled={loading}
            labelClassName={classNames(
              errorType === "phonenumber" ? styles.errorLabel : undefined
            )}
            inputClassName={classNames(
              errorType === "phonenumber" ? styles.errorInput : undefined
            )}
          />
        </div>
        {errorType === "phonenumber" && (
          <p className={styles.fieldError}>{error}</p>
        )}
        {loading && <Spinner />}
      </div>
    );
  }
);

export const PhoneNumberEditTitle = () => <>Phone Number</>;
export const PhoneNumberEditSubmitButton = () => <>Save</>;

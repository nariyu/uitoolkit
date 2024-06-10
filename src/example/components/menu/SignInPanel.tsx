import { defaultUserInfo, useMainContext } from "@/example/hooks/useContext";
import { Button } from "@/lib/components/Button";
import { preventDefault } from "@/lib/utils/ElementUtil";
import { SyntheticEvent, useCallback, useState } from "react";
import styles from "./SignInPanel.module.scss";

export const SignInPanel = () => {
  const { setUserInfo } = useMainContext();

  const [loading, setLoading] = useState(false);

  const onClick = useCallback(
    (event: SyntheticEvent) => {
      preventDefault(event);

      setLoading(true);

      Promise.resolve()
        .then(() => new Promise((resolve) => setTimeout(resolve, 1000)))
        .then(() => {
          setUserInfo(defaultUserInfo);
        });
    },
    [setUserInfo]
  );

  return (
    <div className={styles.component}>
      <Button onClick={onClick} aria-disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </div>
  );
};

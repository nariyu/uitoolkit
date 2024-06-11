import { useMainContext } from "@/example/hooks/useMainContext";
import styles from "./UserInfo.module.scss";

export const UserInfo = () => {
  const { userInfo } = useMainContext();

  return (
    <div className={styles.component}>
      <div
        className={styles.icon}
        style={{ backgroundImage: `url(${userInfo?.profileImageUrl})` }}
      />
      <div className={styles.name}>{userInfo?.username}</div>
    </div>
  );
};

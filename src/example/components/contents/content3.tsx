import { ModalContainerContext } from 'example/context/containercontext';
import { showActionSheet } from 'lib/components/actionsheet';
import { Button } from 'lib/components/button';
import { useContext } from 'react';
import styles from './content.module.scss';

export const Content3 = () => {
  const modalContainer = useContext(ModalContainerContext);

  return (
    <div className={styles.component}>
      <Button
        onClick={() => {
          showActionSheet(
            'Pretty!',
            <div
              style={{
                padding: '1rem',
                minHeight: '20rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '6rem',
              }}
            >
              🥰
            </div>,
            {
              container: modalContainer,
            },
          );
        }}
      >
        Show ActionSheet
      </Button>
    </div>
  );
};

export const Content3Icon = () => <span style={{ opacity: 0.3 }}>⚽️</span>;
export const Content3IconSelected = () => <>⚽️</>;

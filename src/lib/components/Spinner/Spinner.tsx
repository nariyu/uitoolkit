import style from './Spinner.module.scss';

export function Spinner() {
  return (
    <div data-ui="spinner" className={style.spinnerWrapper}>
      <div className={style.spinner}>
        <div className={style.circle}>
          <div className={style.circleLeft} />
          <div className={style.circleRight} />
        </div>
      </div>
    </div>
  );
}

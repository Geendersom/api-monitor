import { Link } from "react-router-dom";

export const MonitorNotFoundState = () => {
  return (
    <section className="state-panel state-panel--empty" role="alert">
      <div
        className="state-panel__icon state-panel__icon--error"
        aria-hidden="true"
      >
        ?
      </div>
      <p className="state-panel__title">Monitor não encontrado</p>
      <p className="state-panel__description">
        O monitor solicitado não existe ou foi removido.
      </p>
      <Link to="/" className="button button--primary">
        Voltar ao Dashboard
      </Link>
    </section>
  );
};

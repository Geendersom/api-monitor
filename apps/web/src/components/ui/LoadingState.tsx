type LoadingStateProps = {
  message?: string;
};

export const LoadingState = ({
  message = "Carregando dashboard",
}: LoadingStateProps) => {
  return (
    <section className="state-panel" aria-live="polite" aria-busy="true">
      <div className="state-panel__icon state-panel__icon--loading">
        <div className="loading-spinner" aria-hidden="true" />
      </div>
      <p className="state-panel__title">{message}</p>
      <p className="state-panel__description">
        Coletando métricas, monitores e alertas da API.
      </p>
    </section>
  );
};

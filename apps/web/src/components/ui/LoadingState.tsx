type LoadingStateProps = {
  message?: string;
};

export const LoadingState = ({
  message = "Carregando dashboard...",
}: LoadingStateProps) => {
  return (
    <section className="state-panel" aria-live="polite" aria-busy="true">
      <div className="loading-spinner" aria-hidden="true" />
      <p className="state-panel__title">{message}</p>
      <p className="state-panel__description">
        Buscando métricas e monitores na API.
      </p>
    </section>
  );
};

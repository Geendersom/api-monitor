type EmptyStateProps = {
  onRetry?: () => void;
};

export const EmptyState = ({ onRetry }: EmptyStateProps) => {
  return (
    <section className="state-panel state-panel--empty">
      <p className="state-panel__title">Nenhum dado disponível ainda</p>
      <p className="state-panel__description">
        A API está respondendo, mas ainda não há monitores ou alertas
        registrados. Crie monitores pela API para começar a acompanhar o
        sistema.
      </p>
      {onRetry ? (
        <button
          type="button"
          className="button button--secondary"
          onClick={onRetry}
        >
          Atualizar
        </button>
      ) : null}
    </section>
  );
};

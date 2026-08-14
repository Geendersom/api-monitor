type EmptyStateProps = {
  onRetry?: () => void;
};

export const EmptyState = ({ onRetry }: EmptyStateProps) => {
  return (
    <section className="state-panel state-panel--empty">
      <div
        className="state-panel__icon state-panel__icon--empty"
        aria-hidden="true"
      >
        ○
      </div>
      <p className="state-panel__title">Dashboard vazia</p>
      <p className="state-panel__description">
        A API respondeu, mas ainda não há monitores ou alertas registrados.
        Cadastre monitores para começar o acompanhamento.
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

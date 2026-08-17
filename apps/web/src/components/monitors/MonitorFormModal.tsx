import { type FormEvent, useEffect, useState } from "react";

import type { CreateMonitorInput } from "../../types/api.js";
import { Modal } from "../ui/Modal.js";

type MonitorFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: CreateMonitorInput;
  error?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMonitorInput) => void;
};

const emptyValues: CreateMonitorInput = {
  name: "",
  url: "",
};

export const MonitorFormModal = ({
  open,
  mode,
  initialValues,
  error,
  submitting = false,
  onClose,
  onSubmit,
}: MonitorFormModalProps) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialValues?.name ?? "");
    setUrl(initialValues?.url ?? "");
  }, [open, initialValues?.name, initialValues?.url]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ name, url });
  };

  const title = mode === "create" ? "Adicionar API" : "Editar API";
  const subtitle =
    mode === "create"
      ? "Cadastre uma nova API para monitoramento."
      : "Atualize o nome ou a URL da API monitorada.";

  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="button button--secondary button--compact"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="monitor-form"
            className="button button--primary button--compact"
            disabled={submitting}
          >
            {submitting
              ? "Salvando..."
              : mode === "create"
                ? "Adicionar"
                : "Salvar"}
          </button>
        </>
      }
    >
      <form id="monitor-form" className="monitor-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nome</span>
          <input
            className="field__input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: API de Produção"
            autoComplete="off"
            required
          />
        </label>

        <label className="field field--wide">
          <span className="field__label">URL</span>
          <input
            className="field__input"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.exemplo.com/health"
            autoComplete="off"
            required
          />
        </label>

        {error ? (
          <p className="monitor-form__error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
};

export { emptyValues as emptyMonitorFormValues };

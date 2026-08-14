import type { CheckResult } from "../../types/api.js";
import {
  formatDateTime,
  formatMilliseconds,
} from "../../services/formatters.js";
import { StatusIndicator } from "./StatusIndicator.js";

type CheckHistoryPanelProps = {
  checks: CheckResult[];
};

export const CheckHistoryPanel = ({ checks }: CheckHistoryPanelProps) => {
  return (
    <section className="panel" aria-labelledby="checks-title">
      <div className="panel__header">
        <div>
          <h2 id="checks-title" className="panel__title">
            Histórico de checks
          </h2>
          <p className="panel__subtitle">Registros mais recentes primeiro</p>
        </div>
        <span className="panel__count">{checks.length}</span>
      </div>

      {checks.length === 0 ? (
        <p className="panel__empty">Este monitor ainda não possui histórico.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Horário</th>
                <th scope="col">Resposta</th>
                <th scope="col">HTTP</th>
                <th scope="col">Erro</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr
                  key={check.id}
                  className={
                    check.status === "down" ? "data-table__row--down" : ""
                  }
                >
                  <td>
                    <StatusIndicator status={check.status} />
                  </td>
                  <td>
                    <time dateTime={check.checkedAt}>
                      {formatDateTime(check.checkedAt)}
                    </time>
                  </td>
                  <td>{formatMilliseconds(check.responseTimeMs)}</td>
                  <td className="data-table__muted">
                    {check.statusCode ?? "—"}
                  </td>
                  <td className="data-table__muted">{check.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

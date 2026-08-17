import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { isAuthenticated, setAuthenticated } from "../auth/session.js";

type LoginLocationState = {
  from?: string;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LoginLocationState | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }

    setSubmitting(true);

    setAuthenticated();
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-page__backdrop" aria-hidden="true" />

      <svg className="login-page__svg-defs" aria-hidden="true">
        <filter id="liquid-glass-distortion">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurred"
            scale="95"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div className="login-card" role="dialog" aria-labelledby="login-title">
        <div className="login-card__glass-distortion" aria-hidden="true" />
        <div className="login-card__glass-tint" aria-hidden="true" />
        <div className="login-card__glass-edge" aria-hidden="true" />
        <div className="login-card__content">
          <div className="login-card__brand">
            <img
              src="/login-logo.png"
              alt=""
              className="login-card__logo"
              width={112}
              height={112}
            />
            <div>
              <h1 id="login-title" className="login-card__title">
                API Monitor
              </h1>
              <p className="login-card__subtitle">
                Entre para acessar o painel de monitoramento.
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="login-form__field">
              <span className="login-form__label">E-mail</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
              />
            </label>

            <label className="login-form__field">
              <span className="login-form__label">Senha</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
              />
            </label>

            {error ? (
              <p className="login-form__error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="login-form__submit"
              disabled={submitting}
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { isAuthenticated } from "../../auth/session.js";

type ProtectedRouteProps = {
  children: ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

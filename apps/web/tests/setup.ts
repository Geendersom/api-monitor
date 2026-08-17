import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

import { setAuthenticated } from "../src/auth/session.js";

beforeEach(() => {
  setAuthenticated();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

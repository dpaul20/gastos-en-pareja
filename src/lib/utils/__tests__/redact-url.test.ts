import { describe, expect, it } from "vitest";
import { redactUrl } from "../redact-url";

describe("redactUrl", () => {
  it("replaces the invitation token with a placeholder", () => {
    expect(redactUrl("https://gastos.app/invite/abc123secret")).toBe(
      "https://gastos.app/invite/[token]",
    );
  });

  it("drops the query string and hash", () => {
    expect(redactUrl("https://gastos.app/login?next=%2Fdashboard#top")).toBe(
      "https://gastos.app/login",
    );
  });

  it("redacts the token and drops the query together", () => {
    expect(redactUrl("https://gastos.app/invite/abc?utm=mail")).toBe(
      "https://gastos.app/invite/[token]",
    );
  });

  it("leaves other paths untouched", () => {
    expect(redactUrl("https://gastos.app/dashboard")).toBe(
      "https://gastos.app/dashboard",
    );
  });

  it("does not touch paths that only start with 'invite'", () => {
    expect(redactUrl("https://gastos.app/invites/list")).toBe(
      "https://gastos.app/invites/list",
    );
  });

  it("returns the input unchanged when it is not a valid URL", () => {
    expect(redactUrl("not a url")).toBe("not a url");
  });
});

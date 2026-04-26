"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";

export default function SettingsPage() {
  const [deivyIncome, setDeivyIncome] = useState("3210000");
  const [annieIncome, setAnnieIncome] = useState("1760000");

  const di = parseInt(deivyIncome.replace(/\D/g, "")) || 0;
  const ai = parseInt(annieIncome.replace(/\D/g, "")) || 0;
  const total = di + ai;
  const deivyPct = total ? Math.round((di / total) * 100) : 0;
  const anniePct = 100 - deivyPct;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "14px 20px",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Configuración
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Pareja */}
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
              fontFamily: "var(--font-sans)",
            }}
          >
            Pareja
          </div>
          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: 16,
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                padding: "16px",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", width: 60, height: 48 }}>
                <Avatar initials="DE" person="a" size="lg" />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 28,
                    border: "2px solid var(--bg-elevated)",
                    borderRadius: 9999,
                  }}
                >
                  <Avatar initials="AN" person="b" size="lg" />
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Deivy y Annie
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--fg-3)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Pareja activa desde ene. 2026
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  deivy@gmail.com
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                  Persona A
                </div>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--person-a)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {deivyPct}%
              </span>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  annie@gmail.com
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                  Persona B
                </div>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--person-b)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {anniePct}%
              </span>
            </div>
          </div>
        </section>

        {/* Ingresos */}
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
              fontFamily: "var(--font-sans)",
            }}
          >
            Ingresos mensuales
          </div>
          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: 16,
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {[
              {
                person: "a" as const,
                initials: "DE",
                name: "Deivy",
                value: deivyIncome,
                onChange: setDeivyIncome,
              },
              {
                person: "b" as const,
                initials: "AN",
                name: "Annie",
                value: annieIncome,
                onChange: setAnnieIncome,
              },
            ].map((p, i) => (
              <div
                key={p.name}
                style={{
                  padding: "14px 16px",
                  borderBottom:
                    i === 0 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <Avatar initials={p.initials} person={p.person} size="sm" />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color:
                        p.person === "a"
                          ? "var(--person-a)"
                          : "var(--person-b)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {p.name}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-sunken)",
                    borderRadius: 10,
                    border: "1.5px solid var(--border-default)",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      padding: "10px 6px 10px 12px",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--fg-3)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    $
                  </span>
                  <input
                    value={p.value}
                    onChange={(e) => p.onChange(e.target.value)}
                    inputMode="numeric"
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      padding: "10px 12px 10px 4px",
                      fontSize: 16,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      outline: "none",
                      color: "var(--fg-1)",
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Proporción en vivo */}
            <div
              style={{
                margin: "0 16px 16px",
                background: "var(--bg-sunken)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--person-a)",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Deivy {deivyPct}%
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--person-b)",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Annie {anniePct}%
                </span>
              </div>
              <div
                style={{
                  background: "var(--border-default)",
                  borderRadius: 99,
                  height: 6,
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${deivyPct}%`,
                    background: "var(--person-a)",
                    transition: "width 300ms",
                  }}
                />
                <div style={{ flex: 1, background: "var(--person-b)" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Cuenta */}
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
              fontFamily: "var(--font-sans)",
            }}
          >
            Cuenta
          </div>
          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: 16,
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {[
              { label: "Moneda", value: "ARS — Peso argentino" },
              { label: "Cerrar sesión", value: "" },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  padding: "14px 16px",
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid var(--border-subtle)"
                      : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color:
                      i === arr.length - 1
                        ? "var(--status-danger)"
                        : "var(--fg-1)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {row.label}
                </span>
                {row.value && (
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--fg-2)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {row.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

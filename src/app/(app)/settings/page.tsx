"use client";

import { useState, useEffect, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/shared/avatar";
import { useCoupleMember } from "@/lib/queries/use-monthly-data";
import { upsertIncome } from "@/lib/actions/expenses";
import { sendInvitation, createCouple } from "@/lib/actions/couple";
import { formatARS, getMonthDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { data: member, isLoading } = useCoupleMember();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [myIncome, setMyIncome] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (!member) return;
    // Load current month income for this user
    supabase
      .from("incomes")
      .select("amount")
      .eq("couple_id", member.couple_id)
      .eq("user_id", member.user_id)
      .eq("month", getMonthDate())
      .single()
      .then(({ data }) => {
        if (data) setMyIncome(String(data.amount));
      });
  }, [member, supabase]);

  const myPct = (() => {
    const v = parseInt(myIncome.replace(/\D/g, "")) || 0;
    return v > 0 ? `${Math.round((v / (v * 1.5)) * 100)}%` : "—";
  })();

  async function handleSaveIncome() {
    const amount = parseInt(myIncome.replace(/\D/g, ""));
    if (!amount || !member) return;
    startTransition(async () => {
      await upsertIncome(amount, getMonthDate());
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    });
  }

  async function handleCreateCouple() {
    startTransition(async () => {
      await createCouple();
      queryClient.invalidateQueries({ queryKey: ["couple-member"] });
    });
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!member || !inviteEmail) return;
    startTransition(async () => {
      try {
        await sendInvitation(member.couple_id, inviteEmail);
        setInviteMsg("Invitación enviada ✓");
        setInviteEmail("");
      } catch (err) {
        setInviteMsg(err instanceof Error ? err.message : "Error al enviar");
      }
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100%",
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: "var(--fg-3)",
            fontFamily: "var(--font-sans)",
          }}
        >
          Cargando...
        </span>
      </div>
    );
  }

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
            {!member ? (
              <div
                style={{
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--fg-2)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  No tenés una pareja configurada todavía.
                </div>
                <button
                  onClick={handleCreateCouple}
                  disabled={isPending}
                  style={{
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Crear pareja
                </button>
              </div>
            ) : (
              <>
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
                      Tu pareja
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--fg-3)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {member.couples?.status === "PENDING"
                        ? "⏳ Invitación pendiente"
                        : "✓ Activa"}
                    </div>
                  </div>
                </div>

                {member.couples?.status === "PENDING" && (
                  <div
                    style={{
                      padding: "14px 16px",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--fg-1)",
                        marginBottom: 8,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Invitar pareja
                    </div>
                    <form
                      onSubmit={handleInvite}
                      style={{ display: "flex", gap: 8 }}
                    >
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@ejemplo.com"
                        style={{
                          flex: 1,
                          border: "1.5px solid var(--border-default)",
                          borderRadius: 10,
                          padding: "10px 12px",
                          fontSize: 14,
                          fontFamily: "var(--font-sans)",
                          background: "var(--bg-elevated)",
                          color: "var(--fg-1)",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isPending || !inviteEmail}
                        style={{
                          background: "var(--accent)",
                          color: "white",
                          border: "none",
                          borderRadius: 10,
                          padding: "10px 14px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Invitar
                      </button>
                    </form>
                    {inviteMsg && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: inviteMsg.includes("✓")
                            ? "var(--status-success)"
                            : "var(--status-danger)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {inviteMsg}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Ingreso mensual */}
        {member && (
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
              Mi ingreso este mes
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
              <div style={{ padding: "14px 16px" }}>
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
                    value={myIncome}
                    onChange={(e) => setMyIncome(e.target.value)}
                    inputMode="numeric"
                    placeholder="0"
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
              <div style={{ padding: "0 16px 14px" }}>
                <button
                  onClick={handleSaveIncome}
                  disabled={isPending || !myIncome}
                  style={{
                    width: "100%",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "11px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    opacity: isPending ? 0.7 : 1,
                  }}
                >
                  {isPending ? "Guardando..." : "Guardar ingreso"}
                </button>
              </div>
            </div>
          </section>
        )}

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
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--fg-1)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Moneda
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                ARS — Peso argentino
              </span>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "14px 16px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--status-danger)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

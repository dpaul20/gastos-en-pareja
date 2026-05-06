"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/shared/avatar";
import {
  useCoupleMember,
  useCoupleMemberProfiles,
} from "@/lib/queries/use-monthly-data";
import {
  usePendingInvitation,
  useCurrentIncome,
  useMyPendingInvitations,
} from "@/lib/queries/settings";
import { upsertIncome } from "@/lib/actions/expenses";
import { sendInvitation, createCouple } from "@/lib/actions/couple";
import { getMonthDate, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NoCoupleCard } from "./_components/no-couple-card";

export default function SettingsPage() {
  const { data: member, isLoading } = useCoupleMember();
  const { data: profiles = [] } = useCoupleMemberProfiles(
    member?.user_id ?? null,
  );
  const { data: pendingInvitation } = usePendingInvitation(
    member?.couple_id ?? null,
  );
  const { data: currentIncome } = useCurrentIncome(
    member?.couple_id ?? null,
    member?.user_id ?? null,
  );
  const { data: myPendingInvitations = [] } = useMyPendingInvitations();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [coupleMsg, setCoupleMsg] = useState("");
  const [myIncome, setMyIncome] = useState("");
  const displayIncome = myIncome || String(currentIncome?.amount ?? "");

  const supabase = createClient();

  const inviteExpiresAt = pendingInvitation?.expires_at ?? null;

  async function handleSaveIncome() {
    const amount = Number.parseInt(displayIncome.replaceAll(/\D/g, ""));
    if (!amount || !member) return;
    startTransition(async () => {
      await upsertIncome(amount, getMonthDate());
      queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
    });
  }

  async function handleCreateCouple() {
    startTransition(async () => {
      try {
        setCoupleMsg("");
        await createCouple();
        queryClient.invalidateQueries({ queryKey: ["couple-member"] });
        queryClient.invalidateQueries({ queryKey: ["my-pending-invitations"] });
      } catch (err) {
        setCoupleMsg(
          err instanceof Error ? err.message : "No se pudo crear la pareja",
        );
      }
    });
  }

  async function handleInvite(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!member || !inviteEmail) return;
    startTransition(async () => {
      try {
        await sendInvitation(member.couple_id, inviteEmail);
        queryClient.invalidateQueries({
          queryKey: ["pending-invitation", member.couple_id],
        });
        queryClient.invalidateQueries({ queryKey: ["my-pending-invitations"] });
        setInviteMsg("Invitación enviada ✓");
        setInviteEmail("");
      } catch (err) {
        setInviteMsg(err instanceof Error ? err.message : "Error al enviar");
      }
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
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
    <main
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
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            margin: 0,
          }}
        >
          Configuración
        </h1>
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
            {member ? (
              <>
                <div
                  style={{
                    padding: "16px",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", flexShrink: 0 }}>
                    <Avatar
                      initials={
                        profiles[0] ? getInitials(profiles[0].full_name) : "?"
                      }
                      person="a"
                      size="lg"
                    />
                    {profiles[1] && (
                      <div
                        style={{
                          marginLeft: -12,
                          border: "2px solid var(--bg-elevated)",
                          borderRadius: 9999,
                        }}
                      >
                        <Avatar
                          initials={getInitials(profiles[1].full_name)}
                          person="b"
                          size="lg"
                        />
                      </div>
                    )}
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
                      {profiles
                        .map((p) => p.full_name.split(" ")[0])
                        .join(" y ") || "Tu pareja"}
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
                    {inviteExpiresAt &&
                    new Date(inviteExpiresAt) > new Date() ? (
                      <div
                        aria-live="polite"
                        style={{
                          background: "var(--bg-sunken)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 10,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "var(--fg-2)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        ⏳ Invitación pendiente hasta el{" "}
                        <strong>
                          {new Date(inviteExpiresAt).toLocaleDateString(
                            "es-AR",
                            {
                              day: "numeric",
                              month: "long",
                            },
                          )}
                        </strong>{" "}
                        . Vas a poder reenviar cuando expire.
                      </div>
                    ) : (
                      <>
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
                              color: "var(--accent-foreground)",
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
                            aria-live="polite"
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
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <NoCoupleCard
                onCreateCouple={handleCreateCouple}
                isPending={isPending}
                pendingInvitations={myPendingInvitations}
                coupleMessage={coupleMsg}
              />
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
                    value={displayIncome}
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
                  aria-busy={isPending}
                  style={{
                    width: "100%",
                    background: "var(--accent)",
                    color: "var(--accent-foreground)",
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
    </main>
  );
}

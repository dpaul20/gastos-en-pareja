"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PersonAvatar as Avatar } from "@/components/shared/avatar";
import {
  useCoupleMember,
  useCoupleMemberProfiles,
} from "@/lib/queries/use-monthly-data";
import {
  usePendingInvitation,
  useActiveLinkInvitation,
  useIncomeWithCarry,
  useMyPendingInvitations,
} from "@/lib/queries/settings";
import { upsertIncome } from "@/lib/actions/expenses";
import {
  sendInvitation,
  createCouple,
  createInvitationLink,
} from "@/lib/actions/couple";
import { getMonthDate, getInitials, formatARS } from "@/lib/utils";
import { parseAmount } from "@/lib/utils/amount";
import { createClient } from "@/lib/supabase/client";
import { NoCoupleCard } from "./_components/no-couple-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { data: member, isLoading } = useCoupleMember();
  const { data: profiles = [] } = useCoupleMemberProfiles(
    member?.user_id ?? null,
  );
  const { data: pendingInvitation } = usePendingInvitation(
    member?.couple_id ?? null,
  );
  const { data: activeLinkInvitation } = useActiveLinkInvitation(
    member?.couple_id ?? null,
  );
  const { data: incomeData } = useIncomeWithCarry(
    member?.couple_id ?? null,
    member?.user_id ?? null,
  );
  const currentIncome = incomeData?.current ?? null;
  const previousIncome = incomeData?.previous ?? null;
  const { data: myPendingInvitations = [] } = useMyPendingInvitations();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [coupleMsg, setCoupleMsg] = useState("");
  const [linkError, setLinkError] = useState("");
  const [copied, setCopied] = useState(false);
  const [myIncome, setMyIncome] = useState("");
  const displayIncome = myIncome || String(currentIncome?.amount ?? "");
  const parsedIncome = parseAmount(displayIncome);
  const inviteUrl = activeLinkInvitation?.token
    ? typeof window !== "undefined"
      ? `${window.location.origin}/invite/${activeLinkInvitation.token}`
      : null
    : null;
  const canShare = typeof window !== "undefined" && "share" in navigator;

  const supabase = createClient();

  const inviteExpiresAt = pendingInvitation?.expires_at ?? null;

  async function handleSaveIncome() {
    const amount = parseAmount(displayIncome);
    if (!amount || !member) return;
    startTransition(async () => {
      await upsertIncome(amount, getMonthDate());
      queryClient.invalidateQueries({ queryKey: ["income-with-carry"] });
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

  async function handleGenerateLink() {
    if (!member) return;
    setLinkError("");
    startTransition(async () => {
      try {
        const result = await createInvitationLink(member.couple_id);
        queryClient.setQueryData(["active-link-invitation", member.couple_id], {
          token: result.token,
          expires_at: result.expiresAt,
        });
      } catch (err) {
        setLinkError(
          err instanceof Error ? err.message : "Error al generar el link",
        );
      }
    });
  }

  async function handleCopyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareLink() {
    if (!inviteUrl) return;
    await navigator.share({ title: "Gastos en Pareja", url: inviteUrl });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100%" }}
      >
        <span
          className="text-sm"
          style={{ color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}
        >
          Cargando...
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: "100%", background: "var(--bg-base)" }}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "14px 20px",
        }}
      >
        <h1
          className="m-0 text-xl font-bold"
          style={{ color: "var(--fg-1)", fontFamily: "var(--font-sans)" }}
        >
          Configuración
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
        {/* Pareja */}
        <section>
          <h2
            className="mb-2 text-xs font-semibold uppercase"
            style={{
              color: "var(--fg-3)",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Pareja
          </h2>
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
                <div className="flex items-center gap-3 p-4">
                  <div className="flex shrink-0">
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
                      className="font-semibold"
                      style={{
                        fontSize: 15,
                        color: "var(--fg-1)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {profiles
                        .map((p) => p.full_name.split(" ")[0])
                        .join(" y ") || "Tu pareja"}
                    </div>
                    <div
                      className="text-xs"
                      style={{
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
                      className="mb-3 font-semibold"
                      style={{
                        fontSize: 13,
                        color: "var(--fg-1)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Invitar pareja
                    </div>

                    {/* Email invite */}
                    <div style={{ marginBottom: 12 }}>
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
                        Por email
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
                              { day: "numeric", month: "long" },
                            )}
                          </strong>
                          . Vas a poder reenviar cuando expire.
                        </div>
                      ) : (
                        <>
                          <form onSubmit={handleInvite} className="flex gap-2">
                            <Input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="email@ejemplo.com"
                              className="flex-1"
                              style={{ fontFamily: "var(--font-sans)" }}
                            />
                            <Button
                              type="submit"
                              disabled={isPending || !inviteEmail}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              Invitar
                            </Button>
                          </form>
                          {inviteMsg && (
                            <div
                              aria-live="polite"
                              className="mt-1.5 text-xs"
                              style={{
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

                    {/* Divider */}
                    <div
                      aria-hidden
                      style={{
                        height: 1,
                        background: "var(--border-subtle)",
                        margin: "12px 0",
                      }}
                    />

                    {/* Link invite */}
                    <div>
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
                        Por link
                      </div>
                      {inviteUrl ? (
                        <>
                          <div
                            className="flex gap-2"
                            style={{ marginBottom: 6 }}
                          >
                            <Input
                              readOnly
                              value={inviteUrl}
                              aria-label="Link de invitación"
                              className="flex-1 text-xs"
                              style={{
                                fontFamily: "var(--font-mono)",
                                color: "var(--fg-2)",
                                background: "var(--bg-sunken)",
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCopyLink}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {copied ? "Copiado ✓" : "Copiar"}
                            </Button>
                            {canShare && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleShareLink}
                                aria-label="Compartir link"
                              >
                                ↗
                              </Button>
                            )}
                          </div>
                          {activeLinkInvitation?.expires_at && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--fg-3)",
                                fontFamily: "var(--font-sans)",
                              }}
                            >
                              Expira el{" "}
                              {new Date(
                                activeLinkInvitation.expires_at,
                              ).toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "long",
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateLink}
                          disabled={isPending}
                          className="w-full justify-start"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {isPending
                            ? "Generando..."
                            : "Generar link de invitación"}
                        </Button>
                      )}
                      {linkError && (
                        <div
                          aria-live="polite"
                          className="mt-1.5 text-xs"
                          style={{
                            color: "var(--status-danger)",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {linkError}
                        </div>
                      )}
                    </div>
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
            <h2
              className="mb-2 text-xs font-semibold uppercase"
              style={{
                color: "var(--fg-3)",
                letterSpacing: "0.05em",
                fontFamily: "var(--font-sans)",
              }}
            >
              Mi ingreso este mes
            </h2>
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
                  className="flex items-center overflow-hidden"
                  style={{
                    background: "var(--bg-sunken)",
                    borderRadius: 10,
                    border: "1.5px solid var(--border-default)",
                  }}
                >
                  <span
                    className="text-base font-semibold"
                    style={{
                      padding: "10px 6px 10px 12px",
                      color: "var(--fg-3)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    $
                  </span>
                  <input
                    id="income-input"
                    aria-label="Mi ingreso este mes"
                    value={displayIncome}
                    onChange={(e) => setMyIncome(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="flex-1 border-none bg-transparent py-2.5 pr-3 pl-1 text-base font-semibold outline-none"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-1)",
                    }}
                  />
                </div>
              </div>
              {previousIncome !== null &&
                currentIncome === null &&
                !myIncome && (
                  <div style={{ padding: "0 16px 10px" }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMyIncome(String(previousIncome.amount))}
                      className="w-full justify-start"
                      style={{
                        color: "var(--accent)",
                        background: "var(--accent-subtle)",
                        borderColor: "var(--border-subtle)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Igual al mes pasado — {formatARS(previousIncome.amount)}
                    </Button>
                  </div>
                )}
              <div style={{ padding: "0 16px 14px" }}>
                <Button
                  onClick={handleSaveIncome}
                  disabled={isPending || !myIncome || parsedIncome <= 0}
                  aria-busy={isPending}
                  className="w-full"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {isPending ? "Guardando..." : "Guardar ingreso"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Cuenta */}
        <section>
          <h2
            className="mb-2 text-xs font-semibold uppercase"
            style={{
              color: "var(--fg-3)",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Cuenta
          </h2>
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
              className="flex justify-between"
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: "var(--fg-1)", fontFamily: "var(--font-sans)" }}
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
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start rounded-none text-sm font-medium"
              style={{
                padding: "14px 16px",
                color: "var(--status-danger)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

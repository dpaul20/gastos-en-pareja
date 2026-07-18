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
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
      <div className="flex min-h-full items-center justify-center">
        <span className="[font-family:var(--font-sans)] text-sm [color:var(--fg-3)]">
          Cargando…
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col [background-color:var(--bg-base)]">
      <div className="border-b [border-color:var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-3.5">
        <h1 className="m-0 [font-family:var(--font-sans)] text-xl font-bold [color:var(--fg-1)]">
          Configuración
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
        {/* Pareja */}
        <section>
          <h2 className="mb-2 [font-family:var(--font-sans)] text-xs font-semibold tracking-wider [color:var(--fg-3)] uppercase">
            Pareja
          </h2>
          <Card className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-subtle)] p-0 shadow-[var(--shadow-sm)]">
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
                      <div className="-ml-3 rounded-full border-2 [border-color:var(--bg-elevated)]">
                        <Avatar
                          initials={getInitials(profiles[1].full_name)}
                          person="b"
                          size="lg"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="[font-family:var(--font-sans)] text-[15px] font-semibold [color:var(--fg-1)]">
                      {profiles
                        .map((p) => p.full_name.split(" ")[0])
                        .join(" y ") || "Tu pareja"}
                    </div>
                    <div className="[font-family:var(--font-sans)] text-xs [color:var(--fg-3)]">
                      {member.couples?.status === "PENDING"
                        ? "⏳ Invitación pendiente"
                        : "✓ Activa"}
                    </div>
                  </div>
                </div>

                {member.couples?.status === "PENDING" && (
                  <div className="border-t [border-color:var(--border-subtle)] px-4 py-3.5">
                    <div className="mb-3 [font-family:var(--font-sans)] text-[13px] font-semibold [color:var(--fg-1)]">
                      Invitar pareja
                    </div>

                    {/* Email invite */}
                    <div className="mb-3">
                      <div className="mb-2 [font-family:var(--font-sans)] text-[11px] font-semibold tracking-wider [color:var(--fg-3)] uppercase">
                        Por email
                      </div>
                      {inviteExpiresAt &&
                      new Date(inviteExpiresAt) > new Date() ? (
                        <div
                          aria-live="polite"
                          className="rounded-[10px] border [border-color:var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2.5 [font-family:var(--font-sans)] text-[13px] [color:var(--fg-2)]"
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
                              className="flex-1 [font-family:var(--font-sans)]"
                            />
                            <Button
                              type="submit"
                              disabled={isPending || !inviteEmail}
                              className="whitespace-nowrap"
                            >
                              Invitar
                            </Button>
                          </form>
                          {inviteMsg && (
                            <div
                              aria-live="polite"
                              className="mt-1.5 [font-family:var(--font-sans)] text-xs"
                              style={{
                                color: inviteMsg.includes("✓")
                                  ? "var(--status-success-text)"
                                  : "var(--status-danger-text)",
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
                      className="my-3 h-px bg-[var(--border-subtle)]"
                    />

                    {/* Link invite */}
                    <div>
                      <div className="mb-2 [font-family:var(--font-sans)] text-[11px] font-semibold tracking-wider [color:var(--fg-3)] uppercase">
                        Por link
                      </div>
                      {inviteUrl ? (
                        <>
                          <div className="mb-1.5 flex gap-2">
                            <Input
                              readOnly
                              value={inviteUrl}
                              aria-label="Link de invitación"
                              className="flex-1 bg-[var(--bg-sunken)] [font-family:var(--font-mono)] text-xs [color:var(--fg-2)]"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCopyLink}
                              className="whitespace-nowrap"
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
                            <div className="[font-family:var(--font-sans)] text-[11px] [color:var(--fg-3)]">
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
                          className="w-full justify-start [font-family:var(--font-sans)]"
                        >
                          {isPending
                            ? "Generando…"
                            : "Generar link de invitación"}
                        </Button>
                      )}
                      {linkError && (
                        <div
                          aria-live="polite"
                          className="mt-1.5 [font-family:var(--font-sans)] text-xs [color:var(--status-danger-text)]"
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
          </Card>
        </section>

        {/* Ingreso mensual */}
        {member && (
          <section>
            <h2 className="mb-2 [font-family:var(--font-sans)] text-xs font-semibold tracking-wider [color:var(--fg-3)] uppercase">
              Mi ingreso este mes
            </h2>
            <Card className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-subtle)] p-0 shadow-[var(--shadow-sm)]">
              <div className="px-4 py-3.5">
                <div className="flex items-center overflow-hidden rounded-[10px] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-sunken)] focus-within:ring-2 focus-within:ring-(--accent)">
                  <span className="py-2.5 pr-1.5 pl-3 [font-family:var(--font-mono)] text-base font-semibold [color:var(--fg-3)]">
                    $
                  </span>
                  <input
                    id="income-input"
                    aria-label="Mi ingreso este mes"
                    value={displayIncome}
                    onChange={(e) => setMyIncome(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="ds-amount flex-1 border-none bg-transparent py-2.5 pr-3 pl-1 text-base font-semibold [color:var(--fg-1)] outline-none"
                  />
                </div>
              </div>
              {previousIncome !== null &&
                currentIncome === null &&
                !myIncome && (
                  <div className="px-4 pb-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMyIncome(String(previousIncome.amount))}
                      className="w-full justify-start border-[var(--border-subtle)] bg-[var(--accent-subtle)] [font-family:var(--font-sans)] [color:var(--accent)]"
                    >
                      Igual al mes pasado — {formatARS(previousIncome.amount)}
                    </Button>
                  </div>
                )}
              <div className="px-4 pb-3.5">
                <Button
                  onClick={handleSaveIncome}
                  disabled={isPending || !myIncome || parsedIncome <= 0}
                  aria-busy={isPending}
                  className="w-full [font-family:var(--font-sans)]"
                >
                  {isPending ? "Guardando…" : "Guardar ingreso"}
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* Cuenta */}
        <section>
          <h2 className="mb-2 [font-family:var(--font-sans)] text-xs font-semibold tracking-wider [color:var(--fg-3)] uppercase">
            Cuenta
          </h2>
          <Card className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-subtle)] p-0 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b [border-color:var(--border-subtle)] px-4 py-3.5">
              <span className="[font-family:var(--font-sans)] text-sm font-medium [color:var(--fg-1)]">
                Tema
              </span>
              <ModeToggle />
            </div>
            <div className="flex justify-between border-b [border-color:var(--border-subtle)] px-4 py-3.5">
              <span className="[font-family:var(--font-sans)] text-sm font-medium [color:var(--fg-1)]">
                Moneda
              </span>
              <span className="[font-family:var(--font-sans)] text-[13px] [color:var(--fg-2)]">
                ARS — Peso argentino
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start rounded-none px-4 py-3.5 [font-family:var(--font-sans)] text-sm font-medium [color:var(--status-danger-text)]"
            >
              Cerrar sesión
            </Button>
          </Card>
        </section>
      </div>
    </div>
  );
}

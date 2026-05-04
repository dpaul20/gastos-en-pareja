"use client";

import { useState, useEffect, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { FAB as Fab } from "@/components/shared/fab";
import { formatARS, getMonthDate, getInitials } from "@/lib/utils";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { CategoryPicker } from "@/components/shared/category-picker";
import {
  incrementPaidInstallments,
  toggleFixedExpenseInstance,
} from "@/lib/actions/expenses";
import { useExpenseSave, type Tab } from "@/lib/queries/use-expense-save";

type MonthlyData = NonNullable<ReturnType<typeof useMonthlyData>["data"]>;
type InstallmentPurchase = MonthlyData["installmentPurchases"][number];
type FixedExpenseInstance = MonthlyData["fixedExpenseInstances"][number];
type VariableExpense = MonthlyData["variableExpenses"][number];

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────
function CuotaItem({ c }: { readonly c: InstallmentPurchase }) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const isPaid = c.paid_installments >= c.installments;
  const cuota = Math.round(c.total_amount / c.installments);
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 14,
        padding: "14px 16px",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {c.description}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-3)",
              marginTop: 2,
              fontFamily: "var(--font-sans)",
            }}
          >
            Cuota {c.paid_installments} de {c.installments}
            {c.auto_renew ? " 🔄" : ""}
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--fg-1)",
            }}
          >
            {formatARS(cuota)}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Badge variant={isPaid ? "success" : "warning"}>
              {isPaid ? "Pagado" : "Pendiente"}
            </Badge>
            {!isPaid && (
              <button
                onClick={() =>
                  startTransition(async () => {
                    await incrementPaidInstallments(c.id);
                    queryClient.invalidateQueries({
                      queryKey: ["monthly-data"],
                    });
                  })
                }
                style={{
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 8px",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                +1
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          background: "var(--color-neutral-200)",
          borderRadius: 99,
          height: 5,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(c.paid_installments / c.installments) * 100}%`,
            height: "100%",
            background: isPaid ? "var(--status-success)" : "var(--accent)",
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  );
}

function FijoItem({
  fi,
  isLast,
}: {
  readonly fi: FixedExpenseInstance;
  readonly isLast: boolean;
}) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {fi.fixed_expense_templates.description}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            marginTop: 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          Vence día {fi.fixed_expense_templates.due_day}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--fg-1)",
          marginRight: 8,
        }}
      >
        {formatARS(fi.fixed_expense_templates.amount)}
      </div>
      <button
        onClick={() =>
          startTransition(async () => {
            await toggleFixedExpenseInstance(fi.id, !fi.paid);
            queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
          })
        }
        style={{
          width: 28,
          height: 28,
          borderRadius: 99,
          cursor: "pointer",
          background: fi.paid
            ? "var(--status-success-subtle)"
            : "var(--bg-sunken)",
          border: `2px solid ${fi.paid ? "var(--status-success)" : "var(--border-default)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {fi.paid && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--status-success)"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    </div>
  );
}

function VariableItem({
  v,
  getPersonInitials,
  getPerson,
}: {
  readonly v: VariableExpense;
  readonly getPersonInitials: (userId: string) => string;
  readonly getPerson: (userId: string) => "a" | "b";
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 14,
        padding: "14px 16px",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Avatar
        initials={getPersonInitials(v.user_id)}
        person={getPerson(v.user_id)}
        size="md"
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {v.description}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-3)",
            marginTop: 2,
            fontFamily: "var(--font-sans)",
          }}
        >
          {v.date}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--fg-1)",
        }}
      >
        {formatARS(v.amount)}
      </div>
    </div>
  );
}

function SegmentedControl({
  active,
  onChange,
}: {
  readonly active: Tab;
  readonly onChange: (t: Tab) => void;
}) {
  return (
    <div
      style={{
        padding: "10px 16px",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          background: "var(--bg-sunken)",
          borderRadius: 10,
          padding: 3,
          display: "flex",
          gap: 2,
        }}
      >
        {(["cuotas", "fijos", "variables"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: active === t ? "var(--bg-elevated)" : "transparent",
              color: active === t ? "var(--accent)" : "var(--fg-2)",
              fontWeight: active === t ? 600 : 500,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              boxShadow: active === t ? "var(--shadow-sm)" : "none",
              transition: "all 150ms",
              textTransform: "capitalize",
              minHeight: 36,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddSheet({
  tab,
  categories,
  onClose,
  onSave,
}: {
  readonly tab: Tab;
  readonly categories: ReturnType<typeof useCategories>["data"];
  readonly onClose: () => void;
  readonly onSave: (
    data: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
  ) => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);

  // Close on Escape — <dialog open> (not showModal) doesn't handle it natively
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const fieldDefs: Record<
    Tab,
    Array<{ key: string; label: string; inputMode?: string }>
  > = {
    cuotas: [
      { key: "description", label: "Descripción" },
      { key: "total_amount", label: "Monto total", inputMode: "numeric" },
      { key: "installments", label: "Cuotas", inputMode: "numeric" },
      { key: "first_payment_date", label: "Primer pago (AAAA-MM-DD)" },
    ],
    fijos: [
      { key: "description", label: "Descripción" },
      { key: "amount", label: "Monto", inputMode: "numeric" },
      {
        key: "due_day",
        label: "Día de vencimiento (1-31)",
        inputMode: "numeric",
      },
    ],
    variables: [
      { key: "description", label: "Descripción" },
      { key: "amount", label: "Monto", inputMode: "numeric" },
      { key: "date", label: "Fecha (AAAA-MM-DD)" },
    ],
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg-overlay)",
          zIndex: 200,
        }}
        onClick={onClose}
      />
      {/* Sheet */}
      {/* biome-ignore lint/a11y/noNoninteractiveEventListener: <dialog> is a native interactive element */}
      <dialog
        open
        aria-label="Agregar gasto"
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--bg-elevated)",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 390,
          margin: 0,
          padding: "20px 20px 40px",
          border: "none",
          zIndex: 201,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 99,
            background: "var(--border-default)",
            margin: "0 auto 20px",
          }}
        />
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            marginBottom: 16,
            textTransform: "capitalize",
          }}
        >
          Nuevo gasto — {tab}
        </div>
        {fieldDefs[tab].map((f) => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--fg-2)",
                marginBottom: 5,
                fontFamily: "var(--font-sans)",
              }}
            >
              {f.label}
            </div>
            <input
              aria-label={f.label}
              value={fields[f.key] ?? ""}
              onChange={(e) =>
                setFields((p) => ({ ...p, [f.key]: e.target.value }))
              }
              inputMode={
                (f.inputMode as React.HTMLAttributes<HTMLInputElement>["inputMode"]) ??
                "text"
              }
              style={{
                width: "100%",
                border: "1.5px solid var(--border-default)",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 15,
                fontFamily:
                  f.inputMode === "numeric"
                    ? "var(--font-mono)"
                    : "var(--font-sans)",
                outline: "none",
                background: "var(--bg-elevated)",
                color: "var(--fg-1)",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        {categories && categories.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--fg-2)",
                marginBottom: 8,
                fontFamily: "var(--font-sans)",
              }}
            >
              Categoría
            </div>
            <CategoryPicker
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
        )}
        {tab === "cuotas" && (
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--fg-2)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Renovar automáticamente
            </span>
            <button
              type="button"
              onClick={() => setAutoRenew((a) => !a)}
              style={{
                width: 44,
                height: 26,
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                background: autoRenew
                  ? "var(--accent)"
                  : "var(--border-default)",
                transition: "background 150ms",
                position: "relative",
              }}
              aria-label="Auto-renovar"
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 99,
                  background: "white",
                  position: "absolute",
                  top: 3,
                  left: autoRenew ? 21 : 3,
                  transition: "left 150ms",
                }}
              />
            </button>
          </div>
        )}
        <button
          onClick={() => onSave(fields, categoryId, autoRenew)}
          style={{
            width: "100%",
            background: "var(--accent)",
            border: "none",
            borderRadius: 12,
            padding: "15px",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          Guardar
        </button>
      </dialog>
    </>
  );
}

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("cuotas");
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const { save } = useExpenseSave(tab);

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setFilterCategory(null);
  }

  const { data: member } = useCoupleMember();
  const coupleId = member?.couple_id ?? null;
  const month = getMonthDate();
  const { data } = useMonthlyData(coupleId, month);
  const { data: profiles = [] } = useCoupleMemberProfiles(
    member?.user_id ?? null,
  );
  const { data: categories = [] } = useCategories(coupleId);

  const getPersonInitials = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p ? getInitials(p.full_name) : "?";
  };
  const getPerson = (userId: string): "a" | "b" =>
    userId === member?.user_id ? "a" : "b";

  function handleSave(
    fields: Record<string, string>,
    categoryId: string | null,
    autoRenew: boolean,
  ) {
    setShowForm(false);
    save(fields, categoryId, autoRenew);
  }

  const allCuotas = data?.installmentPurchases ?? [];
  const allFijos = data?.fixedExpenseInstances ?? [];
  const allVariables = data?.variableExpenses ?? [];

  const cuotas = filterCategory
    ? allCuotas.filter((c) => c.category_id === filterCategory)
    : allCuotas;
  const fijos = filterCategory
    ? allFijos.filter(
        (fi) => fi.fixed_expense_templates?.category_id === filterCategory,
      )
    : allFijos;
  const variables = filterCategory
    ? allVariables.filter((v) => v.category_id === filterCategory)
    : allVariables;

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
          paddingTop: 14,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            padding: "0 20px 10px",
            margin: 0,
          }}
        >
          Gastos
        </h1>
        <SegmentedControl active={tab} onChange={handleTabChange} />
        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              padding: "8px 16px 10px",
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setFilterCategory(null)}
              style={{
                flexShrink: 0,
                padding: "4px 12px",
                borderRadius: 20,
                border: "1px solid var(--border-subtle)",
                background:
                  filterCategory === null
                    ? "var(--accent)"
                    : "var(--bg-sunken)",
                color: filterCategory === null ? "#fff" : "var(--fg-2)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
              }}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setFilterCategory(filterCategory === cat.id ? null : cat.id)
                }
                style={{
                  flexShrink: 0,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "1px solid var(--border-subtle)",
                  background:
                    filterCategory === cat.id
                      ? "var(--accent)"
                      : "var(--bg-sunken)",
                  color: filterCategory === cat.id ? "#fff" : "var(--fg-2)",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* CUOTAS */}
        {tab === "cuotas" && (
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {cuotas.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                }}
              >
                Sin compras en cuotas. Usá el + para agregar.
              </div>
            )}
            {cuotas.map((c) => (
              <CuotaItem key={c.id} c={c} />
            ))}
          </div>
        )}

        {/* FIJOS */}
        {tab === "fijos" && (
          <div style={{ padding: "12px 16px" }}>
            {fijos.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                }}
              >
                Sin gastos fijos. Usá el + para agregar.
              </div>
            )}
            {fijos.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    background: "var(--bg-elevated)",
                    borderRadius: 14,
                    border: "1px solid var(--border-subtle)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {fijos.map((fi, i) => (
                    <FijoItem
                      key={fi.id}
                      fi={fi}
                      isLast={i === fijos.length - 1}
                    />
                  ))}
                </div>
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--fg-2)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Total fijos
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--fg-1)",
                    }}
                  >
                    {formatARS(
                      fijos.reduce(
                        (s, fi) => s + fi.fixed_expense_templates.amount,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* VARIABLES */}
        {tab === "variables" && (
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {variables.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                }}
              >
                Sin gastos variables. Usá el + para agregar.
              </div>
            )}
            {variables.map((v) => (
              <VariableItem
                key={v.id}
                v={v}
                getPersonInitials={getPersonInitials}
                getPerson={getPerson}
              />
            ))}
          </div>
        )}
      </div>

      <Fab onClick={() => setShowForm(true)} label="Agregar gasto" />
      {showForm && (
        <AddSheet
          tab={tab}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </main>
  );
}

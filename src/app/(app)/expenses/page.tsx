"use client";

import { useState } from "react";
import { FAB as Fab } from "@/components/shared/fab";
import { formatARS, getMonthDate, getInitials } from "@/lib/utils";
import {
  useCoupleMember,
  useMonthlyData,
  useCoupleMemberProfiles,
  useCategories,
} from "@/lib/queries/use-monthly-data";
import { useExpenseSave, type Tab } from "@/lib/queries/use-expense-save";
import { CuotaItem } from "./_components/cuota-item";
import { FijoItem } from "./_components/fijo-item";
import { VariableItem } from "./_components/variable-item";
import { SegmentedControl } from "./_components/segmented-control";
import { AddSheet } from "./_components/add-sheet";

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

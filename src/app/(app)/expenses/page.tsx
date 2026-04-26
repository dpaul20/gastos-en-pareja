"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { FAB } from "@/components/shared/fab";
import { formatARS } from "@/lib/utils";

// TODO: replace with real data (issue #4)
const mockCuotas: Array<{
  id: string;
  name: string;
  cuota: number;
  paid: number;
  total: number;
  status: "pending" | "paid";
}> = [
  {
    id: "1",
    name: "Aire Acondicionado",
    cuota: 55000,
    paid: 19,
    total: 24,
    status: "pending",
  },
  {
    id: "2",
    name: "Ventiladores",
    cuota: 55608,
    paid: 3,
    total: 9,
    status: "pending",
  },
];

const mockFijos = [
  { id: "1", name: "Casita", amt: 500000, due: "9 abr.", paid: true },
  {
    id: "2",
    name: "EPEC — Electricidad",
    amt: 68740,
    due: "31 mar.",
    paid: true,
  },
  { id: "3", name: "Aguas Cordobesas", amt: 26910, due: "9 abr.", paid: true },
  { id: "4", name: "Cable", amt: 38877, due: "13 abr.", paid: true },
  { id: "5", name: "Expensas", amt: 26292, due: "10 abr.", paid: true },
  { id: "6", name: "Naranja X", amt: 152266, due: "10 abr.", paid: true },
  { id: "7", name: "Claro", amt: 9115, due: "1 abr.", paid: true },
];

const mockVariables = [
  {
    id: "1",
    name: "Supermercado",
    amt: 8450,
    person: "b" as const,
    date: "22 abr.",
  },
  {
    id: "2",
    name: "YPF — Nafta",
    amt: 12000,
    person: "a" as const,
    date: "18 abr.",
  },
  {
    id: "3",
    name: "Farmacia",
    amt: 3200,
    person: "a" as const,
    date: "20 abr.",
  },
  {
    id: "4",
    name: "Restaurante",
    amt: 6800,
    person: "b" as const,
    date: "15 abr.",
  },
];

type Tab = "cuotas" | "fijos" | "variables";

function SegmentedControl({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
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

function CuotasList() {
  return (
    <div
      style={{
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {mockCuotas.map((c) => (
        <div
          key={c.id}
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
                {c.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-3)",
                  marginTop: 2,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Cuota {c.paid} de {c.total}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                  marginBottom: 4,
                }}
              >
                {formatARS(c.cuota)}
              </div>
              <Badge variant={c.status === "paid" ? "success" : "warning"}>
                {c.status === "paid" ? "Pagado" : "Pendiente"}
              </Badge>
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
                width: `${(c.paid / c.total) * 100}%`,
                height: "100%",
                background:
                  c.status === "paid"
                    ? "var(--status-success)"
                    : "var(--accent)",
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FijosList() {
  const total = mockFijos.reduce((s, f) => s + f.amt, 0);
  return (
    <div style={{ padding: "12px 16px" }}>
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
        {mockFijos.map((f, i) => (
          <div
            key={f.id}
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom:
                i < mockFijos.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
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
                {f.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-3)",
                  marginTop: 1,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Vence {f.due}
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
              {formatARS(f.amt)}
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 99,
                background: f.paid
                  ? "var(--status-success-subtle)"
                  : "var(--bg-sunken)",
                border: `2px solid ${f.paid ? "var(--status-success)" : "var(--border-default)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {f.paid && (
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
            </div>
          </div>
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
          {formatARS(total)}
        </span>
      </div>
    </div>
  );
}

function VariablesList() {
  return (
    <div
      style={{
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {mockVariables.map((v) => (
        <div
          key={v.id}
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
            initials={v.person === "a" ? "DE" : "AN"}
            person={v.person}
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
              {v.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-3)",
                marginTop: 2,
                fontFamily: "var(--font-sans)",
              }}
            >
              {v.person === "a" ? "Deivy" : "Annie"} · {v.date}
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
            {formatARS(v.amt)}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg-overlay)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 390,
          margin: "0 auto",
          padding: "20px 20px 40px",
        }}
        onClick={(e) => e.stopPropagation()}
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
          }}
        >
          Nuevo gasto
        </div>
        {["Descripción", "Monto"].map((label) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--fg-2)",
                marginBottom: 5,
                fontFamily: "var(--font-sans)",
              }}
            >
              {label}
            </div>
            <input
              placeholder={label === "Monto" ? "$0" : ""}
              inputMode={label === "Monto" ? "numeric" : "text"}
              style={{
                width: "100%",
                border: "1.5px solid var(--border-default)",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 15,
                fontFamily:
                  label === "Monto" ? "var(--font-mono)" : "var(--font-sans)",
                outline: "none",
                background: "var(--bg-elevated)",
                color: "var(--fg-1)",
              }}
            />
          </div>
        ))}
        <button
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
          onClick={onClose}
        >
          Guardar gasto
        </button>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("cuotas");
  const [showForm, setShowForm] = useState(false);

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
          paddingTop: 14,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
            padding: "0 20px 10px",
          }}
        >
          Gastos
        </div>
        <SegmentedControl active={tab} onChange={setTab} />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "cuotas" && <CuotasList />}
        {tab === "fijos" && <FijosList />}
        {tab === "variables" && <VariablesList />}
      </div>
      <FAB onClick={() => setShowForm(true)} label="Agregar gasto" />
      {showForm && <AddExpenseSheet onClose={() => setShowForm(false)} />}
    </div>
  );
}

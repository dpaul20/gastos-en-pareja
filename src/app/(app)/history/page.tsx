"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { formatARS } from "@/lib/utils";

// TODO: replace with real data (issue #4)
const mockMonths = [
  {
    label: "Marzo 2026",
    isoMonth: "2026-03-01",
    total: 98400,
    balance: 22100,
    debtor: "Annie",
    creditor: "Deivy",
    deivyPct: 65,
  },
  {
    label: "Febrero 2026",
    isoMonth: "2026-02-01",
    total: 115200,
    balance: 8600,
    debtor: "Deivy",
    creditor: "Annie",
    deivyPct: 65,
  },
  {
    label: "Enero 2026",
    isoMonth: "2026-01-01",
    total: 88750,
    balance: 19300,
    debtor: "Annie",
    creditor: "Deivy",
    deivyPct: 65,
  },
  {
    label: "Diciembre 2025",
    isoMonth: "2025-12-01",
    total: 132000,
    balance: 44100,
    debtor: "Annie",
    creditor: "Deivy",
    deivyPct: 65,
  },
];

function MonthDetail({
  m,
  onBack,
}: {
  m: (typeof mockMonths)[0];
  onBack: () => void;
}) {
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
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            minWidth: 44,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--fg-2)"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--fg-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {m.label}
        </span>
        <Badge variant="neutral">Solo lectura</Badge>
      </div>
      <div
        style={{
          flex: 1,
          padding: "16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: 16,
            padding: "18px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
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
            Balance del mes
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 32,
              fontWeight: 700,
              color: "var(--status-danger)",
              letterSpacing: "-0.02em",
            }}
          >
            {formatARS(m.balance)}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--fg-2)",
              marginTop: 4,
              fontFamily: "var(--font-sans)",
            }}
          >
            {m.debtor} le debía a {m.creditor}
          </div>
          <div
            style={{
              marginTop: 14,
              background: "var(--color-neutral-200)",
              borderRadius: 99,
              height: 6,
              display: "flex",
              overflow: "hidden",
            }}
          >
            <div
              style={{ width: `${m.deivyPct}%`, background: "var(--person-a)" }}
            />
            <div style={{ flex: 1, background: "var(--person-b)" }} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--person-a)",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
              }}
            >
              Deivy {m.deivyPct}%
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--person-b)",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
              }}
            >
              Annie {100 - m.deivyPct}%
            </span>
          </div>
        </div>
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: 16,
            padding: "18px",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Total del mes
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--fg-1)",
            }}
          >
            {formatARS(m.total)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [selected, setSelected] = useState<number | null>(null);

  if (selected !== null) {
    return (
      <MonthDetail m={mockMonths[selected]} onBack={() => setSelected(null)} />
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
          Historial
        </div>
      </div>
      <div
        style={{
          flex: 1,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {mockMonths.map((m, i) => (
          <button
            key={m.isoMonth}
            onClick={() => setSelected(i)}
            style={{
              background: "var(--bg-elevated)",
              borderRadius: 14,
              padding: "16px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {m.label}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--fg-3)"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {m.debtor} → {m.creditor}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--status-danger)",
                }}
              >
                {formatARS(m.balance)}
              </span>
            </div>
            <div
              style={{
                background: "var(--color-neutral-200)",
                borderRadius: 99,
                height: 4,
                display: "flex",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${m.deivyPct}%`,
                  background: "var(--person-a)",
                }}
              />
              <div style={{ flex: 1, background: "var(--person-b)" }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 5,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Total: {formatARS(m.total)}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                DE {m.deivyPct}% · AN {100 - m.deivyPct}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

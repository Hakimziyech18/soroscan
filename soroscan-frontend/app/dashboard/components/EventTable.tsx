"use client";

import { useState } from "react";
import { formatDateTime, shortHash } from "@/components/ingest/formatters";
import type { EventRecord } from "@/components/ingest/types";
import styles from "@/components/ingest/ingest-terminal.module.css";

interface EventTableProps {
  events: EventRecord[];
  loading: boolean;
  onEventClick: (event: EventRecord) => void;
  eventTags: Record<string, string[]>;
  tagSuggestions: string[];
  onAddTag: (eventId: string, tag: string) => void;
  onRemoveTag: (eventId: string, tag: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  showTags?: boolean;
}

export function EventTable({
  events,
  loading,
  onEventClick,
  eventTags = {},
  tagSuggestions = [],
  onAddTag = () => {},
  onRemoveTag = () => {},
  hasActiveFilters,
  onClearFilters,
  showTags = false,
}: EventTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getEventTypeColor = (eventType: string): string => {
    const hash = eventType
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "rgba(0, 255, 156, 0.8)",
      "rgba(0, 212, 255, 0.8)",
      "rgba(255, 170, 0, 0.8)",
      "rgba(255, 102, 255, 0.8)",
    ];
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className={styles.tableWrap}>
        <table className={styles.eventTable}>
          <thead>
            <tr>
              <th>Contract</th>
              <th>Type</th>
              <th>Ledger</th>
              <th>Time</th>
              <th>Transaction</th>
              {showTags && <th>Tags</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={`skeleton-${index}`}>
                <td data-label="Contract">
                  <div className={styles.skeleton} style={{ width: "120px", height: "20px" }} />
                </td>
                <td data-label="Type">
                  <div className={styles.skeleton} style={{ width: "80px", height: "24px", borderRadius: "12px" }} />
                </td>
                <td data-label="Ledger">
                  <div className={styles.skeleton} style={{ width: "60px", height: "24px" }} />
                </td>
                <td data-label="Time">
                  <div className={styles.skeleton} style={{ width: "140px", height: "20px" }} />
                </td>
                <td data-label="Tx">
                  <div className={styles.skeleton} style={{ width: "100px", height: "20px" }} />
                </td>
                {showTags && (
                  <td data-label="Tags">
                    <div className={styles.skeleton} style={{ width: "120px", height: "24px" }} />
                  </td>
                )}
                <td data-label="Actions">
                  <div className={styles.skeleton} style={{ width: "50px", height: "28px" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className={styles.tableWrap}>
        <div className={styles.emptyTable}>
          No events found. Select a contract and adjust filters to view events.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <style>
        {`
          .soroscan-events-card-grid {
            display: none;
          }

          .soroscan-event-card {
            width: 100%;
            text-align: left;
            background: rgba(13, 21, 34, 0.92);
            border: 1px solid rgba(0, 212, 255, 0.25);
            border-radius: 10px;
            padding: 1rem;
            color: #d6f7ff;
            cursor: pointer;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          }

          .soroscan-event-card:hover,
          .soroscan-event-card:focus {
            outline: none;
            border-color: rgba(0, 212, 255, 0.75);
            box-shadow: 0 0 18px rgba(0, 212, 255, 0.18);
            transform: translateY(-1px);
          }

          .soroscan-event-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 0.85rem;
          }

          .soroscan-event-card-title {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }

          .soroscan-event-card-label {
            font-size: 0.7rem;
            color: #7ba8b5;
            text-transform: uppercase;
            letter-spacing: 0.05rem;
          }

          .soroscan-event-card-grid-inner {
            display: grid;
            gap: 0.75rem;
          }

          .soroscan-event-card-row {
            display: flex;
            justify-content: space-between;
            gap: 0.75rem;
            border-top: 1px solid rgba(123, 168, 181, 0.14);
            padding-top: 0.65rem;
          }

          .soroscan-event-card-value {
            color: #d6f7ff;
            text-align: right;
            word-break: break-word;
          }

          .soroscan-event-card-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;
          }

          @media (max-width: 768px) {
            .soroscan-events-table {
              display: none;
            }

            .soroscan-events-card-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 0.9rem;
            }
          }
        `}
      </style>

      <table className={`${styles.eventTable} soroscan-events-table`}>
        <thead>
          <tr>
            <th>Contract</th>
            <th>Type</th>
            <th>Ledger</th>
            <th>Time</th>
            <th>Transaction</th>
            {showTags && <th>Tags</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => onEventClick(event)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 15px ${getEventTypeColor(event.eventType)}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <td data-label="Contract">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <code>{shortHash(event.contractId)}</code>
                  <button
                    type="button"
                    className={styles.btn}
                    style={{
                      padding: "0.2rem 0.4rem",
                      fontSize: "0.7rem",
                      minWidth: "auto",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(
                        event.contractId,
                        `contract-${event.id}`,
                      );
                    }}
                    title="Copy contract ID"
                  >
                    {copiedId === `contract-${event.id}` ? "✓" : "📋"}
                  </button>
                </div>
              </td>
              <td data-label="Type">
                <span
                  className={styles.pill}
                  style={{
                    borderColor: getEventTypeColor(event.eventType),
                    backgroundColor: `${getEventTypeColor(event.eventType)}15`,
                    color: getEventTypeColor(event.eventType),
                  }}
                >
                  {event.eventType}
                </span>
              </td>
              <td data-label="Ledger">{event.ledger}</td>
              <td data-label="Time">{formatDateTime(event.timestamp)}</td>
              <td data-label="Tx">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <code>{shortHash(event.txHash)}</code>
                  <button
                    type="button"
                    className={styles.btn}
                    style={{
                      padding: "0.2rem 0.4rem",
                      fontSize: "0.7rem",
                      minWidth: "auto",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(event.txHash, `tx-${event.id}`);
                    }}
                    title="Copy transaction hash"
                  >
                    {copiedId === `tx-${event.id}` ? "✓" : "📋"}
                  </button>
                </div>
              </td>
              <td data-label="Actions">
                <button
                  type="button"
                  className={styles.btn}
                  style={{
                    padding: "0.3rem 0.6rem",
                    fontSize: "0.75rem",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="soroscan-events-card-grid" data-testid="events-card-grid">
        {events.map((event) => (
          <article key={event.id} className="soroscan-event-card">
            <div className="soroscan-event-card-header">
              <div className="soroscan-event-card-title">
                <span className="soroscan-event-card-label">Event Type</span>
                <span
                  className={styles.pill}
                  style={{
                    borderColor: getEventTypeColor(event.eventType),
                    backgroundColor: `${getEventTypeColor(event.eventType)}15`,
                    color: getEventTypeColor(event.eventType),
                  }}
                >
                  {event.eventType}
                </span>
              </div>
              <button
                type="button"
                className={styles.btn}
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                onClick={() => onEventClick(event)}
              >
                View
              </button>
            </div>

            <div className="soroscan-event-card-grid-inner">
              <div className="soroscan-event-card-row">
                <span className="soroscan-event-card-label">Contract</span>
                <span className="soroscan-event-card-value">
                  <code>{shortHash(event.contractId)}</code>
                </span>
              </div>

              <div className="soroscan-event-card-row">
                <span className="soroscan-event-card-label">Ledger</span>
                <span className="soroscan-event-card-value">
                  {event.ledger}
                </span>
              </div>

              <div className="soroscan-event-card-row">
                <span className="soroscan-event-card-label">Time</span>
                <span className="soroscan-event-card-value">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>

              <div className="soroscan-event-card-row">
                <span className="soroscan-event-card-label">Transaction</span>
                <span className="soroscan-event-card-value">
                  <code>{shortHash(event.txHash)}</code>
                </span>
              </div>
            </div>

            <div className="soroscan-event-card-actions">
              <button
                type="button"
                className={styles.btn}
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                onClick={() => onEventClick(event)}
              >
                View details
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

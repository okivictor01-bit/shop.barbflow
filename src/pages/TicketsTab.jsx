import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

const ACTIVE_STATUSES = ["submitted", "approved", "customer_confirmed", "shop_confirmed"];

export default function TicketsTab({ shop }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadTickets = useCallback(async () => {
    const statuses = showHistory
      ? ["released", "refunded", "disputed"]
      : ACTIVE_STATUSES;

    const { data, error } = await supabase
      .from("tickets")
      .select("*, services(name), users:customer_id(full_name, phone)")
      .eq("shop_id", shop.id)
      .in("status", statuses)
      .order("created_at", { ascending: false });

    if (error) console.error("Failed to load tickets:", error);
    setTickets(data ?? []);
    setLoading(false);
  }, [shop.id, showHistory]);

  useEffect(() => {
    loadTickets();

    const channel = supabase
      .channel(`shop-tickets-${shop.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `shop_id=eq.${shop.id}` },
        () => loadTickets()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadTickets, shop.id]);

  async function runAction(ticketId, rpcName) {
    setActioningId(ticketId);
    setActionError(null);
    const { error } = await supabase.rpc(rpcName, { p_ticket_id: ticketId });
    setActioningId(null);
    if (error) {
      setActionError(error.message ?? "Action failed. Try again.");
      return;
    }
    loadTickets();
  }

  if (loading) {
    return <p style={{ color: "var(--parchment-200)", opacity: 0.6 }}>Loading tickets…</p>;
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">{showHistory ? "History" : "Active tickets"}</h2>
        <button className="btn btn-ghost" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "Back to active" : "View history"}
        </button>
      </div>

      {actionError && <p className="error-text">{actionError}</p>}

      {tickets.length === 0 ? (
        <div className="empty-state">
          <h3>{showHistory ? "No completed tickets yet" : "No active tickets"}</h3>
          <p>
            {showHistory
              ? "Released, refunded, and disputed tickets will show up here."
              : "When a customer arrives and submits a ticket, it'll appear here for you to approve."}
          </p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <TicketStub
            key={ticket.id}
            ticket={ticket}
            busy={actioningId === ticket.id}
            onApprove={() => runAction(ticket.id, "approve_ticket")}
            onReject={() => runAction(ticket.id, "reject_ticket")}
            onConfirm={() => runAction(ticket.id, "confirm_ticket")}
          />
        ))
      )}
    </div>
  );
}

function TicketStub({ ticket, busy, onApprove, onReject, onConfirm }) {
  const shortId = ticket.id.slice(0, 8);
  const customerName = ticket.users?.full_name || "Customer";
  const serviceName = ticket.services?.name || "Service";

  return (
    <div className="ticket-stub">
      <div className="ticket-stub-side">
        <span className={`status-pill status-${statusPillClass(ticket.status)}`}>
          {formatStatus(ticket.status)}
        </span>
        <span className="ticket-stub-id">#{shortId}</span>
      </div>
      <div className="ticket-stub-body">
        <div className="ticket-info">
          <h4>{serviceName}</h4>
          <div className="ticket-meta">
            {customerName} · {ticket.users?.phone || "no phone on file"}
          </div>
        </div>
        <div className="ticket-amount">₦{Number(ticket.amount).toLocaleString()}</div>
        <div className="ticket-actions">
          {ticket.status === "submitted" && (
            <>
              <button className="btn btn-primary" disabled={busy} onClick={onApprove}>
                Approve
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={onReject}>
                Reject
              </button>
            </>
          )}
          {(ticket.status === "approved" ||
            ticket.status === "customer_confirmed" ||
            ticket.status === "shop_confirmed") &&
            !ticket.shop_confirmed_at && (
              <button className="btn btn-primary" disabled={busy} onClick={onConfirm}>
                Mark service complete
              </button>
            )}
          {ticket.shop_confirmed_at && ticket.status !== "released" && (
            <span className="ticket-meta">Waiting on customer to confirm</span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatStatus(status) {
  return status.replace(/_/g, " ");
}

function statusPillClass(status) {
  if (["released"].includes(status)) return "active";
  if (["refunded", "disputed"].includes(status)) return "suspended";
  return "pending";
}

import { fireEvent, render, screen } from "@testing-library/react";

import { EventTable } from "@/app/dashboard/components/EventTable";
import type { EventRecord } from "@/components/ingest/types";

const mockEvents: EventRecord[] = [
  {
    id: "event-1",
    contractId: "contract-1234567890abcdef",
    contractName: "Test Contract",
    eventType: "transfer",
    ledger: 12345,
    eventIndex: 1,
    timestamp: "2026-05-29T10:00:00.000Z",
    txHash: "tx-1234567890abcdef",
    payload: { amount: "100" },
    payloadHash: "payload-123",
    schemaVersion: "1.0",
    validationStatus: "valid",
  },
];

describe("EventTable responsive card grid", () => {
  it("renders the mobile card grid container", () => {
    render(
      <EventTable
        events={mockEvents}
        loading={false}
        onEventClick={jest.fn()}
      />,
    );

    expect(screen.getByTestId("events-card-grid")).toBeInTheDocument();
  });

  it("shows event information inside the mobile cards", () => {
    render(
      <EventTable
        events={mockEvents}
        loading={false}
        onEventClick={jest.fn()}
      />,
    );

    expect(screen.getAllByText("transfer").length).toBeGreaterThan(0);

    expect(screen.getAllByText("12345").length).toBeGreaterThan(0);

    expect(screen.getAllByText(/contract\.\.\.abcdef/i).length).toBeGreaterThan(
      0,
    );

    expect(screen.getAllByText(/tx-12345\.\.\.abcdef/i).length).toBeGreaterThan(
      0,
    );
  });

  it("calls onEventClick when card detail button is clicked", () => {
    const onEventClick = jest.fn();

    render(
      <EventTable
        events={mockEvents}
        loading={false}
        onEventClick={onEventClick}
      />,
    );

    fireEvent.click(screen.getAllByText(/View/i)[1]);

    expect(onEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it("shows loading state", () => {
    render(<EventTable events={[]} loading={true} onEventClick={jest.fn()} />);

    expect(screen.getByText("Loading events...")).toBeInTheDocument();
  });

  it("shows empty state when no events are available", () => {
    render(<EventTable events={[]} loading={false} onEventClick={jest.fn()} />);

    expect(screen.getByText(/No events found/i)).toBeInTheDocument();
  });
});

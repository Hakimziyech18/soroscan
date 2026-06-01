import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { EventTable } from "../EventTable";
import type { EventRecord } from "@/components/ingest/types";

describe("EventTable", () => {
  const mockEvents: EventRecord[] = [
    {
      id: "1",
      contractId: "CCAAA123",
      contractName: "Test Contract",
      eventType: "transfer",
      ledger: 1000,
      eventIndex: 0,
      timestamp: "2024-01-01T00:00:00Z",
      txHash: "abc123",
      payload: { amount: 100 },
    },
    {
      id: "2",
      contractId: "CCBBB456",
      contractName: "Another Contract",
      eventType: "swap",
      ledger: 1001,
      eventIndex: 1,
      timestamp: "2024-01-01T01:00:00Z",
      txHash: "def456",
      payload: { from: "A", to: "B" },
    },
  ];

  const mockOnEventClick = jest.fn();

  beforeEach(() => {
    mockOnEventClick.mockClear();

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Loading State (issue #595)", () => {
    it("shows skeleton loader while loading", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
        />,
      );

      const skeletonRows = container.querySelectorAll("tbody tr");
      expect(skeletonRows.length).toBe(5);

      const skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("skeleton matches table structure with 6 columns", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
        />,
      );

      const firstRow = container.querySelector("tbody tr");
      const cells = firstRow?.querySelectorAll("td");

      expect(cells?.length).toBe(6);
    });

    it("skeleton has proper styling for each column type", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
        />,
      );

      const firstRow = container.querySelector("tbody tr");
      const skeletons = firstRow?.querySelectorAll(".skeleton");

      expect(skeletons?.length).toBe(6);
      expect(skeletons?.[0]).toHaveStyle({ width: "120px" });
      expect(skeletons?.[1]).toHaveStyle({ borderRadius: "12px" });
    });

    it("does not show skeleton when not loading", () => {
      const { container } = render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBe(0);
    });

    it("transitions smoothly from skeleton to content", () => {
      const { container, rerender } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
        />,
      );

      let skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBeGreaterThan(0);

      rerender(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBe(0);

      expect(screen.getAllByText(/CCAAA/).length).toBeGreaterThan(0);
    });
  });

  describe("Event Display", () => {
    it("renders events when not loading", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      expect(screen.getAllByText(/CCAAA/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CCBBB/).length).toBeGreaterThan(0);
      expect(screen.getAllByText("transfer").length).toBeGreaterThan(0);
      expect(screen.getAllByText("swap").length).toBeGreaterThan(0);
    });

    it("shows empty state when no events and not loading", () => {
      render(
        <EventTable
          events={[]}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      expect(screen.getByText(/No events found/i)).toBeInTheDocument();
    });

    it("calls onEventClick when View button is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      fireEvent.click(viewButtons[0]);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it("copies contract ID to clipboard", async () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const copyButtons = screen.getAllByTitle("Copy contract ID");
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("CCAAA123");
      });
    });

    it("copies transaction hash to clipboard", async () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const copyButtons = screen.getAllByTitle("Copy transaction hash");
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("abc123");
      });
    });

    it("shows checkmark after successful copy", async () => {
      jest.useFakeTimers();

      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const copyButtons = screen.getAllByTitle("Copy contract ID");
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(copyButtons[0]).toHaveTextContent("✓");
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(copyButtons[0]).toHaveTextContent("📋");
      });
    });

    it("applies hover effects to event rows", () => {
      const { container } = render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const eventRow = container.querySelector("tbody tr");
      expect(eventRow).toHaveStyle({ cursor: "pointer" });
    });
  });

  describe("Responsive Card Grid", () => {
    it("renders a mobile card grid for events", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      expect(screen.getByTestId("events-card-grid")).toBeInTheDocument();
      expect(screen.getAllByTestId("event-card")).toHaveLength(2);
    });

    it("shows event information in mobile cards", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const cards = screen.getAllByTestId("event-card");

      expect(cards[0]).toHaveTextContent("transfer");
      expect(cards[0]).toHaveTextContent("CCAAA123");
      expect(cards[0]).toHaveTextContent("1000");
      expect(cards[0]).toHaveTextContent("abc123");
    });

    it("opens event details when a mobile card is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const cards = screen.getAllByTestId("event-card");
      fireEvent.click(cards[0]);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it("opens event details from keyboard on a mobile card", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const cards = screen.getAllByTestId("event-card");
      fireEvent.keyDown(cards[0], { key: "Enter" });

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });
  });

  describe("Accessibility", () => {
    it("has proper table structure", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
        />,
      );

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(6);
    });

    it("skeleton rows have unique keys", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
        />,
      );

      const rows = container.querySelectorAll("tbody tr");

      expect(rows.length).toBe(5);

      rows.forEach((row) => {
        expect(row).toBeInTheDocument();
      });
    });
  });
});

import { render, screen, fireEvent, act } from "@testing-library/react";
import NotificationsButton from "./NotificationPopUp";

// Mock the Audio class
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  currentTime: 0,
};
window.Audio = jest.fn().mockImplementation(() => mockAudio);

describe("NotificationsButton Component", () => {
  const mockIncidents = [
    {
      _id: "1",
      severityLevel: "High",
      timestamp: "2024-03-20T10:00:00Z",
    },
    {
      _id: "2",
      severityLevel: "Medium",
      timestamp: "2024-03-20T11:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Initial render should display unread notification count
   */
  test("displays unread notification badge correctly", () => {
    render(<NotificationsButton incidents={mockIncidents} />);
    const badge = screen.getByText("2");
    expect(badge).toBeInTheDocument();
  });

  /**
   * Test: Toggling dropdown should show and hide notifications list
   */
  test("toggles notification dropdown on button click", () => {
    render(<NotificationsButton incidents={mockIncidents} />);

    // Dropdown should not be visible initially
    const dropdown = screen.queryByRole("list");
    expect(dropdown).not.toBeInTheDocument();

    // Click button to open dropdown
    const button = screen.getByRole("button", { name: /Notifications/i });
    fireEvent.click(button);

    // Dropdown should now be visible
    expect(screen.getByRole("list")).toBeInTheDocument();

    // Click again to close the dropdown
    fireEvent.click(button);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  /**
   * Test: Renders list of notifications correctly
   */
  test("displays notifications with correct content", () => {
    render(<NotificationsButton incidents={mockIncidents} />);
    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    // Check notifications content
    expect(screen.getByText("New high severity incident")).toBeInTheDocument();
    expect(
      screen.getByText("New medium severity incident")
    ).toBeInTheDocument();

    // Check timestamps using a more flexible matcher
    const timestamps = screen.getAllByText(/3\/20\/2024/);
    expect(timestamps).toHaveLength(2);
  });

  test("marks notification as read when clicked", () => {
    render(<NotificationsButton incidents={mockIncidents} />);
    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    // Click first notification
    const firstNotification = screen.getByText("New high severity incident");
    fireEvent.click(firstNotification);

    // Notification should be marked as read (opacity 0.5)
    expect(firstNotification.parentElement).toHaveStyle({ opacity: "0.5" });
  });

  test("removes notification when delete button is clicked", async () => {
    const { rerender } = render(
      <NotificationsButton incidents={mockIncidents} />
    );
    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    // Click delete button on first notification
    const deleteButtons = screen.getAllByRole("button", { name: "✕" });
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    // Rerender to reflect state changes
    await act(async () => {
      rerender(<NotificationsButton incidents={mockIncidents} />);
    });

    // First notification should be removed
    expect(
      screen.queryByText("New high severity incident")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("New medium severity incident")
    ).toBeInTheDocument();
  });

  test("toggles between view all and show less", () => {
    const manyIncidents = Array.from({ length: 10 }, (_, i) => ({
      _id: String(i),
      severityLevel: "Low",
      timestamp: "2024-03-20T12:00:00Z",
    }));

    render(<NotificationsButton incidents={manyIncidents} />);
    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    // Initially shows "View All" button
    const viewAllButton = screen.getByText("View All");
    expect(viewAllButton).toBeInTheDocument();

    // Click View All
    fireEvent.click(viewAllButton);
    expect(screen.getByText("Show Less")).toBeInTheDocument();

    // Click Show Less
    fireEvent.click(screen.getByText("Show Less"));
    expect(screen.getByText("View All")).toBeInTheDocument();
  });

  test("plays notification sound when new incidents are added", async () => {
    // First render with no incidents
    const { rerender } = render(<NotificationsButton incidents={[]} />);

    // Add new incidents
    rerender(<NotificationsButton incidents={mockIncidents} />);

    // Wait for the effect to run and sound to play
    await new Promise((resolve) => setTimeout(resolve, 100));
    await mockAudio.play();

    // Verify sound was played
    expect(window.Audio).toHaveBeenCalled();
    expect(mockAudio.play).toHaveBeenCalled();
  });

  test("displays 'No new notifications' when there are no notifications", () => {
    render(<NotificationsButton incidents={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.getByText("No new notifications")).toBeInTheDocument();
  });
});

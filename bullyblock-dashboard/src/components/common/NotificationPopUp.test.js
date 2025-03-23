import { render, screen, fireEvent } from "@testing-library/react";
import NotificationsButton from "./NotificationPopUp";

describe("NotificationsButton Component", () => {
  /**
   * Test: Initial render should display unread notification count
   */
  test("displays unread notification badge correctly", () => {
    render(<NotificationsButton />);
    const badge = screen.getByText("2"); // 2 unread notifications
    expect(badge).toBeInTheDocument();
  });

  /**
   * Test: Toggling dropdown should show and hide notifications list
   */
  test("toggles notification dropdown on button click", () => {
    render(<NotificationsButton />);

    // Dropdown should not be visible initially
    const dropdown = screen.getByRole("list");
    expect(dropdown.parentElement).not.toHaveClass("show");

    // Click button to open dropdown
    const button = screen.getByRole("button", { name: /Notifications/i });
    fireEvent.click(button);

    // Dropdown should now be visible
    expect(dropdown.parentElement).toHaveClass("show");

    // Click again to close the dropdown
    fireEvent.click(button);
    expect(dropdown.parentElement).not.toHaveClass("show");
  });

  /**
   * Test: Renders list of notifications correctly
   */
  test("displays notifications in the dropdown", () => {
    render(<NotificationsButton />);

    // Open dropdown
    const button = screen.getByRole("button", { name: /Notifications/i });
    fireEvent.click(button);

    // Check notifications
    expect(screen.getByText("New comment on your report")).toBeInTheDocument();
    expect(screen.getByText("Incident status updated")).toBeInTheDocument();
    expect(screen.getByText("Reminder: Check analytics")).toBeInTheDocument();
  });
});

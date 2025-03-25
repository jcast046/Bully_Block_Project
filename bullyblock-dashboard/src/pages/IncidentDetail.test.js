import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import axios from "axios";
import IncidentDetail from "./IncidentDetail";

jest.mock("axios");
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: () => ({ id: "123" }),
  useNavigate: () => jest.fn(),
}));

/**
 * Tests to verify the correct rendering and behavior of the page
 * when fetching incident data from the API, handling status changes, and dealing with errors.
 */
describe("IncidentDetail Page", () => {
  const mockIncident = {
    _id: "123",
    contentId: "content123",
    userId: "user123",
    severityLevel: "high",
    status: "pending review",
    fullContent: "This is the full incident content.",
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => "fake-token");
  });

  /**
   * Test to verify that the loading message is displayed
   * while the incident data is being fetched.
   */
  test("displays loading message while fetching incident", () => {
    // Mock axios to delay response
    axios.get = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(
      <MemoryRouter>
        <IncidentDetail />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading incident.../i)).toBeInTheDocument();
  });

  /**
   * Test to verify that the incident data is displayed correctly
   * once the data has been successfully fetched.
   */
  test("displays incident data when API call succeeds", async () => {
    // Use mockImplementation instead of mockResolvedValue
    axios.get = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ data: mockIncident }));

    await act(async () => {
      render(
        <MemoryRouter>
          <IncidentDetail />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Incident Details")).toBeInTheDocument();
      expect(screen.getByText("content123")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
    });
  });

  /**
   * Test to verify that an error message is displayed
   * when the API call to fetch incident data fails.
   */
  test("displays error message when failed to fetch incident", async () => {
    // Use mockImplementation instead of mockRejectedValue
    axios.get = jest
      .fn()
      .mockImplementation(() =>
        Promise.reject(new Error("Failed to load incident data."))
      );

    await act(async () => {
      render(
        <MemoryRouter>
          <IncidentDetail />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load incident data.")
      ).toBeInTheDocument();
    });
  });

  /**
   * Test to verify that the status change button works correctly,
   * sending a PUT request to update the incident status.
   */
  test("handles status change button click", async () => {
    // First set up the get request to load the incident
    axios.get = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ data: mockIncident }));
    // Then set up the put request for the status change
    axios.put = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ data: { ...mockIncident, status: "resolved" } })
      );

    await act(async () => {
      render(
        <MemoryRouter>
          <IncidentDetail />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Mark as Resolved")).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText("Mark as Resolved").click();
    });

    expect(axios.put).toHaveBeenCalledWith(
      "http://localhost:3001/api/incidents/123",
      { status: "resolved" },
      { headers: { Authorization: "Bearer fake-token" } }
    );
  });
});

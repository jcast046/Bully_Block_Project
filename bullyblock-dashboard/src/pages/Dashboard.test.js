import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import axios from "axios";
import Dashboard from "./Dashboard";
import { AuthContext } from "../AuthContext";

jest.mock("axios");

describe("Dashboard Page", () => {
  const mockUser = {
    username: "testuser",
  };

  /**
   * Test to verify that the loading message is displayed while fetching incident count.
   */
  test("displays loading message while fetching incident count", async () => {
    axios.get.mockResolvedValueOnce({ data: { count: 10 } });

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Get all elements with "Loading..." text
    const loadingElements = screen.getAllByText(/Loading.../i);
    // Verify there are exactly 2 loading elements (one for each widget)
    expect(loadingElements).toHaveLength(2);

    // Verify the Incidents widget shows loading
    expect(screen.getByText("Incidents")).toBeInTheDocument();
    expect(screen.getByText("View Incidents")).toBeInTheDocument();
  });

  /**
   * Test to verify that incident count is displayed correctly once fetched.
   */
  test("displays incident count correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: { count: 10 } });

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Incidents")).toBeInTheDocument();
    });
  });

  /**
   * Test to verify that an error message is logged if the API call fails.
   */
  test("handles API errors gracefully", async () => {
    console.error = jest.fn();
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch data"));

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching incidents:",
        expect.any(Error)
      );
    });
  });

  /**
   * Test to verify that "Loading..." is displayed when incident count is null.
   */
  test('displays "Loading..." when incident count is null', async () => {
    axios.get.mockResolvedValueOnce({ data: { count: null } });

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Get all elements with "Loading..." text
    const loadingElements = screen.getAllByText(/Loading.../i);
    // Verify there are exactly 2 loading elements (one for each widget)
    expect(loadingElements).toHaveLength(2);

    // Verify the Incidents widget shows loading
    expect(screen.getByText("Incidents")).toBeInTheDocument();
    expect(screen.getByText("View Incidents")).toBeInTheDocument();
  });

  test("displays analytics data correctly", async () => {
    const mockIncidents = Array(10).fill({
      contentId: "1",
      severityLevel: "high",
      username: "John Doe",
      timestamp: new Date().toISOString(),
    });
    const mockDates = [{ date: "2025-01-01", incidents: 5 }];

    axios.get.mockImplementation((url) => {
      if (url.includes("/incidents")) {
        return Promise.resolve({ data: mockIncidents });
      } else if (url.includes("/dates-bullying")) {
        return Promise.resolve({ data: mockDates });
      }
      return Promise.resolve({ data: { count: 10 } });
    });

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Most Incidents: John Doe")).toBeInTheDocument();
    });
  });
});

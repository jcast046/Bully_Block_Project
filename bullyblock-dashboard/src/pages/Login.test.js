import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "./Login";
import { AuthContext } from "../AuthContext";
import { MemoryRouter } from "react-router";
import axios from "axios";

// Mock navigate function and mock useNavigate.
const mockNavigate = jest.fn();
jest.mock("react-router", () => {
  const actual = jest.requireActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock axios
jest.mock("axios");

// Render login
function loginRender(loginMock) {
  return (
    <MemoryRouter>
      <AuthContext.Provider value={{ login: loginMock }}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Login Component", () => {
  let loginMock;
  beforeEach(() => {
    loginMock = jest.fn();
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    localStorage.clear();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("renders login form correctly", () => {
    render(loginRender(loginMock));

    // Check for welcome text, email and password inputs, and both buttons
    expect(screen.getByText(/Welcome to BullyBlock/i)).toBeInTheDocument();
    // getByLabelText is used to find the label associated with the input
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register/i })
    ).toBeInTheDocument();
  });

  test("toggles password visibility when clicking the toggle icon", () => {
    // Render component and capture the container for querying the icon.
    const { container } = render(loginRender(loginMock));

    // Get the password input using its label
    const passwordInput = screen.getByLabelText(/Password/i);
    // Initial input type should be "password"
    expect(passwordInput).toHaveAttribute("type", "password");
    // Query for toggle icon by class name
    const toggleIcon = container.querySelector(".password-toggle-icon");
    expect(toggleIcon).toBeInTheDocument();

    // Click the toggle icon to toggle password visibility
    fireEvent.click(toggleIcon);

    // After clicking, the input's type should switch to "text"
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("initial input values are empty and no error is shown", () => {
    render(loginRender(loginMock));

    // Check that the input fields are empty and no error message is displayed
    expect(screen.getByLabelText(/Email/i)).toHaveValue("");
    expect(screen.getByLabelText(/Password/i)).toHaveValue("");
    expect(screen.queryByText(/Login failed/i)).not.toBeInTheDocument();
  });

  test("form submission calls preventDefault", () => {
    render(loginRender(loginMock));

    const preventDefaultSpy = jest.spyOn(Event.prototype, "preventDefault");

    // Find the form and simulate submission with a custom event object
    const form = screen.getByTestId("login-form");
    fireEvent.submit(form);

    expect(preventDefaultSpy).toHaveBeenCalled();

    // Cleanup the spy
    preventDefaultSpy.mockRestore();
  });

  test('displays default error message "Login failed" when error.response is undefined', async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    render(loginRender(loginMock));

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    const LoginButton = screen.getByRole("button", { name: /Login/i });
    fireEvent.click(LoginButton);

    // Wait for the async error handling to complete
    expect(await screen.findByText(/Login failed/i)).toBeInTheDocument();
  });

  test("successful login submits form and navigates to dashboard", async () => {
    // Set up axios.post to resolve with a fake response
    const fakeResponse = {
      data: {
        token: "fake-jwt-token",
        user: { id: "1", name: "John Doe" },
      },
    };
    axios.post.mockResolvedValueOnce(fakeResponse);

    render(loginRender(loginMock));

    // Fill out email and password fields
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const loginButton = screen.getByRole("button", { name: /Login/i });
    fireEvent.click(loginButton);

    // Wait for the axios call and subsequent async actions
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:3001/api/users/login",
        { email: "test@example.com", password: "password123" },
        { headers: { "content-Type": "application/json" } }
      );
    });

    // Wait for the login function to be called with the correct data
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        ...fakeResponse.data.user,
        token: fakeResponse.data.token,
      });
    });

    // Verify that navigate was called with '/dashboard'
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("failed login displays error message", async () => {
    // Simulate an axios error with a response containing an error message
    const errorMessage = "Invalid credentials";
    axios.post.mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });

    render(loginRender(loginMock));

    // Fill in email and password fields with incorrect values
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    // Submit the form
    const loginButton = screen.getByRole("button", { name: /Login/i });
    fireEvent.click(loginButton);

    // Wait for the axios post to be attempted
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    // The error message should now appear on the screen
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  test("clicking the Register button navigates to the registration page", () => {
    render(loginRender(loginMock));

    // Find and click the Register button
    const registerButton = screen.getByRole("button", { name: /Register/i });
    fireEvent.click(registerButton);

    // Verify that the navigate function was called with '/register'
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });
});

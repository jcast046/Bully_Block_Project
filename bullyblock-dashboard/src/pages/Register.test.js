import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router';
import Register from './Register';

// Mock axios
jest.mock('axios');

// Mock the alert function
const mockAlert = jest.fn();
global.alert = mockAlert;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockNavigate,
}));

/**
 * Tests to verify the correct rendering and behavior of the component
 * when handling user input, form submission, and navigation.
 */
describe('Register Component', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        mockNavigate.mockClear();
        mockAlert.mockClear();
    });

    /**
     * Test to verify that the form renders correctly with all input fields and button.
     */
    test('renders Register component correctly', () => {
        render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        // Check if form elements are present
        expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
        expect(screen.getByText(/return to login/i)).toBeInTheDocument();
    });

    /**
     * Test to verify that the form inputs update the state correctly when changed.
     */
    test('updates form state when inputs change', () => {
        render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        // Get form inputs
        const roleSelect = screen.getByLabelText(/role/i);
        const usernameInput = screen.getByLabelText(/username/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        // Simulate user input
        fireEvent.change(roleSelect, { target: { name: 'role', value: 'teacher' } });
        fireEvent.change(usernameInput, { target: { name: 'username', value: 'testuser' } });
        fireEvent.change(emailInput, { target: { name: 'email', value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { name: 'password', value: 'testPassword' } });

        // Check if inputs have correct values
        expect(roleSelect.value).toBe('teacher');
        expect(usernameInput.value).toBe('testuser');
        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('testPassword');
    });

    /**
     * Test to verify that the form submission triggers the API call and redirects on success.
     */
    test('handles form submission successfully', async () => {
        // Mock successful API response
        axios.post.mockResolvedValueOnce({
            data: { message: 'User registered successfully' }
        });

        render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        // Fill out the form
        fireEvent.change(screen.getByLabelText(/role/i), { target: { name: 'role', value: 'admin' } });
        fireEvent.change(screen.getByLabelText(/username/i), { target: { name: 'username', value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { name: 'email', value: 'testuser@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { name: 'password', value: 'password' } });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        // Wait for axios to be called
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
        });

        // Check that axios was called with the correct arguments
        expect(axios.post).toHaveBeenCalledWith(
            'http://localhost:3001/api/users/register', // API endpoint
            {
                role: 'admin',
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password'
            },
            { headers: { "Content-Type": "application/json" } } // Headers
        );

        // Wait for the success message alert
        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalledWith('User registered successfully');
        });

        // Verify navigation was called to '/login'
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    /**
     * Test to verify that the form submission displays an error message on failure.
     */
    test('handles form submission failure with specific error message', async () => {
        // Mock API error response
        const errorMessage = 'Email already in use';
        axios.post.mockRejectedValueOnce({
            response: {
                data: {
                    message: errorMessage
                }
            }
        });

        render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        // Fill out the form
        fireEvent.change(screen.getByLabelText(/role/i), { target: { name: 'role', value: 'teacher' } });
        fireEvent.change(screen.getByLabelText(/username/i), { target: { name: 'username', value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { name: 'email', value: 'testuser@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { name: 'password', value: 'password' } });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        // Verify API call was made
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
        });

        // Verify the alert was shown with specific error message
        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalledWith(errorMessage);
        });
    });

    /**
     * Test to verify that the form submission displays a generic error message when no specific message is returned.
     */
    test('handles form submission failure with generic error', async () => {
        // Mock API error with no specific message
        axios.post.mockRejectedValueOnce({});

        render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        // Fill out the form
        fireEvent.change(screen.getByLabelText(/role/i), { target: { name: 'role', value: 'admin' } });
        fireEvent.change(screen.getByLabelText(/username/i), { target: { name: 'username', value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { name: 'email', value: 'testuser@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { name: 'password', value: 'password' } });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        // Verify API call was made
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
        });

        // Verify some alert was shown, without checking the exact message
        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalled();
        });
    });
});
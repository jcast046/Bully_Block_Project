import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
import { MemoryRouter } from 'react-router'; // For Link components
import { AuthContext } from '../../AuthContext';

describe('Navbar Component', () => {
    
    test('renders the Navbar with logo', () => {
        render(
            <MemoryRouter>
                <AuthContext.Provider value={{ isAuthenticated: false }}>
                    <Navbar />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const logoElement = screen.getByAltText(/BullyBlock Logo/i);
        expect(logoElement).toBeInTheDocument();
    });

    test('does not show navigation links when not authenticated', () => {
        render(
            <MemoryRouter>
                <AuthContext.Provider value={{ isAuthenticated: false }}>
                    <Navbar />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(screen.queryByText(/Home/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Incidents/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Analytics/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
    });

    test('shows navigation links when authenticated', () => {
        render(
            <MemoryRouter>
                <AuthContext.Provider value={{ isAuthenticated: true }}>
                    <Navbar />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(screen.getByText(/Home/i)).toBeInTheDocument();
        expect(screen.getByText(/Incidents/i)).toBeInTheDocument();
        expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
        expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    test('calls logout function when clicking logout button', () => {
        const mockLogout = jest.fn();
        render(
            <MemoryRouter>
                <AuthContext.Provider value={{ isAuthenticated: true, logout: mockLogout }}>
                    <Navbar />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const logoutButton = screen.getByText(/Logout/i);
        fireEvent.click(logoutButton); // Simulate clicking logout

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    test('toggles the menu when clicking the menu button', () => {
        // Simulate a small screen width
        window.innerWidth = 500;
        window.dispatchEvent(new Event('resize'));

        const { container } = render(
            <MemoryRouter>
                <AuthContext.Provider value={{ isAuthenticated: true }}>
                    <Navbar />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        // Select the menu toggle by class name
        const menuButton = container.querySelector('.menu-toggle');
        expect(menuButton).toBeInTheDocument();

        // Check that menu is initially closed
        const navLinks = container.querySelector('.nav-links');
        expect(navLinks).toHaveClass('close');

        fireEvent.click(menuButton); // Simulate user clicking the menu button

        expect(navLinks).toHaveClass('open');
    });
});


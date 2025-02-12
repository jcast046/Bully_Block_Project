import { render, screen, fireEvent } from '@testing-library/react';
import DashboardWidget from './DashboardWidget';
import { MemoryRouter } from 'react-router';

describe('DashboardWidget Component', () => {
    const defaultProps = {
        title: "Incidents",
        value: "5",
        description: "View",
        link: "/incidents",
        icon: "fas fa-exclamation-circle",
        color: "#ad7f2a"
    };

    test('renders widget with correct title, value, and description', () => {
        render(
            <MemoryRouter>
                <DashboardWidget {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Incidents/i)).toBeInTheDocument();
        expect(screen.getByText(/5/i)).toBeInTheDocument();
        expect(screen.getByText(/View/i)).toBeInTheDocument();
    });

    test('applies correct border color', () => {
        render(
            <MemoryRouter>
                <DashboardWidget {...defaultProps} />
            </MemoryRouter>
        );

        const widget = screen.getByTestId('dashboard-widget');
        const style = getComputedStyle(widget);
        expect(style.borderLeftColor).toBe(defaultProps.color);
    });

});
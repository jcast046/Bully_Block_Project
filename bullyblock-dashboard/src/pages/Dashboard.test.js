import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import axios from 'axios';
import Dashboard from './Dashboard';
import { AuthContext } from '../AuthContext';

jest.mock('axios');

describe('Dashboard Page', () => {
    const mockUser = {
        username: 'testuser'
    };

    /**
     * Test to verify that the loading message is displayed while fetching incident count.
     */
    test('displays loading message while fetching incident count', async () => {
        axios.get.mockResolvedValueOnce({ data: { count: 10 } }); 

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    }); 

    /**
     * Test to verify that incident count is displayed correctly once fetched.
     */
    test('displays incident count correctly', async () => {
        axios.get.mockResolvedValueOnce({ data: { count: 10 } });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        await waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('Incidents')).toBeInTheDocument();
        });
    }); 

    /**
     * Test to verify that an error message is logged if the API call fails.
     */
    test('handles API errors gracefully', async () => {
        console.error = jest.fn(); 
        axios.get.mockRejectedValueOnce(new Error('Failed to fetch data'));

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <MemoryRouter>
                    <Dashboard />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching incidents:',
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

        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });
});

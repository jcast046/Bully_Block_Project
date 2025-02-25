import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import axios from 'axios';
import Incidents from './Incidents';

jest.mock('axios');

/**
 * Tests to verify the correct rendering and behavior of the page
 * when fetching incident data from the API.
 */
describe('Incidents Page', () => {
    const mockIncidents = [
        {
            _id: '1',
            contentId: 'content1',
            userId: { username: 'user1' },
            severityLevel: 'high',
            status: 'pending review',
            contentSummary: 'Incident summary 1',
            timestamp: new Date().toISOString()
        },
        {
            _id: '2',
            contentId: 'content2',
            userId: { username: 'user2' },
            severityLevel: 'low',
            status: 'resolved',
            contentSummary: 'Incident summary 2',
            timestamp: new Date().toISOString()
        }
    ];

    /**
     * Test to verify that the loading message is displayed
     * while the incidents data is being fetched.
     */
    test('displays loading message while fetching incidents', () => {
        render(
            <MemoryRouter>
                <Incidents />
            </MemoryRouter>
        );
        expect(screen.getByText(/Loading incidents.../i)).toBeInTheDocument();
    });

    /**
     * Test to verify that the incidents data is displayed correctly
     * once the data has been successfully fetched.
     */
    test('displays incidents data', async () => {
        axios.get.mockResolvedValue({ data: mockIncidents });

        render(
            <MemoryRouter>
                <Incidents />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Incident Reports')).toBeInTheDocument();
            expect(screen.getByText('content1')).toBeInTheDocument();
            expect(screen.getByText('user1')).toBeInTheDocument();
            expect(screen.getByText('High')).toBeInTheDocument();
        });
    });

    /**
     * Test to verify that an error message is displayed
     * when the API call to fetch incidents data fails.
     */
    test('displays error message when failed to fetch incidents', async () => {
        axios.get.mockRejectedValue(new Error('Failed to load incident data.'));

        render(
            <MemoryRouter>
                <Incidents />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Failed to load incident data.')).toBeInTheDocument();
        });
    });

    /**
     * Test to verify that a message indicating no incidents found
     * is displayed when the incidents data array is empty.
     */
    test('displays no incidents message when array is empty', async () => {
        axios.get.mockResolvedValue({ data: [] });

        render(
            <MemoryRouter>
                <Incidents />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('No incidents found.')).toBeInTheDocument();
        });
    });

    /**
     * Test to verify that the page handles missing data correctly,
     * such as missing userId and contentSummary fields.
     */
    test('handles missing data correctly', async () => {
        const incompleteData = [
            {
                _id: '3',
                contentId: 'content3',
                userId: null,
                severityLevel: 'medium',
                status: 'active',
                contentSummary: null,
                timestamp: new Date().toISOString()
            }
        ];

        axios.get.mockResolvedValue({ data: incompleteData });

        render(
            <MemoryRouter>
                <Incidents />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Unknown')).toBeInTheDocument();
            expect(screen.getByText('TBD')).toBeInTheDocument();
        });
    });
});

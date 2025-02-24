import { render, screen, waitFor } from '@testing-library/react';
import Analytics from './Analytics';

// Mocking fetch globally
global.fetch = jest.fn();

describe('Analytics Page', () => {
    const mockAnalyticsData = {
        frequentBullies: [
            { name: "John Doe", incidents: 15 },
            { name: "Jane Smith", incidents: 12 },
            { name: "Mike Johnson", incidents: 10 }
        ],
        schoolsMostBullying: [
            { school: "Lincoln High", incidents: 30 },
            { school: "Roosevelt Academy", incidents: 25 },
            { school: "Jefferson Middle", incidents: 22 }
        ],
        datesHighestBullying: [
            { date: "2025-01-10", incidents: 10 },
            { date: "2025-02-14", incidents: 9 },
            { date: "2025-03-05", incidents: 8 }
        ]
    };

    const mockImages = [
        { img: 'http://localhost:3001/images/image1.jpg' },
        { img: 'http://localhost:3001/images/image2.jpg' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test: Display loading state initially.
     */
    test('displays loading message while fetching analytics data', () => {
        render(<Analytics />);
        expect(screen.getByText(/Loading analytics.../i)).toBeInTheDocument();
    }); 
 
    /**
     * Test: Handles image fetching errors gracefully.
     */
    test('displays error message when image fetching fails', async () => {
        console.error = jest.fn(); // Mock console.error
        fetch.mockRejectedValueOnce(new Error('Failed to fetch images'));

        render(<Analytics />);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Error fetching image:', expect.any(Error));
        });
    }); 
});

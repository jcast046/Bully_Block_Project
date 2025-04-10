/*
To run:
npm install --save-dev jest
npx jest uploadIncidents.test.js
*/

const fs = require('fs');
const path = require('path');
const uploadIncidents = require('../scripts/uploadIncidents');
const Incident = require('../models/Incident');

// Mocking
jest.mock('fs');
jest.mock('path');
jest.mock('../models/Incident');

describe('uploadIncidents', () => {
    const filePath = '/mocked/path/incident_reports.json';
    const mockIncidents = [
        { content_id: '1', incident_id: 'a1', author_id: 'u1', content_type: 'text', severity_level: 'low', status: 'open' },
        { content_id: '2', incident_id: 'a2', author_id: 'u2', content_type: 'image', severity_level: 'medium', status: 'resolved' },
        { content_id: '3', incident_id: 'a3', author_id: 'u3', content_type: 'text', severity_level: 'high', status: 'open' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        path.join.mockReturnValue(filePath);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockIncidents));

        // By default, simulate that all incidents are not matched
        Incident.updateOne.mockImplementation(({ incidentId }) => {
            return Promise.resolve({ matchedCount: 0 });
        });

        Incident.create.mockResolvedValue();
    });

    it('should upload only incidents with severity "low" or "high"', async () => {
        await uploadIncidents();

        // Medium severity should be skipped
        expect(Incident.updateOne).toHaveBeenCalledTimes(2);
        expect(Incident.create).toHaveBeenCalledTimes(2);
    });

    it('should skip incidents that already exist (matchedCount > 0)', async () => {
        // Simulate first one is duplicate
        Incident.updateOne.mockResolvedValueOnce({ matchedCount: 1 });
        Incident.updateOne.mockResolvedValueOnce({ matchedCount: 0 });

        await uploadIncidents();

        expect(Incident.create).toHaveBeenCalledTimes(1);
        expect(Incident.create).toHaveBeenCalledWith(expect.objectContaining({
            incidentId: 'a3',
        }));
    });

    it('should handle file read or parse errors gracefully', async () => {
        fs.readFileSync.mockImplementation(() => { throw new Error('File not found'); });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await uploadIncidents();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error uploading incidents:'), expect.any(Error));
    });

    it('should not insert incidents with invalid severity levels', async () => {
        await uploadIncidents();

        const insertedSeverities = Incident.create.mock.calls.map(call => call[0].severityLevel);
        expect(insertedSeverities).not.toContain('medium');
    });

    it('should log summary counts', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        await uploadIncidents();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Incident upload complete:/));
    });
});

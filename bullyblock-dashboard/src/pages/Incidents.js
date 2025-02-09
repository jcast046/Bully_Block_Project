import React, { useState, useEffect } from 'react';
import '../App.css';
import '../Incidents.css';

const Incidents = () => {
    const mockIncidents = [
        {
            contentId: 'C1',
            userId: 'U1',
            severityLevel: 'high',
            status: 'pending review',
            contentSummary: 'User reported offensive messages in group chat.',
            timestamp: new Date().toISOString(),
        },
        {
            contentId: 'C2',
            userId: 'U2',
            severityLevel: 'medium',
            status: 'resolved',
            contentSummary: 'User flagged inappropriate comments on profile.',
            timestamp: new Date().toISOString(),
        },
        {
            contentId: 'C3',
            userId: 'U3',
            severityLevel: 'low',
            status: 'pending review',
            contentSummary: 'Multiple users reported spam messages in forum.',
            timestamp: new Date().toISOString(),
        },
    ];

    const [incidents, setIncidents] = useState([]);

    useEffect(() => {
        setIncidents(mockIncidents);
    }, []);

    return (
        <div className="incidents-container">
            <h1>Incident Reports</h1>
            <table className="incidents-table">
                <thead>
                    <tr>
                        <th>Content ID</th>
                        <th>User ID</th>
                        <th>Severity Level</th>
                        <th>Alert Status</th>
                        <th>Content Summary</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {incidents.length > 0 ? incidents.map(incident => (
                        <tr key={incident.contentId} className={incident.status === 'resolved' ? 'resolved' : ''}>
                            <td>{incident.contentId}</td>
                            <td>{incident.userId}</td>
                            <td>{incident.severityLevel}</td>
                            <td>{incident.status}</td>
                            <td>{incident.contentSummary}</td>
                            <td>{new Date(incident.timestamp).toLocaleString()}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6">No incidents found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Incidents;

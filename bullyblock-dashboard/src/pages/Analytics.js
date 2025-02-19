import React, { useState, useEffect } from 'react';
import '../App.css';
import '../Analytics.css';

const Analytics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]); // Images stored in array

    useEffect(() => {
        // Mock data simulating API response
        const mockAnalyticsData = {
            frequentBullies: [
                { name: "John Doe", incidents: 15 },
                { name: "Jane Smith", incidents: 12 },
                { name: "Mike Johnson", incidents: 10 },
            ],
            schoolsMostBullying: [
                { school: "Lincoln High", incidents: 30 },
                { school: "Roosevelt Academy", incidents: 25 },
                { school: "Jefferson Middle", incidents: 22 },
            ],
            datesHighestBullying: [
                { date: "2025-01-10", incidents: 10 },
                { date: "2025-02-14", incidents: 9 },
                { date: "2025-03-05", incidents: 8 },
            ]
        };

        // Simulate loading delay
        setTimeout(() => {
            setAnalyticsData(mockAnalyticsData);
            setLoading(false);
        }, 1000);
    }, []);

            // Fetch all images in collection
            const fetchImages = async () => {
                try {
                    const response = await fetch('http://localhost:3001/images/');
                    if (response.ok) {
                        const imagesData = await response.json();
                        setImages(imagesData);
                    } else {
                        console.error('Error fetching image');
                    }
                } catch (error) {
                    console.error('Error fetching image:', error);
                }
            };

        fetchImages();

    return (
        <div className="analytics-container">
            <h1>Bullying Analytics</h1>
            {loading ? (
                <p>Loading analytics...</p>
            ) : (
                <>
                    {/* Frequent Bullies */}
                    <h2>Frequent Bullies</h2>
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Number of Incidents</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyticsData.frequentBullies.map((bully, index) => (
                                <tr key={index}>
                                    <td>{bully.name}</td>
                                    <td>{bully.incidents}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Schools with Most Bullying Incidents */}
                    <h2>Schools with Most Bullying</h2>
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>School</th>
                                <th>Number of Incidents</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyticsData.schoolsMostBullying.map((school, index) => (
                                <tr key={index}>
                                    <td>{school.school}</td>
                                    <td>{school.incidents}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Dates with Highest Bullying Rates */}
                    <h2>Dates with Highest Bullying Rates</h2>
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Number of Incidents</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyticsData.datesHighestBullying.map((date, index) => (
                                <tr key={index}>
                                    <td>{new Date(date.date).toLocaleDateString()}</td>
                                    <td>{date.incidents}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Display Images */}
                    <h2>Visualizations</h2>
                    {images.length > 0 ? (
                        <div className="image-gallery">
                            {images.map((image, index) => (
                                <img key={index} src={image.img} alt={`visualization ${index + 1}`} />
                            ))}
                        </div>
                    ) : (
                        <p>Loading image...</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Analytics;

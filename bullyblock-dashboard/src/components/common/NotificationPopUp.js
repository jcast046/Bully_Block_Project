import { useState, useEffect, useMemo, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router"; // Import react-router for routing
import { IncidentsContext } from "../../IncidentsContext"; // Access IncidentsContext for global functionality
import "./NotificationPopUp.css"; // Styling for the notification popup
import notificationSoundFile from "../../assets/sounds/bullyblock_notification_sound.mp3"; // Notification sound file

export default function NotificationsButton() {
  const { incidents: contextIncidents } = useContext(IncidentsContext); // Access incidents from context
  const [isOpen, setIsOpen] = useState(false); // Dropdown menu state
  const [viewAll, setViewAll] = useState(false); // State to toggle between view all and limited notifications
  const [notifications, setNotifications] = useState([]); // Notifications state
  const prevIncidentsRef = useRef(null); // Store previous incidents for comparison
  const initialLoadDoneRef = useRef(false); // Track whether initial load is done
  const unreadCount = notifications.filter((n) => !n.read).length; // Count unread notifications
  const navigate = useNavigate(); // Hook for navigation

  // Memoize the audio instance to play notification sounds
  const notificationSound = useMemo(() => {
    const audio = new Audio(notificationSoundFile);
    return audio;
  }, []);

  // Function to play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      notificationSound.currentTime = 0;
      notificationSound.play().catch((err) => {
        console.warn("Playback blocked by browser restrictions:", err);
      });
    } catch (err) {
      console.error("Error playing notification sound:", err);
    }
  }, [notificationSound]);

  // Compare two arrays of incidents to detect changes
  const detectChanges = useCallback((prevIncidents, currentIncidents) => {
    if (!prevIncidents) return { newPending: [], newResolved: [] };

    // Identify newly pending incidents
    const newPending = currentIncidents.filter(
      current =>
        current.status === "pending review" &&
        (!prevIncidents.some(prev => prev._id === current._id) ||
          prevIncidents.some(prev => prev._id === current._id && prev.status !== "pending review"))
    );

    // Identify newly resolved incidents
    const newResolved = currentIncidents.filter(
      current =>
        current.status === "resolved" &&
        prevIncidents.some(prev => prev._id === current._id && prev.status !== "resolved")
    );

    return { newPending, newResolved };
  }, []);

  // Handle initial load of notifications
  useEffect(() => {
    if (!Array.isArray(contextIncidents) || contextIncidents.length === 0 || initialLoadDoneRef.current) {
      return;
    }

    // Filter only pending incidents for notifications
    const pendingIncidents = contextIncidents.filter(
      incident => incident.status === "pending review"
    );

    if (pendingIncidents.length > 0) {
      // Create notifications for pending incidents
      const initialNotifications = pendingIncidents.map(incident => ({
        id: incident._id,
        incidentId: incident._id, // Store the actual incident ID for navigation
        message: `New ${incident.severityLevel?.toLowerCase() || 'unknown'} severity incident`,
        read: false,
        timestamp: new Date(incident.timestamp).toISOString(), // ISO format for accurate sorting
        status: "pending review",
      }));

      // Sort by timestamp (most recent first)
      initialNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotifications(initialNotifications);

      // Play sound on initial load for pending incidents
      playNotificationSound();
    }

    // Save current incidents for future comparisons
    prevIncidentsRef.current = JSON.parse(JSON.stringify(contextIncidents));
    initialLoadDoneRef.current = true;
  }, [contextIncidents, playNotificationSound]);

  // Update notifications when incidents change (after initial load)
  useEffect(() => {
    if (!Array.isArray(contextIncidents) || contextIncidents.length === 0 || !initialLoadDoneRef.current) {
      return;
    }

    const { newPending, newResolved } = detectChanges(prevIncidentsRef.current, contextIncidents);

    // Play sound for new pending incidents
    if (newPending.length > 0) {
      playNotificationSound();
    }

    // Update notifications
    setNotifications(prev => {
      // Add new pending notifications
      const newNotifications = newPending
        .filter(incident =>
          // Avoid duplicates
          !prev.some(notification => notification.id === incident._id)
        )
        .map(incident => ({
          id: incident._id,
          incidentId: incident._id, // Store the actual incident ID for navigation
          message: `New ${incident.severityLevel?.toLowerCase() || 'unknown'} severity incident`,
          read: false,
          timestamp: new Date(incident.timestamp).toISOString(), // ISO format for accurate sorting
          status: "pending review",
        }));

      // Remove resolved notifications
      const resolvedIds = newResolved.map(incident => incident._id);
      const filteredNotifications = prev.filter(notification =>
        !resolvedIds.includes(notification.id)
      );

      // Combine notifications and sort by timestamp (most recent first)
      return [...filteredNotifications, ...newNotifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    // Save current incidents for future comparisons
    prevIncidentsRef.current = JSON.parse(JSON.stringify(contextIncidents));
  }, [contextIncidents, detectChanges, playNotificationSound]);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  // Navigate to the incident detail page
  const handleNotificationClick = notification => {
    // Mark the notification as read
    setNotifications(prev =>
      prev.map(item =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );

    // Close the dropdown
    setIsOpen(false);

    // Navigate to the incident detail page
    navigate(`/incidents/${notification.incidentId}`);
  };

  const handleNotificationRemove = (id, event) => {
    if (event) {
      event.stopPropagation(); // Prevent triggering parent's onClick
    }
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  return (
    <div className="notifications-container">
      <button onClick={toggleDropdown} className="notifications-button">
        Notifications
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={`notifications-dropdown ${isOpen ? "show" : ""}`}>
          {notifications.length === 0 ? (
            <p className="no-notifications">No new notifications</p>
          ) : (
            <div>
              <ul>
                {(viewAll ? notifications : notifications.slice(0, 5)).map(notification => (
                  <li
                    key={notification.id}
                    className={`notification-item ${notification.read ? "read" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-content">
                      {notification.message}
                      <span className="timestamp">{new Date(notification.timestamp).toLocaleString()}</span>
                    </span>
                    <button
                      className="remove-button"
                      onClick={e => handleNotificationRemove(notification.id, e)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              {notifications.length > 5 && (
                <button
                  onClick={() => setViewAll(prev => !prev)}
                  className="view-all-button"
                >
                  {viewAll ? "Show Less" : "View All"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
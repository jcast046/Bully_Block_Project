import { useState, useEffect, useMemo, useContext, useRef, useCallback } from "react";
import { IncidentsContext } from "../../IncidentsContext";
import "./NotificationPopUp.css";
import notificationSoundFile from "../../assets/sounds/bullyblock_notification_sound.mp3";

export default function NotificationsButton() {
  const { incidents: contextIncidents } = useContext(IncidentsContext);
  const [isOpen, setIsOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const prevIncidentsRef = useRef(null);
  const initialLoadDoneRef = useRef(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Memoize the audio instance
  const notificationSound = useMemo(() => {
    const audio = new Audio(notificationSoundFile);
    return audio;
  }, []);

  // Function to play notification sound - wrapped in useCallback
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

    // Find newly pending incidents
    const newPending = currentIncidents.filter(
      current => current.status === "pending review" &&
        (!prevIncidents.some(prev => prev._id === current._id) ||
          prevIncidents.some(prev => prev._id === current._id && prev.status !== "pending review"))
    );

    // Find newly resolved incidents
    const newResolved = currentIncidents.filter(
      current => current.status === "resolved" &&
        prevIncidents.some(prev => prev._id === current._id && prev.status !== "resolved")
    );

    return { newPending, newResolved };
  }, []);

  // Handle initial load of notifications
  useEffect(() => {
    if (!Array.isArray(contextIncidents) || contextIncidents.length === 0 || initialLoadDoneRef.current) {
      return;
    }

    // Only get pending incidents on initial load
    const pendingIncidents = contextIncidents.filter(
      incident => incident.status === "pending review"
    );

    if (pendingIncidents.length > 0) {
      // Create notifications for all pending incidents
      const initialNotifications = pendingIncidents.map(incident => ({
        id: incident._id,
        message: `New ${incident.severityLevel.toLowerCase()} severity incident`,
        read: false,
        timestamp: new Date(incident.timestamp).toLocaleString(),
        status: "pending review",
      }));

      setNotifications(initialNotifications);

      // Play sound on initial load if there are pending incidents
      playNotificationSound();
    }

    // Initialize the previous incidents reference
    prevIncidentsRef.current = JSON.parse(JSON.stringify(contextIncidents));
    initialLoadDoneRef.current = true;
  }, [contextIncidents, playNotificationSound]);

  // Update notifications when incidents change (after initial load)
  useEffect(() => {
    if (!Array.isArray(contextIncidents) || contextIncidents.length === 0 || !initialLoadDoneRef.current) {
      return;
    }

    const { newPending, newResolved } = detectChanges(prevIncidentsRef.current, contextIncidents);

    // Play sound for new pending notifications
    if (newPending.length > 0) {
      playNotificationSound();
    }

    // Update notifications
    setNotifications(prev => {
      // Create new pending notifications
      const newNotifications = newPending
        .filter(incident =>
          // Make sure we don't add duplicates
          !prev.some(notification => notification.id === incident._id)
        )
        .map(incident => ({
          id: incident._id,
          message: `New ${incident.severityLevel.toLowerCase()} severity incident`,
          read: false,
          timestamp: new Date(incident.timestamp).toLocaleString(),
          status: "pending review",
        }));

      // Remove resolved notifications
      const resolvedIds = newResolved.map(incident => incident._id);
      const filteredNotifications = prev.filter(notification =>
        !resolvedIds.includes(notification.id)
      );

      return [...filteredNotifications, ...newNotifications];
    });

    // Save current incidents for next comparison
    prevIncidentsRef.current = JSON.parse(JSON.stringify(contextIncidents));
  }, [contextIncidents, detectChanges, playNotificationSound]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleNotificationRemove = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
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
                {(viewAll ? notifications : notifications.slice(0, 5)).map((notification) => (
                  <li
                    key={notification.id}
                    className="notification-item"
                  >
                    <span onClick={() => handleNotificationClick(notification.id)}>
                      {notification.message}
                      <span className="timestamp">{notification.timestamp}</span>
                    </span>
                    <button
                      className="remove-button"
                      onClick={() => handleNotificationRemove(notification.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              {notifications.length > 5 && (
                <button
                  onClick={() => setViewAll((prev) => !prev)}
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
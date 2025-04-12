import { useState, useEffect, useRef, useMemo } from "react";
import "./NotificationPopUp.css";
import notificationSoundFile from "../../assets/sounds/bullyblock_notification_sound.mp3";

export default function NotificationsButton({ incidents = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Memoize the audio instance
  const notificationSound = useMemo(() => {
    const audio = new Audio(notificationSoundFile);
    return audio;
  }, []);

  // Detect and react to new incidents
  useEffect(() => {
    if (Array.isArray(incidents) && incidents.length > 0) {
      const newNotifications = incidents
        .filter((incident) => !notifications.some((n) => n.id === incident._id))
        .map((incident) => ({
          id: incident._id,
          message: `New ${incident.severityLevel.toLowerCase()} severity incident`,
          read: false,
          timestamp: new Date(incident.timestamp).toLocaleString(),
        }));

      if (newNotifications.length > 0) {
        // Play notification sound
        try {
          notificationSound.currentTime = 0;
          notificationSound.play();
        } catch (err) {
          console.error("Error playing notification sound:", err);
        }

        // Add new notifications to the list
        setNotifications((prev) => [...newNotifications, ...prev]);
      }
    }
  }, [incidents, notificationSound]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const toggleViewAll = () => setViewAll(!viewAll);

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
    <div className="notifications-container" ref={dropdownRef}>
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
                {(viewAll ? notifications : notifications.slice(0, 5)).map(
                  (notification) => (
                    <li
                      key={notification.id}
                      className="notification-item"
                      style={{ opacity: notification.read ? 0.5 : 1 }}
                    >
                      <span
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        {notification.message}
                        <span className="timestamp">
                          {notification.timestamp}
                        </span>
                      </span>
                      <button
                        className="remove-button"
                        onClick={() =>
                          handleNotificationRemove(notification.id)
                        }
                      >
                        ✕
                      </button>
                    </li>
                  )
                )}
              </ul>
              {notifications.length > 5 && (
                <button onClick={toggleViewAll} className="view-all-button">
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

import { useState, useEffect, useRef } from "react";
import "./NotificationPopUp.css";

export default function NotificationsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New comment on your report", read: false },
    { id: 2, message: "Incident status updated", read: false },
    { id: 3, message: "Reminder: Check analytics", read: true },
  ]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle clicks outside of the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleNotificationClick = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
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

      <div className={`notifications-dropdown ${isOpen ? "show" : ""}`}>
        {notifications.length === 0 ? (
          <p className="no-notifications">No new notifications</p>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="notification-item"
                onClick={() => handleNotificationClick(notification.id)}
                style={{ opacity: notification.read ? 0.7 : 1 }}
              >
                {notification.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

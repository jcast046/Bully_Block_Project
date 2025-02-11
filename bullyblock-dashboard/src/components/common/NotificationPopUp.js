import { useState } from "react";
import "./NotificationPopUp.css";

export default function NotificationsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New comment on your report", read: false },
    { id: 2, message: "Incident status updated", read: false },
    { id: 3, message: "Reminder: Check analytics", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="notifications-container">
      <button onClick={toggleDropdown} className="notifications-button">
        Notifications
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          {notifications.length === 0 ? (
            <p className="no-notifications">No new notifications</p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id} className="notification-item">
                  {notification.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

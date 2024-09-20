self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: 'icon.png', // Optional: add an icon for the notification
  };

  event.waitUntil(
    self.registration.showNotification('New Image Notification', options)
  );
});

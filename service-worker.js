// service-worker.js
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Image Notification', body: 'New image available!' };

  const options = {
    body: data.body,
    icon: 'icon.png', // Optional icon
    image: data.image || '', // Image URL from payload
    data: {
      url: data.url || 'https://rule34.xxx'
    },
    actions: [
      {
        action: 'open_url',
        title: 'View Image'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Close notification when clicked
  
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      if (urlToOpen) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

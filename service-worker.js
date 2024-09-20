// service-worker.js
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Image Notification', body: 'New image available!' };

  const options = {
    body: data.body,
    icon: 'icon.png', // Optional icon
    image: data.image || '', // Image URL from payload
    data: {
      url: data.url || 'https://rule34.xxx' // Default URL if not provided
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
  
  const urlToOpen = event.notification.data.url; // Get the URL from notification data

  console.log('Opening URL:', urlToOpen); // Debug log

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      if (urlToOpen) {
        return clients.openWindow(urlToOpen); // Open the specific Rule34 image page
      }
    })
  );
});

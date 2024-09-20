let imageUrls = [];
let currentPage = 1;

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Image Notification', body: 'New image available!' };

  const options = {
    body: data.body,
    icon: 'icon.png', // Optional icon
    image: data.image || '',
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
  event.notification.close();
  
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

// Function to fetch images
async function fetchImages() {
  const res = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=sort:random+kindred+-animated&pid=${currentPage}`);
  let json = await res.json();
  json = json.filter((x) => !x.file_url.includes('mp4'));
  if (!json.length) return;
  imageUrls.push(...json);
  currentPage++;
}

// Periodic image fetching
async function periodicFetch() {
  if (imageUrls.length < 100) {
    await fetchImages();
  }
  if (imageUrls.length) {
    const imgData = imageUrls.shift();
    const imgUrl = imgData.file_url;
    const postUrl = `https://rule34.xxx/index.php?page=post&s=view&id=${imgData.id}`;
    
    // Send push notification with the image URL
    self.registration.showNotification('New Image Available!', {
      body: 'Check out the latest image!',
      icon: 'icon.png',
      image: imgUrl,
      data: { url: postUrl }
    });
  }
}

// Start periodic fetching on installation
self.addEventListener('install', function(event) {
  event.waitUntil(periodicFetch());
});

// Periodically fetch images every 10 seconds
setInterval(periodicFetch, 10000);

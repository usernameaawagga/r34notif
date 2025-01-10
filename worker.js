let intervalId;
let tags = "";
let impliedTags = "";
let page = 1;

self.onmessage = async function (e) {
  const { command, interval, options } = e.data;

  if (command === 'start') {
    if (options && options.tags && options.impliedTags) {
      tags = options.tags;
      impliedTags = options.impliedTags;
    } else {
      console.error("Tags or impliedTags not provided in options.");
      return;
    }

    // Start the interval for sending 'ping' messages
    intervalId = setInterval(() => {
      self.postMessage({ type: 'ping' }); // Notify the main thread for regular processing
    }, interval);

    // Begin preloading images in the background
    await preloadImages();
  } else if (command === 'stop') {
    clearInterval(intervalId);
  }
};

// Function to preload images in the background
async function preloadImages() {
  try {
    while (true) {
      const apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(tags)}+${encodeURIComponent(impliedTags)}&pid=${page}`;
      console.log("Worker fetching images:", apiUrl);

      const res = await fetch(apiUrl);
      const text = await res.text();

      if (text.trim() === "") {
        console.error("Worker received empty API response. Stopping preload.");
        break; // Exit if no valid response
      }

      const json = JSON.parse(text).filter((x) => x.file_url && !x.file_url.includes('mp4'));
      if (json.length === 0) {
        console.error("Worker found no valid images. Incrementing page...");
        page++;
        continue;
      }

      // Send preloaded images to the main thread
      self.postMessage({ type: 'addImages', images: json });

      page++; // Move to the next page
      await delay(5000); // Wait before the next batch
    }
  } catch (error) {
    console.error("Worker failed to preload images:", error);
  }
}

// Helper function for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

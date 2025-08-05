let intervalId;
let tags = "";
let impliedTags = "";
let page = 1;
let preloading = false;

// This is the message handler for the worker. It correctly unpacks the data
// sent from the updated notif.html file.
self.onmessage = async function (e) {
  const { command, interval, tags: newTags, impliedTags: newImpliedTags } = e.data;

  if (command === 'start') {
    // Stop any previous activity
    clearInterval(intervalId);
    preloading = false;

    // Set new parameters
    tags = newTags;
    impliedTags = newImpliedTags;
    page = 1; // Reset page number on start/restart

    // Start the interval for sending 'ping' messages to the main thread
    intervalId = setInterval(() => {
      self.postMessage({ type: 'ping' });
    }, interval);

    // Begin preloading images
    preloadImages();
  } else if (command === 'stop') {
    clearInterval(intervalId);
    preloading = false; // This will cause the preloadImages loop to exit
  }
};

async function preloadImages() {
    preloading = true;
    while(preloading) { // This loop will now terminate if preloading is set to false
        try {
            const apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(tags)}+${encodeURIComponent(impliedTags)}&pid=${page}`;
            const res = await fetch(apiUrl);

            if (!res.ok) {
                throw new Error(`API request failed with status ${res.status}`);
            }

            const text = await res.text();
            // Handle empty response, which can be valid if a page has no posts
            if (!text || text.trim() === "[]") {
                console.log(`Worker: Page ${page} was empty or end of results. Stopping preload.`);
                preloading = false; // Stop if there are no more images
                break;
            }

            const json = JSON.parse(text).filter(x => x.file_url && !x.file_url.endsWith('.mp4'));

            if (json.length > 0) {
                self.postMessage({ type: 'addImages', images: json });
                page++;
            } else {
                console.log("Worker found no valid images on this page. Trying next.");
                page++;
            }
            // Wait 5 seconds between fetches to avoid spamming the API
            await delay(5000);
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
            console.error("Worker failed to preload images:", error);
            // Wait longer after an error before retrying
            await delay(15000);
        }
    }
    console.log("Worker has stopped preloading.");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

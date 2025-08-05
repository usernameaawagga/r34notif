let intervalId;
let tags = "";
let impliedTags = "";
let page = 1;
let preloading = false;

self.onmessage = async function (e) {
  const { command, interval, tags: newTags, impliedTags: newImpliedTags } = e.data;

  if (command === 'start') {
    tags = newTags;
    impliedTags = newImpliedTags;
    page = 1; // Reset page number on start

    // Start the interval for sending 'ping' messages
    clearInterval(intervalId); // Clear any existing interval
    intervalId = setInterval(() => {
      self.postMessage({ type: 'ping' });
    }, interval);

    // Start preloading images
    if (!preloading) {
        preloadImages();
    }
  } else if (command === 'stop') {
    clearInterval(intervalId);
    preloading = false; // Stop the preloading loop
  }
};

async function preloadImages() {
    preloading = true;
    while(preloading) {
        try {
            const apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(tags)}+${encodeURIComponent(impliedTags)}&pid=${page}`;
            const res = await fetch(apiUrl);

            if (!res.ok) {
                throw new Error(`API request failed with status ${res.status}`);
            }

            const text = await res.text();
            if (!text) {
                console.log("Worker received empty API response. Trying next page.");
                page++;
                await delay(5000); // Wait before retrying
                continue;
            }

            const json = JSON.parse(text).filter(x => x.file_url && !x.file_url.endsWith('.mp4'));

            if (json.length > 0) {
                self.postMessage({ type: 'addImages', images: json });
                page++;
            } else {
                console.log("Worker found no new images. Will try again later.");
                // If no images are found, we should probably stop for a while or slow down.
                await delay(30000); // Wait 30 seconds before trying the next page
            }
            await delay(5000); // Wait 5 seconds between successful fetches
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
            console.error("Worker failed to preload images:", error);
            await delay(15000); // Wait longer after an error
        }
    }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

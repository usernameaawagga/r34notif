let intervalId;
let tags = "";
let impliedTags = "";
let page = 1;
let isFetching = false; // Prevents multiple simultaneous fetches

self.onmessage = async function (e) {
  const { command, interval, tags: newTags, impliedTags: newImpliedTags } = e.data;

  switch (command) {
    case 'start':
      // Stop any previous activity
      clearInterval(intervalId);

      // Set new parameters
      tags = newTags;
      impliedTags = newImpliedTags;
      page = 1; // Reset page number on start/restart

      // Start the interval for sending 'ping' messages to the main thread
      intervalId = setInterval(() => {
        self.postMessage({ type: 'ping' });
      }, interval);
      break;

    case 'stop':
      clearInterval(intervalId);
      tags = "";
      impliedTags = "";
      page = 1;
      break;

    case 'getMoreImages':
      if (!isFetching) {
        await fetchAndSendImages();
      }
      break;
  }
};

async function fetchAndSendImages() {
  if (!tags) {
    self.postMessage({ type: 'error', error: 'Cannot fetch, tags are not set.' });
    return;
  }
  
  isFetching = true;
  try {
    const apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=100&tags=${encodeURIComponent(tags)}+${encodeURIComponent(impliedTags)}&pid=${page}`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }

    const text = await res.text();
    // An empty response or empty array means we've reached the end
    if (!text || text.trim() === '[]') {
      self.postMessage({ type: 'message', message: `No more images found for these tags. End of results at page ${page}.` });
      // We don't increment the page number so subsequent requests for more will hit the same last page
      return;
    }

    const json = JSON.parse(text).filter(x => x.file_url && !x.file_url.endsWith('.mp4'));

    if (json.length > 0) {
      self.postMessage({ type: 'addImages', images: json });
      page++; // Only move to next page if we found images
    } else {
      self.postMessage({ type: 'message', message: `Page ${page} contained no valid images.` });
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  } finally {
    isFetching = false; // Allow new fetches
  }
}

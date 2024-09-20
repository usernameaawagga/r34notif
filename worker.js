let intervalId;

self.onmessage = function (e) {
  const { command, interval } = e.data;

  if (command === 'start') {
    intervalId = setInterval(() => {
      self.postMessage('ping'); // Send a message to the main thread every interval
    }, interval);
  } else if (command === 'stop') {
    clearInterval(intervalId);
  }
};

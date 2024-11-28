const videoInput = document.getElementById('videoInput');
const video = document.getElementById('video');
const output = document.getElementById('output');

// Load face-api.js models
async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        console.log('Models successfully loaded.');
    } catch (err) {
        console.error('Error loading models:', err);
        alert('Failed to load models. Check your internet connection or the CDN link.');
    }
}

// Track facial landmarks
async function trackLandmarks() {
    if (!video.videoWidth || !video.videoHeight) {
        alert('Video is not ready yet. Please wait.');
        return;
    }

    video.addEventListener('play', async () => {
        while (!video.paused && !video.ended) {
            try {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks(true);

                if (detections.length > 0) {
                    const landmarks = detections.map(det => det.landmarks.positions);

                    // Display landmark data as JSON on the web screen
                    output.textContent = JSON.stringify(landmarks, null, 2);
                } else {
                    output.textContent = 'No faces detected. Ensure the video contains clear faces.';
                }
            } catch (err) {
                console.error('Error during detection:', err);
                output.textContent = 'Error detecting facial landmarks. See console for details.';
            }

            await new Promise((r) => setTimeout(r, 100)); // Process every 100ms
        }
    });
}

// Initialize video upload handling
videoInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const fileURL = URL.createObjectURL(file);
        video.src = fileURL;

        await video.play();
        console.log('Video loaded and playing.');
        trackLandmarks();
    } catch (err) {
        console.error('Error loading video:', err);
        alert('Failed to load video. Please ensure the file is valid.');
    }
});

// Load models and set up
loadModels();


// Elements for canvas streaming
const outputCanvas = document.getElementById('outputCanvas');
const responseElement = document.getElementById('response');
const outputContext = outputCanvas.getContext('2d');

let videoFile = null;

// Load face-api.js models
async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        console.log('Models loaded successfully');
    } catch (error) {
        console.error('Error loading face-api.js models:', error);
    }
}

// Function to process video
async function processVideo(video) {
    const facialData = [];
    outputCanvas.width = video.videoWidth || 640;
    outputCanvas.height = video.videoHeight || 480;

    console.log('Canvas dimensions set:', outputCanvas.width, outputCanvas.height);

    await loadModels();

    video.addEventListener('play', () => {
        console.log('Video playback started...');
        const interval = setInterval(async () => {
            if (video.paused || video.ended) {
                console.log('Video processing complete.');
                clearInterval(interval);
                saveDataToExcel(facialData);
                return;
            }

            try {
                // Detect faces and landmarks
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks();

                console.log('Detections:', detections);

                // Clear previous drawings on the canvas
                outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

                // Draw mirrored video frame
                outputContext.save();
                outputContext.scale(-1, 1); // Flip horizontally
                outputContext.drawImage(video, -outputCanvas.width, 0, outputCanvas.width, outputCanvas.height);
                outputContext.restore();

                // Draw detected face landmarks
                faceapi.draw.drawFaceLandmarks(outputCanvas, detections);

                // Store landmark data
                if (detections.length > 0) {
                    detections.forEach(detection => {
                        facialData.push({
                            timestamp: video.currentTime,
                            landmarks: detection.landmarks.positions.map(pos => ({ x: pos.x, y: pos.y }))
                        });
                    });
                }
            } catch (error) {
                console.error('Error during frame processing:', error);
            }
        }, 100); // Process every 100ms
    });
}


// Function to save data to Excel
function saveDataToExcel(facialData) {
    console.log('Saving data to Excel...', facialData);
    const rows = facialData.map((entry, index) => {
        const flattenedLandmarks = entry.landmarks.map(point => `${point.x},${point.y}`).join(';');
        return { Frame: index + 1, Timestamp: entry.timestamp, Landmarks: flattenedLandmarks };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facial Data');

    console.log('Writing Excel file...');
    XLSX.writeFile(workbook, 'Facial_Landmarks_Data.xlsx');
    alert('Facial landmark data saved as Excel file on your desktop!');
}

// Handle video file input
function handleFileInput(event) {
    const file = event.target.files[0];
    if (!file) {
        console.error('No file selected.');
        alert('Please select a valid video file.');
        return;
    }

    console.log('Video file selected:', file.name);

    // Create a video element for playback
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.crossOrigin = "anonymous";
    video.muted = true; // Mute the video to prevent autoplay restrictions
    video.autoplay = true;
    video.loop = false;
    video.controls = true; // Add controls for easier debugging
    document.body.appendChild(video); // Append to body for visual confirmation

    video.addEventListener('loadeddata', () => {
        console.log('Video loaded, starting processing...');
        processVideo(video);
    });

    video.addEventListener('play', () => {
        console.log('Video playback started.');
    });

    video.addEventListener('error', (e) => {
        console.error('Error loading video:', e);
        alert('There was an error loading the video file. Please try again.');
    });
}

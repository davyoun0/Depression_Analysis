document.addEventListener('DOMContentLoaded', async () => {
    const videoInput = document.getElementById('videoInput');
    const video = document.getElementById('video');
    const output = document.getElementById('output');
    const saveButton = document.createElement('button');
    saveButton.innerText = 'Save to Excel';
    document.body.appendChild(saveButton);

    let trackingData = []; // format {landmarksdata (x, y); timestamp}

    // Load models
    async function loadModels() {
        try {
            console.log('Loading models...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
            await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
            await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
            console.log('Models successfully loaded.');
        } catch (err) {
            console.error('Error loading models:', err);
            alert('Failed to load models.');
        }
    }

    // Track landmarks function
    async function trackLandmarks() {
        console.log('trackLandmarks function called.');

        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        faceapi.matchDimensions(canvas, displaySize);

        while (!video.paused && !video.ended) {
            try {
                console.log('Detecting faces...');
                const detections = await faceapi
                    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
                    .withFaceLandmarks();

                console.log('Detection Results:', detections);

                if (detections.length === 0) {
                    console.warn('No faces detected.');
                }

                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, faceapi.resizeResults(detections, displaySize));
                faceapi.draw.drawFaceLandmarks(canvas, faceapi.resizeResults(detections, displaySize));

                if (detections.length > 0) {
                    const landmarks = detections.map(det => det.landmarks.positions);
                    output.textContent = JSON.stringify(landmarks, null, 2);
                    console.log('Landmarks detected:', landmarks);

                    // Store landmarks data for saving to Excel
                    const timestamp = video.currentTime;
                    const landmarksData = landmarks.map((landmark, index) => ({
                        index,
                        x: landmark[0].x.toFixed(2),
                        y: landmark[0].y.toFixed(2),
                        time: timestamp.toFixed(2)
                    }));

                    trackingData.push(...landmarksData);
                } else {
                    output.textContent = 'No faces detected.';
                }
            } catch (err) {
                console.error('Error during detection:', err);
                output.textContent = 'Error detecting facial landmarks.';
            }

            await new Promise((resolve) => setTimeout(resolve, 100)); // Delay for tracking
        }
    }

    // Handle video file input
    videoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            console.log('Loading video...');
            const fileURL = URL.createObjectURL(file);
            video.src = fileURL;

            await loadModels(); 
            await video.play();
            console.log('Video loaded and playing.');
        } catch (err) {
            console.error('Error loading video:', err);
            alert('Failed to load video.');
        }
    });

    // Wait for video metadata to load before starting to track
    video.addEventListener('loadedmetadata', async () => {
        console.log('Video metadata loaded.');
        await trackLandmarks(); 
    });

    // Start tracking when video starts playing
    video.addEventListener('play', async () => {
        console.log('Video started playing.');
        await trackLandmarks(); 
    });

    // Save the landmarks data to Excel
    saveButton.addEventListener('click', () => {
        if (trackingData.length === 0) {
            alert('No tracking data to save.');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(trackingData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Facial Landmarks');

        XLSX.writeFile(workbook, 'landmarks_data.xlsx');
        console.log('Excel file saved.');
    });

    // Load models when page is ready
    await loadModels();
});

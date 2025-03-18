document.addEventListener('DOMContentLoaded', async () => {
    const videoInput = document.getElementById('videoInput');
    const video = document.getElementById('video');
    const output = document.getElementById('output');

    async function loadModels() {
        try {
            console.log('Loading models...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
            await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
            await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
            console.log('Models successfully loaded.');
        } catch (err) {
            console.error('Error loading models:', err);
            alert('Failed to load models. Check your internet connection or the CDN link.');
        }
    }

    async function trackLandmarks() {
        video.addEventListener('loadedmetadata', async () => {
            console.log('Video metadata loaded.');

            const canvas = faceapi.createCanvasFromMedia(video);
            document.body.append(canvas);

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            canvas.width = displaySize.width;
            canvas.height = displaySize.height;
            faceapi.matchDimensions(canvas, displaySize);

            video.addEventListener('play', async () => {
                console.log('Video is playing.');

                while (!video.paused && !video.ended) {
                    try {
                        console.log('Detecting faces...');
                        const detections = await faceapi
                            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
                            .withFaceLandmarks();

                        console.log('Detection Results:', detections);

                        // Clear canvas and redraw detections
                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        faceapi.draw.drawDetections(canvas, faceapi.resizeResults(detections, displaySize));
                        faceapi.draw.drawFaceLandmarks(canvas, faceapi.resizeResults(detections, displaySize));

                        // Update output with landmarks or display message
                        if (detections.length > 0) {
                            const landmarks = detections.map(det => det.landmarks.positions);
                            output.textContent = JSON.stringify(landmarks, null, 2);
                            console.log('Landmarks detected:', landmarks);
                        } else {
                            output.textContent = 'No faces detected. Ensure the video contains clear faces.';
                            console.log('No faces detected.');
                        }
                    } catch (err) {
                        console.error('Error during detection:', err);
                        output.textContent = 'Error detecting facial landmarks. See console for details.';
                    }

                    await new Promise((resolve) => setTimeout(resolve, 100)); // Process every 100ms
                }
            });
        });
    }

    videoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            console.log('Loading video...');
            const fileURL = URL.createObjectURL(file);
            video.src = fileURL;

            await video.play(); // Start video playback
            console.log('Video loaded and playing.');
            trackLandmarks();
        } catch (err) {
            console.error('Error loading video:', err);
            alert('Failed to load video. Please ensure the file is valid.');
        }
    });

    await loadModels();

        // Normalize facial landmarks
    async function normalizeLandmarks(landmarks) {
        // Reference points for normalization
        const refPoint1 = landmarks[27]; // Nose bridge top (27)
        const refPoint2 = landmarks[28]; // Nose bridge bottom (28)

        // Translation vector (aligning nose bridge)
        const Tx = refPoint1.x;
        const Ty = refPoint1.y;
        landmarks = landmarks.map(pt => ({ x: pt.x - Tx, y: pt.y - Ty }));

        // Scaling factor (normalize face size)
        const originalDistance = Math.sqrt(
            Math.pow(refPoint2.x - refPoint1.x, 2) + Math.pow(refPoint2.y - refPoint1.y, 2)
        );
        const newDistance = Math.sqrt(
            Math.pow(pt.x - refPoint1.x, 2) + Math.pow(pt.y - refPoint1.y, 2)
        );
        const scaleFactor = newDistance / originalDistance; // Scale
        landmarks = landmarks.map(pt => ({ x: pt.x * scaleFactor, y: pt.y * scaleFactor }));

        // Rotation angle 
        const theta = Math.atan2(refPoint2.y - refPoint1.y, refPoint2.x - refPoint1.x);
        const cosTheta = Math.cos(-theta);
        const sinTheta = Math.sin(-theta);
        
        landmarks = landmarks.map(pt => ({
            x: pt.x * cosTheta - pt.y * sinTheta,
            y: pt.x * sinTheta + pt.y * cosTheta
        }));
        
        return landmarks;
    }

    // Process video frame and normalize landmarks
    async function processFrame(video) {
        const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
        
        if (detections) {
            const normalizedLandmarks = normalizeLandmarks(detections.landmarks.positions);
            drawLandmarks(normalizedLandmarks);
        }
    }

    // Start processing video
    async function startProcessing(videoElement) {
        await loadModels();
        setInterval(() => processFrame(videoElement), 100);
    }
});




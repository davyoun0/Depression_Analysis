// Elements for video and canvas streaming
const localVideo = document.getElementById('localVideo');
const outputCanvas = document.getElementById('outputCanvas');
const responseElement = document.getElementById('response');

// Get the canvas context
const outputContext = outputCanvas.getContext('2d');

// Load face-api.js models
async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log('Models loaded successfully');
    } catch (error) {
        console.error('Error loading face-api.js models:', error);
    }
}

// Start the webcam and initialize face detection
async function startWebcamStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = stream;
        
        localVideo.addEventListener('loadeddata', () => {
            outputCanvas.width = localVideo.videoWidth;
            outputCanvas.height = localVideo.videoHeight;
        });

        await loadModels();
        detectFace();
    } catch (err) {
        console.error('Error accessing webcam or microphone:', err);
    }
}

// Detect face and landmarks in the video feed
async function detectFace() {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(localVideo, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();

        console.log('Number of faces detected:', detections.length); // Log number of faces detected

        // Clear previous drawings on the canvas
        outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Draw mirrored video frame
        outputContext.save();
        outputContext.scale(-1, 1); // Flip horizontally
        outputContext.drawImage(localVideo, -outputCanvas.width, 0, outputCanvas.width, outputCanvas.height);
        outputContext.restore();

        // Draw detected face landmarks only if detections are found
        if (detections.length > 0) {
            faceapi.draw.drawFaceLandmarks(outputCanvas, detections);
            console.log('Landmarks drawn on canvas'); // Confirm landmarks are drawn
        }
    }, 100); // Update every 100ms
}

// Voice Recognition Functions
function speakText(text, callback) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
        if (callback) callback();
    };
    window.speechSynthesis.speak(utterance);
}

function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const response = event.results[0][0].transcript.toLowerCase();
        handleResponse(response);
    };

    recognition.onerror = (event) => {
        responseElement.textContent = 'Error: ' + event.error;
    };
}

function handleResponse(response) {
    let numericValue;
    switch (response) {
        case 'never':
            numericValue = 1;
            break;
        case 'rarely':
            numericValue = 2;
            break;
        case 'sometimes':
            numericValue = 3;
            break;
        case 'often':
            numericValue = 4;
            break;
        case 'always':
            numericValue = 5;
            break;
        default:
            numericValue = 'Unrecognized response';
    }

    responseElement.textContent = `You said: ${response}, Numeric value: ${numericValue}`;
}

// Set up event listeners for voice questions
const button1 = document.getElementById("question1");
const button2 = document.getElementById("question2");

button1.addEventListener("click", () => {
    speakText("How are you?", startVoiceRecognition);
});

button2.addEventListener("click", () => {
    speakText("How old are you?", startVoiceRecognition);
});

// Initialize webcam stream and load models on window load
window.onload = async () => {
    await loadModels();
    await startWebcamStream();
};

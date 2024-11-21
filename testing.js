// Create an array of 14 arrays to store scores for each question
const scores = Array.from({ length: 14 }, () => []);

// Elements for canvas streaming
const outputCanvas = document.getElementById('outputCanvas');
const responseElement = document.getElementById('response');
const outputContext = outputCanvas.getContext('2d');

let mediaStream = null;

// Load face-api.js models
async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
        console.log('Models loaded successfully');
    } catch (error) {
        console.error('Error loading face-api.js models:', error);
    }
}

async function startWebcamStream() {
    try {
        // Request both video and audio permissions once
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Mute the microphone to avoid audio replay
        const audioTracks = mediaStream.getAudioTracks();
        audioTracks.forEach(track => track.enabled = false); // Disable audio tracks

        // Create a hidden video element for capturing the webcam feed
        const video = document.createElement('video');
        video.srcObject = mediaStream;
        video.play();

        // Set up the canvas dimensions once the video is loaded
        video.addEventListener('loadeddata', () => {
            outputCanvas.width = video.videoWidth;
            outputCanvas.height = video.videoHeight;
        });

        await loadModels();
        detectFace(video); // Pass the video element to the detectFace function
    } catch (err) {
        console.error('Error accessing webcam or microphone:', err);
    }
}


// Detect face and landmarks in the video feed
function detectFace(video) {
    setInterval(async () => {
        // Detect faces and landmarks
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        // Clear previous drawings on the canvas
        outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Draw mirrored video frame
        outputContext.save();
        outputContext.scale(-1, 1); // Flip horizontally
        outputContext.drawImage(video, -outputCanvas.width, 0, outputCanvas.width, outputCanvas.height);
        outputContext.restore();

        // Draw detected face landmarks and expressions
        faceapi.draw.drawFaceLandmarks(outputCanvas, detections);
        faceapi.draw.drawFaceExpressions(outputCanvas, detections);
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

function startVoiceRecognition(questionIndex) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const response = event.results[0][0].transcript.toLowerCase();
        handleResponse(response, questionIndex);
        window.speechSynthesis.cancel(); // Prevent any speech synthesis output
    };

    recognition.onerror = (event) => {
        responseElement.textContent = 'Error: ' + event.error;
    };
}

function handleResponse(response, questionIndex) {
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
            numericValue = 0; // Unrecognized response
    }

    if (numericValue !== 0) {
        scores[questionIndex].push(numericValue); // Save the score to the corresponding array
    }

    // Calculate total score for all questions
    const totalScore = scores.flat().reduce((acc, curr) => acc + curr, 0);

    // Display the updated score
    responseElement.textContent = `You said: ${response}, Numeric value: ${numericValue}.
    Scores for Question ${questionIndex + 1}: [${scores[questionIndex].join(', ')}].
    Total Score: ${totalScore}`;
}

// Set up event listeners for voice questions
for (let i = 0; i < 14; i++) {
    const button = document.getElementById(`question${i + 1}`);
    button.addEventListener("click", () => {
        speakText(`Question ${i + 1}`, () => startVoiceRecognition(i));
    });
}

// Initialize webcam stream and load models on window load
window.onload = async () => {
    await startWebcamStream();
};

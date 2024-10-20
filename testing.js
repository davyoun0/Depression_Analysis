// Elements for video and canvas streaming
const localVideo = document.getElementById('localVideo');
const outputCanvas = document.getElementById('outputCanvas');
const responseElement = document.getElementById('response');

// Get the canvas context
const outputContext = outputCanvas.getContext('2d');

// Function to start the webcam stream
async function startWebcamStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Display local webcam stream
        localVideo.srcObject = stream;

        // Start drawing the video to the canvas
        drawToCanvas();

    } catch (err) {
        console.error('Error accessing webcam or microphone:', err);
    }
}

// Function to draw the video to the canvas with mirror effect
function drawToCanvas() {
    // Set an interval to draw the video every 100 milliseconds
    setInterval(() => {
        // Clear the previous frame
        outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Flip the image horizontally (mirror effect) and draw it to the canvas
        outputContext.save();
        outputContext.scale(-1, 1); // Flip horizontally
        outputContext.drawImage(localVideo, -outputCanvas.width, 0, outputCanvas.width, outputCanvas.height);
        outputContext.restore();
    }, 100); // Draw every 100ms
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

// Initialize webcam stream and media recorder
window.onload = startWebcamStream;

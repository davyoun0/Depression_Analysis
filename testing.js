// Elements for canvas streaming
const outputCanvas = document.getElementById('outputCanvas');
const responseElement = document.getElementById('response');
const outputContext = outputCanvas.getContext('2d');

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

// Start the webcam and initialize face detection
async function startWebcamStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Create a hidden video element for capturing the webcam feed
        const video = document.createElement('video');
        video.srcObject = stream;
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

function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const response = event.results[0][0].transcript.toLowerCase();
        handleResponse(response);
        totalScore(arr);
        window.speechSynthesis.cancel(); // Prevent any speech synthesis output
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

function totalScore(arr){ 
    for(var z =0;z<arr.length;z++){
        numericValue+=arr[z];
    }
    return z;

    responseElement.textContent = 'Your total score is: ${z}';
}


// Set up event listeners for voice questions
const button1 = document.getElementById("question1");
const button2 = document.getElementById("question2");
const button3 = document.getElementById("question3");
const button4 = document.getElementById("question4");
const button5 = document.getElementById("question5");
const button6 = document.getElementById("question6");
const button7 = document.getElementById("question7");
const button8 = document.getElementById("question8");
const button9 = document.getElementById("question9");
const button10 = document.getElementById("question10");
const button11 = document.getElementById("question11");
const button12 = document.getElementById("question12");
const button13 = document.getElementById("question13");
const button14 = document.getElementById("question14");

button1.addEventListener("click", () => {
    speakText("Can you not stop feeling sad?", startVoiceRecognition);
});
button2.addEventListener("click", () => {
    speakText("Do you feel alone?", startVoiceRecognition);
});
button3.addEventListener("click", () => {
    speakText("Do you feel everything in your life went well?", startVoiceRecognition);
});
button4.addEventListener("click", () => {
    speakText("Do you feel like you can't do anything right?", startVoiceRecognition);
});
button5.addEventListener("click", () => {
    speakText("Do you feel lonely?", startVoiceRecognition);
});
button6.addEventListener("click", () => {
    speakText("Do you feel sad?", startVoiceRecognition);
});
button7.addEventListener("click", () => {
    speakText("Do you feel unhappy?", startVoiceRecognition);
});
button8.addEventListener("click", () => {
    speakText("Do you think your life is bad?", startVoiceRecognition);
});
button9.addEventListener("click", () => {
    speakText("Does being sad make hard for you to do things with your friends?", startVoiceRecognition);
});
button10.addEventListener("click", () => {
    speakText("Do you not care about anything?", startVoiceRecognition);
});
button11.addEventListener("click", () => {
    speakText("Do you feel stressed?", startVoiceRecognition);
});
button12.addEventListener("click", () => {
    speakText("Do you feel too sad to eat?", startVoiceRecognition);
});
button13.addEventListener("click", () => {
    speakText("Do you want to be by yourself?", startVoiceRecognition);
});
button14.addEventListener("click", () => {
    speakText("Is it hard for you to have fun?", startVoiceRecognition);
});


// Initialize webcam stream and load models on window load
window.onload = async () => {
    await startWebcamStream();
};

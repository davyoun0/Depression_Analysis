// Function to speak a text using the Web Speech API
function speakText(text, callback) {
    const utterance = new SpeechSynthesisUtterance(text);

    // Once speech ends, invoke the callback (start recognition)
    utterance.onend = () => {
        if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
}

// Function to start voice recognition
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
        document.getElementById('response').textContent = 'Error: ' + event.error;
    };
}

// Function to handle the user's response and convert it to numeric values
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

    // Display the response and its numeric value
    document.getElementById('response').textContent = `You said: ${response}, Numeric value: ${numericValue}`;
}

// Select the buttons
const button1 = document.getElementById("question1");
const button2 = document.getElementById("question2");

// Add event listeners for the buttons
button1.addEventListener("click", () => {
    speakText("How are you?", startVoiceRecognition);
});

button2.addEventListener("click", () => {
    speakText("How old are you?", startVoiceRecognition);
});

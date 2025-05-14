const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
const socket = io("http://localhost:3000", {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
});

// Speech recognition setup for user messages
recognition.lang = "en-US";
recognition.interimResults = false;

// Function to display messages in the UI
function displayMessage(text, isUser) {
  const messagesDiv = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.textContent = text;
  messageElement.className = `message ${isUser ? "user" : "bot"}`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Event listeners for user messages
document.querySelector("button").addEventListener("click", () => {
  recognition.start();
});

// Speech recognition result handler for user messages
recognition.addEventListener("result", (e) => {
  let last = e.results.length - 1;
  let text = e.results[last][0].transcript;

  displayMessage(text, true);
  socket.emit("chat message", text);
});

// Socket.io event handler for bot response
socket.on("bot response", (response) => {
  displayMessage(response, false);
});

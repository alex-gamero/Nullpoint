// This file contains the JavaScript code that handles the game logic. 
// It implements the command system, processes user input, manages the game state, 
// and controls the flow of the story based on player decisions.

const terminal = document.getElementById('terminal');
const inputField = document.getElementById('input');
const output = document.getElementById('output');

let gameState = {
    currentScene: 'start',
    history: []
};

let story = {};
fetch('story.json')
    .then(response => response.json())
    .then(data => {
        story = data.story;
        output.innerHTML = story.start.text.replace(/\n/g, "<br>");
    });

function processInput(input) {
    const command = input.trim().toLowerCase();
    gameState.history.push(command);

    output.innerHTML += `<br>&gt;${command}<br>`;

    // Comando global 'help'
    if (command === 'help') {
        output.innerHTML += "Available commands: look, use [object], inventory, help<br>";
        output.innerHTML += "<br>"; 
        inputField.value = '';
        terminal.scrollTop = terminal.scrollHeight;
        return;
    }

    let scene = story[gameState.currentScene];
    if (!scene) {
        output.innerHTML += "Error: Scene not found.<br><br>";
        return;
    }

    let option = scene.options[command];
    if (option) {
        if (typeof option === 'string') {
            output.innerHTML += option.replace(/\n/g, "<br>") + "<br><br>";
        } else if (typeof option === 'object') {
            output.innerHTML += option.text.replace(/\n/g, "<br>") + "<br><br>";
            if (option.options) {
                gameState.currentScene = command;
                story[command] = option;
            }
            if (option.end) {
                inputField.disabled = true;
            }
        }
    } else {
        output.innerHTML += "Unknown command. Type 'help' for a list of commands.<br><br>";
    }

    inputField.value = '';
    output.scrollTop = output.scrollHeight;
}

inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        processInput(inputField.value);
    }
});

// Initialize the game
output.innerHTML = story.start.text;
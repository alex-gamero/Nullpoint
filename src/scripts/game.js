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

const story = {
    start: {
        text: "Welcome to Nullpoint. Type 'help' for commands.",
        options: {
            help: "Available commands: help, look, go, quit",
            look: "You see a dark void around you.",
            go: "Where do you want to go? (Type 'help' for options)",
            quit: "Exiting the game. Goodbye!"
        }
    },
    // Additional scenes can be added here
};

function processInput(input) {
    const command = input.trim().toLowerCase();
    gameState.history.push(command);
    
    if (command === 'quit') {
        output.innerHTML += "<br>Exiting the game. Goodbye!";
        return;
    }

    if (story[gameState.currentScene].options[command]) {
        output.innerHTML += "<br>" + story[gameState.currentScene].options[command];
    } else {
        output.innerHTML += "<br>Unknown command. Type 'help' for a list of commands.";
    }

    inputField.value = '';
    terminal.scrollTop = terminal.scrollHeight; // Auto-scroll to the bottom
}

inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        processInput(inputField.value);
    }
});

// Initialize the game
output.innerHTML = story.start.text;
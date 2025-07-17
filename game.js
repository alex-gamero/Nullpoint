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
    })
    .catch(error => {
        console.error('Error loading story:', error);
        output.innerHTML = "Error loading story. Please refresh the page.";
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

// --- Animación de runas en el header mejorada ---
const runeBtn = document.getElementById('runeBtn');
const runeText = document.getElementById('runeText');
const chapterText = 'CHAPTER 1: TERMINAL';
const originalRunes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜ';
let runeAnimInterval = null;

function randomRune() {
  const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜ';
  return runes[Math.floor(Math.random() * runes.length)];
}

function animateToText(target) {
  let progress = 0;
  clearInterval(runeAnimInterval);
  runeAnimInterval = setInterval(() => {
    let display = '';
    for (let i = 0; i < target.length; i++) {
      if (i < progress) {
        display += target[i];
      } else if (target[i] === ' ') {
        display += ' ';
      } else {
        display += randomRune();
      }
    }
    runeText.textContent = display;
    if (progress <= target.length) progress++;
    if (progress > target.length) clearInterval(runeAnimInterval);
  }, 60);
}

if (runeBtn && runeText) {
  runeBtn.addEventListener('mouseenter', () => {
    animateToText(chapterText);
  });
  runeBtn.addEventListener('mouseleave', () => {
    clearInterval(runeAnimInterval);
    runeText.textContent = originalRunes;
  });
}

// -------- DUNGEON MINI-GAME --------
let dungeonContainer, dungeonDisplay, dungeonMessage;

const dungeonMap = [
  "#############################################################################################################################################################################################",  
  "#############################################################################################################################################################################################",  
  "#############################################################################################################################################################################################",  
  "#######                                   #############                                   #######################################################                                      ######",  
  "#######                                   #############                                   #######################################################                                      ######",  
  "#######                                   #############                                   #######################################################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                                                                                  ######",  
  "#######                                   #############                                   ###########                                                                                  ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######                                   #############                                   ###########                          ##################                                      ######",  
  "#######################    ############################                                   ###########                          ##################                                      ######",  
  "#######################    ############################                                   ###########                          ##################                                      ######",  
  "#######################    ############################                                   ###########                          ##################                                      ######",  
  "#######################    ############################                                   ###########                          #######################################         ##############",  
  "#######################                                                                                                        #######################################         ##############",  
  "#######################                                                                                                        #######################################         ##############",  
  "#######################    #####################################          ###########################                          #######################################         ##############",  
  "#######################    #####################################          ###########################                          #######################################         ##############",  
  "#######                                   ######################          ###########################                          #######################################         ##############",  
  "#######                                   ######################          ###########################                          #######################################         ##############",  
  "#######                                   ######################          ###########################                          #######################################         ##############",  
  "#######                                   ######################          ###########################                          #######################################         ##############",  
  "#######                                   #############                                   ###########                          #######################################         ##############",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ###########                          #############                                            #####",  
  "#######                                   #############                                   ##################################################                                            #####",  
  "#######                                   #############                                   ##################################################                                            #####",  
  "#######                                   #############                                   ##################################################                                            #####",  
  "#######                                   #############                                   ##################################################                                            #####",  
  "############################################################################################################################################                                            #####",  
  "#############################################################################################################################################################################################",  
  "#############################################################################################################################################################################################"                                                                                                                                                                                                                                                                                      
];

// Buscar la primera celda vacía para el spawn del jugador, que tenga espacios vacíos adyacentes
function findSpawn() {
  for (let y = 9; y < dungeonMap.length - 9; y++) {
    for (let x = 24; x < dungeonMap[y].length - 24; x++) {
      if (dungeonMap[y][x] === ' ') {
        // Verifica si hay espacios vacíos adyacentes 
        if (
          dungeonMap[y - 9][x] === ' ' ||
          dungeonMap[y + 9][x] === ' ' ||
          dungeonMap[y][x - 24] === ' ' ||
          dungeonMap[y][x + 24] === ' '
        ) {
          return { x, y };
        }
      }
    }
  }
  return { x: 1, y: 1 }; // fallback
}

let spawn = findSpawn();
let playerX = spawn.x;
let playerY = spawn.y;
let hasKey = false;

// Posición de la llave
const keyPos = { x: dungeonMap[0].length - 27, y: dungeonMap.length - 10 };

// Definir enemigos con posiciones y formas
const enemyTypes = [">:(", "0_o", "o_o", "=o=", ">-<", "D:=", "^_^", "-_-", "x_x"];
let enemies = [
  { x: 30, y: 10, type: 0 },
  { x: 50, y: 20, type: 1 },
  { x: 70, y: 30, type: 2 },
  { x: 90, y: 15, type: 3 },
  { x: 110, y: 25, type: 4 },
  { x: 130, y: 35, type: 5 },
  { x: 150, y: 45, type: 6 }
];

function isWall(x, y) {
  return dungeonMap[y][x] === '#';
}

function isEnemy(x, y) {
  return enemies.some(e => e.x === x && e.y === y);
}

function moveEnemies() {
  for (let enemy of enemies) {
    // Movimiento aleatorio: 0=arriba, 1=abajo, 2=izq, 3=der, 4=quieto
    let dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 }
    ];
    let dir = dirs[Math.floor(Math.random() * dirs.length)];
    let nx = enemy.x + dir.dx;
    let ny = enemy.y + dir.dy;
    // No atraviesan paredes ni se pisan entre sí
    if (!isWall(nx, ny) && !isEnemy(nx, ny)) {
      enemy.x = nx;
      enemy.y = ny;
    }
  }
}

function drawMap() {
  let mapCopy = dungeonMap.map((row, y) => {
    return row.split('').map((char, x) => {
      // Jugador
      if (x === playerX && y === playerY) {
        return '<span style="color:red">@</span>';
      }
      // Llave
      if (x === keyPos.x && y === keyPos.y && !hasKey) {
        return '<span style="color:yellow">ꄗ</span>';
      }
      // Enemigos
      let enemy = enemies.find(e => e.x === x && e.y === y);
      if (enemy) {
        return `<span style=\"color:#48ee82\">${enemyTypes[enemy.type]}</span>`;
      }
      return char;
    }).join('');
  }).join('<br>');
  dungeonDisplay.innerHTML = mapCopy;
}

function resetPlayer() {
  playerX = spawn.x;
  playerY = spawn.y;
}

// Modificar handleMove para mover enemigos y detectar colisión
function handleMove(dx, dy) {
  let newX = playerX + dx;
  let newY = playerY + dy;
  let targetChar = dungeonMap[newY][newX];
  if (targetChar === '#') return;
  // Si hay enemigo, respawn
  if (isEnemy(newX, newY)) {
    playerX = spawn.x;
    playerY = spawn.y;
    drawMap();
    return;
  }
  // Si hay llave
  if (newX === keyPos.x && newY === keyPos.y && !hasKey) {
    hasKey = true;
    // Aquí luego irá la animación especial
  }
  playerX = newX;
  playerY = newY;
  moveEnemies();
  // Si después de mover enemigos hay colisión, respawn
  if (isEnemy(playerX, playerY)) {
    playerX = spawn.x;
    playerY = spawn.y;
  }
  drawMap();
}

document.addEventListener("keydown", function(e) {
  if (dungeonContainer.style.display === "none") return;
  switch (e.key) {
    case "ArrowUp": handleMove(0, -1); break;
    case "ArrowDown": handleMove(0, 1); break;
    case "ArrowLeft": handleMove(-1, 0); break;
    case "ArrowRight": handleMove(1, 0); break;
    case "Escape":
      dungeonContainer.style.display = "none";
      break;
  }
});

// Mostrar juego al tocar pixel verde
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar elementos del dungeon
  dungeonContainer = document.getElementById("dungeonContainer");
  dungeonDisplay = document.getElementById("dungeonDisplay");
  dungeonMessage = document.getElementById("dungeonMessage");
  
  const secretPixel = document.getElementById("secretPixel");
  
  console.log("Secret pixel element:", secretPixel);
  console.log("Dungeon container:", dungeonContainer);
  console.log("Dungeon display:", dungeonDisplay);
  console.log("Dungeon message:", dungeonMessage);
  
  if (secretPixel) {
    secretPixel.addEventListener("click", () => {
      console.log("Secret pixel clicked!");
      console.log("Dungeon container display before:", dungeonContainer.style.display);
      dungeonContainer.style.display = "block";
      console.log("Dungeon container display after:", dungeonContainer.style.display);
      playerX = spawn.x;
      playerY = spawn.y;
      hasKey = false;
      dungeonMessage.textContent = "Use arrow keys to move. ESC to exit.";
      drawMap();
    });
  } else {
    console.log("Secret pixel element not found!");
  }
});

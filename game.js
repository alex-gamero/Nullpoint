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
        output.scrollTop = output.scrollHeight;
        return;
    }

    // Comando global 'inventory'
    if (command === 'inventory') {
        if (!gameState.inventory || gameState.inventory.length === 0) {
            output.innerHTML += "Your inventory is empty.<br><br>";
        } else {
            output.innerHTML += "Inventory:<br>";
            gameState.inventory.forEach(item => {
                output.innerHTML += `- ${item}<br>`;
            });
            output.innerHTML += "<br>";
        }
        inputField.value = '';
        output.scrollTop = output.scrollHeight;
        return;
    }

    // Comando global 'root' 
    if (command === 'root') {
      showUseKeyAnimation();
    }

    // Comando global 'use key'
    if (command === 'use key') {
        if (!gameState.inventory || !gameState.inventory.includes("key")) {
            output.innerHTML += "You don't have a key.<br><br>";
            //Scroll to the bottom of the terminal
            inputField.value = '';
            output.scrollTop = output.scrollHeight;
            return;
        } else {
            // Remover la llave del inventario después de usarla
            gameState.inventory = gameState.inventory.filter(item => item !== "key");
            showUseKeyAnimation();
            return;
        }
    }

    let scene = story[gameState.currentScene];
    if (!scene) {
        output.innerHTML += "Error: Scene not found.<br><br>";
        inputField.value = '';
        terminal.scrollTop = terminal.scrollHeight;
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
            if (option.knight) {
                inputField.disabled = true;
                output.scrollTop = output.scrollHeight;
                showKnightScreen();
                return;
            }
            if (option.ending) {
                inputField.disabled = true;
                output.scrollTop = output.scrollHeight;
                showEndingScreen("Perfect, simply perfect, you will be a suitable candidate for the next phase. We will see you soon.");
                return;
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
  "#######################    ############################                                   ###########                          ########################################         #############",  
  "#######################                                                                                                        ########################################         #############",  
  "#######################                                                                                                        ########################################         #############",  
  "#######################    #####################################          ###########################                          ########################################         #############",  
  "#######################    #####################################          ###########################                          ########################################         #############",  
  "#######                                   ######################          ###########################                          ########################################         #############",  
  "#######                                   ######################          ###########################                          ########################################         #############",  
  "#######                                   ######################          ###########################                          ########################################         #############",  
  "#######                                   ######################          ###########################                          ########################################         #############",  
  "#######                                   #############                                   ###########                          ########################################         #############",  
  "#######                                   #############                                   ###########                          #############                        ##          #############",  
  "#######                                   #############                                   ###########                          #############     #################  ##          #############",  
  "#######                                   #############                                   ###########                          #############     ###########    ##  ##          #############",  
  "#######                                   #############                                   ###########                          #############     ########### #####  ##          #############",  
  "#######                                   #############                                   ###########                          #############     ###########        ##          #############",  
  "#######                                   #############                                   ###########                          #############     #####################          #############",  
  "#######                                   #############                                   ###########                          #############     #####################          #############",  
  "#######                                   #############                                   ###########                          #############     #####################          #############",  
  "#######                                   #############                                   ###########                          #############     #####################          #############",  
  "#######                                   #############                                   ###########                          #############                                    #############",  
  "#######                                   #############                                   ##################################################                                    #############",  
  "#######                                   #############                                   ##################################################                                    #############",  
  "#######                                   #############                                   ##################################################                                    #############",  
  "#######                                   #############                                   ##################################################                                    #############",  
  "############################################################################################################################################                                    #############",  
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
let keyFound = false; // Para prevenir volver al dungeon
let isAnimating = false; // Para prevenir múltiples animaciones

// Posición de la llave
const keyPos = { x: dungeonMap[0].length - 32, y: dungeonMap.length - 15 };

// Definir enemigos con posiciones y formas
const enemyTypes = [">:(", "0_o", "o_o", "=o=", ">-<", "D:=", "^_^", "-_-", "x_x"];
let enemies = [];

// Función para encontrar posiciones válidas para enemigos
function findValidEnemyPositions() {
  let validPositions = [];
  for (let y = 1; y < dungeonMap.length - 1; y++) {
    for (let x = 1; x < dungeonMap[y].length - 1; x++) {
      if (dungeonMap[y][x] === ' ') {
        // Verificar que no esté muy cerca del spawn
        let distToSpawn = Math.abs(x - spawn.x) + Math.abs(y - spawn.y);
        if (distToSpawn > 10) {
          validPositions.push({ x, y });
        }
      }
    }
  }
  return validPositions;
}

// Inicializar enemigos en posiciones válidas
function initializeEnemies() {
  let validPositions = findValidEnemyPositions();
  enemies = [];
  for (let i = 0; i < 15; i++) { // Más enemigos
    if (validPositions.length > 0) {
      let randomIndex = Math.floor(Math.random() * validPositions.length);
      let pos = validPositions.splice(randomIndex, 1)[0];
      enemies.push({
        x: pos.x,
        y: pos.y,
        type: i % enemyTypes.length
      });
    }
  }
}

function isWall(x, y) {
  return x < 0 || y < 0 || y >= dungeonMap.length || x >= dungeonMap[y].length || dungeonMap[y][x] === '#';
}

function isEnemy(x, y) {
  return enemies.some(e => e.x === x && e.y === y);
}

function moveEnemies() {
  for (let enemy of enemies) {
    // Movimiento aleatorio más agresivo
    let dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
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

// Timer para mover enemigos automáticamente
let enemyMoveInterval = null;

function startEnemyMovement() {
  enemyMoveInterval = setInterval(() => {
    if (dungeonContainer.style.display !== "none") {
      moveEnemies();
      drawMap();
    }
  }, 400); // Más rápido
}

function stopEnemyMovement() {
  if (enemyMoveInterval) {
    clearInterval(enemyMoveInterval);
    enemyMoveInterval = null;
  }
}

// Efecto glitch mejorado - paredes que se mueven
function applyGlitchEffect() {
  // Crear efecto de distorsión de paredes
  const glitchChars = ['#', '█', '▓', '▒', '░', '▄', '▀', '▌', '▐'];
  const originalMap = dungeonMap.map(row => row.split(''));
  
  // Aplicar distorsión aleatoria a algunas paredes
  let distortedMap = originalMap.map((row, y) => {
    return row.map((char, x) => {
      if (char === '#' && Math.random() < 0.01) { // 1% de probabilidad de distorsionar paredes
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return char;
    });
  });
  
  // Aplicar la distorsión temporalmente
  let originalDisplay = dungeonDisplay.innerHTML;
  dungeonDisplay.innerHTML = distortedMap.map(row => row.join('')).join('<br>');
  
  // Restaurar después de un tiempo
  setTimeout(() => {
    dungeonDisplay.innerHTML = originalDisplay;
  }, 100);
}

// Música para efectos
function playKeyMusic() {
  // Crear audio context para generar música
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Frecuencias para una melodía cyberpunk
  const frequencies = [440, 554, 659, 784, 880, 659, 554, 440, 554, 659, 784, 880, 659, 554, 440];
  let currentNote = 0;
  
  function playNote() {
    if (currentNote >= frequencies.length) {
      audioContext.close();
      return;
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequencies[currentNote], audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    currentNote++;
    setTimeout(playNote, 200);
  }
  
  playNote();
}

function drawMap() {
  // Crear el mapa base con textContent para evitar problemas con caracteres especiales
  let mapText = dungeonMap.map((row, y) => {
    return row.split('').map((char, x) => {
      // Jugador
      if (x === playerX && y === playerY) {
        return '@';
      }
      // Llave
      if (x === keyPos.x && y === keyPos.y && !hasKey) {
        return 'ꄗ';
      }
      // Enemigos
      let enemy = enemies.find(e => e.x === x && e.y === y);
      if (enemy) {
        return enemyTypes[enemy.type];
      }
      return char;
    }).join('');
  }).join('\n');
  
  // Usar textContent para el mapa base
  dungeonDisplay.textContent = mapText;
  
  // Ahora aplicar colores usando CSS
  let mapHTML = mapText.split('\n').map((row, y) => {
    return row.split('').map((char, x) => {
      if (char === '@') {
        return '<span style="color:red">@</span>';
      } else if (char === 'ꄗ') {
        return '<span style="color:yellow">ꄗ</span>';
      } else if (enemyTypes.includes(char)) {
        return `<span style="color:#48ee82">${char}</span>`;
      }
      return char;
    }).join('');
  }).join('<br>');
  
  dungeonDisplay.innerHTML = mapHTML;
  
  // Aplicar efecto glitch
  applyGlitchEffect();
}

// Animación especial al encontrar la llave
function showKeyAnimation() {
  playKeyMusic(); // Reproducir música de llave

  stopEnemyMovement();
  keyFound = true; // Marcar que ya se encontró la llave
  isAnimating = true; // Bloquear movimiento inmediatamente
  
  // Asegurar que el fondo negro se aplique inmediatamente
  dungeonContainer.style.background = "black";
  dungeonDisplay.innerHTML = "";
  dungeonMessage.style.textAlign = "center";
  dungeonMessage.style.fontSize = "clamp(16px, 4vw, 24px)";
  dungeonMessage.style.position = "absolute";
  dungeonMessage.style.top = "50%";
  dungeonMessage.style.left = "50%";
  dungeonMessage.style.transform = "translate(-50%, -50%)";
  dungeonMessage.style.color = "#48ee82";
  dungeonMessage.style.bottom = "auto";
  dungeonMessage.style.padding = "10px";
  dungeonMessage.style.background = "transparent";
  dungeonMessage.style.border = "none";
  
  const messages = [
    "You found the ?̶̖͚̠̫̦̼͔̈́̑̾́̂͝?̴̺̘͔̝̖̯̲͉̊̋̊̈́̅̐͘̚̕?   key",
    "Congratulations !!!"
  ];
  
  let currentMessage = 0;
  let currentChar = 0;
  let displayText = "";
  
  function typeMessage() {
    if (currentMessage < messages.length) {
      if (currentChar < messages[currentMessage].length) {
        displayText += messages[currentMessage][currentChar];
        dungeonMessage.innerHTML = displayText;
        currentChar++;
        setTimeout(typeMessage, 60);
      } else {
        // Terminó el mensaje actual
        if (currentMessage === 0) {
          // Esperar un poco antes del segundo mensaje
          setTimeout(() => {
            currentMessage++;
            currentChar = 0;
            displayText = "";
            typeMessage();
          }, 1000);
        } else {
          // Segundo mensaje terminado, hacer parpadear
          blinkCongratulations();
        }
      }
    }
  }
  
  function blinkCongratulations() {
    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
      if (blinkCount % 2 === 0) {
        dungeonMessage.innerHTML = "<span style='color:#48ee82;font-size:clamp(16px, 4vw, 24px);'>Congratulations !!!</span>";
      } else {
        dungeonMessage.innerHTML = "";
      }
      blinkCount++;
      if (blinkCount >= 6) { // 3 parpadeos
        clearInterval(blinkInterval);
        setTimeout(() => {
          // Volver a la terminal
          dungeonContainer.style.display = "none";
          dungeonContainer.style.background = "black";
          dungeonMessage.innerHTML = "";
          dungeonMessage.style = ""; // Resetear estilos
          isAnimating = false; // Desbloquear movimiento
          // Agregar llave al inventario del juego principal
          if (!gameState.inventory) gameState.inventory = [];
          gameState.inventory.push("key");
          output.innerHTML += "<br>🎉 You found a mysterious key! It's now in your inventory.<br><br>";
          // Auto-scroll
          output.scrollTop = output.scrollHeight;
        }, 1000);
      }
    }, 500);
  }
  
  typeMessage();
}

// Modificar handleMove para mover enemigos y detectar colisión
function handleMove(dx, dy) {
  // Si está animando, no permitir movimiento
  if (isAnimating) return;
  
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
  if (newX === keyPos.x && newY === keyPos.y && !hasKey && !isAnimating) {
    hasKey = true;
    isAnimating = true; // Bloquear movimiento
    showKeyAnimation();
    return;
  }
  playerX = newX;
  playerY = newY;
  // Si después de mover hay colisión con enemigo, respawn
  if (isEnemy(playerX, playerY)) {
    playerX = spawn.x;
    playerY = spawn.y;
  }
  drawMap();
}

document.addEventListener("keydown", function(e) {
  if (dungeonContainer.style.display === "none") return;
  
  // Si está animando, bloquear TODAS las teclas excepto ESC
  if (isAnimating) {
    if (e.key === "Escape") {
      dungeonContainer.style.display = "none";
    }
    return;
  }
  
  // Si la animación está activa, bloquear todas las teclas excepto ESC
  if (keyFound && dungeonContainer.style.background === "black") {
    if (e.key === "Escape") {
      dungeonContainer.style.display = "none";
    }
    return;
  }
  
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
      // Si ya se encontró la llave, no permitir volver al dungeon
      if (keyFound) {
        output.innerHTML += "<br>You've already found the key. There's nothing more to discover here.<br><br>";
        inputField.value = '';
        output.scrollTop = output.scrollHeight;
        return;
      }
      
      console.log("Secret pixel clicked!");
      console.log("Dungeon container display before:", dungeonContainer.style.display);
      dungeonContainer.style.display = "block";
      console.log("Dungeon container display after:", dungeonContainer.style.display);
      playerX = spawn.x;
      playerY = spawn.y;
      hasKey = false;
      initializeEnemies();
      startEnemyMovement();
      dungeonMessage.textContent = "Use arrow keys to move. ESC to exit.";
      drawMap();
      
      // Ajustar el tamaño del mapa para diferentes pantallas
      adjustDungeonSize();
    });
  } else {
    console.log("Secret pixel element not found!");
  }
});

// Función para ajustar el tamaño del dungeon según el dispositivo
function adjustDungeonSize() {
  const container = document.getElementById("dungeonContainer");
  const display = document.getElementById("dungeonDisplay");
  const message = document.getElementById("dungeonMessage");
  
  if (!container || !display || !message) return;
  
  // Obtener dimensiones de la ventana
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Ajustar el tamaño de fuente según el dispositivo
  if (windowWidth < 1200) {
    display.style.fontSize = "10px";
    message.style.fontSize = "14px";
  } else if (windowWidth < 1600) {
    display.style.fontSize = "12px";
    message.style.fontSize = "16px";
  } else {
    display.style.fontSize = "14px";
    message.style.fontSize = "18px";
  }
  
  // Ajustar el padding del display para pantallas pequeñas
  if (windowHeight < 600) {
    display.style.padding = "5px";
    message.style.bottom = "10px";
  } else {
    display.style.padding = "10px";
    message.style.bottom = "20px";
  }
}


// ENDINGS

// Animación para usar la llave
function showUseKeyAnimation() {
  // Crear overlay negro
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #48ee82;
    font-family: monospace;
    font-size: 1.1vw;
    text-align: center;
    overflow: auto;
    padding: 0;
    margin: 0;
  `;
  document.body.appendChild(overlay);
  const audio = new Audio('music/good_ending.mp3');
  audio.volume = 0.7; // Puedes ajustar el volumen
  audio.play();
  const messages = [
    "Without a second's hesitation you get up and run until you can feel a door, you use the key and get out of this nightmare.",
    `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  ..  ...  ...     ........'.....''.'','.':ll;.,:,,,,.. .;;........  ..''.            ..'.             .........   ......  .     ...        ...         .. .....  ...    ...  .'...'cxd:,..    .':::cl:'''................ .....  ......',. ...  .  ..             .....    ... .   . .       ...... ...........   .;'..  ...  ...  ..      ..... ...      ....... .....     ....'..............................'.........'................',.....,';c,.','......;c'...''....,,.,,....'.';;,.......,;..'......,,....
               .         ..'. ..... ..;;:;',,;..'. .... .;'.'.       .'.                ..                  .                                                                   .,lol,.         'lol:,,,,'.'...   ... ..                ..                                 .                                       ',                                                            ..    .  .. .....    . ..  .. ....      ..               ..'.  ........'................    ......  .'..;;.   .  ... .'.   ......'.
      .  .     .    ...     .  ..  .':;,c:,,:c'......  .,..,'....     .                 ..                  ..                                                                 'cll:.       ..   'co:'',;::,...       ..      .  ..    ..           ..                     .                              .       .'.               .      .                              .    ..             ...    ....  .   ...   ..   ....           ....    ........... .....  ......  ...,.',.....'..........''.... ..........
   ....             ..   ..    .'..',cl:;,,::,...''.........  .      ...                ..                  ..                                                             ..:;,,.       .......,;cdo:;..,;.....                       ..                                                                        .,'                                                     ...   ....           ...  .   .....   ........    ..  ....    .'..         .......   ... . ....'............'''...     ......... .,'... ..'
                ....     ',.    ':,;c:lodc,;;;,.,. .''...;'      ...  ..                ..                  ..                                                 ..       ..';:c,.         .'......,:looc..'.  .;;,;..                   .                                                              .         .;:.                      .                             .               ..    .  .     ....'.   ..   .   ...   ....    ...    .....  ...  ...  ..........;;..... ......    .......'.  ..............
                 ...     ..  .  .',,,;cldo:,.;oc;,.  .''.'.  .     ...                   ..                  .                                                 ..      .;c,..          .  .....''';;lo'. .'.......'.         ..                                                                       .         ':.                                  .            ..    .   ..             .........   ..  ..   ...  .......  ..   .   ...            .. ..''...'....',,;,. ..   ....  ......... .. ..  ..,;........
,.                             ......,lcllc,',;:'.....''....';.      ..    .             '.                                                                     ..   ... .             ,,  ....'llcdxl;. .,,.'..                                                                                                ,,                                   ..     .  ..... ..          ...       .....  ..  ...  .    ..     ...    .. ....   ..... ..   ..    . .. .... .,:'.,.......    .....','.....  ..  ...';,''....'
..                      .         .....'ccl:,:,.,,..:;..  ...,;. .   .'. ..              ..                                                                      .'.             .    ....  .:'.;;;oxo:;,,;'  ...   .....            ..         .         .                                        .   .       ';.    .                                              ..         .. .    .............    ..               ... .. ....   ... ......... ..... ..... .... ...... .. ...  .. .'...'... .. .';'....';,,''
 .'                             ..  .....,cc;;,',..,dl;;.'ll'...    ..'.                  ..                   .                                             ....,.                ... .....':;..';;cxdcc:,...  .  .......           ..        .         ...   ...                                 ..         .,.                                          .                   ...  .   ..   ................     ..      .....  ...     ..      .......''.  .. ......... .........   ............ .....:;. ....,;' 
  ..          ..         ....    .....,:cc::ll:::. .:,','':c'.     ....      .            ..                  ..                             ..                  ..                     .....';,..',lx:':c,.....';,. .              ..                     ..                                      .         .,'                          ..                          ..                ...   ......'. ... .. .... . .... .....  .........    ......''..........'. ......  .'...... .......,'..... ..'..,,......',..
   ..                        .   ..... .;:;ldxxd:..,,......;'.  .';...       .            .'               ..  ..                                .               ..             ..      .'....;;;;,':xo:;,. .'....'.                ..                   ...                                      .          ,:.                                                          .                   .... ......... ..'.    ... ...  . ....'.. ....  .... ..''.............. .... .....  ..,'.. ............'''..... ....''
   .'.                         .. .. ..''.'''coc;:cl:'..';;,;'. ...                       .,.              .    .                                                 ..                     ......';:c',col;;'..,:' ..                 ..                ...                                         ..        .:,                                                          ...           ....  .'. ........... ...         ..      ..''......   .'....  ...,,.......''  ...''..  ............ .',.. .'...''.....''..'.
     .                         ..   ....,,;:,:o:;olcc:;'.'l:..''..       ..               .;.            .                                                         .         .          ';,..   ..,;lc;;;c'...;.  ..  .            .'.                                                             ....     ''..                                            .       ..        ...   ..  .... .''...  .'....    .. ...    ..   .....'.  ...  .  . ....... .......',;,......'.  .....'..',....''..  .':,. ......;:.','
     ..                       ...   .. .:oc;,cxl:clllllc;'',,;;. ..   ...'.                ..                     ..                                               ..                   .....    .;lolc,;oc..'....,.   .     .     .'.                             .                                       ';.                                                  ..     ...  ..      .     ... .....  .,...      ..'.. .       ........  .. .,'.      .,.    .....'...,;,..',......'''''.....''..'...,,..'... .,:,'',
      ..                   .  .c,.. . ..':oocco:;xkoodocc;'''.';. .   ......               .'                     ..                                                                   .. .'.. ..':odl:;,,:;.  .....   ..          .'  .                                                    ....          .:'                                          .                ..   .           ...  ......  .......  ........            ...     ....   ..  '.   ...............'.............,:'................'...;,'. 
       ..         .        ... ..'...  ..;:;lolc;cdkOk:',;:.  ':.       ..    .            .,.                         .   ..                                                            .,...';;:;:oocc:'.,.  .           .       ,,  .                  .                                   .'..        ',.                       .                  .                 ...          ......  ....        ...  ..... .  . .......    .    ..............    ........ ...... ........ .....'...,'..   ''....,;..,;...
        ..                  ...  ....   ....'clol,.:do:..'l:',,...'.         ..             '.                                     ..                               ..               .. ..;'...,,';clol;,'.,c;.  ... ...           ..                                                            ...'.   ';.                                                      ..      .    ....   ............ ..    ....          ..    ....           .''.........  ............ .......'.. ........,'.'....   ..',,.',...'...
         .                      .'...  ..   .';oo;.'cxd:,,,'',,'..,'      ';...             .'                                                                       .                  .,;. .'..':c'':ol:'.',..'......            ..              .                                            .  ..',..;;    .                         ..  ..                 .. ..              .   ........ .. ..      ..... ..'.   ...   .'...,.. ...    .....     ..  ...'. ...... .'....    ...',''',.   ...........''...;;..
          ..                      ...     ..',','...;locl:,;'.:;.:,,:,';'.;... ...           ..                                                                                  ..      ..  ..''';:,':xOx:..,;'','..              .                                                                  ..',.     .     .                               ..   .       ...  ...        ..   ...',.......         ........   ...   ..  .........   ...... ........;c,...  . ......'.... ...'....,.  .,'...........','';;'
           .                    ..    .....,::,::;cc:o:;c',l,.;',:,;c,,;.::.;,,l:.''..  .    .'                    ..                                                 .                  .. ...,:l:';,,okdc:;,,;;,..               .                                                                   .,.            .                               ..            .. .         ....   ...':,.   .....     .      ..  ..    ..   .  ........ ...........''',;,....... .....','...   .,'.,,'...,:'..'.. .....',..';'
            ..                   ......:clc:cc;;'.'....                  . ..... ...'..;;... ...                    ..                                                ..                  ...,''.....';dxl:c;...',.   .  .        .,.                                                                  ;,.                                                            ..    ..    .   ..  .....    ...   ..  ..    ..         ..  ... .  ....  .......  ............  ..','''... ...',;'..,..';;;;...  ......'. ..''
            ';.             .',..,,;:;''...                                        .....;;'....'                    ..                                                 ..                  ....   .. .ldlllc'....'.   ....        .,.                                                                 .;.                 .                        ...   .'.      .      ...    ..     ........   ...        ...  ...  .....  .'' ...    .    ..... ......'.  ..''.. .,;'.',.....   .,....,..';,.. .......'.....''..
            .;''.''...',.....,,...                      ..   ..        .               ...',..';,.                   .                                                 ..            .     ......''',::;clldo;......  ..          .;.                                                         ..     .;'                                            ..            .     .    ......    ..... .... .  ..        ..  ........   .''.    .. .. .. .......''.............  .. ... .....'.........;'........,,........,';
            ';,;;,,'..',.                         .,'';;,;;'.:l:'':'. .;;,... .             ...;l:.                                                                     .                   .,'....'cc:lxdc;,..,,...'''.      .   .;.                                                            .   ,,.      .                    .....                 . ..    ...   ..    ..      . ..... ... .... .... ....  ..   ..  .     .... ......     ....;,....',............   ......''.''..'.....';;,;........',.. .';c
              ....                   .    ..      ..;;,'.''',:cl::o:...;:;,.  .               ..;:,.'.                                                                  ..                     .....';,;oxo:'... .;;';;. ..   ..  ,c,.                                       .                      .;.       .               .  ..........             ..  ..  ..      .  . ....   ....   .....  .......,.';..  ...        .    ... ..   .   .    .''...,...................... .......','....,,',,,'.....,;'.....'
              .   ..                .... ...     ..  .'','.',c:;clc;'........'.                 .,;,','.                                                                ...                      .......,od;,;'. ..  . .',.       ;o,.   .                                                         .,.                        ...         ..                . ....     ......   .   .......  .......  .... ........     ...       .....  .  .''.  .   . ....'.. .''',,,...'.  .... ......'...'.....,,.',,''..''....'
     .       ..    ..                 .      .......    ....,,::lkxlc;...'.  .  .                .,'';;,.                .                                               .,.                   ..,'.....lkxccl,..... .  .     .. .cd:.                                                             ;;          ..            ...           ..                  .    .  .. ..   .....  ..........'..  ..... ............  .... .....  .. ... .... .... ...''..'..';,,',;. .;'....''..........,'. .',,'..':;,,'',;;;;;
             ..     .'.               .     ..'.  .'.....'';:'':odool;.,;'.  ....       ..        .,;,,'...                                                               ..                   .,;'.'::;:ldolc;....              'odc:.                                                   ..      .:'                        ..             ..          ...        .'...  ... .. .'.......'..  ..   .. .'. ... ... ......   .. ... ..'...... ....'......''.  '.......'.. .,,''...','.......'''...',','.';::;'.:c;;:l
                     ..                         .. ....''.......;llodxl:;,'..;'.  .... .           ;l;'..'.               ..                                               ..                ..;'..';,;c;cool:,'... ...          'loll:.          ..                                             .;'.          ..            ..             .'.        .',,.       .............  .....  ..    ..   .............  .. ..    ..  .... .. ................';,........ .;,..  ''..''''';;..  ..',,,;;''....;:;;'','.,::
             ..        ..                         .    ..,.  .,';c:cdOd:;,;,.'....                 .';;,'..                ..                                  ..      .  .,,                 .........::clcc;.'.  .;...   ..   .,loc;,....                                                 . ...;,                     .     ....          .'.      .,,. .'. .  ....     ...   .  .. .  ..               .:,.....    ..............  ...  ..... ..'''. .,;''..';'  ..,,.. ....''.....'......,:,,'.'..,:l;..','.';,'
             .'         ...                     ...'.......  ..;l:;,:dkdc,;c'...,:..''...            'c;,,'                .'.                                         .   ...                  .....'..,;cc;,''.  ...    ..    .,ll;'.....                                                ..   .;.              ..             .,.         ..       .;.   ..  .   .'...  ........ ...   ..    ...     .. .'....... ....'. ..'....,'..  .  ....  ...;,..........'.....';;'.. ....''...'.....''.',..,::,';:',cc,.;;,,
             ..          ...                     .'...   ..  ...;c,':c:::cc:....''''.  ...       .   .:c;:;.        ..     .,,.                                             .'.                .',' ...'lc,:c;,,;:'.            .,:c,.            .                                       ...   '.           ..                ..,,,'   ............','......  ... ...   .... ......     ...  ....     .. ...  ...  ...'.    .  ............;,.. ..','... ......'.....'..,,..,'',,'...  ....,'.....,;,...;;;lo:,::;;
 .           ..            .'                            .. .,..','.,;:coxd:,:,';;'.    ......        .,ll:,.              .....                                             ..              ..  ..    .,:,:cclc;;'..           .';l:.               .                                  .....  ,;.                                ..'....      ......   .,..   .   ...  . .    .... .'.         ...   ..    ...      ..,,.    .. ..  .,. ....''',........  .',....   ..'.';....''..,,....',.....,'..'''.',;cc:;'','.
 .                           ..                           .. ..,:'..'cccllol;;:cl;'.    ...     .      .:oc,.              .. ..                                             .'.                   ... .,;clcc:;;'....'..  .  ..,;lo;                                                  .';,,. .:,                                .'..                   ..          ..  ......  . ... ..      ........... . ..    .......     ............  .,';;..........,,..........'...'...''..,....',,'...''.,,;;',ll:;'.',.';,
                              ...                         ...'...,'.;olc::cddoc;oc;,'..         . ..    .,c;.             ..    ......       .                                .'                .. .... .,codl;'.....'.. ..   .:c:co,                                                   ....,;c,.                              ....                   .''.              .........  .  .. ..  ...... ... ..........,'.   ........... ....... ...,,..'. .. .',.......',...''...',..........,c'. ...,,'...,;;;:,'..';cc
                               ....                         ... .....','  .cll:'cdo;''....   ......       'c'            .'..    .                                             ..                .   ...,:;co:;,.  ...      .':ll:,c;                                                    .  .;:.                             ...               .........        ....    ..';'....  .     ..  .....     ...  . ...;;.  ......''.       ..'........''.. ... ...    .......... .';'... ..'';c:'..''..,;;;;,..,:;''..',:
                                 .'.                            .''..........'cllc;;:'...  ...'.       ..  .'.                                                                  '.                .   ....;odllc. .,..... .';lol;..;,                                                       .:'                             ...                ....    .      ....        ..'......'.   ...   .....   .... ..   ................''..... .'...   .'.........    ..............,:'..''..,c:;:'.;c'...'','.''..''.';:::
.                                  .'.                    .     .....':c;','..,loc,';'. .....  ..   ..      .'.                .   ..                                           .'            ......  . ..;lolll;.,,''... 'col:,.  ..                                                      .,'.                            ...               ...  ...   .       ....   . .. .'....  ... .... .   .....,...........  ..... .........',....,. ... ................,'..'.. ...'....'',,,..'..;'.;:;:;......:c:;',;,,;lc
   ..        .                      .,,.                     .. ... .;'.......;ldllclc,... ..'....  ..        ..      .             ...                                         .,,                  .'.. .;co:'....... .:lol,.    .'.           .                                         ';.                            ...                ..   ...  ..         ...  ......   .    .... ....    ........................''   ..'..,'...''.','...,'.',..';,'..,:,.... . .,;,. .''.',,''.....,:;;,'.',,;lc;:;;c,.,l:
          .                          .',.                   ..  ..  ';.  .. ..;cccooc,'.,;'.';.  ......        .,.  ...              ..                                         ..:'               .  ..  .':do;..'...';loo:.      .c.                ....                             .. .;'           ..            .  ...                ..      .          ..   .......     .        ..     .  ........  .... ..;,'.........'...'.....',..,'..,;,,'..'.............. .,,,..','',;;.......:l,..,,',,;::;;,,:,,,;,
        ...                           ''...                    .... ...  ....',',:::ol;'.,;','.   .             .;,'.                 ..                                          .'.             ..    ....':;','''':odl;.        .;.                                                    ''            ...         .',..      ..         ..            .      .. ..   ....  ... ...    ..      .......   . .. .. .......,'.....,......''';:,',..,''.. .';''''.';,,'.......''..',:::;'....'::;,'..'::'.':;,;'.',;::;
                                      ..  .'.                 ..  .      ......',co:;ll,..;'';.  .''.            .,:.                    ..                                    .. .''                   ...'',:;'';lxl;.            '.          .  .                                ..   .;.                      ....     ....          ';'     .  .          ..... ...     ..   .. ...''.     .......    ..  ......    .......'..''...:oc,,,'....'.....,;'....;;;,.. ...'..''..,;'..',''',,''..,';:,',:c;',',''.''
                                      ..    ..                          ...  . ..';:''colc;.......'...             .;'                   .'.                                       .,'.                   .,;;c:cdo:,..   ..        ,'       .. ..                                   .   ,'                     ..,.   ...';.            ',.       .... ...     .... .'.   ....     ...  ...  ..  ...     ...   ......  .............. ....'''........''',;..'...,,.....';........'...''..;,,,.';;,''..,:;,;:::;..,;
                                       .      ...          .        .....   .   .,,;..:xxl;;;,.   ..  .             .''.                   ..                                       .;.          .  ..  ..':loxkxc.      ...        ;:..                                                ';.        ..        .....'...... .'             .....   ..  ..    ..     ......   ...       ............  .  .  ......''........  ...   .... ....,:;..'....'.'..'. .....'............,. ....,'. .',:c,';cc'..,::::,'':l;'.,
                                                ..                    ..       .,'..'',coocll;.   ....                .,.                  ..                                        .;.           ... ..:dxl:;'.                   ',        .                                        .:'         ..       ..    ....    ''...          ..     ..     .. ...'..  .'.  ..   ..      ..,,...  .....   .. .... .... .......  .   .....  .,.'...'','.........''''. .............,:,'...;c'...,:;,'.':,..',,,,'.,,;:;,,c
                  ..                              ...                   .      ..  ..'';::llc,'..';.                    ...                 ..                                       .cc'',,,,,;cccc;;'....'.      ..... ..         .;.                                                ,,                   .........    .'.  ....      ..      ..     ..... .. ..... ..........    .......  .   .....  .'.       ...','''''. .'. .'.....''.......... .....',,..... ......'';:c,'...;c,''...''',;::,',:,';,',,,:;,':
                   .    ..             .                                      .  .  ..,'''':c:;';:'.  ...     .          ...                .  .                                     .lkkkkOxoccc::;.           ...''... ...   ..   .:.         .                     .               .'  .                  ... ....    .'      ......',.  ..  ...         ..  ... ........ ....   .  ......    ....  .'.  .. .....  ..,;....''.....  ....'''.''.... ......''...',',,''.','...'.....,;'.....';,:c::cll,,cc;',::;,,'
                                      ..              ...                     ..     ......':ol;,''. '::....  .            ...              .                                         .,l:....                 .;;'.'''.  ..         '.                       ..      ..             .;.                                 ..            ..  ..              ... ...       ...  ....   ...  ...   .. ..  .... .......    .....'.''..''....,,...,,.................'',;::;,,:,,..,......','..',,;::lc;;c:,',::,,:;;:::;
                   ..                  .                ...                    ..    ... .',:l:,;;,'..,,..     .    ..       .'.           ..     ..                                 ....'.         ..    .....',ccc;'......         ..                                              ,,.                                 ..      ..  ...  .     ..   .. .  .    ....  ......   ....   .. .... ......... ... ....  ...  ......... .....,,'.....'...........  ....';..'',;;,',;,;'.,,'..;'..',,;;;;,.';,;clllc;;;:c;,:
                                                          .'.                      .......',,,:oxl;;;''..      .    ..        ...          ..      ...   .                               ..         ...   ..  .,',cl'......          ';.                                ..          .;.                                 .'.      ......                    ...  ......',,'..  .. ..    .......  ... ...  . ....... ......'..  ......,,;;,....''.......',,'. ...':;.....;,. ...'';cl;'..',;cc;'.',,,,;,'',:;,;clooc:o
..                  .                                       ...                         ..''',:odoc;,'..... .   ..              ...       ,.        ..                                    ''.               ...',:l;.... ..          .,.                                 ...       .:,               .              ..   .'      .,'...   ..      .. ....   ..  ............  ..    . ..,....  ...  ... .  ...........'....  .....';:,,,','.. ...... .........,;:;''.......,;,,',;,',;;;'.,:;,,,...'..;:;:ldocllclc:
.,...              ..                                         ....                 ........','..;c::,..',...... ...               .'.   .'.                                               .,,               .....;c:,........        .'.        ..                    .''',;,,.... .,                ..            ..   ......  ..'       .....    . .... ................,.    ..  .. .....  ... ......'. .'..   .................',..,,'..... ...,,'',;'':c,..;:'..... ..':c'..,..,;:,...;ll:cc;',::cc,,:;c;;odo:,
  ......           ..                    .                      ....                 . ...  ....'llcoc''.. ..',;::c;,';:;;::,,:,'...,'....               ..                                .;'                 .'''clc:'...'.        .;;.            .  .          .:dxkOOOOOOOkOdloc.                .                 .'. ...;;.                .   ..   ........'.. .  ..  ...     .....''...............'........... ...........'. .....',,.......,'..',;'...,'...'...',;,..'',;'.....'';;,;c:;,col:,,;',:clc::c
      .'..... .    ..                      .                       ....                    ... ..,;;:,''';ll::;:c::'..........'..,,;;:lc.                                      . .          .;'                .','.''.,'.....        .,'        ..               'x000000OO00000000o.                                   ..   .''..        .          ..  .   .....''.     ... ..   .........   .'..  .........','.',..  ..'.......,,'........,'.......'....,'..;;'.'','..;;;,',,',,',,','...';::,,,';::::lcc::c:;c:
        ........  .'.                                                .'..                   .. ..':cllc:,,;..              .       ..,;cc;.               ..                     .. .        .;'               ........,,.....   .    .::,.  ....              .  cO00000000000000O0k;          .     .                  ..   ..  ..          .       ..  ..   ..',.    ..      ..   ... .',...  ',...',','.'..,,.  .......'..,..';:''';,...''....,,..,'',;....,:c'.....,,'.,;'..''''....';::;;c:,.,:loocclllc::ldoc
        .. .''..''.....                                           ..    ....             ....';:;;c:,.    .......'... ..  .'.        . ..;cc;.             ..                            .....:c'              ......';,,'. ... ...   .cc,.                      .dOO0000000000000OO0ko;'''.   ..                        ..   ..   ..     ..      ....''  ..  ..........'.   ..     ..  ..,;....... .................''. ..,,'''',::'..;'..','.,,':;''...,....,;;c;.....''',''''';::'....';:lccoc:,,clol;cc::::clddc
              .,:'..,.  ..                                        ..       ....       ...,,';:'.     ..'',;:dxololc,....  .....           .;oc'            .                                ...,c'             ........,:,. .....      ,;''.                     'lox000000000000000000OOOOo;'.      ..                 .'.   .''.   ..   .   ..      .. .......  .,'..  ..   ..  ....   .....'.....  ..   .'..............','.,;;:;,'..''''..,'..';,''..'.....''.',..,....;:,,,;:::,'',;.'';lllddc,,::;;llc:coocccl
               .. ....,:,.                    ..                            ......  .',,,,.         .....',,;cccccc:,....  . ..      ..     .',;..         ..   ..                              .,.               .....,,..'''.        .'.,.                 ..  .,cxkxO000000000000000000000kddc::;...                  ..   .'....  ......   .   .'... ........  .......    .   ..  .. .  ...    ....... ......'.......''''...':'':;'.',:c..,',,.....'..........,;.......';:c:'..::'.'',,':lllc:;',::,',cllolloc;:
     ..   .         .,::....                   .                              ....,,'.              ..  ......';:c,;c;,:'..... .. .. ....      .,,.        ..    ...                        .    .;'           .. ......'...'...       .,,'.                 ..  ..,oxdkxdO00000000000000000000Okk00xc,'.    ..        . .'   .'.  ... .,...      ....... ... .  .... .........   .   ...      .'.....'''....,,','.. ....''',,'......,'....,. .,'.............''..''......',,',,.....'.';;;;;;;:;.,;;:c:;;;:cc:lol,'
     ....              .,'....                 .                                   ...            ..... ..... .'::,:olc:,','......        ..    .';,..     ',                                     .;.           ...  ...,.''...  ..    'l;'.                 .     .;::o;.o0000000000000000000000000000Oxdlc:'...    ... .'   ..    ... ....    ..... .     ..    .  .'.........  .. .'.'.     ..'......,'....'''... .. ..  ..,'....... ...,......','.'.''........'..''''',;;,,,.......':c,::;,,;:cclccdc,;:c::oxd:'
          ...             .;;,,..                                                      .           ..   .....  ...'.',,,clcc;..''.'......          .','.   ..        .                       ..    .,'            ......,;;;,.......   .l:'.           .    .       ..,:. 'xOocx00000000000000000000000000000koc:ccodkkl'..   .'.... ..  .'.    .    ... ....''...    ..   .   ..  ..  .'....  .. .......  .....    ....',......',;,.............''..,,..,......'''........';:,..';;;'.,cc,'',;;::;;cccoc',;;llcllcc
..        ... .     .     ....;c:.                                                         ..            ..  .  ........'';cll:::;,.........     ..   ';;..'.                                  .    .;'               ..,;,;;. ..      .::.            .     .        .'..,cc. ,x000OO0000000000000000000000000OO0OOkkkxdo;  .cddkkd;...  .'...';'.   ...  ...'....   .'... ......  ... .....   .  ...............  .....;;,...''....  ..  ..'''''. .;,....''.',,,'''..';;;:cc;,,;odoc;lo:'''cl;;:c:codd:..;,cc:::;.
   ...     .          ...   .'...... .                                                      ..  ..               .... ...',:oocll:,,'...''.........    .':c:.                           .            .'.               ,c'.';,.  ..  ...,,.                               ''.   ,x00o;oO000000000000000OOO00000ko;'.....,lc  ,dl::oxkd:.  .,,cdO0Oxl;'....... ..:odc;'..'''........  ';;:;. .......  .........,;::'......','...''...........';:lol,.....'...''..;;'..'':c:co:..   'dOOkkxdoc;cl:cl:;::cc;,,,col;'.  
.. .  .......       . ....  ...'''.     ....                                                    ....                ..   ..,:;',col:;,..;;,,;;,.....  .....''.            ...                          ..            ...'.';'. .  . .,;...                                 ,;...'cxx, .ck00000OO0000000000000kc.   ...,ccl,  ..    ..;;...:xkO000000Ox:,'.   .,lk000Oxo;... ..    ..',lOOko:,.  ..........,'.'..cOOdol,...',,.'''.',.....:c;'..o0Oxxo:;;:'..,:,.',..',',c:,.       .lO000OOOxxxdolllc;,;cc:cl:.     
.. ..... ....   ..  ..''...   ..  .'.     .....                                                    .....                ........,col;;::;'.,;:c,...... ..   .....           .                      .                .   .......  .....'. ..    .          ..               ,'   .;;.   .;x000kc:x00000000000Odc;;coo,...     ..        .'lk00000000000Okl,..'okO0000000kxo;.      .,.,x0000Okdl:'.......',,;'   :O000Okdl:,''.........,;,'.    ;k0000OOOkd:,:c'.:;. 'c:;.           .:k000000000OOkxdoool:;'.       
 ....,.  .......     ..'....   .',:,.          ..'.                            .                       .... ..            .. ....',:;.,l:,,;;:;,;:'...    ...  .,,.             ..                       ..         .... .............   ..               .   .           .,.    .......';d0Oc  .lk000000000000000Od;........'.      .,ok000000000000000OOxldO00000000000OOkd:. .''.'x000000000Okdc;,'..',,.   .o000000000Okdc;'.'''.','.      .lO00000000OOkxllc,.,:,.               'dO00000000000OOOOOl.         
.   .'.  .''..'.    ..    ...  .,;:,;:.         .',,...    ..                 ..                         .....           .     ..,'...''',;:lc,.''.'''.......  ...'..           ..                       ...         ..   ..  .....                                      .:'            .,;c:.   .;dO00000kodO00000Oko:;;,'....   .,cxO00000000000000000000OO0000000000000000Ox:'. .o00000000000000Okdc::'     .d0000000000000Oxllc;,.          'x00000000000000Okd:.                  .lO000000000000000kl;.       
...,'.....,c'.     ..    ...     ,c;:;.       ..  ........                                                     .',.          ..  ..  ..,'..'';;;::;,,:,.',.'...    ....     .     .                      .;o:.            ..   ..                                        ,,              .,'.....''.:k000k; .;dO000000000OOxdodlcoxO000000000000000000000000000000000000000000x,  .oO00000000000000000kc.      .d0000000000000000Okc.            cO000000000000000Oo.                    ;k000000000000000OOo'      
',;:;;,,...'',,. ...  ... .   . ...':lc.           ..   ......                                                   .. ...         ..... ..   .',;;,,::;'..'';:...         ..                                .','. .       ... ..                                          .;.                ....   .'',lkd,    .;dO0000000000O000000000000000000000000000000000000000000000000k;  .cO000000000000000000x'       .d00000000000000000Oc             .o00000000000000000d'                    'dO0000000000000000x:.    
:ccldd;';;'','..','...''.....''..'',;;,.     ..    ..... .....'....                              .                   ...        ..          ... .,;;,,::::,'......    ..... ..                               ..                   .                                  ...,' ..                       .'.'.  ...'..;dO000000kc,:x000000000000000000000000000000000000000000000Oc. .cO0000000000000000000d.       .x000000000000000000d.             ,k00000000000000000d'                    .lO000000000000000Okd;.  
:ccodc;ll;. .. ,:,,;,,,'':;';'.....':ooc'            .......... .''....                                                   .....                 .',...',;;,..'....,..',;'.....'''.                                                         .                           ''  .                         ......... .'..;dO000x,   .:dk00000000000000000000000000000000000000000Oc.  :O0000000000000000000Ol.       :O000000000000000000O:             .cO00000000000000000d,                    .:k00000000000000000Oo. 
',::;,,ol:c;..,cc,'';,;;;'..:;..',,ldddc'      .....       ....  . .'...'..     . ..                                         ......        ..        ....,;::.....           ..',,.                                             ...  .     .                          .;. ...                                   ..'..;dOd'  ..'..,lk0000000000000OO00000000000000000000000Oc.  ;k00000000000000000000O;        :O0000000000000000000o.             'x000000000000000000k;                     'oO00000000000000000d;
..';..,:,':l:'.;cc;,:cc;,.'cdl..''.':dkko.      .''.    ..  ............'.... ......                                              .'....              .''....                    ...                                                   ..  .                          ;,                                           .'..'...'.. .''',cdO00000000kl'':dO0000000000000000000Ol.  'x000000000000000000000k;        :O0000000000000000000k,              ;k000000000000000000k;                     .ck00000000000000000k
. .;;;,;,..;c:'.;;c:',col::ldl;'.''',:odo;.    ....  ...,'...............   .''...',.   ...            .                             .'....    ...,'. .           ......        .  ..                                                                                ';.                                            .''..'.      ...',cxO0000Od,.....'cxO000000000000000Oo.  'd0000000000000000000000d.        :O0000000000000000000Ol.             .lO000000000000000000k:                      ,x00000000000000000
.....';,'..,,''''','.;ollloocccc:,.;occxko.     .'''','';.....   ....     ..   . ..,.......        .. ..                              .    ....'coc.        .     ....,'.  ..   .        .                                                                          .;'              .            .                   ..            ...;cdO0kc'''.......,lx000000000000Oo.   :k0000000000000000000000o.        cO00000000000000000000x'              ,k0000000000000000000Oc.                     .oO000000000000000
;c.  ':.  .,..'';'..''::,:lc;cllcccooccdOo.    .,..''....    .. ..    .    ..           ..'....     .. ..                             .     .;;,,...      ..     ..   ...  ...          ...                                                                         ',  ..          ...           .                                     .,ll;''.     .'.. .,ok000000000o.  . ..:ok000000000000000000Oc        .d000000000000000000000Oc               cO0000000000000000000Oc.                     .:k00000000000000
.......    ...''.. ...,;..:c;,:oc;;;clok0k;    .,...... ..'..,.  .:c,.'...                . ...';::,:;.cc......                       .            .....                 .....         .                                                                           .;.                                 .                       ..         ....         ..'....:dO00000Ol..,'...  .;lkO00000000000000k,        .x0000000000000000000000x.              .d00000000000000000000Ol.                      ,x0000000000000
.  ..... .     ..,........;:'';::c:,'.,oOkl.    .;',;,,'.:c'':;..',;,......    .  .            .....,',oc;l,,;,;..;'..                                 .......                        .                                          .                                .,,.    .                                                    ..                         ......':dO0ko:,.   .....  .,cxO00000000000k'        .:xO00000000000000000000O:               ;k000000000000000000000o.                      .oO00000000000
...,',;..''..  ....';:;..,;;'','.,loc'cxk0d.    'c;:o::::lc''::;;'..'.......''...........   .. ..   ..';:clc:,,:,:l,,'.',.    ....                     .....,,..      .....   .   .  ..   .                                ..        ..        .                  ':. .....   ..  .....    ..     .    .   ... ..  ..   ..   .........                      .;:.  'ldc:;.      .';;.  .'lO0000000000x'         ..:xO0000000000000000000o.              'd000000000000000000000Ol.                      'd00000000000

⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`

  ];
  const endingTitle = "GOOD ENDING";

  let currentMessage = 0;
  let currentChar = 0;
  let displayText = "";

  function typeMessage() {
    if (currentMessage === 0) {
      // Primer mensaje: tipo normal
      if (currentChar < messages[0].length) {
        displayText += messages[0][currentChar];
        overlay.innerHTML = `<div style='margin-bottom:2vw;'>${displayText.replace(/\n/g, '<br>')}</div>`;
        currentChar++;
        setTimeout(typeMessage, 50);
      } else {
        setTimeout(() => {
          currentMessage = 1;
          currentChar = 0;
          displayText = "";
          typeMessage();
        }, 5000); // Esperar 5 segundos antes de mostrar el ASCII
      }
    } else if (currentMessage === 1) {
      // Arte ASCII: mostrar línea por línea
      const asciiLines = messages[1].split('\n');
      let shownLines = 0;
      overlay.innerHTML = ""; // Limpiar
      const pre = document.createElement('pre');
      pre.style.cssText = `
        color: #48ee82;
        font-family: monospace;
        font-size: 0.30vw; /* Tamano de la imagen */
        margin: 0 auto;
        text-align: center;
        background: transparent;
        white-space: pre;
        max-width: 100vw;
        max-height: 100vh;
        overflow: hidden; /* No scroll */
        box-sizing: border-box;
        line-height: 0.85; /* Compactar líneas */
      `;
      overlay.appendChild(pre);
      function showNextLine() {
        if (shownLines < asciiLines.length) {
          pre.textContent += asciiLines[shownLines] + '\n';
          shownLines++;
          setTimeout(showNextLine, 30); // velocidad de línea
        } else {
          // Cuando termina el arte, mostrar los textos grandes con animación de tipeo
          setTimeout(() => {
            typeEndingText();
          }, 1000); // Esperar 1 segundo antes de empezar
        }
      }
      
      function typeEndingText() {
        const title = document.createElement('div');
        title.style.cssText = `
          color: #48ee82;
          font-family: monospace;
          font-size: 1.5vw;
          margin-top: 2vw;
          text-align: center;
        `;
        const subtitle = document.createElement('div');
        subtitle.style.cssText = `
          color: #48ee82;
          font-family: monospace;
          font-size: 1.5vw;
          margin-top: 1vw;
          text-align: center;
        `;
        overlay.appendChild(title);
        overlay.appendChild(subtitle);
        
        // Animar el título
        let titleChar = 0;
        function typeTitle() {
          if (titleChar < endingTitle.length) {
            title.textContent += endingTitle[titleChar];
            titleChar++;
            setTimeout(typeTitle, 100);
          } else {
            // Cuando termina el título, empezar el subtítulo
            setTimeout(() => {
              let subtitleChar = 0;
              function typeSubtitle() {
                if (subtitleChar < endingSubtitle.length) {
                  subtitle.textContent += endingSubtitle[subtitleChar];
                  subtitleChar++;
                  setTimeout(typeSubtitle, 80);
                }
              }
              typeSubtitle();
            }, 500);
          }
        }
        typeTitle();
      }
      showNextLine();
    }
  }

  typeMessage();
}

function showEndingScreen(endingText) {
    
  // Esperar 5 segundos antes de mostrar el arte y texto
    setTimeout(() => {
  // Crear overlay negro
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: black;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #222;
        font-family: 'Courier New', Courier, monospace;
        font-size: 1.2vw;
        text-align: center;
        overflow: auto;
    `;
    document.body.appendChild(overlay);

        // Reproducir música de ending
        const audio = new Audio('music/ending.mp3');
        audio.volume = 0.3; // Puedes ajustar el volumen
        audio.play();

        // ASCII ART
        const asciiArt = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣦⣤⣴⣦⣤⣤⠀⣄⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣤⣤⣴⣶⡟⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠉⢉⠟⠀⠀⠀⠀⠉⠛⣿⠛⠷⡄⣀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣤⠞⣻⠉⠉⠀⠀⠀⠈⢣⡀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⠐⠀⠀⠀⠀⣧⠀⡄⢉⡿⠀⠀⠀
⠀⠀⠀⣴⠋⠀⠀⡇⠀⠀⠀⠐⠀⠀⢸⡇⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⠀⠀⠤⣀⠀⠀⠀⢀⡟⠀⠀⠋⠀⠀⠀⠀
⠀⠀⠈⠈⠃⠀⠀⠧⠀⣀⠀⠠⠔⠊⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`;

        // Animación de tipeo para el arte
        const artDiv = document.createElement('pre');
        artDiv.style.cssText = `
            color: #ff2222;
            font-family: 'Courier New', Courier, monospace;
            font-size: 1.2vw;
            margin-bottom: 2vw;
            background: transparent;
            white-space: pre;
            text-align: center;
        `;
        overlay.appendChild(artDiv);

        let artLines = asciiArt.split('\n');
        let currentLine = 0;
        function typeArt() {
            if (currentLine < artLines.length) {
                artDiv.textContent += artLines[currentLine] + '\n';
                currentLine++;
                setTimeout(typeArt, 60);
            } else {
                typeEndingText();
            }
        }

        // Animación de tipeo para el texto final
        function typeEndingText() {
            const textDiv = document.createElement('div');
            textDiv.style.cssText = `
                color: #ff2222;
                font-family: 'Courier New', Courier, monospace;
                font-size: 1.3vw;
                margin-top: 2vw;
                text-align: center;
            `;
            overlay.appendChild(textDiv);

            let i = 0;
            function type() {
                if (i < endingText.length) {
                    textDiv.textContent += endingText[i];
                    i++;
                    setTimeout(type, 70);
                }
            }
            type();
        }

        typeArt();
    }, 5000);
}

function showKnightScreen() {
    // Esperar 5 segundos antes de mostrar la pantalla negra y el contenido
    setTimeout(() => {
        // Crear overlay negro
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: black;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Courier New', Courier, monospace;
            text-align: center;
            overflow: auto;
        `;
        document.body.appendChild(overlay);

        // Reproducir música de ending
        const audio = new Audio('music/knight.mp3');
        audio.volume = 0.4; // Puedes ajustar el volumen
        audio.play();

        // Imagen knight centrada
        const img = document.createElement('img');
        img.src = 'img/knight.png';
        img.alt = 'Knight';
        img.style.cssText = `
            max-width: 40vw;
            max-height: 40vh;
            margin-bottom: 2vw;
            filter: drop-shadow(0 0 8px #ff2222);
        `;
        overlay.appendChild(img);

        // Texto animado
        const knightText = "Oh sweet, sweet knight, do you plan to carry the weight of the world on your shoulders?\n\nYou will be a good candidate, a different one. We will see you soon.";
        const textDiv = document.createElement('div');
        textDiv.style.cssText = `
            color: #ff2222;
            font-family: 'Courier New', Courier, monospace;
            font-size: 1.3vw;
            margin-top: 2vw;
            text-align: center;
            white-space: pre-line;
        `;
        overlay.appendChild(textDiv);

        let i = 0;
        function type() {
            if (i < knightText.length) {
                textDiv.textContent += knightText[i];
                i++;
                setTimeout(type, 70);
            }
        }
        type();
    }, 5000);
}
<div align="center">

# Nullpoint

**A dark, text-based mystery game played entirely through a terminal.**
You wake up in a room with no doors and no windows. There's only a terminal, and something on the other side wants to learn about you.

**Live Site:** [https://alex-gamero.github.io/Nullpoint/](https://alex-gamero.github.io/Nullpoint/)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)

![Demo of Nullpoint](assetsREADME/website1.gif)

</div>

---

## Features
| | |
|---|---|
| ⌨️ **Terminal gameplay** | Everything happens by typing commands into a retro terminal |
| 🧠 **A.L.I.C.E.** | An AI asks you uncomfortable questions, and your answers change where the story goes |
| 🌳 **Branching story** | The whole narrative lives in a JSON story tree, so every choice leads somewhere different |
| 🗝️ **Hidden minigame** | A secret ASCII dungeon with moving enemies and a key to find |
| 🎭 **Multiple endings** | Different paths unlock different endings, each with its own music and typed-out finale |
| 🎵 **Atmosphere** | A soundtrack per ending, glitch effects and animated runes |

---

## Screenshots
| The hidden dungeon | An ending |
|:---:|:---:|
| <img src="assetsREADME/website2.gif" width="420" alt="Dungeon minigame" /> | <img src="assetsREADME/website3.gif" width="420" alt="Good ending" /> |

---

## How to play
1. Open the **[live site](https://alex-gamero.github.io/Nullpoint/)** on a laptop or PC.
2. Type `start` and press **Enter**.
3. Explore with commands, and answer A.L.I.C.E. honestly... or don't.

| Command | What it does |
|---|---|
| `help` | Lists the available commands |
| `look` | Examines your surroundings |
| `use [object]` | Interacts with something, e.g. `use terminal` |
| `inventory` | Shows what you're carrying |
| `a` `b` `c` `d` | Answers A.L.I.C.E.'s questions |

> Some secrets aren't in the command list. Pay attention to the screen.

**Requirements:** a desktop browser (Chrome, Firefox, Edge, Opera). Nullpoint is built for a keyboard and doesn't run on phones.

---

## 🛠️ Tech Stack
- **HTML5, CSS3 & vanilla JavaScript**
- **JSON-driven story engine:** scenes, choices and endings are data, not code
- **Web Audio** for the soundtrack and the key melody
- **ASCII rendering** for the dungeon minigame
- **Hosting:** GitHub Pages

### Project structure
```
Nullpoint/
├── index.html    # Terminal UI
├── main.css      # Terminal styling & animations
├── game.js       # Command parser, game state, minigame, endings
├── story.json    # The full branching story
├── img/          # Ending artwork
└── music/        # Soundtrack
```

### Run locally
```bash
git clone https://github.com/alex-gamero/Nullpoint.git
cd Nullpoint
npm install
npm start
```
You need a local server because the game loads `story.json` with `fetch`.

---

## Coming Soon
- More endings
- Mobile version
- Save progress between sessions

---

## Contributing
Got an idea or found a bug? Open an **issue** or submit a **pull request**!

<div align="center">

Made with 🖤 by [Alex Gamero](https://github.com/alex-gamero)

</div>

# 🌸 LE SANCTUAIRE DES 9 NEKOS

**Un petit jeu de piste pour s'amuser — Web, mobile et un peu de papier.**

> *Au-delà des brumes du temps, loin du monde des hommes, un sanctuaire oublié attend ses gardiennes...*

---

## 🎮 L'idée du jeu

C'est un petit projet hybride pour une fête d'anniversaire avec **8 joueuses de 9 ans**. L'idée est de mêler le monde réel et l'écran : les enfants cherchent des **Sceaux-QR** cachés un peu partout. En scannant ces sceaux, elles réveillent les **9 Nekos** (les chats gardiens) qui s'étaient perdus.

L'ambiance visuelle s'inspire de l'encre de Chine et des dessins animés, avec quelque chose d'assez simple et doux.

### 🌑 Le petit scénario
Le Sceau de Nacre a été brisé par **L'ombre**, une entité un peu trop envahissante faite de suie et d'oubli. Pour ne pas disparaître, les **9 Nekos Gardiens** se sont cachés dans notre monde sous la forme de dessins et qr codes à flasher. 

Les joueuses sont des Mikos (apprenties prêtresses) qui doivent retrouver ces chats, réussir leurs petits défis rituels et ramener un peu de lumière dans le sanctuaire.

---

## 🛠️ Côté technique

C'est un projet fait par amour du code et par curiosité, pour voir ce qu'on peut créer simplement :
*   **Pas d'images ni de MP3 :** Tout ce qu'on voit (les chats, les reliques) est dessiné en SVG ou en CSS. Les sons sont créés par le navigateur via la Web Audio API. 
*   **Fonctionne sans réseau :** Une fois la page chargée, le jeu tourne tout seul. Même le scanner de QR codes fonctionne sans Wi-Fi, car toute la logique de reconnaissance est déjà stockée dans le téléphone.

---

## 🎨 L'aspect visuel

### L'ombre
C'est une forme d'encre qui bouge un peu comme une goutte de liquide noir. Ses yeux sont comme des petites fenêtres qui montrent des étoiles à l'intérieur. On a utilisé des mélanges de flous pour donner cet effet de matière vivante et visqueuse.

### L'ambiance et les textures
On a cherché à créer une atmosphère de "conte de fées ancien" :
*   **Papier Washi :** Le fond du jeu a un grain qui rappelle le papier traditionnel japonais.
*   **Couleurs :** Tout tourne autour du noir de l'encre, du blanc nacre et d'une touche de "Menthe Glacée" pour le côté magique et froid.
*   **Pétales de Sakura :** Des petits pétales tombent doucement sur l'écran. Ils changent de couleur ou de vitesse selon l'humeur de l'histoire (calme, mystère ou danger).
*   **Lueurs douces :** Les objets importants brillent discrètement pour contraster avec la profondeur de l'encre.

### Les 9 Jeux et leurs Reliques
Chaque code QR libère un jeu spécifique. Les illustrations **SVG "Sumi-e"** (à l'encre) représentent les reliques que les Nekos protègent :

| Jeu | Relique (SVG) | Ce qu'on fait | Mécanique |
|:---|:---|:---|:---|
| **Ken** | ⚔️ Le Katana | Avoir du courage | **Slash** : Glisser le doigt |
| **Shinobi** | 🎭 Le Masque | Rester immobile | **Statue** : Ne plus bouger |
| **Mochi** | 🍡 Le Mochi | Être patiente | **Hold** : Rester appuyé |
| **Sumo** | 🥁 Le Tambour | Donner de l'énergie | **Mash** : Taper vite |
| **Kitsune** | 🔔 La Clochette | Écouters les sons | **Memory** : Retrouver les paires |
| **Sensu** | 🪭 L'Éventail | Souffler le nuage | **Swipe** : Balayer l'écran |
| **Kasa** | ☂️ L'Ombrelle | Protéger les esprits | **Catch** : Rattraper les objets |
| **Hanko** | 📜 Le Parchemin | Apprendre la sagesse | **Scratch** : Gratter l'encre |
| **Chime** | 🏮 La Lanterne | Suivre le rythme | **Rhythm** : Taper en cadence |

---

## 🏗️ Organisation des fichiers

```text
neko-sanctuaire/
├── index.html          # La page principale
├── sw.js               # Le script pour jouer sans réseau
├── css/
│   ├── base.css        # La mise en page
│   ├── cinematics.css  # L'ombre et les pétales
│   └── game.css        # Le style des épreuves
└── js/
    ├── audio.js        # Les sons faits "maison"
    ├── logic.js        # Le déroulement du jeu
    └── data.js         # Les dessins SVG et les infos des Nekos

# 🐾 Le Sanctuaire des 9 Mikos

> _Il existe un lieu que l’on ne trouve pas sur les cartes._  
> _Un lieu où le silence enseigne, où les présences observent, et où chaque pas est une question._

---

## 🌙 Origine

**Le Sanctuaire des 9 Mikos** est né d’une intention très simple et très personnelle :

offrir un espace de découverte à ma fille,  
un moyen de la faire voyager à travers le numérique  
sans passer par un téléphone,  
sans bruit, sans flux constant, sans distraction.

Un lieu calme.  
Un lieu choisi.

Ce projet est devenu, peu à peu :
- un jeu  
- un support d’apprentissage  
- un terrain d’expérimentation  

Chaque élément est pensé avec une idée simple :  
faire du numérique un espace d’exploration, pas de consommation.

---

## 🐾 Le Sanctuaire

Le sanctuaire n’est pas un niveau.  
C’est un lieu.

Un espace ouvert, fragmenté, presque vivant,  
où rien n’impose un chemin.

Le joueur ne suit pas une histoire.  
Il rencontre des situations.

On n’y gagne rien.  
On y comprend.

---

## 🐱 Les 9 Mikos

Ils sont neuf.

Neuf entités.  
Neuf systèmes.  
Neuf manières d’interagir avec le monde.

Chaque Miko est :
- une mécanique  
- une règle  
- une contrainte  
- une idée  

Ils n’expliquent pas.  
Ils mettent en situation.

---

## 🎮 Mécaniques de jeu

### Actions de base
- se déplacer  
- entrer dans une zone  
- déclencher une interaction  
- observer  
- recommencer  

### Variations
Chaque Miko modifie une règle :

- condition  
- timing  
- mémoire  
- position  
- séquence  
- causalité  

---

## 🔁 Boucle de jeu

1. explorer  
2. rencontrer un Miko  
3. essayer  
4. observer  
5. ajuster  
6. comprendre  

---

## 🏗️ Architecture

### Organisation

- `core/`  
- `entities/`  
- `systems/`  
- `scenes/`  
- `assets/`  

---

## 🧭 Schéma d’architecture

```
          [ Player ]
               |
               v
        +--------------+
        |  Entities    |
        | (Mikos, etc) |
        +--------------+
               |
               v
        +--------------+
        |   Systems    |
        | interactions |
        | rules        |
        +--------------+
               |
               v
        +--------------+
        |   Scenes     |
        | environment  |
        +--------------+
               |
               v
        +--------------+
        |   Core       |
        | game state   |
        +--------------+
```

---

## ⚙️ Logique

- les entités existent  
- les systèmes les font agir  
- les scènes les organisent  
- le core maintient la cohérence  

---

## 🐾 Fiches Mikos

Chaque Miko est un module pédagogique.

---

### 🐱 Miko 1 : Le Gardien

**Intention**  
Introduire la notion de condition.

**Mécanique**  
Une action ne fonctionne que si une condition est remplie.

**Logique**
```js
if (condition) {
  trigger();
}
```

---

### 🐱 Miko 2 : Le Patient

**Intention**  
Comprendre le temps.

**Mécanique**  
Attendre déclenche un événement.

**Logique**
```js
setTimeout(() => {
  activate();
}, delay);
```

---

### 🐱 Miko 3 : Le Mémoire

**Intention**  
Introduire l’état.

**Mécanique**  
Le système se souvient.

**Logique**
```js
state.visited = true;
```

---

### 🐱 Miko 4 : Le Miroir

**Intention**  
Cause et effet.

**Mécanique**  
Une action influence une autre.

---

### 🐱 Miko 5 : Le Seuil

**Intention**  
Positionnement.

**Mécanique**  
Entrer dans une zone déclenche.

---

### 🐱 Miko 6 : Le Cycle

**Intention**  
Boucles.

**Mécanique**  
Un comportement se répète.

---

### 🐱 Miko 7 : Le Choix

**Intention**  
Branches logiques.

**Mécanique**  
Plusieurs résultats possibles.

---

### 🐱 Miko 8 : Le Silence

**Intention**  
Absence de feedback.

**Mécanique**  
Le joueur doit interpréter.

---

### 🐱 Miko 9 : Le Sanctuaire

**Intention**  
Assembler les systèmes.

**Mécanique**  
Tout coexiste.

---

## 🧠 Intention pédagogique

- comprendre des systèmes simples  
- structurer du code  
- expérimenter librement  
- apprendre sans pression  

---

## 🌱 Processus

- itération  
- test  
- simplification  
- évolution  

---

## 🕯️ Philosophie

- simplicité  
- lisibilité  
- modularité  
- expérimentation  

---

## 🌌 Vision

- un numérique calme  
- un jeu qui enseigne  
- un code qui se comprend  

---

## 🚧 État

Projet en évolution constante.

---

## 🤝 Contribution

- observer  
- tester  
- simplifier  
- partager  

---

## 📜 Licence

Ce projet s’inscrit dans une démarche libre.

Il peut être utilisé, modifié, exploré et partagé librement,  
dans le respect de l’esprit du projet :  
apprendre, transmettre, expérimenter.

---

## 🌙 Mot de fin

> _Les Mikos ne donnent pas de réponses._  
> _Ils créent des situations._  

> _Et dans ces situations,_  
> _quelque chose peut être compris._

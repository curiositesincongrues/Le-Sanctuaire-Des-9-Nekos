// Données embarquées — fallback sans serveur
const TEXTS_EMBEDDED = {
  "meta": {
    "lang": "fr",
    "version": "1.0"
  },
  "app": {
    "title": "LE SANCTUAIRE<br>DES 9 NEKOS",
    "startButton": "🌸 COMMENCER L'AVENTURE 🌸",
    "bgKanji": "九猫"
  },
  "rules": {
    "r1": {
      "title": "LE MIROIR DES ESPRITS",
      "text": "Ce parchemin numérique est votre seul lien avec le Sanctuaire. S'il tombe, le portail se brisera à jamais.",
      "warning": "Tenez la relique à deux mains. Ne vous l'arrachez jamais. Celui ou celle qui la tient a la garde de notre monde.",
      "button": "🌸 ÉVEILLER LE MIROIR"
    },
    "r2": {
      "title": "L'ÉCOUTE DE L'OMBRE",
      "text": "La Corruption se nourrit du chaos et des cris. Les esprits fuient ceux qui parlent trop fort.",
      "warning": "Ne criez pas. Parlez d'une voix calme. Si la panique s'installe, l'Esprit vous trouvera plus vite.",
      "button": "🌙 NOUS RESTERONS CALMES"
    },
    "r3": {
      "title": "L'HARMONIE DES MIKOS",
      "text": "La magie des 8 héroïnes ne fonctionne que si les cœurs battent au même rythme. La discorde nourrit les ténèbres.",
      "warning": "Ne vous disputez pas. Écoutez l'intuition de chacune avant de valider un choix d'équipe.",
      "button": "✨ NOUS SOMMES UNIES"
    },
    "r4": {
      "title": "LE CHEMIN DU DESTIN",
      "text": "Il y a 9 Gardiens à libérer, et vous êtes 8 prêtresses. Chacune de vous devra affronter une épreuve seule.",
      "warning": "Décidez MAINTENANT de votre ordre de passage (de 1 à 8). Pour le dernier Gardien, un effort collectif tranchera !",
      "button": "🦊 NOTRE ORDRE EST DÉCIDÉ"
    }
  },
  "oath": {
    "title": "LE SCELLÉ MAGIQUE",
    "instruction": "🐾 Posez chacune un pouce sur votre Rune et maintenez le contact !",
    "counter": "/ 8"
  },
  "hub": {
    "title": "BOUSSOLE SACRÉE",
    "guardiansLabel": "Gardiens libérés :",
    "scanButton": "🔮 SONDER L'AURA",
    "cancelButton": "❌ ANNULER LA VISION"
  },
  "scan": {
    "approaching": "Approchez le miroir du sceau...",
    "found": "{name} trouvé !",
    "success": "✦ Sceau déchiffré ! ✦",
    "wrongCode": "Ce n'est pas le bon sceau... Continuez de chercher !",
    "error": "Le miroir ne s'ouvre pas...",
    "torchHint": "Le sceau résiste... Essayez de l'éclairer.",
    "manualHint": "Le miroir peine à lire ce sceau...",
    "manualPrompt": "Entrez le code inscrit sous le sceau :",
    "torchOn": "🔦 Éclairer",
    "torchOff": "🔦 Éteindre",
    "torchUnsupported": "🔦 Non supporté"
  },
  "mirror": {
    "waking": "✦ Le Miroir s'éveille... ✦",
    "denied": "Le Miroir reste voilé... Les sceaux devront être entrés manuellement.",
    "unavailable": "Le Miroir ne peut s'éveiller sur cet appareil... Les sceaux devront être entrés manuellement."
  },
  "quiz": {
    "guardTitle": "Garde {name}",
    "hintWhisper": "🌿 <i>Un esprit murmure...</i>"
  },
  "minigames": {
    "success": "RÉUSSI !",
    "micDenied": "Micro refusé ! Glissez le doigt à la place !",
    "memoryWatch": "Regarde...",
    "memoryError": "Erreur !"
  },
  "guardians": [
    {
      "qr": "qr_hanako",
      "name": "Hanako",
      "emoji": "🍡",
      "kanji": "花子",
      "color": "#ffb7c5",
      "dark": "#ff1493",
      "discovery": "Les pétales de cerisier dansent à nouveau dans le vent du Sanctuaire... L'âme de Hanako est libérée.",
      "question": "À l'intérieur des délicieux mochis, on trouve souvent une pâte sucrée très populaire au Japon. De quoi est-elle faite ?",
      "answers": [
        "De haricots rouges",
        "De fraises écrasées",
        "De thé vert"
      ],
      "correct": 0,
      "gameType": "hold",
      "instruction": "La Pesée de Riz : Maintiens appuyé sans relâcher !"
    },
    {
      "qr": "qr_raijin",
      "name": "Raijin",
      "emoji": "⚔️",
      "kanji": "雷神",
      "color": "#98e8d4",
      "dark": "#00b386",
      "discovery": "L'éclair sacré de Raijin illumine les ténèbres... La lame du dieu du tonnerre est enfin libre.",
      "question": "Les puissants guerriers Samouraïs obéissaient à un code d'honneur et de courage très strict. Comment s'appelait-il ?",
      "answers": [
        "Le Judo",
        "Le Bushido",
        "Le Sudoku"
      ],
      "correct": 1,
      "gameType": "rhythm",
      "instruction": "Le Rythme du Sabre : Frappe quand la lame brille !"
    },
    {
      "qr": "qr_kagerou",
      "name": "Kagerou",
      "emoji": "🥷",
      "kanji": "陽炎",
      "color": "#c4b5fd",
      "dark": "#8b5cf6",
      "discovery": "Ce que l'on ne voyait pas existe enfin... L'ombre de Kagerou se dissout entre deux mondes.",
      "question": "Les ninjas étaient les maîtres de l'ombre. Comment s'appelle l'art martial secret qu'ils étudiaient ?",
      "answers": [
        "Le Kenjutsu",
        "Le Ninjutsu",
        "Le Karaté"
      ],
      "correct": 1,
      "gameType": "catch",
      "instruction": "L'Ombre Fuyante : Attrape le sceau avant qu'il disparaisse !"
    },
    {
      "qr": "qr_amaterasu",
      "name": "Amaterasu",
      "emoji": "💖",
      "kanji": "天照",
      "color": "#fde68a",
      "dark": "#f59e0b",
      "discovery": "Sa lumière dorée traverse les nuages comme une promesse éternelle... Le cœur d'Amaterasu bat à nouveau.",
      "question": "Dans les légendes japonaises, comment appelle-t-on les esprits, les fantômes ou les monstres comme l'Ombre que vous combattez ?",
      "answers": [
        "Les Yokais",
        "Les Kami",
        "Les Kamikazes"
      ],
      "correct": 0,
      "gameType": "swipe",
      "instruction": "Le Souffle du Cœur : Glisse pour repousser l'Ombre !"
    },
    {
      "qr": "qr_tamamo",
      "name": "Tamamo",
      "emoji": "🦊",
      "kanji": "玉藻",
      "color": "#fdba74",
      "dark": "#f97316",
      "discovery": "Les neuf queues de Tamamo ondulent dans la nuit... Le renard sage sourit, ses secrets rendus au vent.",
      "question": "La légende dit qu'un renard magique gagne quelque chose tous les 100 ans pour prouver sa grande sagesse. Quoi donc ?",
      "answers": [
        "Une paire d'ailes",
        "Une clochette d'or",
        "Une nouvelle queue"
      ],
      "correct": 2,
      "gameType": "scratch",
      "instruction": "L'Encre Maudite : Frotte pour révéler le sceau caché !"
    },
    {
      "qr": "qr_goemon",
      "name": "Goemon",
      "emoji": "🍙",
      "kanji": "五右衛門",
      "color": "#6ee7b7",
      "dark": "#10b981",
      "discovery": "La terre tremble de joie sous ses pas libérés... La force de Goemon résonne comme un tambour sacré.",
      "question": "Juste avant le combat, que lancent les grands lutteurs de Sumo sur le sol pour chasser les mauvais esprits ?",
      "answers": [
        "Du sel",
        "Du sable",
        "Du poivre"
      ],
      "correct": 0,
      "gameType": "mash",
      "instruction": "La Force du Colosse : Martèle l'écran de toutes tes forces !"
    },
    {
      "qr": "qr_mugen",
      "name": "Mugen",
      "emoji": "🧘",
      "kanji": "無限",
      "color": "#a5b4fc",
      "dark": "#6366f1",
      "discovery": "Dans ce souffle immobile, le Sanctuaire retrouve sa paix millénaire... Le silence de Mugen emplit l'espace.",
      "question": "Comment s'appelle la tradition japonaise qui consiste à contempler les fleurs de cerisiers au printemps ?",
      "answers": [
        "L'Ikebana",
        "Le Hanami",
        "L'Origami"
      ],
      "correct": 1,
      "gameType": "statue",
      "instruction": "L'Immobilité du Sage : Ne bouge plus... Deviens la statue !"
    },
    {
      "qr": "qr_hibiki",
      "name": "Hibiki",
      "emoji": "🥁",
      "kanji": "響",
      "color": "#fca5a5",
      "dark": "#ef4444",
      "discovery": "Chaque battement est un cœur qui se souvient d'avoir existé... Le tambour de Hibiki résonne jusqu'aux étoiles.",
      "question": "Le Taiko est un tambour géant qui résonne comme le tonnerre. Avec quoi les musiciens frappent-ils dessus ?",
      "answers": [
        "Avec les mains nues",
        "Avec des maillets rembourrés",
        "Avec de gros bâtons en bois"
      ],
      "correct": 2,
      "gameType": "drum",
      "instruction": "Le Tambour du Tonnerre : Alterne Gauche et Droite en rythme !"
    },
    {
      "qr": "qr_yamato",
      "name": "Yamato",
      "emoji": "🏯",
      "kanji": "大和",
      "color": "#e2e8f0",
      "dark": "#94a3b8",
      "discovery": "Le Sanctuaire des 9 Nekos respire enfin, libéré pour l'éternité... L'âme de Yamato veille sur vous à jamais.",
      "question": "Le Shogun était protégé par une créature légendaire en forme de serpent géant qui volait dans les nuages. Qui est-ce ?",
      "answers": [
        "Le Dragon (Ryu)",
        "Le Phénix",
        "Le Tigre Blanc"
      ],
      "correct": 0,
      "gameType": "memory",
      "instruction": "Les Sceaux du Destin : Mémorise l'ordre des sceaux sacrés !"
    }
  ],
  "cinematics": {
    "acts": [
      "壱",
      "弐",
      "参",
      "肆",
      "伍"
    ],
    "shadows": [
      "守",
      "魂",
      "光",
      "封"
    ],
    "intro": {
      "act1": [
        {
          "fr": "Au-delà des brumes du temps,<br>loin du monde des hommes...",
          "jp": "時の霧を越えて、　人の世界から遠く離れて…"
        },
        {
          "fr": "Se cache un lieu où les esprits de l'eau<br>murmurent des secrets...",
          "jp": "水の精霊が、秘密を囁く場所が隠されている…"
        }
      ],
      "act2": [
        {
          "fr": "Le majestueux Sanctuaire de Neko-Jinja<br>s'élevait vers les cieux.",
          "jp": "荘厳な猫神社が、　天に聳え立っていた。"
        },
        {
          "fr": "Un domaine imprégné<br>de magie pure.",
          "jp": "純粋な魔法に満たされた、　領域。"
        }
      ],
      "act3": [
        {
          "fr": "Où les anciens esprits<br>veillaient en silence.",
          "jp": "古代の精霊が、　静かに見守っていた。"
        },
        {
          "fr": "Le Neko Suprême et ses huit Gardiens<br>protégeaient l'épée sacrée Kusanagi.",
          "jp": "守護者は、聖なる剣、草薙を守っていました。"
        }
      ],
      "act4": [
        {
          "fr": "Mais l'Ombre Millénaire s'éveilla...<br><span class='line-break'>et le sceau vola en éclats.</span>",
          "jp": "しかし…　影の精霊が目覚め、　封印は砕け散った…"
        }
      ],
      "act5": [
        {
          "fr": "La lumière fut engloutie par la nuit.<br><span class='line-break'>Les 9 Gardiens dispersés aux quatre vents.</span>",
          "jp": "光は闇に飲まれ、　九つの守護者は四方に散った。"
        }
      ]
    }
  },
  "finale": {
    "title": "",
    "exorcism": [
      {
        "fr": "Les 9 Gardiens sont réunis.",
        "jp": "九つの守護者が、　揃いた。"
      },
      {
        "fr": "L'Ombre se dresse une dernière fois.",
        "jp": "影が…　最後に立つ。"
      },
      {
        "fr": "Mais la magie des 8 Mikos est plus forte !",
        "jp": "八人の巫女の力が、勝る！"
      }
    ],
    "victory": [
      {
        "fr": "La lumière brille à nouveau sur le Sanctuaire.",
        "jp": "光が、　再び聖地を照らした。"
      },
      {
        "fr": "Les Yokai se souviennent... et un pétale suffit à tout dire.",
        "jp": "妖怪は覚えている…　一枚の花びらで、十分だ。"
      },
      {
        "fr": "Les Gardiens veillent sur vous à jamais.",
        "jp": "守護者たちは…永遠に…あなたたちを守る。"
      }
    ],
    "sealPrompt": {
      "fr": "Scellez cette légende.",
      "jp": "伝説を…　鏡に封印せよ。"
    }
  },
  "certificate": {
    "title": "Pacte Accompli 🌸",
    "timeLabel": "Sanctuaire purifié en :",
    "timeFormat": "{mins} min et {secs} sec"
  },
  "mirrorOverlay": {
    "instruction": "Placez vos visages dans le miroir...",
    "captureButton": "🌸 SCELLER LE REFLET 🌸",
    "openButton": "🪞 OUVRIR LE MIROIR DES ESPRITS"
  },
  "epilogue": {
    "owari": "終",
    "downloadButton": "📜 TÉLÉCHARGER L'ESTAMPE",
    "texts": [
      {
        "fr": "Le voyage touche à sa fin...",
        "jp": "旅は、終わりに近づく…"
      },
      {
        "fr": "Mais les esprits veillent toujours.",
        "jp": "精霊は今も、見守っている。"
      },
      {
        "fr": "Et le souvenir restera gravé dans vos cœurs.",
        "jp": "思い出は永遠に、心に刻まれる。"
      }
    ]
  },
  "mikos": {
    "names": [
      "Ava",
      "Nelya",
      "Mariam",
      "Antinea",
      "Rosa-Louise",
      "Romane",
      "Bahia",
      "Fatima"
    ],
    "emojis": [
      "🌸",
      "🌙",
      "✨",
      "🦊",
      "🎀",
      "🔮",
      "💫",
      "🦋"
    ]
  },
  "ui": {
    "loading": "Chargement...",
    "skip": "Passer",
    "confirm": "Confirmer",
    "cancel": "Annuler"
  }
};

/* ============================================
   TEXTS.JS — Centralized Text Dictionary Loader
   ============================================ */

let T = null; // Global texts object

// SYNC SYNCHRONE — remplit guardianData immédiatement au chargement du script
// Sans attendre fetch ni DOMContentLoaded — garanti avant tout quiz
(function syncGuardianDataNow() {
    if (typeof guardianData === 'undefined') return;
    const g = TEXTS_EMBEDDED.guardians;
    if (!g) return;
    g.forEach((src, i) => {
        if (!guardianData[i]) return;
        guardianData[i].n     = src.name;
        guardianData[i].q     = src.question;
        guardianData[i].a     = src.answers;
        guardianData[i].r     = src.correct;
        guardianData[i].instr = src.instruction;
        guardianData[i].qr    = src.qr;
        guardianData[i].e     = src.emoji;
        guardianData[i].type  = src.gameType;
        guardianData[i].kanji = src.kanji || '';
        guardianData[i].color = src.color || '#ffd700';
        guardianData[i].dark  = src.dark || '#ff1493';
        guardianData[i].discovery = src.discovery || '';
    });
    // Sync mikoNames
    if (typeof mikoNames !== 'undefined' && TEXTS_EMBEDDED.mikos) {
        TEXTS_EMBEDDED.mikos.names.forEach((name, i) => { mikoNames[i] = name; });
    }
    console.log('[Texts] Sync synchrone OK — guardianData prêt');
})();

async function loadTexts(lang = 'fr') {
    try {
        let loaded = false;
        try {
            const response = await fetch('texts.json');
            if (response.ok) { T = await response.json(); loaded = true; }
        } catch(fetchErr) {}
        if (!loaded) {
            // Fallback embarqué — fonctionne en file:// sans serveur
            T = JSON.parse(JSON.stringify(TEXTS_EMBEDDED));
        }
        console.log('[Texts] Loaded:', T.meta.lang, 'v' + T.meta.version);
        
        // Sync guardianData from texts if it exists
        if (T.guardians && typeof guardianData !== 'undefined') {
            T.guardians.forEach((g, i) => {
                guardianData[i].n = g.name;
                guardianData[i].q = g.question;
                guardianData[i].a = g.answers;
                guardianData[i].r = g.correct;
                guardianData[i].instr = g.instruction;
                guardianData[i].qr = g.qr;
                guardianData[i].e = g.emoji;
                guardianData[i].type = g.gameType;
                guardianData[i].kanji = g.kanji || '';
                guardianData[i].color = g.color || '#ffd700';
                guardianData[i].dark = g.dark || '#ff1493';
                guardianData[i].discovery = g.discovery || '';
            });
        }
        
        // Sync mikoNames
        if (T.mikos && typeof mikoNames !== 'undefined') {
            T.mikos.names.forEach((name, i) => { mikoNames[i] = name; });
        }
        
        // Apply static HTML texts
        applyStaticTexts();
        
        return T;
    } catch (err) {
        console.error('[Texts] Error loading:', err);
        return null;
    }
}

function applyStaticTexts() {
    if (!T) return;
    
    // App title
    const introTitle = document.getElementById('intro-title');
    if (introTitle) introTitle.innerHTML = T.app.title;
    
    // Start button
    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.innerHTML = T.app.startButton;
    
    // Background kanji
    const bgKanji = document.querySelector('.bg-kanji');
    if (bgKanji) bgKanji.textContent = T.app.bgKanji;
    
    // Rules
    ['r1', 'r2', 'r3', 'r4'].forEach((rKey, i) => {
        const rule = document.getElementById(`rule-${i + 1}`);
        if (rule && T.rules[rKey]) {
            const h2 = rule.querySelector('h2');
            const p = rule.querySelector('p:not(.rule-warning):not(#mirror-status)');
            const warning = rule.querySelector('.rule-warning');
            const btn = rule.querySelector('button');
            
            if (h2) h2.textContent = T.rules[rKey].title;
            if (p) p.textContent = T.rules[rKey].text;
            if (warning) warning.textContent = T.rules[rKey].warning;
            if (btn) btn.innerHTML = T.rules[rKey].button;
        }
    });
    
    // Oath screen
    const oathTitle = document.querySelector('#screen-oath h1');
    if (oathTitle) oathTitle.textContent = T.oath.title;
    
    const oathInstr = document.querySelector('#screen-oath p[style*="font-weight:bold"]');
    if (oathInstr) oathInstr.textContent = T.oath.instruction;
    
    // Hub screen
    const hubTitle = document.querySelector('#screen-hub h2');
    if (hubTitle) hubTitle.textContent = T.hub.title;
    
    const btnScan = document.getElementById('btn-scan');
    if (btnScan) btnScan.innerHTML = T.hub.scanButton;
    
    const btnCancelScan = document.getElementById('btn-cancel-scan');
    if (btnCancelScan) btnCancelScan.innerHTML = T.hub.cancelButton;
    
    // Final screen title
    const finalTitle = document.getElementById('final-title');
    if (finalTitle) finalTitle.textContent = T.finale.title;
    
    // Certificate
    const certTitle = document.querySelector('.certificate h3');
    if (certTitle) certTitle.textContent = T.certificate.title;
    
    // Mirror overlay
    const mirrorInstr = document.querySelector('.mirror-instruction');
    if (mirrorInstr) mirrorInstr.textContent = T.mirrorOverlay.instruction;
    
    const btnCapture = document.getElementById('btn-capture');
    if (btnCapture) btnCapture.innerHTML = T.mirrorOverlay.captureButton;
    
    const btnDownload = document.getElementById('btn-download');
    if (btnDownload) btnDownload.innerHTML = T.mirrorOverlay.openButton;
}

// Helper functions to get texts
function txt(path) {
    if (!T) return path;
    const keys = path.split('.');
    let val = T;
    for (const k of keys) {
        if (val[k] === undefined) return path;
        val = val[k];
    }
    return val;
}

function txtGuardian(index, field) {
    if (!T || !T.guardians[index]) return '';
    return T.guardians[index][field] || '';
}

function txtCinematic(act, index, lang = 'fr') {
    if (!T || !T.cinematics.intro[act] || !T.cinematics.intro[act][index]) return { fr: '', jp: '' };
    return T.cinematics.intro[act][index];
}

function txtFinale(section, index, lang = 'fr') {
    if (!T || !T.finale[section]) return { fr: '', jp: '' };
    if (Array.isArray(T.finale[section])) {
        return T.finale[section][index] || { fr: '', jp: '' };
    }
    return T.finale[section];
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadTexts());
} else {
    loadTexts();
}

// RE-SYNC DU MENU DEBUG SI EXISTANT
        const debugGuardians = document.getElementById('debug-guardians');
        if (debugGuardians) {
            debugGuardians.innerHTML = ''; // On vide
            for (let i = 0; i < 9; i++) {
                const b = document.createElement('button');
                b.className = 'debug-link';
                b.dataset.action = 'game';
                b.dataset.index = i;
                b.textContent = `${i+1}. ${guardianData[i].e} ${guardianData[i].n}`;
                debugGuardians.appendChild(b);
            }
        }

        
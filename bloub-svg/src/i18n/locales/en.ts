import type ar from './ar'

/**
 * Le type `typeof ar` est le verrou : une cle oubliee ou mal orthographiee est
 * une erreur de compilation nommee, pas une chaine manquante decouverte a
 * l'ecran.
 */
const en: typeof ar = {
  app: {
    name: 'bloub',
    title: 'bloub — animated SVG avatar',
    botAria: 'Animated bloub avatar'
  },

  gallery: {
    back: 'Back to the player',
    intro: 'Hand-curated montages — hit "Load" and they join your list, playing right away.',
    charger: 'Load'
  },

  presets: {
    accueil: 'Welcome',
    accueil_detail: 'A wink and a soft look — the best opening for the bot to appear.',
    notifications: 'Notifications',
    notifications_detail: 'Notification pulses with an exclamation mark, to grab attention fast.',
    reflexion: 'Thinking',
    reflexion_detail: 'A moment of search… then the spark, and playback starts.',
    joie: 'Joy',
    joie_detail: 'Excitement and laughter ending in a small burst.',
    nuit: 'Night',
    nuit_detail: 'Quiet sleep with a glance in between — made for dark mode.',
    surprises: 'Surprises',
    surprises_detail: 'Wide eyes, egg, hexagon and a comet — the unexpected sequence.'
  },

  integration: {
    intro: 'Copy the bot into any page: the code below carries the whole drawing inside it — paste it and it just works, no hosting needed.',
    format: 'Format',
    statique: 'Static',
    anime: 'Animated',
    taille: 'Size in pixels',
    fond: 'Background',
    fond_clair: 'Light',
    fond_nuit: 'Dark',
    fond_transparent: 'Transparent',
    generer: 'Generate animated code',
    code: 'Ready-to-paste code',
    copier: 'Copy code',
    telecharger: 'Download animated SVG',
    vide: 'Hit "Generate animated code" first.',
    video_hint: 'For an MP4, GIF or sprite sheet of your full montage: export it from the Animations view.'
  },

  rail: {
    nav: 'Sections',
    customize: 'Customise',
    animations: 'Animations',
    galerie: 'Gallery',
    integration: 'Embed',
    elements: 'Elements',
    settings: 'Settings'
  },

  panel: {
    animations: 'Animation',
    moves: '{n} move | {n} moves',
    shape: 'Shape',
    expression: 'Expression',
    color: 'Colour',
    mouth: 'Mouth',
    surprise: 'Surprise me',
    couleur_perso: 'Custom colour'
  },

  export: {
    action: 'Export as PNG',
    more: 'Other formats',
    png: 'Download PNG',
    svg: 'Download SVG',
    anime: 'Download animated SVG',
    gif: 'Download animated GIF',
    cycleDetail: 'The video is lighter and smoother; the GIF plays anywhere.',
    cycleFormat: 'Format',
    cycle_mp4: 'MP4 video',
    cycle_mp4_aide: 'Light and smooth, needs a background',
    cycle_gif: 'Animated GIF',
    cycle_gif_aide: 'Plays anywhere, heavier',
    cycle_sprites: 'Sprite sheet (PNG)',
    cycle_sprites_aide: 'Every frame in one grid, for game engines',
    cycleProgress: 'Exporting…',
    cycleReessayer: 'Try again',
    gifTitle: 'Download animated GIF',
    gifDetail:
      'GIF transparency is all-or-nothing: with no background, the ball\u2019s edge comes out a little hard.',
    gifBackground: 'Background',
    fond_blanc: 'White background',
    fond_blanc_aide: 'Smooth edge, for light surfaces',
    fond_transparent: 'Transparent background',
    fond_transparent_aide: 'Fits any background, edge a little hard',
    gifConfirm: 'Download',
    copie: 'Copy image',
    copieSvg: 'Copy SVG',
    done: 'Exported',
    copied: 'Copied',
    failed: 'Export failed'
  },

  preview: {
    exit: 'Exit preview',
    key: 'Esc'
  },

  timeline: {
    play: 'Start playback',
    pause: 'Stop playback',
    addAnimation: 'Add an animation',
    preview: 'Preview',
    export: 'Export the montage',
    share: 'Copy share link',
    random: 'Random montage',
    blocks: '{n} block | {n} blocks',
    blockDuplicateAria: 'Duplicate {state}',
    zoom: 'Track zoom',
    blockAria: '{state}, {duration}',
    blockDurationAria: 'Duration of {state}, {duration}',
    blockRemoveAria: 'Remove {state}'
  },

  dialog: {
    cancel: 'Cancel',
    nameCreateTitle: 'New cycle',
    nameRenameTitle: 'Rename cycle',
    nameField: 'Cycle name',
    nameCreate: 'Create',
    nameRename: 'Rename',
    removeTitle: 'Delete "{name}"?',
    removeDetail:
      'This sequence will be lost, along with its animation. | This sequence will be lost, along with its {n} animations.',
    removeConfirm: 'Delete',
    importEchec: 'Invalid file: nothing was imported.',
    resetTitle: 'Restore the reference sequence?',
    resetDetail: 'The current arrangement will be replaced by the sequence measured from the video.',
    resetConfirm: 'Restore'
  },

  cycles: {
    defaultName: 'Default cycle',
    newName: 'My cycle',
    menuNew: 'New cycle',
    menuExporter: 'Export as JSON',
    menuImporter: 'Import from JSON',
    menuReset: 'Restore reference sequence',
    menuRenameAria: 'Rename {name}',
    menuRemoveAria: 'Delete {name}'
  },

  units: {
    seconds: '{n} s',
    secondsShort: '{n}s'
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    appearance: 'Appearance',
    previewBackground: 'Preview background',
    transparent: 'Transparent',
    customBackground: 'Custom color',
    followCursor: 'Follow cursor',
    followCursorHint: 'Eyes and mouth follow your pointer while previewing.',
    theme_jour: 'Light',
    theme_nuit: 'Dark',
    about: 'About',
    credits: 'Made with ❤️ by {name}'
  },

  states: {
    idle: 'Idle',
    thinking: 'Thinking',
    wink: 'Wink',
    wide: 'Wide eyes',
    alert: 'Alert',
    notify: 'Notification',
    exclaim: 'Exclamation',
    sleep: 'Sleep',
    egg: 'Egg',
    hexagon: 'Hexagon',
    play: 'Play',
    orbit: 'Orbit',
    burst: 'Burst',
    comet: 'Comet',
    bounce: 'Bounce',
    shake: 'Shake',
    pulse: 'Pulse',
    nod: 'Nod',
    jump: 'Jump',
    dart: 'Dash',
    swirl: 'Swirl'
  },

  shapes: {
    cercle: 'Circle',
    ovale: 'Oval',
    oeuf: 'Egg',
    galet: 'Pebble',
    squircle: 'Squircle',
    capsule: 'Capsule',
    triangle: 'Triangle',
    pentagone: 'Pentagon',
    hexagone: 'Hexagon',
    losange: 'Diamond',
    nuage: 'Cloud',
    goutte: 'Droplet',
    fleur: 'Flower',
    etoile: 'Star',
    coeur: 'Heart',
    bouclier: 'Shield'
  },

  colors: {
    encre: 'Ink',
    creme: 'Cream',
    brun: 'Brown',
    rouge: 'Red',
    orange: 'Orange',
    ambre: 'Amber',
    vert: 'Green',
    turquoise: 'Turquoise',
    bleu: 'Blue',
    violet: 'Purple',
    rose: 'Pink',
    gris: 'Grey'
  },

  mouths: {
    aucun: 'None',
    sourire: 'Smile',
    rire: 'Laughing',
    afflige: 'Sad',
    etonne: 'Amazed'
  },

  expressions: {
    neutre: 'Neutral',
    attentif: 'Attentive',
    surpris: 'Surprised',
    excite: 'Excited',
    heureux: 'Happy',
    hilare: 'Laughing',
    colere: 'Angry',
    triste: 'Sad',
    effraye: 'Scared',
    mefiant: 'Suspicious',
    confus: 'Confused',
    curieux: 'Curious',
    fier: 'Proud',
    timide: 'Shy',
    blase: 'Unimpressed',
    somnolent: 'Sleepy',
    ebloui: 'Dazzled',
    determine: 'Determined',
    moqueur: 'Smug',
    calme: 'Serene',
    fatigue: 'Worn out',
    vertige: 'Dizzy',
    grognon: 'Grumpy',
    hesitant: 'Hesitant'
  }
}

export default en

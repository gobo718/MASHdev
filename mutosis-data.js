/* Derived from the recovered MasterMutosisCode_Clean.docx: 15 groups, 60 emojis, 36 route texts. */
const MUTOSIS_DATA = {
  "categories": {
    "animal": [
      "🐱",
      "🐶",
      "🐸",
      "🐙",
      "🦁"
    ],
    "food": [
      "🍕",
      "🍔",
      "🍣",
      "🍰"
    ],
    "sport": [
      "🏀",
      "🛹",
      "🏈"
    ],
    "plant": [
      "🌵",
      "🍄",
      "🌲"
    ],
    "object": [
      "💎",
      "⏰",
      "🎸",
      "🪩",
      "🧩",
      "☎️",
      "🕶️",
      "💰",
      "📀",
      "⚰️"
    ],
    "mythical": [
      "🐉",
      "👽",
      "🤖",
      "🧟",
      "👾"
    ],
    "occupation": [
      "👨‍⚕️",
      "👨‍🚒",
      "👨‍🚀",
      "👨‍🍳",
      "🤡"
    ],
    "flag": [
      "🇺🇸",
      "🇯🇵",
      "🇧🇷"
    ],
    "anatomy_gesture": [
      "🤦",
      "🤟",
      "🧠",
      "👶",
      "🧔"
    ],
    "celestial_weather": [
      "⭐",
      "🌞",
      "⛄",
      "🌦️",
      "🌈",
      "🌎"
    ],
    "places_infrastructure": [
      "🏥",
      "🛣️"
    ],
    "abstract_symbols": [
      "🔴",
      "❤️",
      "💬",
      "🔞",
      "🔺",
      "▫️"
    ],
    "clothing_fashion": [
      "👠"
    ],
    "vehicles_transit": [
      "🚗"
    ],
    "pure_smileys": [
      "🤣"
    ]
  },
  "traits": {
    "🐱": "feline whiskers and soft fur patches",
    "🐶": "floppy canine ears and a wagging tail",
    "🐸": "glistening amphibian skin and a long sticky tongue",
    "🐙": "rubbery suction-cup tentacles and deep-sea eyes",
    "🦁": "a thick golden mane",
    "🍕": "bubbling mozzarella and pepperoni",
    "🍔": "stacked patties, sesame bun, and cheese",
    "🍣": "salmon roe, fish textures, and seaweed",
    "🍰": "layered sponge cake with frosting",
    "🏀": "orange pebbled leather and black lines",
    "🛹": "grip tape and graffiti deck art",
    "🏈": "pigskin leather and white laces",
    "🌵": "spiky green cactus flesh",
    "🍄": "spotted mushroom cap and gills",
    "🌲": "pine bark and evergreen needles",
    "💎": "faceted crystal shards",
    "⏰": "metallic clock gears and alarm bells",
    "🎸": "guitar strings and mahogany frame",
    "🪩": "mirrored disco tiles",
    "🧩": "jigsaw edges and cardboard tabs",
    "☎️": "coiled phone cord and rotary wheel",
    "🕶️": "tinted lenses and sleek black frames",
    "💰": "gold coins and paper money",
    "📀": "rainbow-reflective silver discs",
    "⚰️": "dark casket wood and brass handles",
    "🐉": "dragon scales, horns, and smoke",
    "👽": "grey alien skin and black eyes",
    "🤖": "metal plating, circuits and hinges",
    "🧟": "tattered zombie clothing and decayed skin",
    "👾": "pixelated 8-bit shapes",
    "👨‍⚕️": "doctor coat and stethoscope",
    "👨‍🚒": "firefighter helmet and turnout coat",
    "👨‍🚀": "space suit and visor",
    "👨‍🍳": "chef coat and tall hat",
    "🤡": "red clown nose and face paint",
    "🇺🇸": "red and white stripes and white stars on blue",
    "🇯🇵": "white field with crimson sun disc",
    "🇧🇷": "green, yellow and blue flag motifs",
    "🤦": "a hand over a frustrated face",
    "🤟": "rock-and-roll hand gesture",
    "🧠": "folded cerebral brain tissue",
    "👶": "chubby baby features",
    "🧔": "thick beard and mustache",
    "⭐": "a glowing golden star",
    "🌞": "radiant sun face",
    "⛄": "snowballs and carrot nose",
    "🌦️": "raincloud with sunbeams",
    "🌈": "an arc of spectral light",
    "🌎": "blue and green planet Earth",
    "🏥": "a hospital façade and red cross",
    "🛣️": "an asphalt highway and lane markings",
    "🔴": "a smooth polished red sphere",
    "❤️": "symmetrical candy-red heart",
    "💬": "a graphic speech bubble",
    "🔞": "red restriction symbols",
    "🔺": "sharp red triangle",
    "▫️": "a white square tile",
    "👠": "patent leather stiletto heel",
    "🚗": "streamlined chassis and chrome wheels",
    "🤣": "yellow laughing face and tears"
  },
  "routes": {
    "clone": "A shocking mutant hybrid combining traits together, a single unique organism showcasing both [emoji_A.trait] and [emoji_B.trait] mixed into one seamless entity",
    "animal_food": "A surreal biological creature where a [emoji_A] is made entirely out of [emoji_B.getName], with [emoji_B.trait] forming its fur and body structure",
    "animal_sport": "A hyper-realistic [emoji_A] actually playing [emoji_B.getName], holding the gear and caught active in [emoji_B.context]",
    "animal_plant": "A whimsical fantasy creature that is a genetic cross between a [emoji_A] and a vegetative [emoji_B], with leaves and roots emerging from its skin",
    "animal_object": "An impossible mechanical and organic blend, where a living [emoji_A] has its limbs and torso crafted out of mechanical [emoji_B.trait]",
    "animal_mythical": "A legendary cosmic entity resembling a giant [emoji_A] completely fused with the alien properties and features of a [emoji_B]",
    "animal_occupation": "A detailed character design of a surreal hybrid entity: a human [emoji_B.getName] professionally working in their gear but with the head, paws, and anatomy of a [emoji_A]",
    "food_sport": "A funny commercial display showing high-end sporting equipment like a [emoji_B.getName] completely cooked and crafted out of edible [emoji_A.trait]",
    "food_plant": "A surreal botanical anomaly where a vegetative version of a [emoji_A] grows naturally like fruit directly off the stems of a [emoji_B]",
    "food_object": "A bizarre artistic sculpture where an everyday mechanical [emoji_B] is constructed out of melting, oozing [emoji_A.trait]",
    "food_mythical": "A terrifying dark fantasy creature design showing a legendary [emoji_B] born out of a living, pulsing mound of [emoji_A.trait]",
    "food_occupation": "A comical portrait of a professional [emoji_B.getName] whose entire protective uniform and tools have been baked out of edible [emoji_A.trait]",
    "sport_plant": "An organic athletic installation where a functional piece of [emoji_A.getName] gear has been completely reclaimed by nature, wrapped in roots and sprouted [emoji_B.trait]",
    "sport_object": "A high-tech hybrid machine where an athletic [emoji_A.getName] has been seamlessly engineered into a luxury mechanical [emoji_B], exposing inner gears and wires",
    "sport_mythical": "A surreal arena concept where a massive, terrifying [emoji_B] is captured interacting with or crushing a tiny piece of [emoji_A.name] gear",
    "sport_occupation": "An action shot of a professional [emoji_B.getName] attempting to play their job duties as if it were a high-stakes competitive game of [emoji_A.getName]",
    "plant_object": "A masterpiece clockwork ecosystem where a delicate vegetative [emoji_A] has sprouted metal gears and crystalline [emoji_B.trait] elements",
    "plant_mythical": "An ancient woodland spirit resembling a legendary [emoji_B] whose skin is made entirely of thick moss, bark, and [emoji_A.trait]",
    "plant_occupation": "A surreal character design of a professional [emoji_B.getName] who has been stationary so long they have turned into a living plant, sprouting [emoji_A.trait]",
    "object_mythical": "A brilliant sci-fi construct showing an ancient, legendary [emoji_B] re-engineered inside a lab with cold chrome plating and glowing [emoji_A.trait]",
    "object_occupation": "A futuristic cyborg portrait of a [emoji_B.getName] whose organic human limbs and facial features have been replaced by industrial [emoji_A.trait]",
    "mythical_occupation": "A majestic cinematic scene of a legendary [emoji_A] taking over the professional workspace of a human [emoji_B.getName], clumsily using their tools",
    "flag_animal": "A stunning masterpiece artwork where a single centered [emoji_B.getName] has its surface patterns and fur custom-painted to exactly match the colors of [emoji_A.trait]",
    "flag_food": "A Michelin-star culinary dish where a [emoji_B.getName] has been meticulously plated to recreate the geometric layout and design of the [emoji_A.getName] flag",
    "flag_sport": "A custom-designed luxury piece of [emoji_B.getName] equipment boasting the bold graphic textures, national crests, and paint schemes of [emoji_A.trait]",
    "flag_plant": "A detailed macro photo of a rare botanical [emoji_B.getName] whose leaves and blossoms naturally grow with the distinct color layout of the [emoji_A.getName] flag",
    "flag_object": "A gleaming industrial [emoji_B.getName] pristine-coated in high-gloss paint that proudly maps out the exact lines, stars, and emblems of [emoji_A.trait]",
    "flag_mythical": "A breathtaking fantasy mural showing a legendary [emoji_B] flying through the sky, its wings leaving an atmospheric vapor trail shaped like the [emoji_A.getName] flag",
    "flag_occupation": "A patriotic portrait of a professional [emoji_B.getName] standing proudly at attention, their uniform custom-tailored with the fabrics and motifs of [emoji_A.trait]",
    "abstract_symbols_any": "A striking graphic design artwork where a [emoji_B.getName] is completely hollowed out and reshaped to form the absolute silhouette of a [emoji_A.trait] A high-concept sculpture featuring a single [emoji_B.getName] entirely branded, stamped, or constructed out of the repeating geometric patterns of [emoji_A.trait]",
    "celestial_weather_any": "A powerful, epic landscape shot where the severe atmospheric phenomena of [emoji_A.trait] is physically altering the molecular structure of a single centered [emoji_B.getName] A surreal fantasy illustration showing a [emoji_B.getName] floating in the center of the frame, entirely manifested out of the raw cosmic elements of [emoji_A.trait], set within [emoji_A.context]",
    "anatomy_gesture_any": "A surreal biological transformation where a [emoji_B.getName] has grown an unsettling, hyper-detailed human characteristic, specifically featuring [emoji_A.trait] A mind-bending optical illusion portrait where the shapes of a [emoji_A.getName] are arranged to subtly form the complete physical anatomy of a [emoji_B.getName]",
    "clothing_fashion_any": "A wild conceptual art piece where a single centered [emoji_B.getName] has been physically warped and custom-tailored to be worn as high fashion, constructed entirely out of [emoji_A.trait]",
    "vehicles_transit_any": "A mind-blowing custom mechanics warehouse shot featuring a roaring, full-sized land vehicle constructed out of the patterns of a [emoji_A.getName], boasting [emoji_B.trait]",
    "pure_smileys_any": "A surreal psychological art pop layout where a [emoji_B.getName] is possessed by an intense conscious emotion, manifesting [emoji_A.trait] directly over its center face",
    "universal_fusion": "A single bizarre entity that is a complete genetic hybrid mashup of a [emoji_A] and a [emoji_B], a surreal bio-fusion blending the structural properties of [emoji_A.trait] directly onto [emoji_B.trait]"
  }
};

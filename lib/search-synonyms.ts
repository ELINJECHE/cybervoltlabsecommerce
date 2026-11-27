// Search synonyms, in one easy-to-edit file.
//
// PHRASES: what shoppers type -> what we call it. Spaces and plurals don't matter on either side
// ("knee pads", "kneepads", "knee pad" are all the same key), and the left side can be one word or several.
// Add a line whenever the zero-result log (see lib/search-log.ts) shows a word people use that we don't.
export const PHRASES: Record<string, string[]> = {
  // Knee and elbow protection is sold as "guards".
  "knee pads": ["knee guards"],
  "knee protector": ["knee guards"],
  "knee protection": ["knee guards"],
  "knee guard": ["knee guards"],
  "elbow pads": ["elbow guards"],
  "elbow protector": ["elbow guards"],
  "elbow protection": ["elbow guards"],
  // Wet-weather gear.
  "rain suit": ["rain coat"],
  "rain jacket": ["rain coat", "rain suit"],
  "rain coat": ["rain suit"],
  // Helmets.
  lid: ["helmet"],
  // Jackets and armour.
  "riding jacket": ["jacket", "armour"],
  "bike jacket": ["jacket", "armour"],
  armour: ["jacket", "armour"],
  armor: ["jacket", "armour"],
};

// WORDS: single everyday words that mean something else on our shelves. (Plurals are handled
// automatically, so there is no need to list both "glove" and "gloves".)
export const WORDS: Record<string, string[]> = {
  trainers: ["sneakers", "shoes"], sneaker: ["sneakers"], shoe: ["shoes", "sneakers"], kicks: ["sneakers"],
  fridge: ["refrigerator"], freezer: ["refrigerator"], tv: ["television", "bracket", "mount"],
  speaker: ["woofer", "soundbar"], woofer: ["speaker"], subwoofer: ["woofer", "speaker"],
  rider: ["riding", "motorcycle", "helmet", "gloves"], bike: ["motorcycle", "riding"], biker: ["riding", "motorcycle"],
  lock: ["padlock"], padlock: ["lock"], gym: ["dumbbell", "barbell", "stepper"],
  mosquito: ["net"], net: ["mosquito"], bedding: ["duvet", "bedsheet", "blanket"],
  duvet: ["quilt"], cooker: ["stove", "oven"], stove: ["cooker", "burner"],
  oven: ["microwave"], washer: ["washing"], kids: ["kid", "baby", "toy"],
  flask: ["thermos"], cookware: ["pot", "pan"], blender: ["mixer"],
  watch: ["smartwatch"], smartwatch: ["watch"], shaver: ["clipper", "trimmer"], hair: ["dryer", "clipper", "trimmer"],
};

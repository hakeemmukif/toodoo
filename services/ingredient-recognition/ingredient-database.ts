import type { IngredientEntry, AirFryerCategory } from "@/lib/types"

/**
 * Built-in database of common air fryer ingredients with cooking parameters.
 * Data sourced from popular air fryer cookbooks and manufacturer guidelines.
 *
 * All temperatures are in Celsius.
 * Times are for room temperature ingredients unless frozen variant specified.
 */
export const INGREDIENT_DATABASE: IngredientEntry[] = [
  // ========== PROTEINS - CHICKEN ==========
  {
    names: ["chicken breast", "breast", "chicken fillet", "chicken cutlet"],
    temperature: 200,
    timeMinutes: 22,
    timeRange: [18, 25],
    shakeHalfway: true,
    category: "protein",
    notes: "Flip halfway for even cooking. Internal temp 74C.",
    frozen: { addMinutes: 8 }
  },
  {
    names: ["chicken wings", "wings", "buffalo wings"],
    temperature: 200,
    timeMinutes: 25,
    timeRange: [22, 28],
    shakeHalfway: true,
    category: "protein",
    notes: "Shake every 10 min for crispy skin",
    frozen: { addMinutes: 5 }
  },
  {
    names: ["chicken thighs", "thighs", "chicken leg"],
    temperature: 200,
    timeMinutes: 25,
    timeRange: [22, 28],
    shakeHalfway: true,
    category: "protein",
    notes: "Bone-in takes longer. Internal temp 74C.",
    frozen: { addMinutes: 8 }
  },
  {
    names: ["chicken drumsticks", "drumsticks", "chicken legs"],
    temperature: 200,
    timeMinutes: 22,
    timeRange: [20, 25],
    shakeHalfway: true,
    category: "protein",
    frozen: { addMinutes: 8 }
  },
  {
    names: ["chicken tenders", "tenders", "chicken strips", "chicken fingers"],
    temperature: 200,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "protein",
    frozen: { addMinutes: 4 }
  },
  {
    names: ["chicken nuggets", "nuggets"],
    temperature: 200,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "protein",
    frozen: { addMinutes: 3 }
  },

  // ========== PROTEINS - BEEF ==========
  {
    names: ["beef steak", "steak", "sirloin", "ribeye", "striploin"],
    temperature: 200,
    timeMinutes: 12,
    timeRange: [8, 16],
    shakeHalfway: true,
    category: "protein",
    notes: "Rare: 8min, Medium: 12min, Well: 16min. Rest 3-5 min."
  },
  {
    names: ["beef burger", "burger patty", "hamburger", "patty"],
    temperature: 190,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "protein",
    notes: "Flip once halfway",
    frozen: { addMinutes: 4 }
  },
  {
    names: ["meatballs", "beef meatballs"],
    temperature: 190,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "protein",
    frozen: { addMinutes: 4 }
  },
  {
    names: ["beef kebab", "kebab", "skewers"],
    temperature: 200,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "protein"
  },

  // ========== PROTEINS - PORK ==========
  {
    names: ["pork chops", "pork chop", "chops"],
    temperature: 200,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "protein",
    notes: "Internal temp 63C. Rest 3 min."
  },
  {
    names: ["bacon", "streaky bacon"],
    temperature: 200,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: false,
    category: "protein",
    notes: "Crispy: 10min. No need to flip."
  },
  {
    names: ["sausages", "sausage", "breakfast sausage"],
    temperature: 180,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "protein",
    notes: "Pierce skins to prevent bursting",
    frozen: { addMinutes: 5 }
  },
  {
    names: ["pork belly", "crispy pork belly"],
    temperature: 200,
    timeMinutes: 25,
    timeRange: [20, 30],
    shakeHalfway: false,
    category: "protein",
    notes: "Score skin for crackling"
  },

  // ========== PROTEINS - SEAFOOD ==========
  {
    names: ["salmon", "salmon fillet", "salmon steak"],
    temperature: 180,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: false,
    category: "protein",
    notes: "Skin-side down. No flipping needed.",
    frozen: { addMinutes: 5 }
  },
  {
    names: ["shrimp", "prawns", "jumbo shrimp"],
    temperature: 180,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: true,
    category: "protein",
    notes: "Toss in oil before cooking",
    frozen: { addMinutes: 3 }
  },
  {
    names: ["fish fillet", "white fish", "cod", "tilapia", "basa"],
    temperature: 180,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: false,
    category: "protein",
    frozen: { addMinutes: 5 }
  },
  {
    names: ["fish fingers", "fish sticks"],
    temperature: 200,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "protein",
    frozen: { addMinutes: 3 }
  },
  {
    names: ["calamari", "squid", "fried calamari"],
    temperature: 200,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: true,
    category: "protein"
  },
  {
    names: ["scallops", "sea scallops"],
    temperature: 200,
    timeMinutes: 6,
    timeRange: [5, 8],
    shakeHalfway: true,
    category: "protein"
  },

  // ========== PROTEINS - OTHER ==========
  {
    names: ["tofu", "firm tofu", "extra firm tofu"],
    temperature: 190,
    timeMinutes: 18,
    timeRange: [15, 20],
    shakeHalfway: true,
    category: "protein",
    notes: "Press to remove moisture first. Cut into cubes."
  },
  {
    names: ["tempeh"],
    temperature: 190,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "protein"
  },
  {
    names: ["eggs", "egg", "hard boiled eggs"],
    temperature: 130,
    timeMinutes: 15,
    timeRange: [12, 17],
    shakeHalfway: false,
    category: "protein",
    notes: "Soft: 12min, Medium: 15min, Hard: 17min"
  },

  // ========== VEGETABLES - ROOT ==========
  {
    names: ["potatoes", "potato", "potato cubes", "diced potatoes", "roast potatoes"],
    temperature: 200,
    timeMinutes: 20,
    timeRange: [18, 25],
    shakeHalfway: true,
    category: "vegetable",
    notes: "Cut into even-sized pieces"
  },
  {
    names: ["fries", "french fries", "chips", "potato fries"],
    temperature: 200,
    timeMinutes: 18,
    timeRange: [15, 22],
    shakeHalfway: true,
    category: "vegetable",
    notes: "Shake every 5 min for crispiness",
    frozen: { addMinutes: 5 }
  },
  {
    names: ["sweet potato", "sweet potato fries", "sweet potato cubes"],
    temperature: 200,
    timeMinutes: 18,
    timeRange: [15, 22],
    shakeHalfway: true,
    category: "vegetable",
    frozen: { addMinutes: 5 }
  },
  {
    names: ["carrots", "carrot", "baby carrots"],
    temperature: 190,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "vegetable"
  },
  {
    names: ["parsnips", "parsnip"],
    temperature: 190,
    timeMinutes: 18,
    timeRange: [15, 20],
    shakeHalfway: true,
    category: "vegetable"
  },
  {
    names: ["beetroot", "beets"],
    temperature: 200,
    timeMinutes: 25,
    timeRange: [20, 30],
    shakeHalfway: true,
    category: "vegetable",
    notes: "Cut into wedges for faster cooking"
  },

  // ========== VEGETABLES - CRUCIFEROUS ==========
  {
    names: ["broccoli", "broccoli florets"],
    temperature: 180,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "vegetable",
    notes: "Toss with oil. Don't overcrowd.",
    frozen: { addMinutes: 3 }
  },
  {
    names: ["brussels sprouts", "sprouts", "brussel sprouts"],
    temperature: 190,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "vegetable",
    notes: "Halve for even cooking",
    frozen: { addMinutes: 4 }
  },
  {
    names: ["cauliflower", "cauliflower florets"],
    temperature: 190,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "vegetable",
    frozen: { addMinutes: 4 }
  },
  {
    names: ["cabbage", "cabbage wedges"],
    temperature: 190,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "vegetable"
  },
  {
    names: ["kale chips", "kale"],
    temperature: 150,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: true,
    category: "vegetable",
    notes: "Watch carefully - burns easily"
  },

  // ========== VEGETABLES - OTHER ==========
  {
    names: ["zucchini", "courgette", "zucchini chips", "zucchini fries"],
    temperature: 180,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "vegetable"
  },
  {
    names: ["asparagus"],
    temperature: 180,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: false,
    category: "vegetable",
    notes: "Snap off woody ends first"
  },
  {
    names: ["green beans", "beans"],
    temperature: 180,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "vegetable",
    frozen: { addMinutes: 3 }
  },
  {
    names: ["mushrooms", "mushroom", "button mushrooms"],
    temperature: 180,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "vegetable"
  },
  {
    names: ["bell peppers", "peppers", "capsicum"],
    temperature: 190,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "vegetable"
  },
  {
    names: ["onion rings", "onion"],
    temperature: 190,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "vegetable",
    frozen: { addMinutes: 3 }
  },
  {
    names: ["corn on the cob", "corn", "sweetcorn"],
    temperature: 200,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "vegetable",
    notes: "Brush with butter"
  },
  {
    names: ["eggplant", "aubergine"],
    temperature: 190,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "vegetable"
  },
  {
    names: ["tomatoes", "cherry tomatoes"],
    temperature: 180,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: false,
    category: "vegetable"
  },
  {
    names: ["garlic", "roasted garlic"],
    temperature: 180,
    timeMinutes: 20,
    timeRange: [15, 25],
    shakeHalfway: false,
    category: "vegetable",
    notes: "Cut top off, drizzle with oil"
  },

  // ========== FROZEN / CONVENIENCE ==========
  {
    names: ["frozen vegetables", "mixed vegetables", "stir fry vegetables"],
    temperature: 180,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "frozen"
  },
  {
    names: ["frozen pizza", "pizza"],
    temperature: 180,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: false,
    category: "frozen"
  },
  {
    names: ["spring rolls", "egg rolls"],
    temperature: 200,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "frozen",
    frozen: { addMinutes: 2 }
  },
  {
    names: ["samosa", "samosas"],
    temperature: 180,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "frozen",
    frozen: { addMinutes: 3 }
  },
  {
    names: ["hash browns"],
    temperature: 200,
    timeMinutes: 12,
    timeRange: [10, 15],
    shakeHalfway: true,
    category: "frozen"
  },
  {
    names: ["tater tots", "potato gems"],
    temperature: 200,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "frozen"
  },
  {
    names: ["mozzarella sticks", "cheese sticks"],
    temperature: 200,
    timeMinutes: 6,
    timeRange: [5, 8],
    shakeHalfway: false,
    category: "frozen",
    notes: "Watch carefully - cheese can leak"
  },
  {
    names: ["popcorn chicken"],
    temperature: 200,
    timeMinutes: 10,
    timeRange: [8, 12],
    shakeHalfway: true,
    category: "frozen"
  },

  // ========== BREAD / BAKED ==========
  {
    names: ["toast", "bread"],
    temperature: 180,
    timeMinutes: 4,
    timeRange: [3, 5],
    shakeHalfway: false,
    category: "bread"
  },
  {
    names: ["garlic bread"],
    temperature: 180,
    timeMinutes: 6,
    timeRange: [5, 8],
    shakeHalfway: false,
    category: "bread",
    frozen: { addMinutes: 2 }
  },
  {
    names: ["croutons"],
    temperature: 180,
    timeMinutes: 5,
    timeRange: [4, 6],
    shakeHalfway: true,
    category: "bread"
  },
  {
    names: ["croissant", "croissants"],
    temperature: 160,
    timeMinutes: 5,
    timeRange: [4, 6],
    shakeHalfway: false,
    category: "bread",
    notes: "To reheat. Fresh from frozen: 8min",
    frozen: { addMinutes: 3 }
  },
  {
    names: ["pita bread", "pita", "flatbread"],
    temperature: 180,
    timeMinutes: 4,
    timeRange: [3, 5],
    shakeHalfway: false,
    category: "bread"
  },

  // ========== SNACKS ==========
  {
    names: ["tortilla chips", "nachos"],
    temperature: 180,
    timeMinutes: 5,
    timeRange: [4, 6],
    shakeHalfway: true,
    category: "snack"
  },
  {
    names: ["pita chips"],
    temperature: 180,
    timeMinutes: 6,
    timeRange: [5, 8],
    shakeHalfway: true,
    category: "snack"
  },
  {
    names: ["nuts", "roasted nuts", "almonds", "cashews"],
    temperature: 160,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: true,
    category: "snack",
    notes: "Watch carefully - can burn quickly"
  },
  {
    names: ["chickpeas", "roasted chickpeas"],
    temperature: 200,
    timeMinutes: 15,
    timeRange: [12, 18],
    shakeHalfway: true,
    category: "snack",
    notes: "Pat dry and toss with oil"
  },
  {
    names: ["wontons", "fried wontons"],
    temperature: 190,
    timeMinutes: 8,
    timeRange: [6, 10],
    shakeHalfway: true,
    category: "snack"
  },
]

/**
 * Get all ingredient entries
 */
export function getAllIngredients(): IngredientEntry[] {
  return INGREDIENT_DATABASE
}

/**
 * Get ingredients by category
 */
export function getIngredientsByCategory(category: IngredientEntry["category"]): IngredientEntry[] {
  return INGREDIENT_DATABASE.filter(i => i.category === category)
}

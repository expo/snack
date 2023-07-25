import sample from 'lodash/sample';

const emotions = [
  'mad',
  'bad',
  'blissful',
  'joyous',
  'fascinated',
  'intrigued',
  'curious',
  'amused',
  'thoughtful',
  'playful',
  'courageous',
  'thrilled',
  'funny',
  'great',
  'intelligent',
  'excited',
  'spunky',
  'vigorous',
  'bold',
  'brave',
  'eager',
  'upbeat',
  'privileged',
  'calm',
  'quiet',
  'surprised',
  'carefree',
  'adequate',
  'authentic',
  'blessed',
  'tenacious',
  'honest',
  'supportive',
  'mature',
  'smiling',
  'grounded',
  'trusting',
  'spontaneous',
  'healthy',
  'laughing',
  'graceful',
  'thankful',
  'suspicious',
  'lonely',
  'bossy',
  'shallow',
  'arrogant',
  'tactless',
  'frowning',
  'ranting',
  'moody',
  'crabby',
  'rebellious',
  'vengeful',
  'jealous',
  'cranky',
  'awkward',
  'nervous',
  'restless',
  'grumpy',
  'hazardous',
  'uplifting',
  'happy',
  'gnarly',
  'smart',
  'smelly',
  'juicy',
  'hot',
  'delicious',
  'talking',
  'witty',
  'biased',
  'greedy',
  'ludicrous',
];

const snacks = [
  'beef jerky',
  'crackers',
  'cashew',
  'peanut',
  'popcorn',
  'hummus',
  'cookie',
  'cookies',
  'edamame',
  'almond',
  'apple',
  'apples',
  'chip',
  'chips',
  'yogurt',
  'mixed nuts',
  'cheese',
  'cereal',
  'donut',
  'donuts',
  'pizza',
  'pretzel',
  'pretzels',
  'waffle',
  'waffles',
  'candy',
  'candies',
  'chocolate',
  'chocolates',
  'truffle',
  'truffles',
  'fudge',
  'bubblegum',
  'marshmallows',
  'pudding',
  'turkish delight',
  'toffee',
  'graham crackers',
  'raisins',
  'cake',
  'churros',
  'scone',
  'scones',
  'pastry',
  'coffee',
  'juice box',
  'milkshake',
  'soda',
  'tea',
  'ice cream',
  'popsicle',
  'banana',
  'bananas',
  'carrot',
  'celery',
  'peach',
  'orange',
  'kiwi',
  'salsa',
  'strawberries',
  'raspberries',
  'blueberries',
  'watermelon',
  'macaroni and cheese',
  'ramen',
  'french fries',
  'bagel',
  'croissant',
  'sandwich',
  'tortilla',
  'tortillas',
  'nachos',
  'bacon',
  'soylent',
  'stroopwafel',
  'stroopwafels',
];

export const getSnackName = () => `${sample(emotions)} ${sample(snacks)}`;
export const isIntentionallyNamed = (name: string) => {
  const [first, ...rest] = name.split(' ');
  return !emotions.includes(first) || !snacks.includes(rest.join(' '));
};

import {
  uniqueNamesGenerator,
  animals,
  adjectives,
  colors,
} from 'unique-names-generator';

import type { Config } from 'unique-names-generator';

const config: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: ' ',
  style: 'capital',
};

function generateName() {
  return uniqueNamesGenerator(config);
}

export { generateName };

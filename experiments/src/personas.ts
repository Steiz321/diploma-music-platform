import type { SongTags } from '@platform/contracts';

/** A synthetic listener type: what it likes and what it avoids. */
export interface Persona {
  name: string;
  likes: string[];
  dislikes: string[];
}

/** "group:value" keys, the same as TAG_VECTOR_KEYS */
export const PERSONAS: Persona[] = [
  {
    name: 'melancholic',
    likes: ['mood:melancholic', 'mood:sad', 'mood:nostalgic', 'topics:heartbreak', 'topics:loneliness', 'topics:memories'],
    dislikes: ['mood:happy', 'mood:energetic', 'topics:party'],
  },
  {
    name: 'party',
    likes: ['mood:happy', 'mood:energetic', 'mood:playful', 'topics:party', 'topics:success', 'topics:city_life'],
    dislikes: ['mood:sad', 'mood:melancholic', 'topics:death'],
  },
  {
    name: 'romantic',
    likes: ['mood:romantic', 'mood:dreamy', 'mood:calm', 'topics:love', 'topics:family', 'topics:nature'],
    dislikes: ['mood:angry', 'mood:dark', 'topics:war'],
  },
  {
    name: 'rebel',
    likes: ['mood:angry', 'mood:dark', 'mood:energetic', 'topics:war', 'topics:freedom', 'topics:social_issues'],
    dislikes: ['mood:romantic', 'mood:calm', 'mood:dreamy'],
  },
  {
    name: 'explorer',
    likes: ['mood:hopeful', 'mood:dreamy', 'mood:calm', 'topics:travel', 'topics:nature', 'topics:self_discovery'],
    dislikes: ['mood:dark', 'mood:angry', 'topics:death'],
  },
  {
    name: 'spiritual',
    likes: ['mood:hopeful', 'mood:calm', 'mood:nostalgic', 'topics:faith', 'topics:family', 'topics:homeland'],
    dislikes: ['mood:playful', 'topics:party', 'topics:city_life'],
  },
];

const keysOf = (tags: SongTags): string[] => [
  ...tags.mood.map((value) => `mood:${value}`),
  ...tags.topics.map((value) => `topics:${value}`),
];

/** How much the persona likes a track: liked tags minus disliked tags. */
export const affinity = (persona: Persona, tags: SongTags): number => {
  const keys = keysOf(tags);
  const liked = keys.filter((key) => persona.likes.includes(key)).length;
  const disliked = keys.filter((key) => persona.dislikes.includes(key)).length;
  return liked - disliked;
};

/** Ground truth of the evaluation: the persona would enjoy this track. */
export const RELEVANT_AFFINITY = 2;

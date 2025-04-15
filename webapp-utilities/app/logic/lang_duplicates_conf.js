
const hashFn = j => {
  const s = j.join('|');
  const h = s.length + s.substring(0, 10);
  return h;
};

const useKey = k => {
  if(!Array.isArray(k)) return false;
  if(k.length === 4) {
    return k.every(item => typeof item === 'string');
  }
  return false;
};

export const config = {
  srcKeyToSkip: ['.ac', '.ar', '.bec', '.cl', '.it', '.s', '.sk', '.st', '.wp'],
  hashFn,
  useKey,
  namePrefix: '.cmn.',
};
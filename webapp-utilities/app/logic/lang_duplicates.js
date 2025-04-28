import { atom, useSetAtom, useAtomValue } from 'jotai';
import { readJsonFile, writeFile } from '@utils/index';
import { config } from './lang_duplicates_conf';

export const inpFileAtom = atom(undefined);
export const langStateAtom = atom('At Start');
export const langErrorsAtom = atom([]);
export const langSrcAtom = atom({});
export const langOutAtom = atom({});
export const langNamesAtom = atom({});

export const stateWorking = 'Working';

export const ldCleanHook = () => {
  const setErr = useSetAtom(langErrorsAtom);
  const setSrc = useSetAtom(langSrcAtom);
  const setOut = useSetAtom(langOutAtom);
  const setNames = useSetAtom(langNamesAtom);
  
  const setLangState = useSetAtom(langStateAtom);

  return () => {
    setErr([]);
    setSrc({});
    setOut({});
    setNames({});
    setLangState('At Start');
  }
};

export const ldReadHook = () => {  
  const setErr = useSetAtom(langErrorsAtom);
  const setSrc = useSetAtom(langSrcAtom);
  const setOut = useSetAtom(langOutAtom);
  const setState = useSetAtom(langStateAtom);
  const setNames = useSetAtom(langNamesAtom);

  return (file) => {
    setSrc({});
    setOut({});
    setNames({});
    setState(stateWorking);
    readJsonFile(file, (json, err) => {
      if(err) {
        setErr(e => ([...e, err.message]));  
        setState('Reading failed');
        return;
      };
  
      if(json) {
        setSrc(json);
        console.log(json);
        setState('Reading done');
      };  
    });
  }
}

const parseSourceRec = (s, p, out) => {
  if(config.srcKeyToSkip.includes(p)) return;
  Object.keys(s).forEach(k => {
    if(config.useKey(s[k])) {
      const hash = config.hashFn(s[k]);
      if(!out[hash]) out[hash] = [];
      out[hash].push(p+'.'+k);
    }else if(typeof s[k] === 'object') {
      parseSourceRec(s[k], p+'.'+k, out);
    }
  });
}

export const ldParseHook = () => {
  const setOut = useSetAtom(langOutAtom);
  const setState = useSetAtom(langStateAtom);
  const setNames = useSetAtom(langNamesAtom);

  return (src) => {
    setOut({});
    setNames({});
    setState(stateWorking);

    const out = {};
    const path = '';
    parseSourceRec(src, path, out);
 
    const toDel = [];
    Object.keys(out).forEach(k => {
      if(out[k].length < 3) toDel.push(k);
    });

    toDel.forEach(k => delete out[k]);

    const names = {};
    Object.keys(out).forEach(k => {
      const newName = out[k][0].slice(1).replace(/[. ]/g, '_');
      names[k] = newName;
    });

    setOut(out);
    setNames(names);
    setState('Source is parsed');
  }
}

export const ldExportHook = () => {
  const out = useAtomValue(langOutAtom);
  const names = useAtomValue(langNamesAtom);
  const setState = useSetAtom(langStateAtom);

  return () => {
    setState(stateWorking);

    const res = { move: [] };
    Object.keys(names).forEach(n => {
      const t = config.namePrefix + names[n];
      out[n].forEach(f => res.move.push({ f, t }));
    });

    const fileName = 'RMMV_rename_script.json';
    writeFile(res, fileName);
    setState('Result exported to: '+fileName);
  };
}

export const digInSrc = (src, key) => {
  const keys = key.split('.');
  if(key[0] === '.') keys.shift();
  const leaf = keys.pop();

  let now = src;
  keys.forEach(k => {
    if(!now.hasOwnProperty(k)) now[k] = {};
    now = now[k];
  });

  return { src: now, value: now[leaf], leaf };
}
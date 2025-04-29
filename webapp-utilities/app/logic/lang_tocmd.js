import { atom, useSetAtom, useAtom, useAtomValue } from 'jotai';
import { readJsonFile, writeFile, checkObjectConsistency } from '@utils/index';
import { digInSrc } from './lang_duplicates';
import JSZip from 'jszip';

export const lang3SrcAtom = atom({});
export const lang3StateAtom = atom('At Start');
export const lang3InfoAtom = atom([]);
export const lang3ErrorsAtom = atom([]);
export const lang3StAtom = atom({});

export const stateWorking = 'Working';

export const ld3ReadHook = () => {  
  const setSrc = useSetAtom(lang3SrcAtom);
  const setState = useSetAtom(lang3StateAtom);
  const setSt = useSetAtom(lang3StAtom);
  const setInfo = useSetAtom(lang3InfoAtom);
  const setError = useSetAtom(lang3ErrorsAtom);

  const loadFilesBatch = async (files, targetList) => {
    for (const file of files) {
      try {
        setInfo(i => [...i, `Loading file ${file.name}`]);
        const json = await readJsonFile(file);
        targetList.push({ name: file.name, content: json });
      } catch (error) {
        setError(i => [...i, `Loading failed (${file.name})`]);
        setState('There was Error');
        console.error("Failed to load file:", file.name, error);
        return;
      }
    }
  };  

  return async (dataFiles, langFiles) => {
    setState(stateWorking);
    setSrc({});
    setSt({});
    setInfo(['Starting new process']);
    setError([]);

    setInfo(i => [...i, `== Data Files: ${dataFiles.length} ==`]);
    const data = [];
    await loadFilesBatch(dataFiles, data);

    setInfo(i => [...i, `== Lang Files: ${langFiles.length} ==`]);
    const lang = [];
    await loadFilesBatch(langFiles, lang);

    setSrc(s => ({ data, lang }));
    setState('Loading is done.');
  }
};

export const ld3ProcessDataHook = () => {  
  const [src, setSrc] = useAtom(lang3SrcAtom);
  const setState = useSetAtom(lang3StateAtom);
  const setInfo = useSetAtom(lang3InfoAtom);
  const setError = useSetAtom(lang3ErrorsAtom);
  const setSt = useSetAtom(lang3StAtom);

  const regex = /^#\{(.+)\.\d+\}$/;
  const getLexPath = (seq) => {
    let commonPrefix = null;
    for (let i = 1; i < seq.length; i++) {
      const match = seq[i].parameters[0].match(regex);
      if (!match) {
        // No match found
        return false;
      }
      if (commonPrefix === null) {
        commonPrefix = match[1];
      } else if (commonPrefix !== match[1]) {
        // Different prefix found
        return false;
      }
    }
  
    return commonPrefix;
  };

  const forShowT = {
    code: [101, 401],
    params: [0, 1, 2, 3],
    cmd: 'gd_showText',
    info: '[Show]',
  };

  const forScrollT = {
    code: [105, 405],
    params: [0, 1],
    cmd: 'gd_scrollText',
    info: '[Scroll]',
  };

  let moves = [];
  let skips = [];

  const processTransformation = (evSrc, script, id) => {
    let evs = [...evSrc];
    const moveMem = moves.length;
    for (let i = 0; i < evs.length; i++) {
      if (evs[i].code === script.code[0]) {
        let start = i;
        let end = i + 1;
        
        if(evs[end].code !== script.code[1]) {
          setInfo(ii => ([...ii, `SKIPPING ${i} - Lonely ${script.code[0]}`]));
          console.log(`SKIPPING ${i} - Lonely ${script.code[0]}`);
          console.log(evs[i]);
          skips.push(`SKIPPING ${id}(${i}) - Lonely ${script.code[0]}`);
          continue;
        }

        while (end < evs.length && evs[end].code === script.code[1]) {
          end++;
        }
        // Now [start, end) is the sequence you want
        const sequence = evs.slice(start, end);

        // Let's check the sequence contains LEX text only
        const lexPath = getLexPath(sequence);
        if(!lexPath) {
          setInfo(ii => ([...ii, `SKIPPING ${i} - NonLex ${script.code[0]}`]));
          console.log(`SKIPPING ${i} - NonLex ${script.code[0]}`);
          console.log(sequence);
          skips.push(`SKIPPING ${id}(${i}) - NonLex ${script.code[0]}`);
          continue;
        }

        const p = script.params.map(i => sequence[0].parameters[i]).join(' ');
        const processed = [{
          code: 356,
          indent: sequence[0].indent,
          parameters: [script.cmd+' '+p+' #{'+lexPath+'}'],
        }];
  
        moves.push(lexPath);
        console.log(`-> ${i}: ${lexPath}`);
      // Replace the original sequence with the processed result
        evs.splice(start, end - start, ...[].concat(processed));
      }
    }

    if(moves.length - moveMem) {
      setInfo(ii => ([...ii, `Replaced ${moves.length - moveMem} ${script.info}`]));
    }
    return evs;
  };

  return async () => {
    setState(stateWorking);
    setInfo(['Starting new process']);
    setError([]);

    src.data.forEach(data => {
      setInfo(i => ([...i, `== Data File (${data.name}) ==`]));
      
      const isMap = /^Map\d+\.json$/.test(data.name);
      const isCommonEvents = data.name === 'CommonEvents.json';
      const isTroops = data.name === 'Troops.json';

      if(!isMap && !isCommonEvents && !isTroops) {
        setInfo(i => ([...i, 'File name not categorized']));
        setError(i => ([...i, 'Data file '+data.name+' cannot be processed']));
        return;
      }

      if(isCommonEvents) {
        data.content.forEach(e => {
          if(e) {
            const name = 'cmn.'+e.id+':'+e.name;
            setInfo(i => ([...i, `On ${name}`]));
            e.list = processTransformation(e.list, forShowT, name);
            e.list = processTransformation(e.list, forScrollT, name);
          }
        });
      }

      if(isTroops) {
        data.content.forEach(e => {
          if(e) {
            e.pages.forEach((p, i) => {
              const name = `troop ${e.id+":"+e.name+'.'+i}`;
              setInfo(ii => ([...ii,'On '+name]));
              console.log('IN', name, p.list);
              p.list = processTransformation(p.list, forShowT, name);
              p.list = processTransformation(p.list, forScrollT, name);
              console.log('OUT', p.list);
            });
          }
        });
      }

      if(isMap) {
        data.content.events.forEach(e => {
          if(e) {
            e.pages.forEach((p, i) => {
              const name = `${data.name+'.'+e.id+":"+e.name+'.'+i}`;
              setInfo(ii => ([...ii,'On '+name]));
              console.log('IN', name, p.list);
              p.list = processTransformation(p.list, forShowT, name);
              p.list = processTransformation(p.list, forScrollT, name);
              console.log('OUT', p.list);
            });
          }
        });
      }  
    });

    setSt(st => ({...st,  moves, skips }));
    console.log('== MOVES ==', moves);
    console.log('== SKIPS ==', skips);

    setState(`Data transformation (${moves.length}) is done (${skips.length} skips)`);
  }
};

export const ld3ProcessLangHook = () => {
  const src = useAtomValue(lang3SrcAtom);
  const setState = useSetAtom(lang3StateAtom);
  const [st, setSt] = useAtom(lang3StAtom);
  const setInfo = useSetAtom(lang3InfoAtom);
  const setError = useSetAtom(lang3ErrorsAtom);

  return async () => {
    setState(stateWorking);
    setInfo(['Checking LANG consistency']);
    setError([]);

    const langs = src.lang;
    if(!langs.length) {
      setInfo(i => ([...i, 'No lang files selected.']));
      setState('Work on LANG is done');
      return;
    }

    const [refLang, ...langsToCheck] = langs;
    const consisCheck = langsToCheck.flatMap(
      l => checkObjectConsistency(refLang.content, l.content, l.name)
    );

    console.log('Inconsistencies', consisCheck);
    setInfo(i => ([...i, 'Found '+consisCheck.length+' inconsistencies']));

    setError(consisCheck);
    setSt(st => ({ ...st, consisCheck }));
    if(consisCheck.length) {
      return;
    }

    setInfo(i => ([...i, 'Check move duplicates']));
    const movesUn = {};
    st.moves.forEach(m => {
      movesUn[m] = movesUn[m] ? movesUn[m]+1 : 1;
    })
    const moves = Object.keys(movesUn);
    const multiMoves = Object.entries(movesUn)
      .filter(([key, value]) => value > 1)
      .map(([key]) => key);

    setInfo(i => ([...i, `Moves reduced from ${st.moves.length} to ${moves.length} (by ${multiMoves.length})`]));
    console.log('Multi moves', multiMoves);

    const skips = [];
    setInfo(i => ([...i, 'Reshaping lang files']));
    moves.forEach(m => {

      langs.forEach(l => {
        const s = digInSrc(l.content, m);
        if(Array.isArray(s.src[s.leaf])) {
          const transformed = s.src[s.leaf].join('\n').replace(/[\s\n]+$/g, "");
          s.src[s.leaf] = transformed;
        } else {
          const name = `${m} in ${l.name}`;
          skips.push(name);
          console.log('SKIPPING '+name, s.src[s.leaf]);
        }
      });
      setInfo(i => ([...i, m+' transformed']));
    });
 
    setSt(st => ({ ...st, langSkips: skips }));
    setState(`Work on LANG is done (${skips.length} skips)`);
  };
};

export const ld3ExportHook = () => {
  const src = useAtomValue(lang3SrcAtom);
  const setState = useSetAtom(lang3StateAtom);
  const setInfo = useSetAtom(lang3InfoAtom);
  const setError = useSetAtom(lang3ErrorsAtom);

  return async () => {
    setState(stateWorking);
    setInfo(['Preparing export zip']);
    setError([]);

    const out = new JSZip();
    const data = out.folder('data');

    src.lang.forEach(l => out.file(l.name, JSON.stringify(l.content, null, 2)));
    src.data.forEach(d => data.file(d.name, JSON.stringify(d.content)));

    const blob = await out.generateAsync({ type:"blob" });
    writeFile(blob, "RMMV_tocmd_out.zip", 'zip');
    setState('Export done');
  };
};
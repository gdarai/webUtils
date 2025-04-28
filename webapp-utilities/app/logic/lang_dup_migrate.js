import { atom, useSetAtom, useAtom, useAtomValue } from 'jotai';
import { readJsonFile, writeFile, checkObjectConsistency } from '@utils/index';
import { digInSrc } from './lang_duplicates';
import JSZip from 'jszip';

export const lang2SrcAtom = atom({});
export const lang2StateAtom = atom('At Start');
export const lang2InfoAtom = atom([]);
export const lang2ErrorsAtom = atom([]);
export const lang2StAtom = atom({});

export const stateWorking = 'Working';

export const ld2ReadHook = () => {  
  const setSrc = useSetAtom(lang2SrcAtom);
  const setState = useSetAtom(lang2StateAtom);
  const setSt = useSetAtom(lang2StAtom);
  const setInfo = useSetAtom(lang2InfoAtom);
  const setError = useSetAtom(lang2ErrorsAtom);

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

  return async (scriptFile, dataFiles, langFiles) => {
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

    setInfo(i => [...i, '== Script File ==']);
    const script = [];
    await loadFilesBatch([scriptFile], script);

    setSrc(s => ({ data, lang, script: script[0].content }));
    setState('Loading is done.');
  }
};

export const ld2ProcessDataHook = () => {  
  const [src, setSrc] = useAtom(lang2SrcAtom);
  const setState = useSetAtom(lang2StateAtom);
  const setInfo = useSetAtom(lang2InfoAtom);
  const setError = useSetAtom(lang2ErrorsAtom);
  const setSt = useSetAtom(lang2StAtom);

  let moves;

  const processDataMove = (evs, id = 'cmn') => {
    setInfo(i => ([...i, `On ${id}`]));
    let cnt = 0;
    evs.forEach((e, i0) => {      
      if(!e || !e.parameters) return;
      e.parameters.forEach((p, i1) => {
        if(typeof p !== 'string') return;
        moves.forEach(m => {          
          if(p.includes(m.f)){
            m.occ.push(id+'-'+i0+'.'+i1);
            e.parameters[i1] = p.replace(m.f, m.t);
            console.log(e.parameters[i1]);
            cnt += 1;
          }
        });
      });
    });
    setInfo(i => ([...i, ` - found ${evs.length} events, did ${cnt} moves.`]));
    return cnt;
  };

  return async () => {
    setState(stateWorking);
    setInfo(['Starting new process']);
    setError([]);
    let moveCnt = 0;

    if(src.script.move.length) {
      const moveSrc = src.script.move;
      setInfo(i => ([...i, `== Lang Migration Moves (${moveSrc.length}) ==`]));
      
      moves = moveSrc.map(({f, t}) => {
        return ({
          f: f.substring(1),
          t: t.substring(1),
          occ: [],
        });
      });

      src.data.forEach(data => {
        setInfo(i => ([...i, `== Data File (${data.name}) ==`]));
        
        const isMap = /^Map\d+\.json$/.test(data.name);
        const isCommonEvents = data.name === 'CommonEvents.json';

        if(!isMap && !isCommonEvents) {
          setInfo(i => ([...i, 'File name not categorized']));
          setError(i => ([...i, 'Data file '+data.name+' cannot be processed']));
          return;
        }

        if(isCommonEvents) {
          data.content.forEach(e => {
            if(e) moveCnt += processDataMove(e.list, 'cmn.'+e.id);
          });
        }

        if(isMap) {
          data.content.events.forEach(e => {
            if(e) e.pages.forEach((p, i) => moveCnt += processDataMove(p.list, data.name+'.'+e.id+'.'+i));
          });
        }  
      });
    }
    setSt(st => ({...st,  moves }));
    console.log('== MOVES ==', moves);

    const unusedMoves = [];
    moves.forEach(m => {
      if(!m.occ.length) unusedMoves.push(m);
    });
    setInfo(i => ([...i, 'Found '+unusedMoves.length+' unused moves.']));
    console.log('Unused Moves', unusedMoves);

    setState(`Migration (${moveCnt}) is done (${unusedMoves.length} unused)`);
  }
};

export const ld2ProcessLangHook = () => {
  const src = useAtomValue(lang2SrcAtom);
  const setState = useSetAtom(lang2StateAtom);
  const [st, setSt] = useAtom(lang2StAtom);
  const setInfo = useSetAtom(lang2InfoAtom);
  const setError = useSetAtom(lang2ErrorsAtom);

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

    setInfo(i => ([...i, 'Reshaping lang files']));
    st.moves.forEach(m => {
      if(!m.occ.length) return;

      langs.forEach(l => {
        const srcF = digInSrc(l.content, m.f);
        const srcT = digInSrc(l.content, m.t);

        if(!srcT.value) srcT.src[srcT.leaf] = srcF.value;
        delete srcF.src[srcF.leaf];
      });
      setInfo(i => ([...i, m.f+' moved-to '+m.t]));
    });
 
    setState('Work on LANG is done');
  };
};

export const ld2ExportHook = () => {
  const src = useAtomValue(lang2SrcAtom);
  const setState = useSetAtom(lang2StateAtom);
  const setInfo = useSetAtom(lang2InfoAtom);
  const setError = useSetAtom(lang2ErrorsAtom);

  return async () => {
    setState(stateWorking);
    setInfo(['Preparing export zip']);
    setError([]);

    const out = new JSZip();
    const data = out.folder('data');

    src.lang.forEach(l => out.file(l.name, JSON.stringify(l.content, null, 2)));
    src.data.forEach(d => data.file(d.name, JSON.stringify(d.content)));

    const blob = await out.generateAsync({ type:"blob" });
    writeFile(blob, "RMMV_rename_out.zip", 'zip');
    setState('Export done');
  };
};
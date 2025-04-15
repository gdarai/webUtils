import React from 'react';
import {
  CentVList,
  CentHList,
} from '@app/ui/_index';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Spinner } from "@heroui/spinner";
import {Select, SelectItem} from "@heroui/select";
import {Checkbox} from "@heroui/checkbox";

import { useAtom, useAtomValue } from 'jotai';
import {
  stateWorking,
  inpFileAtom,
  langStateAtom,
  langErrorsAtom,
  langSrcAtom,
  langOutAtom,
  langNamesAtom,
  ldCleanHook,
  ldReadHook,
  ldParseHook,
  ldExportHook,
  digInSrc,
} from '@logic/lang_duplicates';

export default function LangDuplicates() {

  const [dispKey, setDispKey] = React.useState("");
  const [file, setFile] = useAtom(inpFileAtom);
  const [langState, setLangState] = useAtom(langStateAtom);
  const langErrors = useAtomValue(langErrorsAtom);
  const src = useAtomValue(langSrcAtom);
  const out = useAtomValue(langOutAtom);
  const [names, setNames] = useAtom(langNamesAtom);

  const ldClean = ldCleanHook();
  const ldRead = ldReadHook();
  const ldParse = ldParseHook();
  const ldExport = ldExportHook();

  const isWorking = langState === stateWorking;
  const haveSrc = Object.keys(src).length;

  const outKeys = Object.keys(out);
  const haveOut = outKeys.length;
  const disp = (haveOut && dispKey.length) ? out[dispKey] : null;
  const tickSkip = !names[dispKey];
  const text = disp ? digInSrc(src, disp[0]).value : [];

  const changeSelect = s => {
    if(!s.size) {
      setDispKey('');
    } else {
      setDispKey(s.values().next().value);
    }
  };
  
  const changeSkip = () => {
    if(!names[dispKey]) {
      const newName = disp[0].slice(1).replace(/[. ]/g, '_');
      setNames(n => ({...n, [dispKey]: newName}));
    } else {
      delete names[dispKey];
      setNames(() => ({...names}));
    }
  };

  const changeName = n => {
    setNames(() => ({...names, [dispKey]: n}));
  }

  return (
    <CentVList>
      <h1>Solving Translation Duplicates in JSON</h1>
      <CentHList>
      <Input
        type="file"
        label="Upload Lang JSON File"
        onClick={() => ldClean()}
        onChange={(x) => {
          if(x.target.files.length) {
            setFile(x.target.files[0]);
            setLangState('File Selected');  
          }
        }}
        accept=".json"
      />
      </CentHList>
      <CentHList>
      <Button
          isDisabled={!file}
          onPress={() => { ldRead(file) }}
        >Load the File</Button>
        <Button
          isDisabled={!haveSrc}
          onPress={() => { ldParse(src) }}
        >Parse It</Button>
        <Button
          isDisabled={!haveOut}
          onPress={() => { ldExport(out) }}
        >Export result</Button>
      </CentHList>
      <h1 className="text-primary text-lg">
        {langState}
        {isWorking && <>{'  '}<Spinner /></>}
      </h1>
      {haveOut && (
        <>
          <CentHList style={{ width: '100%' }}>
            <Select
              className="w-2/5"
              label="Isolated keys:"
              onSelectionChange={changeSelect}
            >
              {outKeys.map((k) => (
                <SelectItem className={names[k] ? 'text-primary' : 'text-danger'} key={k}>
                  {`[${out[k].length}] ${k}`}
                </SelectItem>
              ))}
            </Select>
            { !!disp && (
              <>
                <Checkbox isSelected={tickSkip} onValueChange={changeSkip}>Skip</Checkbox>
                <Input
                  className="w-[400px] grow"
                  label="Key new name:"
                  value={names[dispKey] || ''}
                  onValueChange={changeName}
                />
              </>
            )}
          </CentHList>
          { !!text.length && (
            <div>
              {text.map((t,i) => (<div key={i}>{t}</div>))}
            </div>
          )}
        </>
      )}
      {langErrors.map((e, i) => (<h2 className="text-danger" key={i}>{e}</h2>))}
    </CentVList>
  )
}

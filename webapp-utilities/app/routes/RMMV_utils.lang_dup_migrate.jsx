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
  lang2SrcAtom,
  lang2StateAtom,
  lang2InfoAtom,
  lang2ErrorsAtom,
  lang2StAtom,
  ld2ReadHook,
  ld2ProcessDataHook,
  ld2ProcessLangHook,
  ld2ExportHook,
} from '@logic/lang_dup_migrate';

export default function LangDupMigrate() {
  const [script, setScript] = React.useState('');
  const [files, setFiles] = React.useState([]);
  const [dataFiles, setDataFiles] = React.useState([]);
  const [langFiles, setLangFiles] = React.useState([]);
  const langErrors = useAtomValue(lang2ErrorsAtom);
  const langSt = useAtomValue(lang2StAtom);
  

  const state = useAtomValue(lang2StateAtom);
  const info = useAtomValue(lang2InfoAtom);
  const src = useAtomValue(lang2SrcAtom);

  const haveAllInput = script !== '' && (dataFiles.length || langFiles.length);
  const isWorking = state === stateWorking;

  const ld2Read = ld2ReadHook();
  const ld2ProcessData = ld2ProcessDataHook();
  const ld2ProcessLang = ld2ProcessLangHook();
  const ld2Export = ld2ExportHook();
  
  return (
    <CentVList>
      <h1 className="text-primary text-lg">Solving Translation Duplicates in JSON - migration</h1>
      <CentHList>
        <Input
          type="file"
          label="Select migration script"
          onClick={() => {}}
          onChange={(x) => {
            if(x.target.files.length) setScript(x.target.files[0]);
          }}
          accept=".json"
        />
        <Input
          type="file"
          label="Select files for tweaking"
          onClick={() => {}}
          onChange={(x) => {
            if(x.target.files.length) setFiles(Array.from(x.target.files));
          }}
          multiple
          accept=".json"
        />
      </CentHList>
      <CentHList>
      </CentHList>
      <CentHList>
        <Button
            isDisabled={!files.length}
            onPress={() => setDataFiles(a => ([...a, ...files]))}
          >Add files to DATA</Button>
        <Button
          onPress={() => setDataFiles([])}
        >Clear DATA</Button>
        <span className="text-primary text-lg">
            {`Selected ${dataFiles.length} DATA files`}
        </span>
      </CentHList>
      <CentHList>
        <Button
          isDisabled={!files.length}
          onPress={() => setLangFiles(a => ([...a, ...files]))}
        >Add files to LANG</Button>
        <Button
          onPress={() => setLangFiles([])}
        >Clear LANG</Button>
        <span className="text-primary text-lg">
            {`Selected ${langFiles.length} LANG files`}
        </span>
      </CentHList>
      <h1 className="text-primary text-lg">
        {state}
        {isWorking && <>{'  '}<Spinner /></>}
      </h1>      <CentHList>
      <Button
          isDisabled={!haveAllInput}
          onPress={() => ld2Read(script, dataFiles, langFiles)}
        >Load the files</Button>
      <Button
          isDisabled={!src.script}
          onPress={() => ld2ProcessData()}
        >Run Data Migration</Button>
      <Button
          isDisabled={!langSt.moves}
          onPress={() => ld2ProcessLang()}
        >Run Lang Migration</Button>
      <Button
          isDisabled={!langSt.consisCheck}
          onPress={() => ld2Export()}
        >Export result</Button>
      </CentHList>
      {langErrors.map((e, i) => (<h2 className="text-danger" key={i}>{e}</h2>))}
      {info.map((t,i) => <div key={i}>{t}</div>)}
    </CentVList>
  );
}

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
  lang3SrcAtom,
  lang3StateAtom,
  lang3InfoAtom,
  lang3ErrorsAtom,
  lang3StAtom,
  ld3ReadHook,
  ld3ProcessDataHook,
  ld3ProcessLangHook,
  ld3ExportHook,
} from '@logic/lang_tocmd';

export default function LangToCmd() {
  const [files, setFiles] = React.useState([]);
  const [dataFiles, setDataFiles] = React.useState([]);
  const [langFiles, setLangFiles] = React.useState([]);
  const langErrors = useAtomValue(lang3ErrorsAtom);
  const langSt = useAtomValue(lang3StAtom);
  

  const state = useAtomValue(lang3StateAtom);
  const info = useAtomValue(lang3InfoAtom);
  const src = useAtomValue(lang3SrcAtom);

  const haveAllInput = (dataFiles.length && langFiles.length);
  const isWorking = state === stateWorking;

  const ldRead = ld3ReadHook();
  const ldProcessData = ld3ProcessDataHook();
  const ldProcessLang = ld3ProcessLangHook();
  const ldExport = ld3ExportHook();
  
  return (
    <CentVList>
      <h1 className="text-primary text-lg">RMMV transformation - to custom command</h1>
      <CentHList>
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
      </h1>
      <CentHList>
        <Button
          isDisabled={!haveAllInput}
          onPress={() => ldRead(dataFiles, langFiles)}
        >Load the files</Button>
        <Button
          isDisabled={!src.data}
          onPress={() => ldProcessData()}
        >Run Data Migration</Button>
        <Button
          isDisabled={!langSt.moves}
          onPress={() => ldProcessLang()}
        >Run Lang Migration</Button>
        <Button
          isDisabled={!langSt.moves}
          onPress={() => ldExport()}
        >Export result</Button>
      </CentHList>
      {langErrors.map((e, i) => (<h2 className="text-danger" key={i}>{e}</h2>))}
      {info.map((t,i) => <div key={i}>{t}</div>)}
    </CentVList>
  );
}

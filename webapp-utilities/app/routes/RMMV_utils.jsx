import React from 'react';
import { Outlet } from "@remix-run/react";
import {
  CentVList,
  CentHList,
  NavButton,
} from '@app/ui/_index';
import { Input } from '@heroui/input';

export default function Index() {
  return (
    <CentVList>
      <h1>RMMV Utils</h1>
      <CentHList>
        <NavButton link="/">To Root</NavButton>
      </CentHList>
      <CentHList>
      <NavButton link="./lang_duplicates">Lang Duplicates</NavButton>
      <NavButton link="./lang_dup_migrate">Lang Migration</NavButton>
      <NavButton link="./lang_tocmd">Show Text Commands</NavButton>
      </CentHList>
      <Outlet />
    </CentVList>
  )
}

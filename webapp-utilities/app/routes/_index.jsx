import React from 'react';
import {
  CentVList,
  CentHList,
  NavButton,
} from '@app/ui/_index';

export default function Index() {
  return (
    <CentVList>
      <h1>Gaimi Darai's Web Based JS Utils</h1>
      <CentHList>
        <NavButton link="/RMMV_utils/lang_duplicates">RMMV Utils</NavButton>
      </CentHList>
    </CentVList>
  )
}

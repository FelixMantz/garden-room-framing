"use client";
import React from 'react';
import type { Settings } from './framing';
import { FRAMING_PDF_PAGE_COUNT } from './framing-pdf';
import { drawSheathingDetails } from './pdf/sheathing';
import { svgCanvas } from './pdf/svg';

export default function ConstructionDetails({settings}:{settings:Settings}){
  return <section className="diagram-card shared-drawing" aria-label="Labelled external corner construction detail"
    dangerouslySetInnerHTML={{__html:drawSheathingDetails(settings,FRAMING_PDF_PAGE_COUNT,FRAMING_PDF_PAGE_COUNT,svgCanvas())}}/>;
}

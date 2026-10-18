"use client";
import React from 'react';
import type { Settings } from './framing';
import { PDF_PARTS } from './framing-pdf';
import { drawSheathingDetails } from './pdf/sheathing';
import { svgCanvas } from './pdf/svg';

export default function ConstructionDetails({settings}:{settings:Settings}){
  return <section className="diagram-card shared-drawing" aria-label="Labelled external corner construction detail"
    dangerouslySetInnerHTML={{__html:drawSheathingDetails(settings,8,PDF_PARTS[1].pageCount,svgCanvas())}}/>;
}

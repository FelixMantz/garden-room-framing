import { z } from "zod";
import { defaultSettings, type Settings } from "./framing";
import { adjustmentFields } from "./specification";
export const settingsSchema=z.unknown().transform((input,ctx):Settings=>{
 const defaults=defaultSettings();
 if(!input || typeof input!=="object" || Array.isArray(input)){ctx.addIssue({code:'custom',message:'Expected framing settings'});return z.NEVER;}
 const values=input as Record<string,unknown>,allowed=new Set<string>(adjustmentFields.map(f=>f[0]));
 for(const key of Object.keys(values))if(!(key in defaults)){ctx.addIssue({code:'custom',path:[key],message:'Unknown setting'});}
 for(const key of Object.keys(defaults))if(!allowed.has(key)&&JSON.stringify(values[key])!==JSON.stringify(defaults[key as keyof Settings]))ctx.addIssue({code:'custom',path:[key],message:'Fixed garden-room specification'});
 for(const [key,,min,max,step] of adjustmentFields){const value=values[key];if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(key==='tieCount'||key==='tieEvery')&&!Number.isInteger(value)){ctx.addIssue({code:'custom',path:[key],message:`Must be between ${min} and ${max}`});}else defaults[key]=value;}
 return defaults;
});

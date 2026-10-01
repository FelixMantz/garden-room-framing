import {createServer} from 'vite';
import {writeFile,mkdir} from 'node:fs/promises';
const vite=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
try{const {defaultSettings}=await vite.ssrLoadModule('/app/framing.ts');const {generateFramingPdf}=await vite.ssrLoadModule('/app/framing-pdf.ts');await mkdir('public',{recursive:true});await writeFile('public/garden-room-framing-set.pdf',generateFramingPdf(defaultSettings()));}finally{await vite.close();}

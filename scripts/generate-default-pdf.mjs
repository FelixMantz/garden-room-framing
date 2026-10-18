import {createServer} from 'vite';
import {writeFile,mkdir,rm} from 'node:fs/promises';
const vite=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
try{
 const {defaultSettings}=await vite.ssrLoadModule('/app/framing.ts');
 const {generateFramingPdf,PDF_PARTS}=await vite.ssrLoadModule('/app/framing-pdf.ts');
 await mkdir('public',{recursive:true});
 for(const part of PDF_PARTS)await writeFile(`public/${part.filename}`,generateFramingPdf(defaultSettings(),part.id));
 await rm('public/garden-room-framing-set.pdf',{force:true});
}finally{await vite.close();}

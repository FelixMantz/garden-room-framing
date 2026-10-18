import { defaultSettings, type Settings } from "../../framing";
import { generateFramingPdf, PDF_PARTS, type PdfPart } from "../../framing-pdf";
import { settingsSchema } from "../../settings-schema";

function parsePart(value:FormDataEntryValue|null):PdfPart{
  if(value===null)return 'timber';
  if(value==='timber'||value==='construction')return value;
  throw new Error('Invalid PDF part.');
}
function render(settings:Settings,download:boolean,part:PdfPart){
  const pdf=generateFramingPdf(settings,part);
  return new Response(pdf,{headers:{
    "Content-Type":"application/pdf",
    "Content-Disposition":`${download?"attachment":"inline"}; filename="${PDF_PARTS.find(item=>item.id===part)!.filename}"`,
    "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
  }});
}

export async function GET(request?:Request){
  try{return render(defaultSettings(),false,parsePart(request?new URL(request.url).searchParams.get('part'):null));}
  catch{return new Response('Invalid PDF part.',{status:400});}
}

export async function POST(request:Request){
  try{
    const form=await request.formData(),raw=form.get("config");
    if(typeof raw!=="string")throw new Error("Missing framing configuration");
    if(raw.length>50000)throw new Error("Framing configuration is too large.");
    const result=settingsSchema.safeParse(JSON.parse(raw));
    if(!result.success)throw new Error(result.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));
    return render(result.data,form.get("output")==="download",parsePart(form.get("part")));
  }catch(error){
    return new Response(error instanceof Error?error.message:"Invalid framing configuration",{
      status:400,headers:{"Content-Type":"text/plain; charset=utf-8"},
    });
  }
}

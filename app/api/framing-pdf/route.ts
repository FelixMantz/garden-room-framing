import { defaultSettings, type Settings } from "../../framing";
import { generateFramingPdf } from "../../framing-pdf";
import { settingsSchema } from "../../settings-schema";

function render(settings:Settings,download:boolean){
  const pdf=generateFramingPdf(settings);
  return new Response(pdf,{headers:{
    "Content-Type":"application/pdf",
    "Content-Disposition":`${download?"attachment":"inline"}; filename="garden-room-framing-set.pdf"`,
    "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
  }});
}

export async function GET(){return render(defaultSettings(),false);}

export async function POST(request:Request){
  try{
    const form=await request.formData(),raw=form.get("config");
    if(typeof raw!=="string")throw new Error("Missing framing configuration");
    if(raw.length>50000)throw new Error("Framing configuration is too large.");
    const result=settingsSchema.safeParse(JSON.parse(raw));
    if(!result.success)throw new Error(result.error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; "));
    return render(result.data,form.get("output")==="download");
  }catch(error){
    return new Response(error instanceof Error?error.message:"Invalid framing configuration",{
      status:400,headers:{"Content-Type":"text/plain; charset=utf-8"},
    });
  }
}

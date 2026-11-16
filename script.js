// เครื่องมือสร้าง QR Code: ทำงานทั้งหมดใน browser
const $ = id => document.getElementById(id);
let qr = null, logoData = "", timer, logoVersion = 0;
const form = $("form");
const controls = ["kind", "data", "size", "foreground", "background"];
function notify(message, ok = false) {
  $("message").textContent = message;
  $("message").classList.toggle("ok", ok);
}
function clearPreview() {
  qr = null;
  $("qr").replaceChildren();
  $("placeholder").hidden = false;
  $("png").disabled = $("svg").disabled = true;
}
// ตรวจสอบความต่างของความสว่างเพื่อช่วยให้สแกนได้ง่าย
function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map(x => parseInt(x,16)/255);
  return rgb.map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4)
    .reduce((sum,v,i) => sum + v*[.2126,.7152,.0722][i],0);
}
function generate(showError = false) {
  clearTimeout(timer);
  const data = $("data").value.trim(), size = Number($("size").value);
  const foreground = $("foreground").value, background = $("background").value;
  $("fgValue").textContent = foreground;
  $("bgValue").textContent = background;
  $("dimension").textContent = size + " × " + size + " px";
  function fail(message) { clearPreview(); notify(message); }
  if (!data) { clearPreview(); notify(showError ? "กรุณากรอก URL หรือข้อความ" : ""); return; }
  if ($("kind").value === "url") {
    try { const url = new URL(data); if (!["http:","https:"].includes(url.protocol) || !url.hostname) throw Error(); }
    catch { return fail("กรุณากรอก URL ที่ขึ้นต้นด้วย https:// หรือ http://"); }
  }
  if ((luminance(background)+.05)/(luminance(foreground)+.05) < 4.5)
    return fail("กรุณาเลือกสี QR Code เข้มและพื้นหลังสว่าง ให้มีความต่างของสีเพียงพอ");
  if (typeof QRCodeStyling !== "function") return fail("โหลดไลบรารีไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรช");
  // ใช้ระดับแก้ไขข้อผิดพลาด H และเว้นขอบเพื่อช่วยให้สแกนง่าย
  try {
    const next = new QRCodeStyling({
      width:size, height:size, type:"svg", data,
      margin:Math.ceil(size*.10),
      qrOptions:{errorCorrectionLevel:"H"},
      dotsOptions:{color:foreground,type:"square"},
      cornersSquareOptions:{color:foreground,type:"square"},
      cornersDotOptions:{color:foreground,type:"square"},
      backgroundOptions:{color:background},
      ...(logoData ? {image:logoData,imageOptions:{hideBackgroundDots:true,imageSize:.20,margin:4,saveAsBlob:true}} : {})
    });
    $("qr").replaceChildren();
    next.append($("qr"));
    qr = next; $("placeholder").hidden = true;
    $("png").disabled = $("svg").disabled = false;
    notify("สร้าง QR Code สำเร็จ",true);
  } catch { fail("ไม่สามารถสร้าง QR Code ได้ กรุณาลดความยาวข้อความ"); }
}
function schedule() { clearTimeout(timer); clearPreview(); timer=setTimeout(()=>generate(),150); }
controls.forEach(id=>$(id).addEventListener("input",()=>{
  if(id==="kind") $("data").placeholder=$("kind").value==="url"?"https://example.com":"พิมพ์ข้อความที่ต้องการ";
  schedule();
}));
form.addEventListener("submit",e=>{e.preventDefault();generate(true);});
// อ่านไฟล์โลโก้เป็น data URL ไม่อัปโหลดออกจากเครื่อง
$("logo").addEventListener("change",()=>{
  const file=$("logo").files[0], version=++logoVersion;
  logoData=""; $("removeLogo").hidden=true;
  if(!file){generate();return;}
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>2*1024*1024){
    $("logo").value="";generate();notify("กรุณาเลือก PNG, JPG หรือ WebP ไม่เกิน 2 MB");return;
  }
  clearPreview(); clearTimeout(timer);
  const reader=new FileReader();
  reader.onload=()=>{
    if(version!==logoVersion)return;
    const img=new Image();
    img.onload=()=>{if(version!==logoVersion)return;logoData=reader.result;$("removeLogo").hidden=false;generate();};
    img.onerror=()=>{if(version!==logoVersion)return;$("logo").value="";generate();notify("ไฟล์ภาพไม่ถูกต้อง");};
    img.src=reader.result;
  };
  reader.onerror=()=>{if(version!==logoVersion)return;$("logo").value="";generate();notify("อ่านไฟล์โลโก้ไม่สำเร็จ");};
  reader.readAsDataURL(file);
});
$("removeLogo").addEventListener("click",()=>{logoVersion++;logoData="";$("logo").value="";$("removeLogo").hidden=true;generate();});
form.addEventListener("reset",()=>{logoVersion++;logoData="";clearTimeout(timer);$("removeLogo").hidden=true;setTimeout(()=>{$("data").placeholder="https://example.com";generate();},0);});
async function download(extension){
  if(!qr)return;
  const current=qr;
  try { await current.download({name:"qr-code",extension}); }
  catch { notify("ดาวน์โหลดไม่สำเร็จ กรุณาสร้าง QR Code ใหม่"); }
}
$("png").addEventListener("click",()=>download("png"));
$("svg").addEventListener("click",()=>download("svg"));
generate();
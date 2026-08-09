const FALLBACK_SUPABASE_URL="https://kqfqdxmhrsndrgyipybe.supabase.co";
const FALLBACK_SUPABASE_KEY="sb_publishable_vLPh3dz8y3jHDcXtg1JmgQ_nJF2WdUF";
function env(k,fallback=""){return globalThis.__ENV?.[k]||fallback}
function supabaseConfig(){return {url:env("SUPABASE_URL",FALLBACK_SUPABASE_URL),key:env("SUPABASE_ANON_KEY",FALLBACK_SUPABASE_KEY)}}
const clone=x=>structuredClone(x);
const uid=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();
const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d");
const money=n=>Math.max(0,Math.round(Number(n)||0));
const qty=n=>Math.max(0,Number(n)||0);

async function rpc(name,payload){
  const {url,key}=supabaseConfig();
  const r=await fetch(`${url}/rest/v1/rpc/${name}`,{method:"POST",headers:{"Content-Type":"application/json","apikey":key,"Authorization":`Bearer ${key}`},body:JSON.stringify(payload)});
  const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok)throw new Error(data?.message||String(data||"Lỗi Supabase"));return data;
}
async function readRootRaw(){
  const v=await rpc("cantin_read_store_public",{});
  if(Array.isArray(v)&&v.length===1){
    const row=v[0];
    if(row&&typeof row==="object"){
      const keys=Object.keys(row);
      if(keys.length===1&&row[keys[0]]&&typeof row[keys[0]]==="object")return row[keys[0]];
    }
  }
  return v;
}

function emptyStore(name="Cửa hàng chính"){return {meta:{name,createdAt:now(),version:"2.0.0"},config:{money:{under1000MeansThousands:true},ai:{preview:true,safetyMode:"preview",autoIngredientDeduct:false},ui:{compactDebt:true}},products:[],ingredients:[{"id": "ing-ca-phe-phin", "name": "Cà phê phin", "purchasePrice": 1085000, "packageQty": 7000, "unit": "g", "unitCost": 155, "stock": 0, "note": "240g pha được 500ml cà phê phin"}, {"id": "ing-ca-phe-may", "name": "Cà phê máy", "purchasePrice": 234000, "packageQty": 1000, "unit": "g", "unitCost": 234, "stock": 0, "note": "Tạm tính gói 1kg; sửa nếu khác"}, {"id": "ing-bot-kem-muoi", "name": "Bột kem muối", "purchasePrice": 80000, "packageQty": 500, "unit": "g", "unitCost": 160, "stock": 0, "note": "Người dùng cung cấp"}, {"id": "ing-sua-dac", "name": "Sữa đặc", "purchasePrice": 450000, "packageQty": 9120, "unit": "ml", "unitCost": 49.3421052632, "stock": 0, "note": "24 hộp x 380ml"}, {"id": "ing-sua-tuoi", "name": "Sữa tươi", "purchasePrice": 35000, "packageQty": 1000, "unit": "ml", "unitCost": 35, "stock": 0, "note": "1 lít giá 35.000"}, {"id": "ing-duong", "name": "Đường", "purchasePrice": 25000, "packageQty": 1000, "unit": "g", "unitCost": 25, "stock": 0, "note": "Tạm tính 25.000/kg; sửa theo thực tế"}],customers:[],debts:[],sales:[],stockReceipts:[],audits:[],transactions:[],snapshots:[],aliases:[],cashEntries:[],suppliers:[],supplierDebts:[],cashSessions:[]}}

function normalizeLegacyProductCosts(x){
  // Các bản cũ từng lưu giá nhập/thùng vào costPrice (vốn/đơn vị).
  // Chỉ tự sửa khi dấu hiệu rất rõ: giá vốn hiện lớn hơn giá bán nhưng chia theo packSize lại hợp lý.
  if(x?.meta?.unitCostMigrationVersion>=1)return;
  let changed=0;
  for(const p of x.products||[]){
    const pack=Math.max(1,qty(p.packSize)||1),cost=money(p.costPrice),sale=money(p.salePrice);
    if(pack>1&&cost>0&&sale>0&&cost>sale&&cost/pack<sale){
      p.legacyCaseCost=cost;
      p.costPrice=Math.round(cost/pack);
      changed++;
    }
  }
  x.meta=x.meta||{};x.meta.unitCostMigrationVersion=1;
  if(changed)x.meta.unitCostMigrationCount=changed;
}
function ensureStore(s,name){const x=s&&typeof s==="object"?s:{};const e=emptyStore(name);for(const k of Object.keys(e))if(x[k]===undefined)x[k]=clone(e[k]);for(const k of ["products","ingredients","customers","debts","sales","stockReceipts","audits","transactions","snapshots","aliases","cashEntries","suppliers","supplierDebts","cashSessions"])if(!Array.isArray(x[k]))x[k]=[];x.meta={...e.meta,...(x.meta||{})};x.config={...e.config,...(x.config||{})};x.config.ai={...e.config.ai,...(x.config.ai||{})};x.config.money={...e.config.money,...(x.config.money||{})};x.config.ui={...e.config.ui,...(x.config.ui||{})};if(!Array.isArray(x.ingredients)||!x.ingredients.length)x.ingredients=clone([{"id": "ing-ca-phe-phin", "name": "Cà phê phin", "purchasePrice": 1085000, "packageQty": 7000, "unit": "g", "unitCost": 155, "stock": 0, "note": "240g pha được 500ml cà phê phin"}, {"id": "ing-ca-phe-may", "name": "Cà phê máy", "purchasePrice": 234000, "packageQty": 1000, "unit": "g", "unitCost": 234, "stock": 0, "note": "Tạm tính gói 1kg; sửa nếu khác"}, {"id": "ing-bot-kem-muoi", "name": "Bột kem muối", "purchasePrice": 80000, "packageQty": 500, "unit": "g", "unitCost": 160, "stock": 0, "note": "Người dùng cung cấp"}, {"id": "ing-sua-dac", "name": "Sữa đặc", "purchasePrice": 450000, "packageQty": 9120, "unit": "ml", "unitCost": 49.3421052632, "stock": 0, "note": "24 hộp x 380ml"}, {"id": "ing-sua-tuoi", "name": "Sữa tươi", "purchasePrice": 35000, "packageQty": 1000, "unit": "ml", "unitCost": 35, "stock": 0, "note": "1 lít giá 35.000"}, {"id": "ing-duong", "name": "Đường", "purchasePrice": 25000, "packageQty": 1000, "unit": "g", "unitCost": 25, "stock": 0, "note": "Tạm tính 25.000/kg; sửa theo thực tế"}]);for(const i of x.ingredients)i.category=i.category||"Nguyên liệu cà phê";normalizeLegacyProductCosts(x);return x}

function dataWeight(root){
  try{
    return (root.stores||[]).reduce((sum,s)=>{
      const d=s.data||{};
      return sum+(d.products?.length||0)+(d.customers?.length||0)+(d.debts?.length||0)+(d.sales?.length||0)+(d.audits?.length||0)+(d.stockReceipts?.length||0);
    },0)
  }catch{return 0}
}

function normalizeLegacyStore(input,name="Cửa hàng chính"){
  const src=clone(input||{});
  const out=ensureStore(src);
  out.meta={...(out.meta||{}),name:out.meta?.name||name,version:"2.0.0"};
  // Preserve legacy arrays instead of dropping them.
  if((!Array.isArray(out.audits)||!out.audits.length)&&Array.isArray(src.weeklyAudits)){
    out.audits=src.weeklyAudits.map(a=>({
      id:a.id||uid(),
      createdAt:a.createdAt||now(),
      note:a.note||"Kiểm kho cũ",
      source:a.source||"legacy_weekly_audit",
      lines:(a.lines||[]).map(l=>({
        productId:l.productId||"",
        name:l.name||"",
        unit:l.unit||"",
        before:Number(l.stockBefore ?? l.openingStock ?? l.recordedQty ?? 0),
        actual:Number(l.endingStock ?? l.recordedQty ?? 0),
        delta:Number((l.endingStock ?? l.recordedQty ?? 0)-(l.stockBefore ?? l.openingStock ?? l.recordedQty ?? 0))
      }))
    }));
  }
  if(!Array.isArray(out.stockAdjustments)&&Array.isArray(src.stockAdjustments))out.stockAdjustments=clone(src.stockAdjustments);
  if(!Array.isArray(out.weeklyAudits)&&Array.isArray(src.weeklyAudits))out.weeklyAudits=clone(src.weeklyAudits);
  if(!Array.isArray(out.weeklyTemplate)&&Array.isArray(src.weeklyTemplate))out.weeklyTemplate=clone(src.weeklyTemplate);
  return out;
}
function normalizeRoot(raw){
  // Already v4 root: preserve every store.
  if(raw&&raw.__nextV4&&Array.isArray(raw.stores)&&raw.stores.length){
    const stores=raw.stores.map((s,i)=>({
      id:s.id||uid(),
      name:s.name||s.data?.meta?.name||`Cửa hàng ${i+1}`,
      createdAt:s.createdAt||now(),
      data:normalizeLegacyStore(s.data||{},s.name||`Cửa hàng ${i+1}`)
    }));
    const activeStoreId=stores.some(s=>s.id===raw.activeStoreId)?raw.activeStoreId:stores[0].id;
    return {...raw,__nextV4:true,revision:Number(raw.revision)||0,activeStoreId,stores};
  }

  // Legacy multi-store v2/v3: preserve ALL stores, not only active store.
  if(raw&&raw.__multiStore&&Array.isArray(raw.stores)&&raw.stores.length){
    const stores=raw.stores.map((s,i)=>({
      id:s.id||uid(),
      name:s.name||s.data?.meta?.name||`Cửa hàng ${i+1}`,
      createdAt:s.createdAt||now(),
      data:normalizeLegacyStore(s.data||{},s.name||`Cửa hàng ${i+1}`)
    }));
    const activeStoreId=stores.some(s=>s.id===raw.activeStoreId)?raw.activeStoreId:stores[0].id;
    return {__nextV4:true,revision:Number(raw.revision)||0,activeStoreId,stores};
  }

  // Plain legacy single-store object.
  if(raw&&typeof raw==="object"){
    const data=normalizeLegacyStore(raw,raw.meta?.name||"Cửa hàng chính");
    const id=raw.id||"store-main";
    return {__nextV4:true,revision:0,activeStoreId:id,stores:[{id,name:data.meta?.name||"Cửa hàng chính",createdAt:raw.meta?.createdAt||now(),data}]};
  }

  // Only when there is truly no data at all, create blank store.
  const data=ensureStore({}); const id="store-main";
  return {__nextV4:true,revision:0,activeStoreId:id,stores:[{id,name:"Cửa hàng chính",createdAt:now(),data}]};
}
async function readRoot(){return normalizeRoot(await rpc("cantin_read_store_public",{}))}
async function writeRoot(root,expectedRevision=null){
  const currentRaw=await readRootRaw().catch(()=>null);
  const current=currentRaw?normalizeRoot(currentRaw):null;
  if(expectedRevision!==null&&current&&Number(current.revision||0)!==Number(expectedRevision)) throw Object.assign(new Error("Dữ liệu vừa thay đổi ở thiết bị khác. Hãy đồng bộ lại trước khi lưu."),{status:409});

  // Prevent an accidental blank overwrite, but do not block normal edits.
  if(current&&dataWeight(current)>10&&dataWeight(root)===0){
    throw new Error("Đã chặn ghi dữ liệu trắng đè lên dữ liệu hiện có.");
  }

  // IMPORTANT: do not embed the whole previous database into the next database.
  // Per-action store snapshots already exist and are enough for rollback.
  delete root.backups;

  root.revision=(Number(root.revision)||0)+1;
  const token=uid();
  root.persist={token,writtenAt:now(),version:"2.0.0"};

  if(expectedRevision!==null){const latest=normalizeRoot(await readRootRaw());if(Number(latest.revision||0)!==Number(expectedRevision))throw Object.assign(new Error("Phát hiện thay đổi đồng thời từ thiết bị khác. Lần lưu này đã được hủy để tránh ghi đè."),{status:409});}
  await rpc("cantin_write_store_public",{p_data:root});

  for(let i=0;i<4;i++){
    const check=normalizeRoot(await readRootRaw());
    if(check.persist?.token===token){
      return check;
    }
    await new Promise(r=>setTimeout(r,120*(i+1)));
  }
  throw new Error("Supabase chưa xác nhận lưu dữ liệu. Không có dữ liệu nào được báo thành công giả.");
}
function active(root){return root.stores.find(s=>s.id===root.activeStoreId)||root.stores[0]}
function tx(store,type,summary,changes=[]){const t={id:`TX-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,type,summary,changes,createdAt:now()};store.transactions.push(t);if(store.transactions.length>600)store.transactions=store.transactions.slice(-600);return t}
function snapshot(store,label){
  const data=clone(store);data.snapshots=[];
  // Snapshot chỉ giữ một phần nhật ký gần đây để tránh mỗi lần lưu nhân bản toàn bộ lịch sử giao dịch.
  data.transactions=(data.transactions||[]).slice(-120);
  store.snapshots.push({id:uid(),label,createdAt:now(),data});
  // 12 snapshot gần nhất đủ cho hoàn tác thực tế, giảm đáng kể kích thước payload Supabase.
  if(store.snapshots.length>12)store.snapshots=store.snapshots.slice(-12)
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
function bad(m,status=400){throw Object.assign(new Error(m),{status})}



function parseAmountAfter(text,keywords){
  const raw=String(text||""),nraw=norm(raw);
  for(const kw of keywords){const i=nraw.indexOf(norm(kw));if(i>=0){const c=parseCashDetailed(raw.slice(i+kw.length));if(c.amount)return c}}
  return {amount:null,ambiguous:false}
}
function paymentAmountFromMessage(text){return parseAmountAfter(text,["trả nợ","tra no","trả","tra"]).amount}
function debtAmountFromClause(text){return parseAmountAfter(text,["ghi nợ","ghi no","nợ","no"]).amount}
function debtNoteFromClause(text){
  const raw=String(text||"").trim();
  const m=raw.match(/(?:^|\s)(?:ghi\s*nợ|ghi\s*no|nợ|no)(?=\s|$)/i);
  if(!m)return "";
  const after=raw.slice((m.index||0)+m[0].length).trim();
  const amount=after.match(/^(?:[:=\-]?\s*)?(\d+(?:[.,]\d+)?)\s*(k|nghin|nghìn|ngàn|ngan|tr|triệu|trieu)?\b/i);
  if(!amount)return "";
  let note=after.slice(amount[0].length).trim();
  // Ngày tháng là metadata của khoản nợ, không phải ghi chú.
  note=note.replace(/(?:,?\s*(?:ngày|ngay)\s*\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/ig,"");
  note=note.replace(/^[,;:\-–—\s]+|[,;:\-–—\s]+$/g,"").trim();
  return note;
}
function lastSale(st,customerId=""){return [...(st.sales||[])].filter(s=>!customerId||s.customerId===customerId).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0]||null}
function saleItemsPayload(s){return (s?.items||[]).map(l=>({productId:l.productId,quantity:+l.quantity||0}))}
function linkedDebtForSale(st,saleId){return st.debts.find(d=>d.saleId===saleId)||null}
function paySelectedDebts(st,customerId,allocations,note="",createdAt=now()){
  const c=st.customers.find(x=>x.id===customerId);if(!c)bad("Không tìm thấy khách");let total=0;
  for(const a of allocations||[]){const d=st.debts.find(x=>x.id===a.debtId&&x.customerId===customerId);if(!d||d.balance<=0)continue;const amount=Math.min(money(a.amount),+d.balance||0);if(amount<=0)continue;d.paid=(+d.paid||0)+amount;d.balance=(+d.amount||0)-d.paid;d.payments=d.payments||[];d.payments.push({id:uid(),amount,note,createdAt});total+=amount}
  if(!total)bad("Không có khoản nợ hợp lệ để thanh toán");return total
}
function productRecipeNeed(p,quantity=1){
  const name=norm(p?.name||""),formula=norm(p?.formula||p?.source||""),q=+quantity||0;
  const get=(unit,key)=>{const re=new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${unit}\\s*[^+;,]*${key}`,"i"),m=formula.match(re);return m?Number(m[1].replace(",",".")):0};
  let phinMl=get("ml","ca phe phin"),machineMl=get("ml","ca phe may"),condensed=get("ml","sua dac"),fresh=get("ml","sua tuoi"),salt=get("g","kem muoi"),sugar=get("g","duong");
  if(!phinMl&&!machineMl&&!condensed&&!fresh&&!salt&&!sugar){if(name.includes("ca phe sua")){phinMl=40;condensed=20}else if(name.includes("bac xiu")){phinMl=30;fresh=40;condensed=20}else if(name.includes("ca phe den")){phinMl=40;sugar=3}else if(name.includes("ca phe muoi")){phinMl=40;salt=25}else if(name.includes("ca phe may"))machineMl=40}
  return {phin_g:phinMl*(240/500)*q,machine_g:machineMl*(18/40)*q,condensed_ml:condensed*q,fresh_ml:fresh*q,salt_g:salt*q,sugar_g:sugar*q}
}
function ingredientNeedForItems(st,items){const total={phin_g:0,machine_g:0,condensed_ml:0,fresh_ml:0,salt_g:0,sugar_g:0};for(const l of items||[]){const p=st.products.find(x=>x.id===l.productId)||l,n=productRecipeNeed(p,l.quantity);for(const k of Object.keys(total))total[k]+=n[k]||0}return total}
function adjustIngredientsForItems(st,items,sign=-1){const n=ingredientNeedForItems(st,items),map={"ing-ca-phe-phin":n.phin_g,"ing-ca-phe-may":n.machine_g,"ing-sua-dac":n.condensed_ml,"ing-sua-tuoi":n.fresh_ml,"ing-bot-kem-muoi":n.salt_g,"ing-duong":n.sugar_g};for(const ing of st.ingredients||[]){const amount=map[ing.id]||0;if(amount)ing.stock=(+ing.stock||0)+sign*amount}}
function rewriteSale(st,saleId,next){
  const sale=st.sales.find(s=>s.id===saleId);if(!sale)bad("Không tìm thấy đơn hàng");const linked=linkedDebtForSale(st,sale.id);if(linked&&((+linked.paid||0)>0||(linked.payments||[]).length))bad("Đơn ghi nợ đã có thanh toán. Hãy hoàn tác/xóa lần trả nợ trước khi sửa đơn.");
  for(const l of sale.items||[]){const p=st.products.find(x=>x.id===l.productId);if(p?.trackStock!==false)p.stock=qty(p.stock)+qty(l.quantity)}if(st.config?.ai?.autoIngredientDeduct)adjustIngredientsForItems(st,sale.items||[],+1);st.debts=st.debts.filter(d=>d.saleId!==sale.id);
  const totals=saleTotals(st,next.items||saleItemsPayload(sale)),net=calcSaleNet(totals,{discountType:next.discountType??sale.discountType??"amount",discountValue:next.discountValue??sale.discount??0});
  const payments=normalizePayments(net.total,next.payments||sale.payments||{paymentMethod:sale.paymentMethod||"cash"}),customerId=next.customerId!==undefined?next.customerId:(sale.customerId||""),customer=customerId?st.customers.find(c=>c.id===customerId):null;if(customerId&&!customer)bad("Không tìm thấy khách hàng");if(payments.debt>0&&!customer)bad("Ghi nợ bắt buộc chọn khách hàng");
  for(const l of totals.lines){const p=st.products.find(x=>x.id===l.productId);if(p?.trackStock!==false)p.stock=qty(p.stock)-qty(l.quantity)}
  const paymentMethod=[payments.cash?"cash":"",payments.transfer?"transfer":"",payments.debt?"debt":""].filter(Boolean).join("+")||"cash";
  Object.assign(sale,{items:totals.lines,subtotal:net.raw,discount:net.discount,discountType:String(next.discountType??sale.discountType??"amount"),total:net.total,costTotal:totals.cost,profit:net.profit,paymentMethod,payments,customerId:customer?.id||"",customer:customer?.name||""});if(next.note!==undefined)sale.note=String(next.note||"");if(next.createdAt)sale.createdAt=next.createdAt;
  if(payments.debt>0)st.debts.push({id:uid(),customerId:customer.id,customer:customer.name,amount:payments.debt,paid:0,balance:payments.debt,note:`Đơn hàng ${new Date(sale.createdAt).toLocaleDateString("vi-VN")}`,createdAt:sale.createdAt,payments:[],saleId:sale.id});if(st.config?.ai?.autoIngredientDeduct)adjustIngredientsForItems(st,sale.items||[],-1);return sale
}

function periodSales(st,from,to,category=""){const a=new Date(from),b=new Date(to);let revenue=0,profit=0,qty=0,ids=new Set();for(const s of st.sales||[]){const d=new Date(s.createdAt);if(d<a||d>=b)continue;for(const l of s.items||[]){if(category&&norm(l.category)!==norm(category))continue;revenue+=+l.subtotal||0;profit+=(+l.quantity||0)*((+l.unitPrice||0)-(+l.costPrice||0));qty+=+l.quantity||0;ids.add(s.id)}}return {sales:ids.size,revenue,profit,qty}}
function dayRange(offset=0){const a=new Date();a.setHours(0,0,0,0);a.setDate(a.getDate()+offset);const b=new Date(a);b.setDate(b.getDate()+1);return [a,b]}
function weekRange(offsetWeeks=0){const b=new Date();b.setHours(0,0,0,0);b.setDate(b.getDate()+1+offsetWeeks*7);const a=new Date(b);a.setDate(a.getDate()-7);return [a,b]}
function monthRange(year,month){return [new Date(year,month-1,1),new Date(year,month,1)]}
function auditVarianceReport(st){
  const rows=[];for(const p of st.products.filter(x=>x.trackStock!==false)){const audits=(st.audits||[]).filter(a=>(a.lines||[]).some(l=>l.productId===p.id)).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));if(audits.length<2)continue;const cur=audits.at(-1),prev=audits.at(-2),cl=cur.lines.find(l=>l.productId===p.id),pl=prev.lines.find(l=>l.productId===p.id),from=new Date(prev.createdAt),to=new Date(cur.createdAt);let sold=0,received=0;for(const s of st.sales||[])if(new Date(s.createdAt)>from&&new Date(s.createdAt)<=to)for(const l of s.items||[])if(l.productId===p.id)sold+=+l.quantity||0;for(const r of st.stockReceipts||[])if(new Date(r.createdAt)>from&&new Date(r.createdAt)<=to)for(const l of r.lines||[])if(l.productId===p.id)received+=+l.quantity||0;const expected=(+pl.actual||0)+received-sold,actual=+cl.actual||0,diff=actual-expected;if(Math.abs(diff)>=1)rows.push({productId:p.id,name:p.name,from:prev.createdAt,to:cur.createdAt,previous:+pl.actual||0,received,sold,expected,actual,diff})}return rows.sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff))
}
function parseBulkAudit(st,msg,context={}){const text=String(msg||"").replace(/^(kiểm kho|kiem kho)(?:\s+\S+)?\s*[:\-]?/i,"").trim(),parts=text.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean),lines=[];let lastProduct=null;for(const part of parts){let p=context.resolvedProductId&&parts.length===1?st.products.find(x=>x.id===context.resolvedProductId):findProduct(st,part,lastProduct?.id||context.productId);if(!p)continue;let actual=null;if(/\b(hết|het)\b/i.test(part))actual=0;else{const nums=[...part.matchAll(/(\d+(?:[.,]\d+)?)/g)].map(m=>Number(m[1].replace(",",".")));if(nums.length)actual=nums.at(-1)}if(actual===null)continue;lines.push({productId:p.id,name:p.name,actual});lastProduct=p}return lines}
function parseBulkStockin(st,msg,context={}){const text=String(msg||"").replace(/^(nhập kho|nhap kho|nhập|nhap)\s*[:\-]?/i,"").trim(),parts=text.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean),map=new Map();let lastProduct=null;for(const part of parts){let p=findProduct(st,part,lastProduct?.id||context.productId);if(!p&&lastProduct)p=lastProduct;if(!p)continue;let q=0;for(const m of part.matchAll(/(\d+(?:[.,]\d+)?)\s*(thùng|thung|két|ket|chai|lon|cái|cai|gói|goi|ly|lẻ|le)\b/gi)){let n=Number(m[1].replace(",",".")),u=norm(m[2]);if(u==="thung"||u==="ket")n*=+p.packSize||1;q+=n}if(!q){const m=part.match(/(\d+(?:[.,]\d+)?)/);if(m)q=Number(m[1].replace(",","."))}if(!q)continue;const priceMatch=part.match(/(?:giá|gia|đơn giá|don gia)\s*[:=]?\s*(\d[\d.]*)/i),prev=map.get(p.id)||{productId:p.id,name:p.name,quantity:0,costPrice:null};prev.quantity+=q;if(priceMatch)prev.costPrice=Number(priceMatch[1].replace(/\./g,""));map.set(p.id,prev);lastProduct=p}return [...map.values()]}
function todaySummaryData(st){const [a,b]=dayRange(0),s=periodSales(st,a,b);let debtPaid=0;for(const d of st.debts||[])for(const p of d.payments||[]){const x=new Date(p.createdAt);if(x>=a&&x<b)debtPaid+=+p.amount||0}const debtNew=(st.debts||[]).filter(d=>{const x=new Date(d.createdAt);return x>=a&&x<b}).reduce((z,d)=>z+(+d.amount||0),0),low=st.products.filter(p=>p.active!==false&&p.trackStock!==false&&(+p.stock||0)<=(+p.minStock||0));return {revenue:s.revenue,profit:s.profit,orders:s.sales,qty:s.qty,debtNew,debtPaid,totalDebt:st.debts.reduce((z,d)=>z+(+d.balance||0),0),low:low.slice(0,8).map(p=>({name:p.name,stock:p.stock,unit:p.unit})),variance:auditVarianceReport(st).slice(0,5)}}

function defaultAuditPeriodKey(value){
  const d=value?new Date(value):new Date();if(Number.isNaN(d.getTime()))return "";
  if(d.getDate()<=3)d.setMonth(d.getMonth()-1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`
}
function previousAuditForProduct(st,audit,productId){
  return (st.audits||[]).filter(a=>a.id!==audit.id&&new Date(a.createdAt)<new Date(audit.createdAt)&&(a.lines||[]).some(l=>l.productId===productId)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0]||null
}
function auditPeriodEstimate(st,periodKey,category=""){
  const out={periodKey,actualRevenue:0,actualProfit:0,derivedRevenue:0,derivedProfit:0,lossCost:0,unclassifiedQty:0,baselineQty:0,lines:[]};
  const start=new Date(`${periodKey}-01T00:00:00`),end=new Date(start);end.setMonth(end.getMonth()+1);
  for(const s of st.sales||[]){
    const d=new Date(s.createdAt);if(d<start||d>=end)continue;
    for(const l of s.items||[]){
      const cat=l.category||st.products.find(p=>p.id===l.productId)?.category||"Khác";if(category&&norm(cat)!==norm(category))continue;
      const q=+l.quantity||0,sub=+l.subtotal||q*(+l.unitPrice||0);
      out.actualRevenue+=sub;out.actualProfit+=q*((+l.unitPrice||0)-(+l.costPrice||0))
    }
  }
  for(const a of st.audits||[]){
    if(a.periodKey!==periodKey)continue;
    for(const l of a.lines||[]){
      const p=st.products.find(x=>x.id===l.productId);if(!p)continue;
      if(category&&norm(p.category||"Khác")!==norm(category))continue;
      const prev=previousAuditForProduct(st,a,l.productId),unexplained=Math.max(0,(+l.before||0)-(+l.actual||0));
      if(!prev){out.baselineQty+=unexplained;continue}
      const type=l.reconcileType||"unclassified",salePrice=l.salePriceSnapshot??p.salePrice??0,costPrice=l.costPriceSnapshot??p.costPrice??0;
      if(type==="unrecorded_sale"){out.derivedRevenue+=unexplained*salePrice;out.derivedProfit+=unexplained*(salePrice-costPrice)}
      else if(type==="loss")out.lossCost+=unexplained*costPrice;
      else if(type==="unclassified")out.unclassifiedQty+=unexplained;
      if(unexplained>0)out.lines.push({auditId:a.id,productId:p.id,name:p.name,category:p.category||"Khác",from:prev.createdAt,to:a.createdAt,periodKey,type,quantity:unexplained,salePrice,costPrice,revenue:type==="unrecorded_sale"?unexplained*salePrice:0,lossCost:type==="loss"?unexplained*costPrice:0})
    }
  }
  out.estimatedRevenue=out.actualRevenue+out.derivedRevenue;
  out.estimatedProfit=out.actualProfit+out.derivedProfit-out.lossCost;
  return out
}


function addCashEntry(st,{type="expense",category="Khác",amount=0,paymentMethod="cash",note="",createdAt=now(),source="manual",sourceId=""}={}){
  amount=money(amount);if(!amount)return null;
  const e={id:uid(),type:type==="income"?"income":"expense",category:String(category||"Khác"),amount,paymentMethod:String(paymentMethod||"cash"),note:String(note||""),createdAt,source,sourceId};
  st.cashEntries.push(e);return e
}
function rebuildDebtCashEntries(st){
  const old=(st.cashEntries||[]).filter(e=>e.source==="debt_payment"),methodByKey=new Map();
  for(const e of old)methodByKey.set(`${e.note||""}|${e.createdAt||""}`,e.paymentMethod||"cash");
  st.cashEntries=(st.cashEntries||[]).filter(e=>e.source!=="debt_payment");
  for(const d of st.debts||[]){for(const pay of d.payments||[]){
    const paymentMethod=pay.paymentMethod||methodByKey.get(`${d.customer||""}|${pay.createdAt||""}`)||"cash";pay.paymentMethod=paymentMethod;
    addCashEntry(st,{type:"income",category:"Thu nợ",amount:pay.amount,paymentMethod,note:d.customer||"Khách",createdAt:pay.createdAt,source:"debt_payment",sourceId:`${d.id}:${pay.id}`});
  }}
}
function supplierBalance(st,id){return (st.supplierDebts||[]).filter(d=>d.supplierId===id).reduce((a,d)=>a+(+d.balance||0),0)}
function normalizePayments(total,p){
  let cash=money(p?.cash),transfer=money(p?.transfer),debt=money(p?.debt),sum=cash+transfer+debt;
  if(!sum){const m=p?.paymentMethod||"cash"; if(m==="debt")debt=total; else if(m==="transfer")transfer=total; else cash=total; sum=total}
  if(sum!==total){const diff=total-sum;if(diff>0)cash+=diff;else if(diff<0)bad("Tổng các phương thức thanh toán vượt quá thành tiền")}
  return {cash,transfer,debt}
}
function calcSaleNet(t,p){const raw=t.total,discountType=String(p.discountType||"amount"),discountValue=money(p.discountValue||p.discount||0);let discount=discountType==="percent"?Math.round(raw*Math.min(100,discountValue)/100):Math.min(raw,discountValue);const total=Math.max(0,raw-discount);return {raw,discount,total,profit:t.profit-discount}}

function applyAction(root,action,p){
  const holder=active(root),st=holder.data;
  if(action!=="snapshot.create"&&action!=="snapshot.restore"&&action!=="store.switch"&&action!=="audit.reset.safe"&&action!=="business.reset.keep_debts"&&action!=="debt.backup.import")snapshot(st,`Trước: ${action}`);

  switch(action){
    case "recovery.import": {
      const imported=normalizeLegacyStore(p.data||{},"Dữ liệu khôi phục");
      const keep=[...(st.snapshots||[])];
      keep.push({id:uid(),label:"Tự động trước khôi phục",createdAt:now(),data:(()=>{const x=clone(st);x.snapshots=[];return x})()});
      imported.snapshots=[...(imported.snapshots||[]),...keep].slice(-30);
      holder.data=imported;tx(holder.data,action,"Khôi phục dữ liệu từ backup");break;
    }
    case "store.switch": {
      if(!root.stores.some(s=>s.id===p.id))bad("Không tìm thấy cửa hàng");
      root.activeStoreId=p.id;break;
    }
    case "store.create": {
      const id=uid(),name=String(p.name||"Cửa hàng mới").trim()||"Cửa hàng mới";
      root.stores.push({id,name,createdAt:now(),data:emptyStore(name)});root.activeStoreId=id;break;
    }
    case "store.import": {
      holder.data=normalizeLegacyStore(clone(p.store||{}),holder.name||"Cửa hàng");
      tx(holder.data,action,"Nhập dữ liệu cửa hàng");break;
    }
    case "config.import": {
      st.config={...(st.config||{}),...(p.config||{})};st.config.ai={...(st.config.ai||{}),...(p.config?.ai||{})};
      if(Array.isArray(p.aliases))st.aliases=clone(p.aliases);tx(st,action,"Nhập cấu hình ứng dụng");break;
    }
    case "data.tabular.import": {
      const products=Array.isArray(p.products)?p.products:[],customers=Array.isArray(p.customers)?p.customers:[],debts=Array.isArray(p.debts)?p.debts:[];
      let pc=0,cc=0,dc=0;
      for(const row of products){const name=String(row.name||"").trim();if(!name)continue;let x=st.products.find(v=>norm(v.name)===norm(name));const present=v=>v!==undefined&&v!==null&&String(v)!=="";const vals={name,category:String(present(row.category)?row.category:(x?.category||"Khác")),unit:String(present(row.unit)?row.unit:(x?.unit||"cái")),packSize:present(row.packSize)?(qty(row.packSize)||1):(x?.packSize||1),costPrice:present(row.costPrice)?money(row.costPrice):(x?.costPrice||0),salePrice:present(row.salePrice)?money(row.salePrice):(x?.salePrice||0),stock:present(row.stock)?qty(row.stock):(x?.stock||0),minStock:present(row.minStock)?qty(row.minStock):(x?.minStock||0),trackStock:true,active:true};if(x)Object.assign(x,vals);else st.products.push({id:uid(),...vals});pc++}
      for(const row of customers){const name=String(row.name||"").trim();if(!name)continue;if(!st.customers.some(c=>norm(c.name)===norm(name))){st.customers.push({id:uid(),name,createdAt:now(),active:true});cc++}}
      for(const row of debts){const customerName=String(row.customer||row.name||"").trim(),amount=money(row.amount);if(!customerName||!amount)continue;let c=st.customers.find(x=>norm(x.name)===norm(customerName));if(!c){c={id:uid(),name:customerName,createdAt:now(),active:true};st.customers.push(c);cc++}const createdAt=row.createdAt||now(),note=String(row.note||"");const exists=st.debts.some(d=>d.customerId===c.id&&String(d.createdAt).slice(0,10)===String(createdAt).slice(0,10)&&(+d.amount||0)===amount&&String(d.note||"")===note);if(exists)continue;const paid=Math.min(money(row.paid),amount);st.debts.push({id:uid(),customerId:c.id,customer:c.name,amount,paid,balance:amount-paid,note,createdAt,payments:[]});dc++}
      tx(st,action,`Nhập Excel: ${pc} mặt hàng · ${cc} khách mới · ${dc} khoản nợ`);break;
    }
    case "config.update": {st.config={...(st.config||{}),...(p.config||{})};if(p.config?.ai)st.config.ai={...(st.config.ai||{}),...p.config.ai};tx(st,action,"Cập nhật cấu hình ứng dụng");break;}

    case "customer.create": {
      const name=String(p.name||"").trim();if(!name)bad("Tên khách trống");
      if(st.customers.some(c=>norm(c.name)===norm(name)))bad("Khách đã tồn tại");
      st.customers.push({id:uid(),name,createdAt:now(),active:true});
      tx(st,action,`Thêm khách ${name}`);break;
    }
    case "customer.update": {
      const c=st.customers.find(c=>c.id===p.id);if(!c)bad("Không tìm thấy khách");
      const name=String(p.name||"").trim();if(!name)bad("Tên khách trống");
      if(st.customers.some(x=>x.id!==c.id&&norm(x.name)===norm(name)))bad("Tên khách đã tồn tại");
      const old=c.name;c.name=name;
      for(const d of st.debts.filter(d=>d.customerId===c.id))d.customer=name;
      for(const s of st.sales.filter(s=>s.customerId===c.id))s.customer=name;
      tx(st,action,`Đổi tên khách ${old} → ${name}`);break;
    }

    case "debt.add": {
      const c=st.customers.find(c=>c.id===p.customerId);if(!c)bad("Không tìm thấy khách");
      const amount=money(p.amount);if(!amount)bad("Số tiền không hợp lệ");
      st.debts.push({id:uid(),customerId:c.id,customer:c.name,amount,paid:0,balance:amount,note:String(p.note||""),createdAt:p.createdAt||now(),payments:[]});
      tx(st,action,`Ghi nợ ${c.name}: ${formatMoney(amount)}`);break;
    }
    case "debt.pay": {const c=st.customers.find(c=>c.id===p.customerId);if(!c)bad("Không tìm thấy khách");const amount=Math.min(money(p.amount),customerDebt(st,c.id));if(!amount)bad("Không có số nợ để trừ");const createdAt=p.createdAt||now();payDebt(st,c.id,amount,p.note||"",createdAt);addCashEntry(st,{type:"income",category:"Thu nợ",amount,paymentMethod:p.paymentMethod||"cash",note:c.name,createdAt,source:"debt_payment"});rebuildDebtCashEntries(st);tx(st,p.source==="ai"?"ai.debt.payment":action,`${c.name} trả ${formatMoney(amount)}`);break;}
    case "debt.pay.selected": {const createdAt=p.createdAt||now(),total=paySelectedDebts(st,p.customerId,p.allocations,p.note||"",createdAt),c=st.customers.find(x=>x.id===p.customerId);addCashEntry(st,{type:"income",category:"Thu nợ",amount:total,paymentMethod:p.paymentMethod||"cash",note:c?.name||"Khách",createdAt,source:"debt_payment"});rebuildDebtCashEntries(st);tx(st,p.source==="ai"?"ai.debt.payment":action,`${c?.name||"Khách"} trả ${formatMoney(total)} theo khoản đã chọn`);break;}
    case "debt.update": {
      const d=st.debts.find(d=>d.id===p.id);if(!d)bad("Không tìm thấy khoản nợ");
      const amount=d.saleId?(+d.amount||0):money(p.amount);if(amount<(+d.paid||0))bad("Tổng nợ không thể thấp hơn đã trả");
      d.amount=amount;d.balance=amount-(+d.paid||0);d.note=String(p.note||"");if(p.createdAt)d.createdAt=p.createdAt;
      tx(st,action,d.saleId?"Chỉnh ngày/ghi chú khoản nợ từ đơn bán hàng":"Chỉnh khoản nợ");break;
    }
    case "debt.delete": {
      const i=st.debts.findIndex(d=>d.id===p.id);if(i<0)bad("Không tìm thấy khoản nợ");
      if(st.debts[i].saleId)bad("Khoản nợ này gắn với đơn bán hàng. Hãy xóa đơn hàng để hoàn kho và xóa công nợ đồng bộ.");
      st.debts.splice(i,1);tx(st,action,"Xóa khoản nợ");break;
    }
    case "debt.payment.update": {
      const d=st.debts.find(d=>d.id===p.debtId);if(!d)bad("Không tìm thấy khoản nợ");
      const pay=(d.payments||[]).find(x=>x.id===p.paymentId);if(!pay)bad("Không tìm thấy lần trả");
      const old=money(pay.amount),next=money(p.amount),newPaid=(+d.paid||0)-old+next;
      if(newPaid>d.amount)bad("Tổng tiền đã trả không thể lớn hơn khoản nợ");
      pay.amount=next;pay.note=String(p.note||"");if(p.createdAt)pay.createdAt=p.createdAt;
      d.paid=newPaid;d.balance=d.amount-newPaid;rebuildDebtCashEntries(st);tx(st,action,"Chỉnh chi tiết lần trả nợ");break;
    }
    case "debt.payment.delete": {
      const d=st.debts.find(d=>d.id===p.debtId);if(!d)bad("Không tìm thấy khoản nợ");
      const i=(d.payments||[]).findIndex(x=>x.id===p.paymentId);if(i<0)bad("Không tìm thấy lần trả");
      const removed=d.payments.splice(i,1)[0];
      d.paid=Math.max(0,(+d.paid||0)-(+removed.amount||0));d.balance=d.amount-d.paid;rebuildDebtCashEntries(st);
      tx(st,action,"Xóa chi tiết lần trả nợ");break;
    }

    case "ingredient.create": {
      const x={id:uid(),name:String(p.name||"").trim(),category:String(p.category||"Nguyên liệu cà phê"),unit:String(p.unit||"g").trim()||"g",purchasePrice:money(p.purchasePrice),packageQty:qty(p.packageQty)||1,unitCost:0,stock:qty(p.stock),note:String(p.note||"")};
      if(!x.name)bad("Tên nguyên liệu trống");x.unitCost=x.purchasePrice/x.packageQty;st.ingredients.push(x);
      tx(st,action,`Thêm nguyên liệu ${x.name}`);break;
    }
    case "ingredient.update": {
      const x=st.ingredients.find(x=>x.id===p.id);if(!x)bad("Không tìm thấy nguyên liệu");
      x.name=String(p.name||x.name).trim();x.category=String(p.category||x.category||"Nguyên liệu cà phê");
      x.unit=String(p.unit||x.unit).trim();x.purchasePrice=money(p.purchasePrice);x.packageQty=qty(p.packageQty)||1;
      x.unitCost=x.purchasePrice/x.packageQty;x.stock=qty(p.stock);x.note=String(p.note||"");
      tx(st,action,`Sửa nguyên liệu ${x.name}`);break;
    }
    case "ingredient.delete": {
      const i=st.ingredients.findIndex(x=>x.id===p.id);if(i<0)bad("Không tìm thấy nguyên liệu");
      const name=st.ingredients[i].name;st.ingredients.splice(i,1);tx(st,action,`Xóa nguyên liệu ${name}`);break;
    }

    case "product.stock.set": {
      const x=st.products.find(x=>x.id===p.id);if(!x)bad("Không tìm thấy sản phẩm");
      const before=qty(x.stock),after=qty(p.stock);x.stock=after;
      tx(st,action,`Điều chỉnh tồn độc lập ${x.name}: ${before} → ${after} ${x.unit||""}`,[{productId:x.id,before,after,note:String(p.note||"")}]);
      break;
    }
    case "product.create": {
      const x={id:uid(),name:String(p.name||"").trim(),category:String(p.category||"Khác"),unit:String(p.unit||"cái"),packSize:qty(p.packSize)||1,costPrice:money(p.costPrice),salePrice:money(p.salePrice),stock:qty(p.stock),minStock:qty(p.minStock),trackStock:true,active:true};
      if(!x.name)bad("Tên sản phẩm trống");
      if(st.products.some(v=>norm(v.name)===norm(x.name)))bad("Mặt hàng đã tồn tại");
      st.products.push(x);tx(st,action,`Thêm sản phẩm ${x.name}`);break;
    }
    case "product.update": {
      const x=st.products.find(x=>x.id===p.id);if(!x)bad("Không tìm thấy sản phẩm");
      const beforeStock=qty(x.stock),afterStock=qty(p.stock);
      Object.assign(x,{name:String(p.name||x.name).trim(),category:String(p.category||x.category),unit:String(p.unit||x.unit),packSize:qty(p.packSize)||1,costPrice:money(p.costPrice),salePrice:money(p.salePrice),stock:afterStock,minStock:qty(p.minStock)});
      tx(st,action,`Sửa sản phẩm ${x.name}`,beforeStock!==afterStock?[{productId:x.id,before:beforeStock,after:afterStock,note:"Sửa từ biểu mẫu sản phẩm"}]:[]);
      break;
    }
    case "product.delete": {
      const i=st.products.findIndex(x=>x.id===p.id);if(i<0)bad("Không tìm thấy sản phẩm");
      const product=st.products[i];
      const referenced=st.sales.some(s=>(s.items||[]).some(l=>l.productId===product.id))||st.stockReceipts.some(r=>(r.lines||[]).some(l=>l.productId===product.id))||st.audits.some(a=>(a.lines||[]).some(l=>l.productId===product.id));
      if(referenced){product.active=false;product.trackStock=false;tx(st,action,`Ngừng sử dụng sản phẩm ${product.name} (giữ lịch sử)`)}
      else{st.products.splice(i,1);st.aliases=(st.aliases||[]).filter(a=>a.productId!==product.id);tx(st,action,`Xóa sản phẩm ${product.name}`)}
      break;
    }

    case "sale.create": {
      const t=saleTotals(st,p.items||[]);if(!t.lines.length)bad("Đơn hàng trống");
      const net=calcSaleNet(t,p),payments=normalizePayments(net.total,p.payments||p),customer=p.customerId?st.customers.find(c=>c.id===p.customerId):null;
      if(p.customerId&&!customer)bad("Không tìm thấy khách hàng đã chọn");if(payments.debt>0&&!customer)bad("Ghi nợ bắt buộc phải chọn khách hàng");
      for(const l of t.lines){const pr=st.products.find(x=>x.id===l.productId);if(pr.trackStock!==false)pr.stock-=l.quantity}
      const paymentMethod=[payments.cash?"cash":"",payments.transfer?"transfer":"",payments.debt?"debt":""].filter(Boolean).join("+")||"cash";
      const sale={id:uid(),createdAt:p.createdAt||now(),items:t.lines,subtotal:net.raw,discount:net.discount,discountType:String(p.discountType||"amount"),total:net.total,costTotal:t.cost,profit:net.profit,paymentMethod,payments,customerId:customer?.id||"",customer:customer?.name||"",note:String(p.note||"")};
      if(payments.debt>0)st.debts.push({id:uid(),customerId:customer.id,customer:customer.name,amount:payments.debt,paid:0,balance:payments.debt,note:`Đơn hàng ${new Date(sale.createdAt).toLocaleDateString("vi-VN")}`,createdAt:sale.createdAt,payments:[],saleId:sale.id});
      st.sales.push(sale);if(st.config?.ai?.autoIngredientDeduct)adjustIngredientsForItems(st,sale.items,-1);tx(st,action,`Bán hàng ${formatMoney(net.total)}${customer?` · ${customer.name}`:""}`);break;
    }
    case "sale.update": {const sale=rewriteSale(st,p.id,p);tx(st,action,`Sửa đơn ${sale.id} · ${formatMoney(sale.total)}`);break;}
    case "sale.delete": {
      const i=st.sales.findIndex(s=>s.id===p.id);if(i<0)bad("Không tìm thấy đơn");
      const sale=st.sales[i],linked=st.debts.filter(d=>d.saleId===sale.id);
      if(linked.some(d=>(+d.paid||0)>0||(d.payments||[]).length>0))bad("Đơn ghi nợ này đã có trả nợ. Hãy xóa/chỉnh các lần trả nợ trước rồi mới xóa đơn.");
      for(const l of sale.items||[]){const pr=st.products.find(x=>x.id===l.productId);if(pr?.trackStock!==false)pr.stock=qty(pr.stock)+qty(l.quantity)}
      if(st.config?.ai?.autoIngredientDeduct)adjustIngredientsForItems(st,sale.items||[],+1);st.debts=st.debts.filter(d=>d.saleId!==sale.id);st.sales.splice(i,1);
      tx(st,action,"Xóa đơn hàng, hoàn kho và xóa công nợ liên quan");break;
    }

    case "stockin.create": {
      const lines=[];let totalCost=0;
      for(const r of p.lines||[]){const pr=st.products.find(x=>x.id===r.productId);if(!pr)continue;const pack=Math.max(1,qty(pr.packSize)||1),cases=qty(r.cases),units=qty(r.units),amount=cases*pack+units;if(!amount)continue;const before=qty(pr.stock);
        // v2.0.1: caseCost là giá của cả thùng. unitCost luôn là giá của 1 đơn vị lẻ.
        // Giữ tương thích phiếu cũ chỉ gửi unitCost.
        const suppliedCaseCost=money(r.caseCost),legacyUnitCost=money(r.unitCost??pr.costPrice),caseCost=suppliedCaseCost>0?suppliedCaseCost:legacyUnitCost*pack,unitCost=caseCost/pack;
        const calculatedLineCost=Math.round(cases*caseCost+units*unitCost),lineCost=calculatedLineCost;pr.stock=before+amount;
        if(unitCost>0){const oldValue=(+pr.costPrice||0)*before;pr.costPrice=Math.round((oldValue+lineCost)/Math.max(1,before+amount))}
        totalCost+=lineCost;lines.push({productId:pr.id,name:pr.name,cases,units,quantity:amount,caseCost,unitCost,lineCost,before,after:pr.stock})}
      if(!lines.length)bad("Phiếu nhập trống");
      const supplier=p.supplierId?(st.suppliers||[]).find(x=>x.id===p.supplierId):null,paid=Math.min(money(p.paidAmount??totalCost),totalCost),debtAmount=totalCost-paid,receiptId=uid(),createdAt=p.createdAt||now();
      st.stockReceipts.push({id:receiptId,createdAt,note:String(p.note||""),supplierId:supplier?.id||"",supplier:supplier?.name||"",totalCost,paidAmount:paid,debtAmount,paymentMethod:String(p.paymentMethod||"cash"),lines});
      if(paid>0)addCashEntry(st,{type:"expense",category:"Nhập hàng",amount:paid,paymentMethod:p.paymentMethod||"cash",note:supplier?`Nhập hàng · ${supplier.name}`:"Nhập hàng",createdAt,source:"stockin",sourceId:receiptId});
      if(debtAmount>0&&supplier)st.supplierDebts.push({id:uid(),supplierId:supplier.id,supplier:supplier.name,amount:debtAmount,paid:0,balance:debtAmount,note:`Phiếu nhập ${new Date(createdAt).toLocaleDateString("vi-VN")}`,createdAt,payments:[],receiptId});
      tx(st,action,`Nhập kho ${lines.reduce((a,l)=>a+l.quantity,0)} đơn vị · ${formatMoney(totalCost)}`);break;
    }
    case "stockin.update": {
      const receipt=st.stockReceipts.find(r=>r.id===p.id);if(!receipt)bad("Không tìm thấy phiếu nhập");const linkedSp=(st.supplierDebts||[]).filter(d=>d.receiptId===receipt.id);if(linkedSp.some(d=>(+d.paid||0)>0||(d.payments||[]).length))bad("Phiếu nhập đã có thanh toán nợ nhà cung cấp. Hãy hoàn tác phần trả nợ trước khi sửa.");
      // Hoàn ảnh hưởng số lượng cũ trước; chặn nếu hàng đã bán khiến không thể hoàn.
      for(const l of receipt.lines||[]){const pr=st.products.find(x=>x.id===l.productId);if(pr&&qty(pr.stock)-qty(l.quantity)<0)bad(`Không thể sửa phiếu: ${pr.name} hiện chỉ còn ${pr.stock}, thấp hơn lượng cần hoàn ${l.quantity}.`)}
      for(const l of receipt.lines||[]){const pr=st.products.find(x=>x.id===l.productId);if(pr)pr.stock=qty(pr.stock)-qty(l.quantity)}
      st.cashEntries=(st.cashEntries||[]).filter(e=>!(e.source==="stockin"&&e.sourceId===receipt.id));st.supplierDebts=(st.supplierDebts||[]).filter(d=>d.receiptId!==receipt.id);
      const lines=[];let totalCost=0;
      for(const r of p.lines||[]){const pr=st.products.find(x=>x.id===r.productId);if(!pr)continue;const pack=Math.max(1,qty(pr.packSize)||1),cases=qty(r.cases),units=qty(r.units),amount=cases*pack+units;if(!amount)continue;const before=qty(pr.stock),caseCost=money(r.caseCost)>0?money(r.caseCost):money(r.unitCost||pr.costPrice)*pack,unitCost=caseCost/pack,lineCost=Math.round(cases*caseCost+units*unitCost);pr.stock=before+amount;if(unitCost>0){const baseValue=(+pr.costPrice||0)*before;pr.costPrice=Math.round((baseValue+lineCost)/Math.max(1,before+amount))}totalCost+=lineCost;lines.push({productId:pr.id,name:pr.name,cases,units,quantity:amount,caseCost,unitCost,lineCost,before,after:pr.stock})}
      if(!lines.length)bad("Phiếu nhập trống");const supplier=p.supplierId?(st.suppliers||[]).find(x=>x.id===p.supplierId):null,paid=Math.min(money(p.paidAmount??totalCost),totalCost),debtAmount=totalCost-paid,createdAt=p.createdAt||receipt.createdAt||now();if(debtAmount>0&&!supplier)bad("Còn nợ phải chọn nhà cung cấp");
      Object.assign(receipt,{createdAt,note:String(p.note||""),supplierId:supplier?.id||"",supplier:supplier?.name||"",totalCost,paidAmount:paid,debtAmount,paymentMethod:String(p.paymentMethod||receipt.paymentMethod||"cash"),lines});
      if(paid>0)addCashEntry(st,{type:"expense",category:"Nhập hàng",amount:paid,paymentMethod:receipt.paymentMethod,note:supplier?`Nhập hàng · ${supplier.name}`:"Nhập hàng",createdAt,source:"stockin",sourceId:receipt.id});
      if(debtAmount>0&&supplier)st.supplierDebts.push({id:uid(),supplierId:supplier.id,supplier:supplier.name,amount:debtAmount,paid:0,balance:debtAmount,note:`Phiếu nhập ${new Date(createdAt).toLocaleDateString("vi-VN")}`,createdAt,payments:[],receiptId:receipt.id});
      tx(st,action,`Sửa phiếu nhập ${lines.length} mặt hàng · ${formatMoney(totalCost)}`);break;
    }
    case "stockin.delete": {
      const i=st.stockReceipts.findIndex(r=>r.id===p.id);if(i<0)bad("Không tìm thấy phiếu");
      const receipt=st.stockReceipts[i],linkedSp=(st.supplierDebts||[]).filter(d=>d.receiptId===receipt.id);
      if(linkedSp.some(d=>(+d.paid||0)>0||(d.payments||[]).length))bad("Phiếu nhập có công nợ nhà cung cấp đã thanh toán. Hãy hoàn tác phần trả nợ trước.");
      for(const l of receipt.lines||[]){const pr=st.products.find(x=>x.id===l.productId);if(pr&&qty(pr.stock)-qty(l.quantity)<0)bad(`Không thể xóa phiếu: ${pr.name} hiện chỉ còn ${pr.stock}, thấp hơn lượng cần hoàn ${l.quantity}.`)}
      for(const l of receipt.lines||[]){const pr=st.products.find(x=>x.id===l.productId);if(pr)pr.stock=qty(pr.stock)-qty(l.quantity)}
      st.cashEntries=(st.cashEntries||[]).filter(e=>!(e.source==="stockin"&&e.sourceId===receipt.id));st.supplierDebts=(st.supplierDebts||[]).filter(d=>d.receiptId!==receipt.id);
      st.stockReceipts.splice(i,1);tx(st,action,"Xóa phiếu nhập, hoàn kho và gỡ dòng tiền/công nợ liên quan");break;
    }

    case "cash.entry.create": {
      const e=addCashEntry(st,{type:p.type,category:p.category,amount:p.amount,paymentMethod:p.paymentMethod,note:p.note,createdAt:p.createdAt||now()});if(!e)bad("Số tiền phải lớn hơn 0");tx(st,action,`${e.type==="income"?"Thu":"Chi"} ${formatMoney(e.amount)} · ${e.category}`);break;
    }
    case "cash.entry.update": {
      const e=st.cashEntries.find(x=>x.id===p.id);if(!e)bad("Không tìm thấy khoản thu/chi");Object.assign(e,{type:p.type==="income"?"income":"expense",category:String(p.category||e.category),amount:money(p.amount),paymentMethod:String(p.paymentMethod||e.paymentMethod),note:String(p.note||""),createdAt:p.createdAt||e.createdAt});tx(st,action,`Sửa khoản thu/chi ${formatMoney(e.amount)}`);break;
    }
    case "cash.entry.delete": {const i=st.cashEntries.findIndex(x=>x.id===p.id);if(i<0)bad("Không tìm thấy khoản thu/chi");const e=st.cashEntries[i];if(e.source&&e.source!=="manual")bad("Khoản tự động phải sửa từ chứng từ gốc");st.cashEntries.splice(i,1);tx(st,action,`Xóa khoản thu/chi ${formatMoney(e.amount)}`);break;}
    case "supplier.create": {const name=String(p.name||"").trim();if(!name)bad("Tên nhà cung cấp trống");if(st.suppliers.some(x=>norm(x.name)===norm(name)))bad("Nhà cung cấp đã tồn tại");st.suppliers.push({id:uid(),name,phone:String(p.phone||""),note:String(p.note||""),createdAt:now(),active:true});tx(st,action,`Thêm nhà cung cấp ${name}`);break;}
    case "supplier.pay": {const sp=st.suppliers.find(x=>x.id===p.supplierId);if(!sp)bad("Không tìm thấy nhà cung cấp");let amount=Math.min(money(p.amount),supplierBalance(st,sp.id));if(!amount)bad("Không có công nợ nhà cung cấp để trả");let left=amount;for(const d of st.supplierDebts.filter(x=>x.supplierId===sp.id&&x.balance>0).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)))){const x=Math.min(left,d.balance);d.paid=(+d.paid||0)+x;d.balance=(+d.amount||0)-d.paid;d.payments=d.payments||[];d.payments.push({id:uid(),amount:x,note:String(p.note||""),createdAt:p.createdAt||now()});left-=x;if(left<=0)break}addCashEntry(st,{type:"expense",category:"Trả nợ NCC",amount,paymentMethod:p.paymentMethod||"cash",note:sp.name,createdAt:p.createdAt||now(),source:"supplier_payment"});tx(st,action,`Trả NCC ${sp.name} ${formatMoney(amount)}`);break;}
    case "cash.session.close": {const x={id:uid(),createdAt:p.createdAt||now(),openingCash:money(p.openingCash),expectedCash:money(p.expectedCash),actualCash:money(p.actualCash),difference:Math.round((Number(p.actualCash)||0)-(Number(p.expectedCash)||0)),note:String(p.note||"")};st.cashSessions.push(x);tx(st,action,`Đóng ca · lệch ${formatMoney(Math.abs(x.difference))}`);break;}
    case "audit.create": {
      const lines=[],createdAt=p.createdAt||now(),periodKey=String(p.periodKey||defaultAuditPeriodKey(createdAt)),defaultType=String(p.defaultReconcileType||"unclassified");
      for(const r of p.lines||[]){const pr=st.products.find(x=>x.id===r.productId);if(!pr)continue;const systemBefore=qty(pr.stock),hasPrevious=(st.audits||[]).some(a=>new Date(a.createdAt)<new Date(createdAt)&&(a.lines||[]).some(l=>l.productId===pr.id)),hasExpected=Number.isFinite(Number(r.expectedBefore)),before=hasExpected?qty(r.expectedBefore):systemBefore,actual=qty(r.actual),delta=actual-before;pr.stock=actual;lines.push({productId:pr.id,name:pr.name,before,systemBefore,actual,delta,sold:Math.max(0,before-actual),baseline:false,autoBaseline:!hasPrevious&&!!r.autoBaseline,reconcileType:String(r.reconcileType||defaultType),salePriceSnapshot:+pr.salePrice||0,costPriceSnapshot:+pr.costPrice||0})}
      if(!lines.length)bad("Phiếu kiểm kho trống");
      st.audits.push({id:uid(),createdAt,periodKey,revenuePeriodEnabled:true,periodStart:String(p.periodStart||""),periodEnd:String(p.periodEnd||""),periodStartAt:String(p.periodStartAt||""),periodEndAt:String(p.periodEndAt||""),periodLabel:String(p.periodLabel||""),summarySnapshot:p.summarySnapshot&&typeof p.summarySnapshot==="object"?{...p.summarySnapshot}:null,note:String(p.note||""),lines});
      tx(st,action,`Kiểm kho ${lines.length} mặt hàng · kỳ ${periodKey}`);break;
    }
    case "audit.update": {
      const a=st.audits.find(a=>a.id===p.id);if(!a)bad("Không tìm thấy đơn kiểm kho");
      const requested=new Map((p.lines||[]).map(r=>[r.productId,{actual:qty(r.actual),reconcileType:r.reconcileType}]));
      for(const old of a.lines||[]){if(!requested.has(old.productId))continue;const pr=st.products.find(x=>x.id===old.productId);if(!pr)continue;const req=requested.get(old.productId),next=req.actual,prev=qty(old.actual),hasLater=(st.audits||[]).some(x=>x.id!==a.id&&new Date(x.createdAt)>new Date(a.createdAt)&&(x.lines||[]).some(y=>y.productId===old.productId));if(hasLater&&next!==prev)bad(`Không thể đổi tồn của ${pr.name}: đã có kỳ kiểm kho sau. Bạn vẫn có thể sửa nguyên nhân/ghi chú.`);const correction=next-prev;if(correction)pr.stock=qty(pr.stock)+correction;old.actual=next;old.delta=next-qty(old.before);old.sold=Math.max(0,qty(old.before)-next);if(req.reconcileType)old.reconcileType=String(req.reconcileType);if(old.salePriceSnapshot===undefined)old.salePriceSnapshot=+pr.salePrice||0;if(old.costPriceSnapshot===undefined)old.costPriceSnapshot=+pr.costPrice||0}
      if(p.periodKey!==undefined)a.periodKey=String(p.periodKey||"");if(p.periodStart!==undefined)a.periodStart=String(p.periodStart||"");if(p.periodEnd!==undefined)a.periodEnd=String(p.periodEnd||"");if(p.periodStartAt!==undefined)a.periodStartAt=String(p.periodStartAt||"");if(p.periodEndAt!==undefined)a.periodEndAt=String(p.periodEndAt||"");if(p.periodLabel!==undefined)a.periodLabel=String(p.periodLabel||"");if(p.summarySnapshot&&typeof p.summarySnapshot==="object")a.summarySnapshot={...p.summarySnapshot};a.revenuePeriodEnabled=true;a.note=String(p.note||"");tx(st,action,`Chỉnh đơn kiểm kho theo chênh lệch · kỳ ${a.periodKey||"chưa gán"}`);break;
    }
    case "business.reset.keep_debts": {
      const salesCount=(st.sales||[]).length,auditCount=(st.audits||[]).length;
      snapshot(st,"Trước reset doanh thu, lợi nhuận và đơn hàng");
      const stockGuard=new Map((st.products||[]).map(pr=>[pr.id,qty(pr.stock)]));
      st.sales=[];
      st.audits=[];
      for(const d of st.debts||[]){
        if(d.saleId)d.saleId="";
        if(d.source==="sale")d.source="manual-preserved";
      }
      for(const pr of st.products||[])if(stockGuard.has(pr.id))pr.stock=stockGuard.get(pr.id);
      st.transactions=[];
      tx(st,action,`Reset doanh thu/lợi nhuận/đơn hàng · xóa ${salesCount} đơn bán và ${auditCount} phiếu kiểm kho · giữ nguyên công nợ · KHÔNG thay đổi tồn kho`,[]);
      break;
    }
    case "debt.backup.import": {
      const data=p.data||{},incomingCustomers=Array.isArray(data.customers)?data.customers:[],incomingDebts=Array.isArray(data.debts)?data.debts:[];
      if(data.format!=="cantin-ai-debt-backup")bad("Sai định dạng file backup nợ");
      snapshot(st,"Trước khôi phục backup công nợ");
      const byId=new Map((st.customers||[]).map(c=>[c.id,c]));
      for(const c of incomingCustomers){
        if(!c||!c.id)continue;
        const old=byId.get(c.id);
        byId.set(c.id,old?{...old,...c}:{...c});
      }
      st.customers=[...byId.values()];
      st.debts=incomingDebts.map(d=>({...d}));
      tx(st,action,`Khôi phục backup công nợ · ${incomingCustomers.length} khách · ${incomingDebts.length} khoản nợ`,[]);
      break;
    }
    case "audit.reset.safe": {
      const count=(st.audits||[]).length;
      if(!count){tx(st,action,"Reset kiểm kho: không có dữ liệu để xóa");break}
      snapshot(st,"Trước reset toàn bộ kiểm kho");
      const restoreByProduct=new Map();
      for(const a of st.audits||[]){
        for(const l of a.lines||[]){
          const delta=qty(l.actual)-qty(l.before);
          restoreByProduct.set(l.productId,(restoreByProduct.get(l.productId)||0)-delta);
        }
      }
      const stockChanges=[];
      for(const [productId,restoreDelta] of restoreByProduct){
        const pr=st.products.find(x=>x.id===productId);if(!pr)continue;
        const before=qty(pr.stock),after=before+restoreDelta;
        pr.stock=after;
        stockChanges.push({productId,before,after,note:"Hoàn tác toàn bộ ảnh hưởng kiểm kho"});
      }
      st.audits=[];
      tx(st,action,`Reset toàn bộ kiểm kho · đã xóa ${count} phiếu · hoàn tồn về trạng thái không có kiểm kho`,stockChanges);
      break;
    }
    case "audit.delete": {
      const i=st.audits.findIndex(a=>a.id===p.id);if(i<0)bad("Không tìm thấy đơn");
      const target=st.audits[i],targetTime=new Date(target.createdAt).getTime();
      const stockChanges=[];
      for(const l of target.lines||[]){
        const pr=st.products.find(x=>x.id===l.productId);if(!pr)continue;
        const hasLater=(st.audits||[]).some(a=>a.id!==target.id&&new Date(a.createdAt).getTime()>targetTime&&(a.lines||[]).some(x=>x.productId===l.productId));
        if(!hasLater){
          const before=qty(pr.stock),after=before-(qty(l.actual)-qty(l.before));
          pr.stock=after;stockChanges.push({productId:pr.id,before,after,note:"Xóa phiếu kiểm kho mới nhất"})
        }
      }
      const periodKey=target.periodKey||"";
      st.audits.splice(i,1);
      tx(st,action,`Xóa đơn kiểm kho${periodKey?` · tính lại kỳ ${periodKey}`:""}`,stockChanges);
      break;
    }

    case "snapshot.create": snapshot(st,String(p.label||"Snapshot"));break;
    case "snapshot.restore": {
      const s=st.snapshots.find(x=>x.id===p.id);if(!s)bad("Không tìm thấy snapshot");
      const keep=st.snapshots;Object.keys(st).forEach(k=>delete st[k]);Object.assign(st,clone(s.data));st.snapshots=keep;
      tx(st,action,`Khôi phục snapshot ${s.label||""}`);break;
    }

    case "alias.add": {
      const pr=st.products.find(x=>x.id===p.productId);if(!pr)bad("Không tìm thấy sản phẩm");
      const alias=String(p.alias||"").trim();if(!alias)bad("Alias trống");
      st.aliases=st.aliases||[];st.aliases=st.aliases.filter(a=>norm(a.alias)!==norm(alias));
      st.aliases.push({id:uid(),alias,productId:pr.id,createdAt:now()});tx(st,action,`Thêm alias ${alias} = ${pr.name}`);break;
    }
    case "alias.delete": {
      const i=(st.aliases||[]).findIndex(a=>a.id===p.id);if(i<0)bad("Không tìm thấy alias");
      st.aliases.splice(i,1);tx(st,action,"Xóa alias AI");break;
    }
    case "ai.execute": executePlan(st,p.plan,p.message);break;
    default: bad("Action chưa hỗ trợ: "+action)
  }
}


function levenshtein(a,b){
  a=norm(a);b=norm(b);const m=a.length,n=b.length,dp=Array.from({length:m+1},(_,i)=>[i]);
  for(let j=1;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n]
}
function similarity(a,b){a=norm(a);b=norm(b);if(!a||!b)return 0;return 1-levenshtein(a,b)/Math.max(a.length,b.length)}
function aliasMap(store){
  const m=new Map();
  for(const a of store.aliases||[])if(a.alias&&a.productId)m.set(norm(a.alias),a.productId);
  return m
}
function productCandidates(store,text){
  const q=norm(text),aliases=aliasMap(store),out=[];
  for(const [al,id] of aliases){if(q.includes(al)){const p=store.products.find(x=>x.id===id);if(p)out.push({p,score:200+al.length,why:"alias"})}}
  for(const p of store.products.filter(x=>x.active!==false)){
    const n=norm(p.name);let score=0;
    if(q.includes(n))score=150+n.length;
    else{
      const words=n.split(/\s+/).filter(w=>w.length>=2),hits=words.filter(w=>q.includes(w));
      score=hits.length*18+hits.join("").length;
      const tokens=q.split(/\s+/);
      for(const t of tokens)if(t.length>=3)score=Math.max(score,Math.round(similarity(t,n)*35));
    }
    if(score>8)out.push({p,score,why:"name"})
  }
  return out.sort((a,b)=>b.score-a.score)
}
function findProduct(store,text,contextProductId=""){
  const c=productCandidates(store,text);
  if(c.length&&(!c[1]||c[0].score>=c[1].score+6))return c[0].p;
  if(!c.length&&contextProductId)return store.products.find(x=>x.id===contextProductId)||null;
  return c[0]?.p||null
}
function findCustomer(store,text,contextCustomerId=""){
  const q=norm(text);let best=null,score=0;
  for(const c of store.customers){
    const n=norm(c.name);let s=q.includes(n)?100+n.length:0;
    for(const t of q.split(/\s+/))if(t.length>=3)s=Math.max(s,Math.round(similarity(t,n)*30));
    if(s>score){best=c;score=s}
  }
  if(score>=16)return best;
  if(contextCustomerId)return store.customers.find(x=>x.id===contextCustomerId)||null;
  return null
}
function parseNum(text){const m=norm(text).replace(/\./g,"").match(/(\d+(?:[.,]\d+)?)/);return m?Number(m[1].replace(",",".")):null}
function parseCashDetailed(text){
  const m=String(text).toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(k|nghin|nghìn|ngàn|ngan|tr|triệu|trieu)?/);
  if(!m)return {amount:null,ambiguous:false};
  let n=Number(m[1].replace(",",".")),u=m[2]||"",ambiguous=false;
  if(u==="k"||u.includes("ng"))n*=1000;
  else if(u==="tr"||u.includes("tri"))n*=1e6;
  else if(n>0&&n<1000){ambiguous=true;n*=1000}
  return {amount:Math.round(n),ambiguous,raw:m[1]}
}
function parseCash(text){return parseCashDetailed(text).amount}
function customerDebt(store,id){return store.debts.filter(d=>d.customerId===id).reduce((a,d)=>a+(+d.balance||0),0)}
function payDebt(store,id,amount,note="",createdAt=now()){
  let left=amount,applied=0;
  for(const d of store.debts.filter(d=>d.customerId===id&&d.balance>0).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){
    const x=Math.min(left,d.balance);if(x<=0)break;
    d.paid=(+d.paid||0)+x;d.balance=(+d.amount||0)-d.paid;d.payments=d.payments||[];
    d.payments.push({id:uid(),amount:x,note,createdAt});left-=x;applied+=x
  }
  return applied
}
function saleTotals(store,items){
  let total=0,cost=0,lines=[];
  for(const r of items){
    const p=store.products.find(x=>x.id===r.productId);if(!p)bad("Không tìm thấy sản phẩm");
    const q=qty(r.quantity);if(!q)continue;
    if(p.trackStock!==false&&q>p.stock)bad(`${p.name} chỉ còn ${p.stock}`);
    const sub=q*p.salePrice,co=q*p.costPrice;total+=sub;cost+=co;
    lines.push({productId:p.id,name:p.name,unit:p.unit,category:p.category,quantity:q,unitPrice:p.salePrice,costPrice:p.costPrice,subtotal:sub})
  }
  return {lines,total,cost,profit:total-cost}
}
function startOfDaysAgo(days){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-days);return d}
function recentSales(store,days=7){const from=startOfDaysAgo(days-1);return store.sales.filter(s=>new Date(s.createdAt)>=from)}
function saleStats(store,days=7){
  const sales=recentSales(store,days),by=new Map();let revenue=0,profit=0;
  for(const s of sales){revenue+=+s.total||0;profit+=+s.profit||0;for(const l of s.items||[]){const x=by.get(l.productId)||{name:l.name,qty:0,revenue:0,profit:0};x.qty+=+l.quantity||0;x.revenue+=+l.subtotal||0;x.profit+=(+l.quantity||0)*((+l.unitPrice||0)-(+l.costPrice||0));by.set(l.productId,x)}}
  return {sales,revenue,profit,items:[...by.values()].sort((a,b)=>b.qty-a.qty)}
}
function formatMoney(n){return Math.round(n||0).toLocaleString("vi-VN")+"đ"}
function anomalyList(st){const out=[],debtLimit=unusualDebtThreshold(st);for(const d of st.debts.filter(d=>d.balance>0&&d.balance<1000))out.push(`Khoản nợ rất nhỏ ${formatMoney(d.balance)} của ${d.customer||"khách"} — có thể nhập thiếu “k”.`);for(const d of st.debts.filter(d=>(+d.amount||0)>debtLimit))out.push(`Khoản nợ ${formatMoney(d.amount)} của ${d.customer||"khách"} cao bất thường so với lịch sử.`);for(const p of st.products){if((+p.stock||0)<0)out.push(`${p.name} đang tồn âm ${p.stock}.`);if((+p.salePrice||0)>0&&(+p.costPrice||0)>(+p.salePrice||0))out.push(`${p.name}: giá bán ${formatMoney(p.salePrice)} thấp hơn giá vốn ${formatMoney(p.costPrice)}.`)}for(const r of st.stockReceipts.slice(-30))for(const l of r.lines||[]){const p=st.products.find(x=>x.id===l.productId);if(p&&l.quantity>(p.packSize||1)*10)out.push(`Phiếu nhập ${p.name} +${l.quantity} ${p.unit||""} khá lớn, nên kiểm tra.`)}for(const v of auditVarianceReport(st).slice(0,8))out.push(`${v.name}: tồn kiểm thực tế lệch ${v.diff>0?"+":""}${v.diff} so với tồn lý thuyết (${v.expected}).`);return out.slice(0,15)}
function forecastLines(st){
  const stats=saleStats(st,14),map=new Map(stats.items.map(x=>[norm(x.name),x]));
  const out=[];
  for(const p of st.products.filter(x=>x.trackStock!==false&&x.active!==false)){
    const s=map.get(norm(p.name)),daily=(s?.qty||0)/14;
    if(daily<=0)continue;
    const days=(+p.stock||0)/daily;
    const suggested=Math.max(0,Math.ceil((daily*7-(+p.stock||0))/(p.packSize||1)))*(p.packSize||1);
    if(days<=7||p.stock<=p.minStock)out.push({p,daily,days,suggested})
  }
  return out.sort((a,b)=>a.days-b.days)
}
function recipeUsage(st,days=7){
  const sales=recentSales(st,days),tot={phin_g:0,machine_g:0,condensed_ml:0,fresh_ml:0,salt_g:0,sugar_g:0};
  for(const s of sales)for(const l of s.items||[]){
    const p=st.products.find(x=>x.id===l.productId)||l,name=norm(p.name),formula=norm(p.formula||p.source||"");
    const q=+l.quantity||0;
    const get=(unit,key)=>{const re=new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${unit}\\s*[^+;,]*${key}`,"i"),m=formula.match(re);return m?Number(m[1].replace(",",".")):0};
    let phinMl=get("ml","ca phe phin"),machineMl=get("ml","ca phe may");
    let condensed=get("ml","sua dac"),fresh=get("ml","sua tuoi"),salt=get("g","kem muoi"),sugar=get("g","duong");
    if(!phinMl&&!machineMl&&!condensed&&!fresh&&!salt&&!sugar){
      if(name.includes("ca phe sua")){phinMl=40;condensed=20}
      else if(name.includes("bac xiu")){phinMl=30;fresh=40;condensed=20}
      else if(name.includes("ca phe den")){phinMl=40;sugar=3}
      else if(name.includes("ca phe muoi")){phinMl=40;salt=25}
      else if(name.includes("ca phe may"))machineMl=40
    }
    tot.phin_g+=phinMl*(240/500)*q;tot.machine_g+=machineMl*(18/40)*q;tot.condensed_ml+=condensed*q;tot.fresh_ml+=fresh*q;tot.salt_g+=salt*q;tot.sugar_g+=sugar*q
  }
  return tot
}
function allMentionedProducts(st,msg){
  const q=norm(msg),hits=[];
  for(const p of st.products.filter(x=>x.active!==false)){
    const names=[norm(p.name),...(st.aliases||[]).filter(a=>a.productId===p.id).map(a=>norm(a.alias))].filter(Boolean);
    let pos=-1,label="";
    for(const n of names){const i=q.indexOf(n);if(i>=0&&(pos<0||i<pos)){pos=i;label=n}}
    if(pos>=0)hits.push({p,pos,label})
  }
  hits.sort((a,b)=>a.pos-b.pos);
  const out=[];
  for(let i=0;i<hits.length;i++){
    const h=hits[i],from=i?hits[i-1].pos+hits[i-1].label.length:0,pre=q.slice(Math.max(from,h.pos-24),h.pos);
    const nums=[...pre.matchAll(/(\d+(?:[.,]\d+)?)/g)],n=nums.length?Number(nums.at(-1)[1].replace(",",".")):1;
    out.push({productId:h.p.id,name:h.p.name,quantity:n||1})
  }
  return out
}
function ambiguousProduct(st,msg){
  const c=productCandidates(st,msg);if(c.length>=2&&c[0].score<c[1].score+6&&c[0].p.id!==c[1].p.id)return c.slice(0,4).map(x=>x.p);
  return []
}
function validateAIPlan(st,plan){
  if(!plan||typeof plan!=="object")bad("Kế hoạch AI không hợp lệ");
  const allowed=new Set(["alias.add","batch","config.set","debt.add","debt.batch","debt.correct","debt.pay","inventory.batch","inventory.set","restore.snapshot","sale.create","sale.modify","sale.repeat","stockin","stockin.batch"]);
  if(!allowed.has(plan.kind))bad("AI tạo loại thao tác chưa được cho phép: "+String(plan.kind||""));
  const product=id=>{if(id&&!st.products.some(p=>p.id===id))bad("AI tham chiếu mặt hàng không tồn tại")};
  const customer=id=>{if(id&&!st.customers.some(c=>c.id===id))bad("AI tham chiếu khách hàng không tồn tại")};
  if(plan.productId)product(plan.productId);if(plan.customerId)customer(plan.customerId);
  if(plan.kind==="sale.create"){if(!Array.isArray(plan.items)||!plan.items.length)bad("Đơn AI không có sản phẩm");for(const x of plan.items){product(x.productId);if(!(Number(x.quantity)>0))bad("Số lượng AI không hợp lệ")}}
  if(plan.kind==="debt.add"||plan.kind==="debt.pay"){customer(plan.customerId);if(!(Number(plan.amount)>0))bad("Số tiền AI không hợp lệ")}
  if(plan.kind==="inventory.batch"||plan.kind==="stockin.batch"){if(!Array.isArray(plan.lines)||!plan.lines.length)bad("Danh sách AI trống");for(const x of plan.lines)product(x.productId)}
  if(plan.kind==="debt.batch"){customer(plan.customerId);if(!Array.isArray(plan.items)||!plan.items.length)bad("Danh sách nợ AI trống");for(const x of plan.items){if(!(Number(x.amount)>0))bad("Khoản nợ AI không hợp lệ");if(x.productId)product(x.productId)}}
  if(plan.kind==="batch"){if(!Array.isArray(plan.steps)||!plan.steps.length)bad("Batch AI trống");for(const step of plan.steps)validateAIPlan(st,step)}
  return plan
}
function finalizeAIResponse(st,response){if(response?.type==="plan")validateAIPlan(st,response.plan);return response}

function executePlan(st,plan,message){validateAIPlan(st,plan);
  if(plan.kind==="config.set"){st.config.ai={...(st.config.ai||{}),...(plan.ai||{})};tx(st,"ai.config","AI cập nhật cấu hình");return}
  if(plan.kind==="debt.correct"){const d=st.debts.find(x=>x.id===plan.debtId);if(!d)bad("Không tìm thấy khoản nợ");const old=d.amount;d.amount=+plan.amount||d.amount;d.balance=Math.max(0,d.amount-(+d.paid||0));if(plan.createdAt)d.createdAt=plan.createdAt;if(plan.note!==undefined)d.note=plan.note;if(d.saleId){const s=st.sales.find(x=>x.id===d.saleId);if(s){s.total=d.amount;s.profit=s.total-(+s.costTotal||0);if((s.items||[]).length===1){s.items[0].subtotal=s.total;s.items[0].unitPrice=s.items[0].quantity?s.total/s.items[0].quantity:s.total}}}tx(st,"ai.debt.correct",`AI sửa khoản nợ ${formatMoney(old)} → ${formatMoney(d.amount)}`);return}
  if(plan.kind==="sale.repeat"){const source=st.sales.find(x=>x.id===plan.saleId);if(!source)bad("Không tìm thấy đơn nguồn");const t=saleTotals(st,saleItemsPayload(source));for(const l of t.lines){const p=st.products.find(x=>x.id===l.productId);if(p?.trackStock!==false)p.stock-=l.quantity}const c=source.customerId?st.customers.find(x=>x.id===source.customerId):null,sale={id:uid(),createdAt:now(),items:t.lines,total:t.total,costTotal:t.cost,profit:t.profit,paymentMethod:source.paymentMethod,customerId:c?.id||"",customer:c?.name||"",note:`AI tạo lại từ ${source.id}`};if(sale.paymentMethod==="debt"){if(!c)bad("Đơn nguồn ghi nợ nhưng không còn khách hàng");st.debts.push({id:uid(),customerId:c.id,customer:c.name,amount:sale.total,paid:0,balance:sale.total,note:"Đơn AI tạo lại",createdAt:sale.createdAt,payments:[],saleId:sale.id})}st.sales.push(sale);if(st.config?.ai?.autoIngredientDeduct)adjustIngredientsForItems(st,sale.items,-1);tx(st,"ai.sale.repeat",`AI tạo lại đơn ${formatMoney(sale.total)}`);return}
  if(plan.kind==="sale.modify"){const sale=rewriteSale(st,plan.saleId,plan.next||{});tx(st,"ai.sale.modify",`AI sửa đơn ${sale.id} · ${formatMoney(sale.total)}`);return}
  if(plan.kind==="inventory.batch"){const lines=[];for(const r of plan.lines||[]){const p=st.products.find(x=>x.id===r.productId);if(!p)continue;const before=+p.stock||0,actual=qty(r.actual);p.stock=actual;lines.push({productId:p.id,name:p.name,before,actual,delta:actual-before,sold:Math.max(0,before-actual)})}if(!lines.length)bad("Không có mặt hàng kiểm kho hợp lệ");const createdAt=plan.createdAt||now(),periodKey=plan.periodKey||defaultAuditPeriodKey(createdAt);for(const l of lines){const p=st.products.find(x=>x.id===l.productId);l.reconcileType=plan.defaultReconcileType||"unrecorded_sale";l.salePriceSnapshot=+p?.salePrice||0;l.costPriceSnapshot=+p?.costPrice||0}st.audits.push({id:uid(),createdAt,periodKey,revenuePeriodEnabled:true,note:`AI: ${message}`,lines});tx(st,"ai.inventory.batch",`AI kiểm kho ${lines.length} mặt hàng · kỳ ${periodKey}`);return}
  if(plan.kind==="stockin.batch"){const lines=[];for(const r of plan.lines||[]){const p=st.products.find(x=>x.id===r.productId);if(!p)continue;const q=qty(r.quantity);if(!q)continue;const before=+p.stock||0;p.stock=before+q;if(r.costPrice&&plan.updateCost)p.costPrice=money(r.costPrice);lines.push({productId:p.id,name:p.name,quantity:q,before,after:p.stock,cases:0,units:q})}if(!lines.length)bad("Không có mặt hàng nhập kho hợp lệ");st.stockReceipts.push({id:uid(),createdAt:plan.createdAt||now(),note:`AI: ${message}`,lines});tx(st,"ai.stockin.batch",`AI nhập kho ${lines.length} mặt hàng`);return}
  if(plan.kind==="restore.snapshot"){const s=st.snapshots.find(x=>x.id===plan.snapshotId);if(!s)bad("Không tìm thấy snapshot");const keep=st.snapshots;Object.keys(st).forEach(k=>delete st[k]);Object.assign(st,clone(s.data));st.snapshots=keep;tx(st,"ai.restore",`AI khôi phục ${s.label||"snapshot"}`);return}
  if(plan.kind==="debt.batch"){
    const c=st.customers.find(x=>x.id===plan.customerId);if(!c)bad("Không tìm thấy khách");
    for(const row of plan.items||[]){
      if(row.productId&&row.quantity>0){
        const pr=st.products.find(x=>x.id===row.productId);if(!pr)bad("Không tìm thấy sản phẩm");
        if(pr.trackStock!==false&&row.quantity>pr.stock)bad(`${pr.name} chỉ còn ${pr.stock}`);
        if(pr.trackStock!==false)pr.stock-=row.quantity;
        const total=(+row.amount||0),cost=row.quantity*(+pr.costPrice||0);
        const sale={id:uid(),createdAt:row.createdAt||now(),items:[{productId:pr.id,name:pr.name,unit:pr.unit,category:pr.category,quantity:row.quantity,unitPrice:row.quantity?total/row.quantity:0,costPrice:pr.costPrice,subtotal:total}],total,costTotal:cost,profit:total-cost,paymentMethod:"debt",customerId:c.id,customer:c.name,note:`AI: ${message}`};
        st.sales.push(sale);if(st.config?.ai?.autoIngredientDeduct)adjustIngredientsForItems(st,sale.items,-1);
        st.debts.push({id:uid(),customerId:c.id,customer:c.name,amount:total,paid:0,balance:total,note:`Đơn AI: ${row.quantity} ${pr.name}`,createdAt:sale.createdAt,payments:[],saleId:sale.id});
      }else{
        st.debts.push({id:uid(),customerId:c.id,customer:c.name,amount:+row.amount||0,paid:0,balance:+row.amount||0,note:row.note||row.raw||message,createdAt:row.createdAt||now(),payments:[]});
      }
    }
    tx(st,"ai.debt.batch",`AI tạo ${plan.items?.length||0} khoản nợ cho ${c.name}`);return
  }
  if(plan.kind==="batch"){for(const x of plan.steps||[])executePlan(st,x,message);return}
  if(plan.kind==="alias.add"){
    const p=st.products.find(x=>x.id===plan.productId);if(!p)bad("Không tìm thấy sản phẩm");
    st.aliases=st.aliases||[];st.aliases=st.aliases.filter(a=>norm(a.alias)!==norm(plan.alias));
    st.aliases.push({id:uid(),alias:plan.alias,productId:p.id,createdAt:now()});tx(st,"ai.alias",`AI học alias “${plan.alias}” = ${p.name}`);return
  }
  if(plan.kind==="sale.create"){
    const t=saleTotals(st,plan.items||[]);if(!t.lines.length)bad("Đơn hàng trống");
    for(const l of t.lines){const p=st.products.find(x=>x.id===l.productId);if(p.trackStock!==false)p.stock-=l.quantity}
    const c=plan.customerId?st.customers.find(x=>x.id===plan.customerId):null;
    if(plan.customerId&&!c)bad("Không tìm thấy khách hàng");
    const sale={id:uid(),createdAt:now(),items:t.lines,total:t.total,costTotal:t.cost,profit:t.profit,paymentMethod:plan.paymentMethod||"cash",customerId:c?.id||"",customer:c?.name||"",note:`AI: ${message}`};
    if(sale.paymentMethod==="debt"){
      if(!c)bad("Không tìm thấy khách để ghi nợ");st.debts.push({id:uid(),customerId:c.id,customer:c.name,amount:t.total,paid:0,balance:t.total,note:`Đơn AI: ${t.lines.map(x=>`${x.quantity} ${x.name}`).join(", ")}`,createdAt:sale.createdAt,payments:[],saleId:sale.id})
    }
    st.sales.push(sale);if(st.config?.ai?.autoIngredientDeduct)adjustIngredientsForItems(st,sale.items,-1);tx(st,"ai.sale",`AI tạo đơn ${t.lines.length} món · ${formatMoney(t.total)}${sale.paymentMethod==="debt"?" · ghi nợ":""}`);return
  }
  if(plan.kind==="inventory.set"){
    const pr=st.products.find(x=>x.id===plan.productId);if(!pr)bad("Không tìm thấy sản phẩm");const before=pr.stock;
    if(before===plan.after){tx(st,"ai.noop",`${pr.name} đã ở mức ${plan.after}`);return}
    pr.stock=plan.after;const sold=Math.max(0,before-plan.after);
    if(sold>0&&plan.recordSale!==false){
      const total=sold*pr.salePrice,cost=sold*pr.costPrice;
      st.sales.push({id:uid(),createdAt:now(),items:[{productId:pr.id,name:pr.name,unit:pr.unit,category:pr.category,quantity:sold,unitPrice:pr.salePrice,costPrice:pr.costPrice,subtotal:total}],total,costTotal:cost,profit:total-cost,paymentMethod:"inventory",note:`AI: ${message}`})
    }
    st.audits.push({id:uid(),createdAt:now(),note:`AI: ${message}`,lines:[{productId:pr.id,name:pr.name,before,actual:plan.after,sold}]});
    tx(st,"ai.inventory",`AI kiểm kho ${pr.name}: ${before} → ${plan.after}`);return
  }
  if(plan.kind==="stockin"){
    const pr=st.products.find(x=>x.id===plan.productId);if(!pr)bad("Không tìm thấy sản phẩm");
    const before=pr.stock;pr.stock+=plan.quantity;
    st.stockReceipts.push({id:uid(),createdAt:now(),note:`AI: ${message}`,lines:[{productId:pr.id,name:pr.name,quantity:plan.quantity,before,after:pr.stock}]});
    tx(st,"ai.stockin",`AI nhập ${pr.name} +${plan.quantity}`);return
  }
  if(plan.kind==="debt.add"){
    const c=st.customers.find(x=>x.id===plan.customerId);if(!c)bad("Không tìm thấy khách");
    st.debts.push({id:uid(),customerId:c.id,customer:c.name,amount:plan.amount,paid:0,balance:plan.amount,note:plan.note||message,createdAt:now(),payments:[]});
    tx(st,"ai.debt",`AI ghi nợ ${c.name}: ${formatMoney(plan.amount)}`);return
  }
  if(plan.kind==="debt.pay"){
    const c=st.customers.find(x=>x.id===plan.customerId);if(!c)bad("Không tìm thấy khách");
    const a=Math.min(plan.amount,customerDebt(st,c.id));payDebt(st,c.id,a,`AI: ${message}`);tx(st,"ai.payment",`AI ghi nhận ${c.name} trả ${formatMoney(a)}`);return
  }
  bad("Plan AI chưa hỗ trợ")
}
function answerAI(st,msg,context={}){
  const q=norm(msg),cu=findCustomer(st,msg,context.customerId),pr=findProduct(st,msg,context.productId);
  const today=new Date().toISOString().slice(0,10);

  if(q.includes("bat thuong")||q.includes("bất thường")||q.includes("kiem tra loi")||q.includes("sai so")){
    const a=anomalyList(st);return a.length?`Tôi thấy ${a.length} điểm cần kiểm tra:\n${a.map(x=>"• "+x).join("\n")}`:"Chưa thấy bất thường rõ ràng trong dữ liệu hiện tại."
  }
  if(q.includes("goi y nhap")||q.includes("cần nhập")||q.includes("can nhap")||q.includes("nhap som")||q.includes("dự báo")||q.includes("du bao")){
    const a=forecastLines(st);return a.length?`Gợi ý nhập hàng theo tốc độ bán 14 ngày:\n${a.slice(0,10).map(x=>`• ${x.p.name}: còn ${x.p.stock} ${x.p.unit}, ~${x.daily.toFixed(1)}/ngày, đủ khoảng ${x.days.toFixed(1)} ngày${x.suggested?`, gợi ý nhập ≥ ${x.suggested} ${x.p.unit}`:""}`).join("\n")}`:"Chưa đủ lịch sử bán để dự báo hoặc tồn kho đang ổn."
  }
  if((q.includes("nguyen lieu")||q.includes("nguyên liệu"))&&(q.includes("ca phe")||q.includes("cà phê"))){
    const u=recipeUsage(st,7);return `Ước tính nguyên liệu cà phê đã dùng trong 7 ngày:\n• Cà phê phin: ${u.phin_g.toFixed(0)} g\n• Cà phê máy: ${u.machine_g.toFixed(0)} g\n• Sữa đặc: ${u.condensed_ml.toFixed(0)} ml\n• Sữa tươi: ${u.fresh_ml.toFixed(0)} ml\n• Bột kem muối: ${u.salt_g.toFixed(0)} g\n• Đường: ${u.sugar_g.toFixed(0)} g\n(Ước tính theo công thức sản phẩm và số ly bán.)`
  }
  if(q.includes("hom nay kinh doanh")||q.includes("hôm nay kinh doanh")||q.includes("tong ket hom nay")||q.includes("tổng kết hôm nay")){
    const s=st.sales.filter(x=>String(x.createdAt).slice(0,10)===today),rev=s.reduce((a,x)=>a+(+x.total||0),0),profit=s.reduce((a,x)=>a+(+x.profit||0),0),qtys=s.reduce((a,x)=>a+(x.items||[]).reduce((z,l)=>z+(+l.quantity||0),0),0);
    return `Hôm nay: ${s.length} đơn · ${qtys} sản phẩm · doanh thu ${formatMoney(rev)} · lợi nhuận ${formatMoney(profit)} · tổng công nợ hiện tại ${formatMoney(st.debts.reduce((a,d)=>a+(+d.balance||0),0))}.`
  }
  if(q.includes("7 ngay")||q.includes("7 ngày")||q.includes("ban chay")||q.includes("bán chạy")||q.includes("loi cao")||q.includes("lời cao")){
    const s=saleStats(st,7);
    if(q.includes("loi cao")||q.includes("lời cao"))return s.items.length?`Lợi nhuận theo mặt hàng 7 ngày:\n${[...s.items].sort((a,b)=>b.profit-a.profit).slice(0,8).map((x,i)=>`${i+1}. ${x.name}: ${formatMoney(x.profit)}`).join("\n")}`:"Chưa có dữ liệu bán 7 ngày.";
    return s.items.length?`Bán chạy 7 ngày:\n${s.items.slice(0,8).map((x,i)=>`${i+1}. ${x.name}: ${x.qty} · ${formatMoney(x.revenue)}`).join("\n")}\nTổng doanh thu: ${formatMoney(s.revenue)} · lợi nhuận: ${formatMoney(s.profit)}`:"Chưa có dữ liệu bán 7 ngày."
  }
  if(q.includes("ban cham")||q.includes("bán chậm")||q.includes("ton nhieu")||q.includes("tồn nhiều")){
    const sold=new Map(saleStats(st,14).items.map(x=>[norm(x.name),x.qty]));
    const a=st.products.filter(p=>p.stock>0).map(p=>({p,qty:sold.get(norm(p.name))||0})).sort((a,b)=>(b.p.stock/(b.qty+1))-(a.p.stock/(a.qty+1))).slice(0,8);
    return a.length?`Tồn nhiều / bán chậm trong 14 ngày:\n${a.map(x=>`• ${x.p.name}: tồn ${x.p.stock}, bán ${x.qty}`).join("\n")}`:"Không có dữ liệu phù hợp."
  }
  if(q.includes("sap het")||q.includes("sắp hết")){const a=st.products.filter(p=>p.trackStock!==false&&p.stock<=p.minStock);return a.length?`Sắp hết / đã hết:\n${a.map(p=>`• ${p.name}: ${p.stock} ${p.unit}`).join("\n")}`:"Không có sản phẩm dưới mức tồn tối thiểu."}
  if(q.includes("no nhieu")||q.includes("nợ nhiều")||q.includes("no cao")||q.includes("nợ cao")){const a=st.customers.map(c=>({name:c.name,d:customerDebt(st,c.id)})).filter(x=>x.d>0).sort((a,b)=>b.d-a.d).slice(0,8);return a.length?a.map((x,i)=>`${i+1}. ${x.name}: ${formatMoney(x.d)}`).join("\n"):"Không có công nợ."}
  if(q.includes("ai tra no hom nay")||q.includes("ai trả nợ hôm nay")||q.includes("tra no hom nay")){
    const rows=[];for(const d of st.debts)for(const p of d.payments||[])if(String(p.createdAt).slice(0,10)===today)rows.push({name:d.customer||st.customers.find(c=>c.id===d.customerId)?.name||"",amount:p.amount});
    return rows.length?`Trả nợ hôm nay:\n${rows.map(x=>`• ${x.name}: ${formatMoney(x.amount)}`).join("\n")}`:"Hôm nay chưa có lần trả nợ."
  }
  if(cu&&(q.includes("no tu ngay")||q.includes("nợ từ ngày")||q.includes("lich su no")||q.includes("lịch sử nợ")||q.includes("dang no")||q.includes("đang nợ"))){
    const ds=st.debts.filter(d=>d.customerId===cu.id),bal=customerDebt(st,cu.id);return `${cu.name} còn nợ ${formatMoney(bal)}.\n${ds.slice(-10).reverse().map(d=>`• ${new Date(d.createdAt).toLocaleDateString("vi-VN")}: ${formatMoney(d.amount)} · còn ${formatMoney(d.balance)} · ${d.note||""}`).join("\n")}`
  }
  if(q.includes("doanh thu hom nay")||q.includes("doanh thu hôm nay")||q.includes("loi hom nay")||q.includes("lời hôm nay")){const s=st.sales.filter(x=>String(x.createdAt).slice(0,10)===today),rev=s.reduce((a,x)=>a+(+x.total||0),0),profit=s.reduce((a,x)=>a+(+x.profit||0),0);return `Hôm nay doanh thu ${formatMoney(rev)}, lợi nhuận ${formatMoney(profit)}.`}
  if(pr&&(q.includes("con bao nhieu")||q.includes("còn bao nhiêu")||q.includes("ton bao nhieu")))return `${pr.name} còn ${pr.stock} ${pr.unit}.`
  if(q.includes("tinh hinh hom nay")||q.includes("tình hình hôm nay"))return {__type:"todaySummary",data:todaySummaryData(st)};
  if(q.includes("chenh lech kho")||q.includes("chênh lệch kho")||q.includes("that thoat")||q.includes("thất thoát")||q.includes("ton ly thuyet")||q.includes("tồn lý thuyết")){const a=auditVarianceReport(st);return a.length?`Chênh lệch giữa 2 lần kiểm kho gần nhất:\n${a.slice(0,10).map(x=>`• ${x.name}: đầu ${x.previous} + nhập ${x.received} - bán ${x.sold} = lý thuyết ${x.expected}; kiểm thực tế ${x.actual}; lệch ${x.diff>0?"+":""}${x.diff}`).join("\n")}`:"Chưa có đủ ít nhất 2 lần kiểm kho cho cùng mặt hàng để tính chênh lệch."}
  if(q.includes("so voi hom qua")||q.includes("so với hôm qua")){const [a,b]=dayRange(0),[c,d]=dayRange(-1),x=periodSales(st,a,b),y=periodSales(st,c,d),pct=y.revenue?((x.revenue-y.revenue)/y.revenue*100):null;return `Hôm nay ${formatMoney(x.revenue)} doanh thu, ${formatMoney(x.profit)} lợi nhuận. Hôm qua ${formatMoney(y.revenue)} doanh thu, ${formatMoney(y.profit)} lợi nhuận.${pct===null?"":` Doanh thu ${pct>=0?"tăng":"giảm"} ${Math.abs(pct).toFixed(1)}%.`}`}
  if((q.includes("tuan nay")&&q.includes("tuan truoc"))||(q.includes("tuần này")&&q.includes("tuần trước"))){const [a,b]=weekRange(0),[c,d]=weekRange(-1),x=periodSales(st,a,b),y=periodSales(st,c,d);return `7 ngày gần nhất: ${formatMoney(x.revenue)} doanh thu / ${formatMoney(x.profit)} lợi nhuận. 7 ngày trước đó: ${formatMoney(y.revenue)} / ${formatMoney(y.profit)}.`}
  if(q.includes("tong no")||q.includes("tổng nợ"))return `Tổng công nợ hiện tại: ${formatMoney(st.debts.reduce((z,d)=>z+(+d.balance||0),0))}.`;
  if(q.includes("chua tra no")||q.includes("chưa trả nợ")){const dm=msg.match(/(\d+)\s*ngày/i),days=dm?Number(dm[1]):10,cut=Date.now()-days*86400000,rows=st.customers.map(c=>{const debts=st.debts.filter(d=>d.customerId===c.id&&d.balance>0),payments=debts.flatMap(d=>d.payments||[]),last=payments.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];return {c,balance:customerDebt(st,c.id),last:last?.createdAt||""}}).filter(x=>x.balance>0&&(!x.last||new Date(x.last).getTime()<cut));return rows.length?`Khách còn nợ và chưa trả trong ${days} ngày:\n${rows.slice(0,15).map(x=>`• ${x.c.name}: ${formatMoney(x.balance)}${x.last?` · lần trả gần nhất ${new Date(x.last).toLocaleDateString("vi-VN")}`:" · chưa có lần trả"}`).join("\n")}`:"Không có khách phù hợp."}
  if(q.includes("no tren")||q.includes("nợ trên")){const amount=parseAmountAfter(msg,["nợ trên","no tren"]).amount||200000,rows=st.customers.map(c=>({name:c.name,d:customerDebt(st,c.id)})).filter(x=>x.d>amount).sort((a,b)=>b.d-a.d);return rows.length?`Khách nợ trên ${formatMoney(amount)}:\n${rows.map(x=>`• ${x.name}: ${formatMoney(x.d)}`).join("\n")}`:"Không có khách phù hợp."}
  const monthReq=parseMonthRequest(msg);if(context.customerId&&monthReq&&(q.includes("xem")||q.includes("lich su")||q.includes("lịch sử")||context.lastIntent==="debtHistory")){const c=st.customers.find(x=>x.id===context.customerId),rows=debtHistoryForMonth(st,c.id,monthReq.year,monthReq.month);return rows.length?`${c.name} – công nợ tháng ${monthReq.month}/${monthReq.year}:\n${rows.map(d=>`• ${new Date(d.createdAt).toLocaleDateString("vi-VN")}: ${formatMoney(d.amount)} · còn ${formatMoney(d.balance)} · ${d.note||""}`).join("\n")}`:`${c.name} không có khoản nợ trong tháng ${monthReq.month}/${monthReq.year}.`}
  if(q.includes("doanh thu")){const cats=[...new Set(st.products.map(p=>p.category).filter(Boolean))],cat=cats.find(c=>q.includes(norm(c))),mr=parseMonthRequest(msg);if(cat||mr){if(mr){const key=`${mr.year}-${String(mr.month).padStart(2,"0")}`,x=auditPeriodEstimate(st,key,cat||"");return `${cat?`Doanh thu ${cat}`:"Doanh thu"} tháng ${mr.month}/${mr.year}: thực tế từ đơn ${formatMoney(x.actualRevenue)} · suy ra từ kiểm kho ${formatMoney(x.derivedRevenue)} · tổng ước tính ${formatMoney(x.estimatedRevenue)} · lợi nhuận ước tính ${formatMoney(x.estimatedProfit)}${x.lossCost?` · hao hụt theo giá vốn ${formatMoney(x.lossCost)}`:""}${x.unclassifiedQty?` · còn ${x.unclassifiedQty} SP chênh lệch chưa phân loại`:""}.`}const range=weekRange(0),x=periodSales(st,range[0],range[1],cat||"");return `${cat?`Doanh thu ${cat}`:"Doanh thu"} 7 ngày gần nhất: ${formatMoney(x.revenue)} · lợi nhuận ${formatMoney(x.profit)} · ${x.qty} sản phẩm.`}}
  if((q.includes("neu ban")||q.includes("nếu bán"))&&pr){const m=msg.match(/(\d+(?:[.,]\d+)?)\s*(?:ly|cốc|coc)?/i),quantity=m?Number(m[1].replace(",",".")):1,n=productRecipeNeed(pr,quantity);return `Nếu bán ${quantity} ${pr.name}, ước tính cần: cà phê phin ${n.phin_g.toFixed(0)}g; cà phê máy ${n.machine_g.toFixed(0)}g; sữa đặc ${n.condensed_ml.toFixed(0)}ml; sữa tươi ${n.fresh_ml.toFixed(0)}ml; bột kem muối ${n.salt_g.toFixed(0)}g; đường ${n.sugar_g.toFixed(0)}g.`}

  return null
}

function parseVietnameseDate(text){
  const s=String(text||"").toLowerCase();
  const m=s.match(/(?:ngày|ngay)?\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i);
  if(!m)return null;
  let d=Number(m[1]),mo=Number(m[2]),y=m[3]?Number(m[3]):new Date().getFullYear();
  if(y<100)y+=2000;
  if(d<1||d>31||mo<1||mo>12)return null;
  const dt=new Date(y,mo-1,d,12,0,0,0);
  return Number.isNaN(dt.getTime())?null:dt.toISOString();
}

function explicitDebtProduct(st,text){
  const q=norm(String(text||""));
  // Debt notes like "2c", "3c", "1 mèo" are internal notes, not product names.
  // Only accept a product when its full normalized name or an explicit alias appears in the text.
  const products=[...(st.products||[])].filter(p=>p.active!==false).sort((a,b)=>norm(b.name).length-norm(a.name).length);
  for(const p of products){
    const n=norm(p.name);
    if(n.length>=3&&q.includes(n))return p;
  }
  for(const a of st.aliases||[]){
    const alias=norm(a.alias||"");
    if(alias.length>=2&&new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=\\s|$)`).test(q)){
      const p=st.products.find(x=>x.id===a.productId&&x.active!==false);
      if(p)return p;
    }
  }
  return null;
}

function splitDebtClauses(msg){
  // Keeps the customer name in the prefix and splits repeated debt clauses by commas/semicolons.
  return String(msg||"").split(/\s*[,;]\s*/).map(x=>x.trim()).filter(Boolean);
}
function parseDebtBatch(st,msg,context={}){
  const q=String(msg||"").trim();
  const clauses=splitDebtClauses(q);
  if(!clauses.length)return null;

  let customer=findCustomer(st,q,context.customerId);
  if(!customer){
    // Try only the prefix before first debt keyword as customer name.
    const prefix=q.split(/(?:^|\s)(?:ghi\s*nợ|ghi\s*no|nợ|no)(?=\s|$)/i)[0].trim();
    if(prefix)customer=findCustomer(st,prefix,context.customerId);
  }
  if(!customer)return null;

  const parsed=[];
  for(const clause0 of clauses){
    let clause=clause0;
    if(!/(?:^|\s)(?:ghi\s*nợ|ghi\s*no|nợ|no)(?=\s|$)/i.test(clause))continue;

    const cash={amount:debtAmountFromClause(clause),ambiguous:false};
    if(!cash.amount)continue;

    const date=parseVietnameseDate(clause)||now();

    // Optional product quantity such as 2c / 2 cái / 2 chai / 2 lon.
    let qtyMatch=clause.match(/(\d+(?:[.,]\d+)?)\s*(c|cái|cai|chai|lon|ly|gói|goi)\b/i);
    let quantity=qtyMatch?Number(qtyMatch[1].replace(",",".")):0;

    // Try identifying a product from the clause. If no product name exists, keep debt as manual debt.
    const product=explicitDebtProduct(st,clause);
    parsed.push({
      amount:cash.amount,
      date,
      quantity,
      productId:product?.id||"",
      productName:product?.name||"",
      raw:clause,
      note:debtNoteFromClause(clause)
    });
  }
  if(!parsed.length)return null;
  return {customer,items:parsed};
}
function debtBatchSummary(batch){
  return batch.items.map((x,i)=>{
    const d=new Date(x.date).toLocaleDateString("vi-VN");
    if(x.productName)return `${i+1}. ${formatMoney(x.amount)} · ${d} · ${x.quantity||1} ${x.productName}`;
    return `${i+1}. ${formatMoney(x.amount)} · ${d} · ghi chú: ${x.note||x.raw||""}`;
  }).join("\n");
}


function customerDebtHistory(st,customerId){
  return st.debts.filter(d=>d.customerId===customerId).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(d=>({
    id:d.id,
    createdAt:d.createdAt,
    amount:+d.amount||0,
    paid:+d.paid||0,
    balance:+d.balance||0,
    note:d.note||"",
    saleId:d.saleId||""
  }));
}


function findDebtByDate(st,customerId,dateText){const iso=parseVietnameseDate(dateText);if(!iso)return null;const target=new Date(iso);return st.debts.filter(d=>d.customerId===customerId).sort((a,b)=>Math.abs(new Date(a.createdAt)-target)-Math.abs(new Date(b.createdAt)-target))[0]||null}
function debtHistoryForMonth(st,customerId,year,month){const [a,b]=monthRange(year,month);return st.debts.filter(d=>d.customerId===customerId&&new Date(d.createdAt)>=a&&new Date(d.createdAt)<b).sort((x,y)=>String(y.createdAt).localeCompare(String(x.createdAt)))}
function parseMonthRequest(msg){const m=String(msg).match(/tháng\s*(\d{1,2})(?:[\/\-](\d{2,4}))?/i);if(!m)return null;let y=m[2]?Number(m[2]):new Date().getFullYear();if(y<100)y+=2000;return {month:Number(m[1]),year:y}}
function unusualDebtThreshold(st){const a=st.debts.map(d=>+d.amount||0).filter(x=>x>0).sort((x,y)=>x-y);if(!a.length)return 1000000;return Math.max(1000000,(a[Math.floor(a.length/2)]||0)*5)}
function planAI(st,msg,context={}){
  const q=norm(msg);
  const payCustomer=findCustomer(st,msg,context.customerId);
  if(payCustomer&&(q.includes("tra no")||q.includes("trả nợ"))&&!paymentAmountFromMessage(msg)&&!q.includes("tra het")&&!q.includes("trả hết")){
    const total=customerDebt(st,payCustomer.id),history=customerDebtHistory(st,payCustomer.id);
    return {
      type:"debtPayment",
      customer:{id:payCustomer.id,name:payCustomer.name},
      total,
      history,
      selectedDebtIds:history.filter(d=>d.balance>0).map(d=>d.id),
      context:{...context,customerId:payCustomer.id,lastIntent:"debtPayment"}
    };
  }
  const direct=answerAI(st,msg,context);if(direct){if(typeof direct==="object"&&direct.__type==="todaySummary")return {type:"todaySummary",data:direct.data,context:{...context,lastIntent:"summary"}};return {type:"answer",answer:direct,context:{...context,lastIntent:"answer"}}}
  const resolvedProduct=context.resolvedProductId?st.products.find(x=>x.id===context.resolvedProductId):null;
  const amb=resolvedProduct?[]:ambiguousProduct(st,msg);
  const cu=findCustomer(st,msg,context.customerId);
  const pr=resolvedProduct||findProduct(st,msg,context.productId);

  if(q.includes("bat tu dong tru nguyen lieu")||q.includes("bật tự động trừ nguyên liệu"))return {type:"plan",safe:true,summary:"Bật tự động trừ nguyên liệu cà phê khi bán",plan:{kind:"config.set",ai:{autoIngredientDeduct:true}},context};
  if(q.includes("tat tu dong tru nguyen lieu")||q.includes("tắt tự động trừ nguyên liệu"))return {type:"plan",safe:true,summary:"Tắt tự động trừ nguyên liệu cà phê",plan:{kind:"config.set",ai:{autoIngredientDeduct:false}},context};
  if(context.customerId&&(q.includes("thanh toan khoan dau tien")||q.includes("thanh toán khoản đầu tiên"))){const rows=customerDebtHistory(st,context.customerId).filter(d=>d.balance>0).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))),c=st.customers.find(x=>x.id===context.customerId);return {type:"debtPayment",customer:{id:c.id,name:c.name},total:rows[0]?.balance||0,history:customerDebtHistory(st,c.id),selectedDebtIds:rows[0]?[rows[0].id]:[],context:{...context,lastIntent:"debtPayment"}}}
  const payAmount=paymentAmountFromMessage(msg);
  if(cu&&(q.includes("tra khoan ngay")||q.includes("trả khoản ngày"))){const d=findDebtByDate(st,cu.id,msg);return d?{type:"debtPayment",customer:{id:cu.id,name:cu.name},total:d.balance,history:customerDebtHistory(st,cu.id),selectedDebtIds:[d.id],context:{...context,customerId:cu.id,lastIntent:"debtPayment"}}:{type:"answer",answer:"Không tìm thấy khoản nợ gần ngày anh yêu cầu.",context}}
  if(cu&&(q.includes("tru khoan cu nhat")||q.includes("trừ khoản cũ nhất"))){const rows=customerDebtHistory(st,cu.id).filter(d=>d.balance>0).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));return {type:"debtPayment",customer:{id:cu.id,name:cu.name},total:payAmount||rows[0]?.balance||0,history:customerDebtHistory(st,cu.id),selectedDebtIds:rows[0]?[rows[0].id]:[],suggestedAmount:payAmount||rows[0]?.balance||0,context:{...context,customerId:cu.id,lastIntent:"debtPayment"}}}
  if(q.includes("kiem kho")||q.includes("kiểm kho")){const lines=parseBulkAudit(st,msg,context);if(lines.length>=1)return {type:"plan",safe:false,summary:`Kiểm kho ${lines.length} mặt hàng:\n${lines.map(x=>`• ${x.name}: ${x.actual}`).join("\n")}`,plan:{kind:"inventory.batch",lines},context:{...context,lastIntent:"audit"}}}
  if(q.includes("nhap kho")||q.includes("nhập kho")||q.startsWith("nhap ")||q.startsWith("nhập ")||q.includes("ve them")||q.includes("về thêm")||q.includes("hoa don")||q.includes("hóa đơn")){const lines=parseBulkStockin(st,msg,context);if(lines.length>=1){const hasPrice=lines.some(x=>x.costPrice);return {type:"plan",safe:false,summary:`Nhập kho ${lines.length} mặt hàng:\n${lines.map(x=>`• ${x.name}: +${x.quantity}${x.costPrice?` · giá ${formatMoney(x.costPrice)}`:""}`).join("\n")}`,plan:{kind:"stockin.batch",lines,updateCost:hasPrice},context:{...context,lastIntent:"stockin"}}}}
  if(cu&&(q.includes("khoan no")||q.includes("khoản nợ"))&&(q.includes("khong phai")||q.includes("không phải"))&&(q.includes("ma la")||q.includes("mà là"))){const d=findDebtByDate(st,cu.id,msg),after=String(msg).split(/mà là|ma la/i)[1]||"",amount=parseCashDetailed(after).amount;if(d&&amount)return {type:"plan",safe:false,summary:`Sửa khoản nợ ${cu.name} ngày ${new Date(d.createdAt).toLocaleDateString("vi-VN")}: ${formatMoney(d.amount)} → ${formatMoney(amount)}`,plan:{kind:"debt.correct",debtId:d.id,amount,createdAt:parseVietnameseDate(msg)||d.createdAt,note:d.note},context:{...context,customerId:cu.id,lastIntent:"debtHistory"}}}
  if(q.includes("tao lai don cuoi")||q.includes("tạo lại đơn cuối")||q.includes("lap lai don cuoi")||q.includes("lặp lại đơn cuối")||q.includes("lay nhu don hom qua")||q.includes("lấy như đơn hôm qua")){const s=lastSale(st,cu?.id||"");if(s)return {type:"plan",safe:false,summary:`Tạo lại đơn ${new Date(s.createdAt).toLocaleString("vi-VN")} · ${formatMoney(s.total)}`,plan:{kind:"sale.repeat",saleId:s.id},context:{...context,customerId:s.customerId||context.customerId,lastSaleId:s.id,lastIntent:"sale"}}}
  if(q.includes("don vua roi")||q.includes("đơn vừa rồi")||q.includes("don cuoi")||q.includes("đơn cuối")){
    const s=context.lastSaleId?st.sales.find(x=>x.id===context.lastSaleId):lastSale(st,cu?.id||"");
    if(s){
      if(q.includes("chuyen khoan")||q.includes("chuyển khoản")||q.includes("tien mat")||q.includes("tiền mặt")||q.includes("ghi no")||q.includes("ghi nợ")){
        const pm=(q.includes("chuyen khoan")||q.includes("chuyển khoản"))?"transfer":(q.includes("ghi no")||q.includes("ghi nợ"))?"debt":"cash";
        return {type:"plan",safe:false,summary:`Đổi thanh toán đơn vừa rồi sang ${pm==="transfer"?"chuyển khoản":pm==="debt"?"ghi nợ":"tiền mặt"}`,plan:{kind:"sale.modify",saleId:s.id,next:{paymentMethod:pm,customerId:cu?.id||s.customerId||""}},context:{...context,lastSaleId:s.id,lastIntent:"sale"}}
      }
      const mentioned=allMentionedProducts(st,msg),target=mentioned[0];
      if(target&&(q.includes("them ")||q.includes("thêm "))){
        const items=saleItemsPayload(s),row=items.find(x=>x.productId===target.productId);
        if(row)row.quantity+=target.quantity;else items.push({productId:target.productId,quantity:target.quantity});
        return {type:"plan",safe:false,summary:`Thêm ${target.quantity} ${target.name} vào đơn vừa rồi`,plan:{kind:"sale.modify",saleId:s.id,next:{items}},context:{...context,lastSaleId:s.id,lastIntent:"sale"}}
      }
      if(target&&(q.includes("xoa ")||q.includes("xóa ")||q.includes("bo ")||q.includes("bỏ "))){
        const items=saleItemsPayload(s),row=items.find(x=>x.productId===target.productId);
        if(row){
          row.quantity=Math.max(0,row.quantity-target.quantity);
          return {type:"plan",safe:false,summary:`Bỏ ${target.quantity} ${target.name} khỏi đơn vừa rồi`,plan:{kind:"sale.modify",saleId:s.id,next:{items:items.filter(x=>x.quantity>0)}},context:{...context,lastSaleId:s.id,lastIntent:"sale"}}
        }
      }
      if(target&&(q.includes("sai")||q.includes("chu khong phai")||q.includes("chứ không phải"))){
        const nums=[...msg.matchAll(/(\d+(?:[.,]\d+)?)/g)].map(m=>Number(m[1].replace(",","."))),newQty=nums.at(-1),items=saleItemsPayload(s),row=items.find(x=>x.productId===target.productId);
        if(row&&newQty){
          row.quantity=newQty;
          return {type:"plan",safe:false,summary:`Sửa ${target.name} trong đơn vừa rồi thành ${newQty}`,plan:{kind:"sale.modify",saleId:s.id,next:{items}},context:{...context,lastSaleId:s.id,lastIntent:"sale"}}
        }
      }
    }
  }
  if(q.includes("hoan tac")||q.includes("hoàn tác")||q.includes("khoi phuc truoc")||q.includes("khôi phục trước")){const keyword=(q.includes("kiem kho")||q.includes("kiểm kho"))?"audit":(q.includes("nhap kho")||q.includes("nhập kho"))?"stockin":(q.includes("ban")||q.includes("bán"))?"sale":"",s=[...(st.snapshots||[])].reverse().find(x=>!keyword||norm(x.label).includes(keyword));if(s)return {type:"plan",safe:false,summary:`Khôi phục snapshot: ${s.label}`,plan:{kind:"restore.snapshot",snapshotId:s.id},context:{...context,lastIntent:"restore"}}}

  // Flexible multi-debt command, e.g. "Đình Thành 67 nợ 30k 2c ngày 8/7, nợ 48k 2c ngày 6/7"
  const debtBatch=parseDebtBatch(st,msg,context);
  if(debtBatch&&debtBatch.items.length>=2){
    return {
      type:"plan",
      summary:`Tạo ${debtBatch.items.length} khoản nợ cho ${debtBatch.customer.name}:
${debtBatchSummary(debtBatch)}`,
      plan:{kind:"debt.batch",customerId:debtBatch.customer.id,items:debtBatch.items.map(x=>({amount:x.amount,createdAt:x.date,quantity:x.quantity,productId:x.productId,note:x.note||x.raw}))},
      context:{...context,customerId:debtBatch.customer.id,resolvedProductId:""}
    };
  }

  if(amb.length)return {
    type:"clarify",
    question:`Tôi chưa chắc anh đang nói mặt hàng nào. Chọn một mặt hàng:`,
    choices:amb.map(p=>({label:p.name,message:msg,context:{...context,resolvedProductId:p.id,productId:p.id}})),
    context
  };

  const aliasMatch=msg.match(/(?:gọi|goi|từ nay gọi|tu nay goi)\s+(.+?)\s+(?:là|la)\s+([^\s,;]+)/i);
  if(aliasMatch){
    const p=findProduct(st,aliasMatch[1]);if(!p)return {type:"clarify",question:"Tôi chưa xác định được sản phẩm cần đặt alias.",choices:[],context};
    return {type:"plan",safe:true,summary:`Ghi nhớ “${aliasMatch[2]}” = ${p.name}`,plan:{kind:"alias.add",productId:p.id,alias:aliasMatch[2]},context:{...context,productId:p.id}}
  }

  // Multi-item sale: "Đang lấy 2 Pocari, 1 Bò húc và ghi nợ"
  const items=allMentionedProducts(st,msg);
  if(items.length&&(q.includes("lay ")||q.includes("lấy ")||q.includes("mua ")||q.includes("ban cho")||q.includes("bán cho")||q.includes("tao don")||q.includes("tạo đơn"))){
    if(!cu&&q.includes("no"))return {type:"clarify",question:"Đơn này ghi nợ nhưng tôi chưa xác định được khách hàng. Hãy nói rõ tên khách.",choices:[],context};
    const paymentMethod=(q.includes("ghi no")||q.includes("ghi nợ")||q.includes(" no"))?"debt":(q.includes("chuyen khoan")||q.includes("chuyển khoản"))?"transfer":"cash";
    const total=items.reduce((a,l)=>a+(st.products.find(p=>p.id===l.productId)?.salePrice||0)*l.quantity,0);
    return {type:"plan",safe:false,summary:`Tạo đơn ${items.map(x=>`${x.quantity} ${x.name}`).join(", ")} · ${formatMoney(total)}${paymentMethod==="debt"&&cu?` · ghi nợ ${cu.name}`:""}`,plan:{kind:"sale.create",items,customerId:cu?.id||"",paymentMethod},context:{...context,productId:items.at(-1)?.productId||"",customerId:cu?.id||context.customerId||"",lastIntent:"sale"}}
  }

  if(pr&&(q.includes("ban het")||q.includes("bán hết")||q.includes("het hang")||q.includes("hết hàng")||q.includes("het roi")||q.includes("hết rồi")||q.endsWith(" het")||q.endsWith(" hết")||q.includes("cho ve 0")||q.includes("về 0")))return {type:"plan",summary:`Kiểm kho ${pr.name}: ${pr.stock} → 0 ${pr.unit}`,plan:{kind:"inventory.set",productId:pr.id,after:0},context:{...context,productId:pr.id}};
  if(pr&&(q.includes("kiem kho")||q.includes("kiểm kho")||q.includes(" con ")||q.includes(" còn "))){const n=parseNum(msg);if(n!==null)return {type:"plan",summary:`Kiểm kho ${pr.name}: ${pr.stock} → ${n} ${pr.unit}`,plan:{kind:"inventory.set",productId:pr.id,after:n},context:{...context,productId:pr.id}}}
  if(items.length>1&&(q.includes("nhap")||q.includes("nhập")||q.includes("ve them")||q.includes("về thêm"))){
    const steps=items.map(x=>({kind:"stockin",productId:x.productId,quantity:x.quantity}));
    return {type:"plan",summary:`Nhập kho nhiều mặt hàng: ${items.map(x=>`${x.quantity} ${x.name}`).join(", ")}`,plan:{kind:"batch",steps},context:{...context,productId:items.at(-1)?.productId||""}}
  }
  if(pr&&(q.includes("nhap")||q.includes("nhập")||q.includes("ve them")||q.includes("về thêm"))){
    const numbers=[...norm(msg).matchAll(/(\d+(?:[.,]\d+)?)\s*(thung|thùng|ket|két|chai|lon|goi|gói|cai|cái|le|lẻ)?/g)];
    if(numbers.length){
      let total=0;for(const m of numbers){let n=Number(m[1].replace(",",".")),u=m[2]||"";if(u.includes("thung")||u.includes("thùng")||u.includes("ket")||u.includes("két"))n*=pr.packSize||1;total+=n}
      return {type:"plan",summary:`Nhập ${pr.name} +${total} ${pr.unit}`,plan:{kind:"stockin",productId:pr.id,quantity:total},context:{...context,productId:pr.id}}
    }
  }
  if(cu&&(q.includes("tra het")||q.includes("trả hết"))){
    const a=customerDebt(st,cu.id);if(a)return {type:"plan",summary:`${cu.name} trả hết ${formatMoney(a)}`,plan:{kind:"debt.pay",customerId:cu.id,amount:a},context:{...context,customerId:cu.id}}
  }
  if(cu&&(q.includes("no ")||q.includes("nợ ")||q.includes("ghi no")||q.includes("ghi nợ"))){
    const c={amount:debtAmountFromClause(msg),ambiguous:false};if(c.amount){
      if(c.ambiguous)return {type:"clarify",question:`Anh muốn ghi nợ ${formatMoney(c.amount)} cho ${cu.name} đúng không?`,choices:[{label:`Đúng, ${formatMoney(c.amount)}`,message:`${cu.name} ghi nợ ${c.amount}đ ${msg}`},{label:"Nhập lại",message:`${cu.name} ghi nợ `}],context:{...context,customerId:cu.id}};
      const createdAt=parseVietnameseDate(msg)||now();
      const debtNote=debtNoteFromClause(msg);
      const qm=msg.match(/(\d+(?:[.,]\d+)?)\s*(c|cái|cai|chai|lon|ly|gói|goi)\b/i);
      const quantity=qm?Number(qm[1].replace(",",".")):0;
      const product=explicitDebtProduct(st,msg);
      if(product&&quantity>0){
        return {type:"plan",summary:`Tạo đơn nợ ${cu.name}: ${quantity} ${product.name} · ${formatMoney(c.amount)} · ${new Date(createdAt).toLocaleDateString("vi-VN")}`,plan:{kind:"debt.batch",customerId:cu.id,items:[{amount:c.amount,createdAt,quantity,productId:product.id,note:debtNote||msg}]},context:{...context,customerId:cu.id,productId:product.id,resolvedProductId:""}}
      }
      return {type:"plan",summary:`Ghi nợ ${cu.name}: ${formatMoney(c.amount)} · ${new Date(createdAt).toLocaleDateString("vi-VN")}${debtNote?` · ghi chú: ${debtNote}`:""}`,plan:{kind:"debt.add",customerId:cu.id,amount:c.amount,note:debtNote,createdAt},context:{...context,customerId:cu.id}}
    }
  }
  if(cu&&(q.includes("tra ")||q.includes("trả ")||q.includes("tra no")||q.includes("trả nợ"))){
    const c={amount:paymentAmountFromMessage(msg),ambiguous:false};if(c.amount){
      if(c.ambiguous)return {type:"clarify",question:`Anh muốn ghi nhận ${cu.name} trả ${formatMoney(c.amount)} đúng không?`,choices:[{label:`Đúng, ${formatMoney(c.amount)}`,message:`${cu.name} trả nợ ${c.amount}đ`},{label:"Nhập lại",message:`${cu.name} trả nợ `}],context:{...context,customerId:cu.id}};
      return {type:"plan",summary:`${cu.name} trả ${formatMoney(c.amount)}`,plan:{kind:"debt.pay",customerId:cu.id,amount:c.amount},context:{...context,customerId:cu.id}}
    }
  }

  return {type:"clarify",question:"Tôi chưa hiểu chắc. Anh có thể nói rõ tên mặt hàng/khách hàng và số lượng hoặc số tiền. Tôi sẽ không tự ghi khi chưa chắc.",choices:[],context}
}

export async function onRequest(context){
  globalThis.__ENV=context.env||{};
  const url=new URL(context.request.url),path=url.pathname,req=context.request;
  try{
    if(path==="/api/bootstrap"&&req.method==="GET"){const root=await readRoot(),s=active(root);return json({revision:root.revision||0,storeId:s.id,store:s.data,stores:root.stores.map(x=>({id:x.id,name:x.name}))})}
    if(path==="/api/action"&&req.method==="POST"){const body=await req.json(),root=await readRoot();if(Number(body.revision)!==Number(root.revision||0))bad("Dữ liệu vừa thay đổi ở thiết bị khác. Hãy đồng bộ lại.",409);applyAction(root,body.action,body.payload||{});const saved=await writeRoot(root,Number(body.revision)),s=active(saved);return json({ok:true,revision:saved.revision,storeId:s.id,store:s.data,stores:saved.stores.map(x=>({id:x.id,name:x.name}))})}
    if(path==="/api/ai/plan"&&req.method==="POST"){const body=await req.json(),root=await readRoot(),s=root.stores.find(x=>x.id===body.storeId)||active(root);return json(finalizeAIResponse(s.data,planAI(s.data,String(body.message||""),body.context||{})))}
    if(path==="/api/package/validate"&&req.method==="POST"){const body=await req.json();if(body.format!=="cantin-ai-node-json")bad("Không phải gói Cantin AI");if(!Array.isArray(body.files)||!body.files.length)bad("Gói không có file");return json({ok:true,version:body.version||"không rõ",fileCount:body.files.length})}
    return json({error:"Không tìm thấy API"},404)
  }catch(e){return json({error:e.message||"Lỗi máy chủ"},e.status||500)}
}
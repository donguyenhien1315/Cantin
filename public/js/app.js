
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={revision:0,storeId:"",store:null,stores:[],cart:new Map(),filters:{sale:"",audit:"",stockin:"",product:""}};
const money=n=>`${Math.round(Number(n)||0).toLocaleString("vi-VN")} ₫`;
const fmtDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?"Không rõ ngày":d.toLocaleString("vi-VN")};
const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const todayKey=()=>{const d=new Date(),p=x=>String(x).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};

async function api(path,opts={}){
  const r=await fetch(path,{headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});
  const d=await r.json().catch(()=>({error:"Phản hồi API không hợp lệ"}));
  if(!r.ok)throw new Error(d.error||"Có lỗi xảy ra");
  return d;
}
async function boot(){
  const b=$("#boot");try{
    b.textContent="Đang đồng bộ dữ liệu…";b.classList.remove("hidden");
    const d=await api("/api/bootstrap");
    state.revision=d.revision;state.storeId=d.storeId;state.store=d.store;state.stores=d.stores||[];
    renderAll();b.classList.add("hidden");
  }catch(e){b.textContent="Lỗi đồng bộ: "+e.message;toast(e.message,true)}
}
async function mutate(action,payload={}){
  const d=await api("/api/action",{method:"POST",body:JSON.stringify({revision:state.revision,action,payload})});
  state.revision=d.revision;state.storeId=d.storeId;state.store=d.store;state.stores=d.stores||[];
  renderAll();return d;
}
function toast(msg,error=false){const t=$("#toast");t.textContent=msg;t.className="toast show"+(error?" error":"");clearTimeout(t._x);t._x=setTimeout(()=>t.className="toast",2600)}
function modal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#closeModal").onclick=closeModal;$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

function navigate(page){
  $$(".page").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  $$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.target===page));
  if(page==="more")showMoreHome();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav").forEach(b=>b.onclick=()=>navigate(b.dataset.target));
$$(".jump").forEach(b=>b.onclick=()=>navigate(b.dataset.pageTarget));
$("#syncBtn").onclick=boot;
$("#storeSelect").onchange=async e=>{try{await mutate("store.switch",{id:e.target.value});toast("Đã chuyển cửa hàng")}catch(err){toast(err.message,true)}};

function renderHeader(){
  $("#storeName").textContent=state.store?.meta?.name||"Cửa hàng";
  $("#storeSelect").innerHTML=(state.stores||[]).map(s=>`<option value="${s.id}" ${s.id===state.storeId?"selected":""}>${esc(s.name)}</option>`).join("");
}
function customerDebt(id){return (state.store.debts||[]).filter(d=>d.customerId===id).reduce((s,d)=>s+(+d.balance||0),0)}
function renderDashboard(){
  const day=todayKey(),sales=(state.store.sales||[]).filter(s=>String(s.createdAt).slice(0,10)===day);
  const rev=sales.reduce((a,s)=>a+(+s.total||0),0),profit=sales.reduce((a,s)=>a+(+s.profit||0),0);
  const debt=(state.store.debts||[]).reduce((a,d)=>a+(+d.balance||0),0);
  const low=(state.store.products||[]).filter(p=>p.active!==false&&p.trackStock!==false&&(+p.stock||0)<= (+p.minStock||0));
  $("#todayRevenue").textContent=money(rev);$("#todayProfit").textContent=money(profit);$("#totalDebt").textContent=money(debt);$("#lowStock").textContent=low.length;
  const alerts=[];
  low.slice(0,6).forEach(p=>alerts.push(`<div class="list-row"><div><strong>${esc(p.name)}</strong><small>Tồn ${p.stock} ${esc(p.unit||"")} · tối thiểu ${p.minStock||0}</small></div></div>`));
  const tiny=(state.store.debts||[]).filter(d=>d.balance>0&&d.balance<1000);
  tiny.slice(0,3).forEach(d=>{const c=state.store.customers.find(x=>x.id===d.customerId);alerts.push(`<div class="list-row"><div><strong>Kiểm tra nợ nhỏ · ${esc(c?.name||"Khách")}</strong><small>${money(d.balance)} · có thể nhập thiếu .000</small></div></div>`)});
  $("#alerts").innerHTML=alerts.length?alerts.join(""):'<div class="empty">Không có cảnh báo đáng chú ý.</div>';
  const tx=[...(state.store.transactions||[])].reverse().slice(0,6);
  $("#recentTx").innerHTML=tx.length?tx.map(t=>`<div class="list-row"><div><strong>${esc(t.summary||t.type)}</strong><small>${fmtDate(t.createdAt)}</small></div></div>`).join(""):'<div class="empty">Chưa có thao tác.</div>';
}
$("#refreshDashboard").onclick=renderDashboard;

function categories(items){return [...new Set(items.filter(x=>x.active!==false).map(x=>String(x.category||"Khác")))].sort((a,b)=>a.localeCompare(b,"vi"))}
function renderChips(id,key,items,rerender){
  const cats=categories(items);if(state.filters[key]&&!cats.includes(state.filters[key]))state.filters[key]="";
  $(id).innerHTML=[{v:"",n:"Tất cả"},...cats.map(x=>({v:x,n:x}))].map(x=>`<button class="chip ${state.filters[key]===x.v?"active":""}" data-v="${esc(x.v)}">${esc(x.n)}</button>`).join("");
  $(id).querySelectorAll(".chip").forEach(b=>b.onclick=()=>{state.filters[key]=b.dataset.v;rerender()});
}

function renderSales(){
  const products=(state.store.products||[]).filter(p=>p.active!==false);
  renderChips("#saleCategories","sale",products,renderSales);
  const q=norm($("#saleSearch").value),cat=state.filters.sale;
  const rows=products.filter(p=>(!q||norm(p.name).includes(q))&&(!cat||p.category===cat));
  $("#saleProducts").innerHTML=rows.map(p=>{const q=state.cart.get(p.id)||0;return `<button class="product-card" data-id="${p.id}"><strong>${esc(p.name)}</strong><small>${money(p.salePrice)} · tồn ${p.stock}</small>${q?`<span class="qty-badge">${q}</span>`:""}</button>`}).join("");
  $("#saleProducts").querySelectorAll(".product-card").forEach(b=>b.onclick=()=>addCart(b.dataset.id,1));
  $("#saleCustomer").innerHTML='<option value="">Không chọn</option>'+(state.store.customers||[]).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
  renderCart();
  const hist=[...(state.store.sales||[])].reverse().slice(0,20);
  $("#saleHistory").innerHTML=hist.length?hist.map(s=>`<div class="list-row"><div><strong>${money(s.total)}</strong><small>${fmtDate(s.createdAt)} · ${esc(s.customer||s.paymentMethod||"")}</small></div><button class="ghost danger" data-delete-sale="${s.id}">Xóa</button></div>`).join(""):'<div class="empty">Chưa có đơn hàng.</div>';
  $$("[data-delete-sale]").forEach(b=>b.onclick=async()=>{if(!confirm("Xóa đơn hàng này?"))return;try{await mutate("sale.delete",{id:b.dataset.deleteSale});toast("Đã xóa đơn")}catch(e){toast(e.message,true)}});
}
$("#saleSearch").oninput=renderSales;
function addCart(id,n){const p=state.store.products.find(x=>x.id===id);if(!p)return;const cur=state.cart.get(id)||0,next=Math.max(0,cur+n);if(p.trackStock!==false&&next>p.stock){toast(`Chỉ còn ${p.stock} ${p.unit||""}`,true);return}if(next)state.cart.set(id,next);else state.cart.delete(id);renderSales()}
function renderCart(){
  const rows=[...state.cart].map(([id,q])=>({p:state.store.products.find(x=>x.id===id),q})).filter(x=>x.p);
  $("#cart").innerHTML=rows.length?rows.map(({p,q})=>`<div class="cart-row"><div><strong>${esc(p.name)}</strong><small>${money(p.salePrice*q)}</small></div><button class="qty-btn" data-minus="${p.id}">−</button><input class="qty-input" data-qty="${p.id}" value="${q}" inputmode="numeric"><button class="qty-btn" data-plus="${p.id}">+</button><button class="qty-btn cart-remove" data-remove="${p.id}">×</button></div>`).join(""):'<div class="empty">Chưa chọn sản phẩm.</div>';
  const total=rows.reduce((s,x)=>s+x.p.salePrice*x.q,0);$("#cartTotal").textContent=money(total);
  $$("[data-minus]").forEach(b=>b.onclick=()=>addCart(b.dataset.minus,-1));$$("[data-plus]").forEach(b=>b.onclick=()=>addCart(b.dataset.plus,1));$$("[data-remove]").forEach(b=>b.onclick=()=>{state.cart.delete(b.dataset.remove);renderSales()});
  $$("[data-qty]").forEach(i=>i.onchange=()=>{const p=state.store.products.find(x=>x.id===i.dataset.qty);let q=Math.max(0,Number(i.value)||0);if(p.trackStock!==false)q=Math.min(q,p.stock);if(q)state.cart.set(p.id,q);else state.cart.delete(p.id);renderSales()});
}
$("#saveSale").onclick=async()=>{const items=[...state.cart].map(([productId,quantity])=>({productId,quantity}));if(!items.length)return toast("Đơn hàng trống",true);try{await mutate("sale.create",{items,paymentMethod:$("#paymentMethod").value,customerId:$("#saleCustomer").value,note:$("#saleNote").value});state.cart.clear();$("#saleNote").value="";toast("Đã lưu đơn hàng")}catch(e){toast(e.message,true)}};

function renderDebts(){
  const q=norm($("#debtSearch").value),customers=[...(state.store.customers||[])].filter(c=>!q||norm(c.name).includes(q)).map(c=>({...c,balance:customerDebt(c.id)})).sort((a,b)=>b.balance-a.balance);
  $("#debtTotal").textContent=money(customers.reduce((s,c)=>s+c.balance,0));
  $("#customerList").innerHTML=customers.map(c=>`<div class="customer-card"><button class="customer-head" data-customer="${c.id}"><strong>${esc(c.name)}</strong><strong>${money(c.balance)}</strong></button><div class="customer-detail hidden" data-detail="${c.id}"></div></div>`).join("");
  $$("[data-customer]").forEach(b=>b.onclick=()=>toggleCustomer(b.dataset.customer));
}
$("#debtSearch").oninput=renderDebts;
function toggleCustomer(id){const box=$(`[data-detail="${id}"]`),c=state.store.customers.find(x=>x.id===id);box.classList.toggle("hidden");if(box.classList.contains("hidden"))return;const debts=(state.store.debts||[]).filter(d=>d.customerId===id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));box.innerHTML=`<div class="debt-actions"><button class="primary small" data-add-debt="${id}">Ghi nợ</button><button class="ghost small" data-pay-debt="${id}">Trả nợ</button><button class="ghost small" data-rename="${id}">Đổi tên</button></div><div class="list">${debts.map(d=>`<div class="list-row"><div><strong>${money(d.balance)}</strong><small>${fmtDate(d.createdAt)} · ${esc(d.note||"Khoản nợ")}${(d.payments||[]).length?` · đã trả ${money(d.paid)}`:""}</small></div>${!d.saleId?`<button class="ghost danger" data-del-debt="${d.id}">Xóa</button>`:""}</div>`).join("")||'<div class="empty">Chưa có lịch sử.</div>'}</div>`;bindDebtButtons()}
function bindDebtButtons(){
  $$("[data-add-debt]").forEach(b=>b.onclick=()=>showDebtAdd(b.dataset.addDebt));$$("[data-pay-debt]").forEach(b=>b.onclick=()=>showDebtPay(b.dataset.payDebt));$$("[data-rename]").forEach(b=>b.onclick=()=>showRename(b.dataset.rename));$$("[data-del-debt]").forEach(b=>b.onclick=async()=>{if(!confirm("Xóa khoản nợ?"))return;try{await mutate("debt.delete",{id:b.dataset.delDebt});toast("Đã xóa khoản nợ")}catch(e){toast(e.message,true)}})
}
function showDebtAdd(id){const c=state.store.customers.find(x=>x.id===id);modal(`<h3>Ghi nợ · ${esc(c.name)}</h3><label>Số tiền<input id="mAmount" inputmode="numeric"></label><label>Ngày<input id="mDate" type="date" value="${todayKey()}"></label><label>Ghi chú<input id="mNote"></label><button id="mSave" class="primary full">Lưu</button>`);$("#mSave").onclick=async()=>{try{await mutate("debt.add",{customerId:id,amount:$("#mAmount").value,createdAt:$("#mDate").value+"T05:00:00.000Z",note:$("#mNote").value});closeModal();toast("Đã ghi nợ")}catch(e){toast(e.message,true)}}}
function showDebtPay(id){const c=state.store.customers.find(x=>x.id===id),total=customerDebt(id);modal(`<h3>Trả nợ · ${esc(c.name)}</h3><p class="hint">Tổng còn nợ ${money(total)}</p><label>Số tiền<input id="mAmount" value="${total}" inputmode="numeric"></label><label>Ngày<input id="mDate" type="date" value="${todayKey()}"></label><label>Ghi chú<input id="mNote"></label><button id="mSave" class="primary full">Thanh toán</button>`);$("#mSave").onclick=async()=>{try{await mutate("debt.pay",{customerId:id,amount:$("#mAmount").value,createdAt:$("#mDate").value+"T05:00:00.000Z",note:$("#mNote").value});closeModal();toast("Đã trả nợ")}catch(e){toast(e.message,true)}}}
function showRename(id){const c=state.store.customers.find(x=>x.id===id);modal(`<h3>Đổi tên khách</h3><label>Tên<input id="mName" value="${esc(c.name)}"></label><button id="mSave" class="primary full">Lưu</button>`);$("#mSave").onclick=async()=>{try{await mutate("customer.update",{id,name:$("#mName").value});closeModal();toast("Đã đổi tên")}catch(e){toast(e.message,true)}}}
$("#addCustomer").onclick=()=>{modal('<h3>Thêm khách</h3><label>Tên<input id="mName"></label><button id="mSave" class="primary full">Thêm</button>');$("#mSave").onclick=async()=>{try{await mutate("customer.create",{name:$("#mName").value});closeModal();toast("Đã thêm khách")}catch(e){toast(e.message,true)}}};

function downloadJson(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
$("#downloadDebtBackup").onclick=()=>downloadJson({format:"cantin-ai-debt-backup",version:"1",exportedAt:new Date().toISOString(),customers:state.store.customers,debts:state.store.debts},`cantin-debt-${todayKey()}.json`);
$("#uploadDebtBackup").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const o=JSON.parse(await f.text());if(o.format!=="cantin-ai-debt-backup")throw new Error("Sai định dạng file nợ");if(!confirm(`Khôi phục ${o.customers?.length||0} khách và ${o.debts?.length||0} khoản nợ?`))return;await mutate("debt.backup.import",{data:o});toast("Đã khôi phục công nợ")}catch(err){toast(err.message,true)}e.target.value=""};

function renderWarehouse(){
  renderWarehouseList("audit");renderWarehouseList("stockin");
  const audits=[...(state.store.audits||[])].reverse().slice(0,15);$("#auditHistory").innerHTML=audits.length?audits.map(a=>`<div class="list-row"><div><strong>${fmtDate(a.createdAt)}</strong><small>${a.lines?.length||0} mặt hàng · ${esc(a.note||"")}</small></div><button class="ghost danger" data-del-audit="${a.id}">Xóa</button></div>`).join(""):'<div class="empty">Chưa có phiếu kiểm kho.</div>';
  $$("[data-del-audit]").forEach(b=>b.onclick=async()=>{if(confirm("Xóa phiếu kiểm kho?"))try{await mutate("audit.delete",{id:b.dataset.delAudit});toast("Đã xóa")}catch(e){toast(e.message,true)}});
  const receipts=[...(state.store.stockReceipts||[])].reverse().slice(0,15);$("#stockinHistory").innerHTML=receipts.length?receipts.map(r=>`<div class="list-row"><div><strong>${fmtDate(r.createdAt)}</strong><small>${r.lines?.length||0} mặt hàng · ${esc(r.note||"")}</small></div><button class="ghost danger" data-del-receipt="${r.id}">Xóa</button></div>`).join(""):'<div class="empty">Chưa có phiếu nhập.</div>';
  $$("[data-del-receipt]").forEach(b=>b.onclick=async()=>{if(confirm("Xóa phiếu nhập?"))try{await mutate("stockin.delete",{id:b.dataset.delReceipt});toast("Đã xóa")}catch(e){toast(e.message,true)}});
}
$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.toggle("active",x===b));$$(".warehouse-view").forEach(x=>x.classList.toggle("active",x.dataset.warehouseView===b.dataset.warehouse))});
$("#auditSearch").oninput=()=>renderWarehouseList("audit");$("#stockinSearch").oninput=()=>renderWarehouseList("stockin");
function renderWarehouseList(kind){
  const products=(state.store.products||[]).filter(p=>p.active!==false);
  renderChips(kind==="audit"?"#auditCategories":"#stockinCategories",kind,products,()=>renderWarehouseList(kind));
  const q=norm($(kind==="audit"?"#auditSearch":"#stockinSearch").value),cat=state.filters[kind],rows=products.filter(p=>(!q||norm(p.name).includes(q))&&(!cat||p.category===cat));
  const target=kind==="audit"?"#auditProducts":"#stockinProducts";
  $(target).innerHTML=rows.map(p=>kind==="audit"?`<div class="stock-row" data-product="${p.id}"><div><strong>${esc(p.name)}</strong><small>Tồn hệ thống ${p.stock} ${esc(p.unit||"")}</small></div><label>Thực tế<input class="actual" type="number" min="0" placeholder="${p.stock}"></label><span></span></div>`:`<div class="stock-row" data-product="${p.id}"><div><strong>${esc(p.name)}</strong><small>${p.packSize||1} / thùng · tồn ${p.stock}</small></div><label>Thùng<input class="cases" type="number" min="0" placeholder="0"></label><label>Lẻ<input class="units" type="number" min="0" placeholder="0"></label></div>`).join("")
}
$("#saveAudit").onclick=async()=>{const lines=$$("#auditProducts [data-product]").map(r=>{const v=r.querySelector(".actual").value;return v===""?null:{productId:r.dataset.product,actual:Number(v)}}).filter(Boolean);if(!lines.length)return toast("Chưa nhập tồn thực tế",true);try{await mutate("audit.create",{lines,note:$("#auditNote").value});$("#auditNote").value="";toast("Đã lưu kiểm kho")}catch(e){toast(e.message,true)}};
$("#saveStockin").onclick=async()=>{const lines=$$("#stockinProducts [data-product]").map(r=>({productId:r.dataset.product,cases:Number(r.querySelector(".cases").value)||0,units:Number(r.querySelector(".units").value)||0})).filter(x=>x.cases||x.units);if(!lines.length)return toast("Phiếu nhập trống",true);try{await mutate("stockin.create",{lines,note:$("#stockinNote").value});$("#stockinNote").value="";toast("Đã nhập kho")}catch(e){toast(e.message,true)}};

function renderCatalog(){
  const products=(state.store.products||[]).filter(p=>p.active!==false);
  renderChips("#productCategories","product",products,renderCatalog);
  const q=norm($("#productSearch").value),cat=state.filters.product,rows=products.filter(p=>(!q||norm(p.name).includes(q))&&(!cat||p.category===cat)).sort((a,b)=>a.stock-b.stock);
  $("#productSummary").innerHTML=`<span>${rows.length} mặt hàng</span><span>Tổng tồn ${rows.reduce((s,p)=>s+(+p.stock||0),0)}</span>`;
  $("#productList").innerHTML=rows.map(p=>`<div class="list-row"><div><strong>${esc(p.name)}</strong><small>${esc(p.category||"Khác")} · tồn ${p.stock} · bán ${money(p.salePrice)} · vốn ${money(p.costPrice)}</small></div><div><button class="ghost small" data-stock="${p.id}">Tồn</button> <button class="ghost small" data-edit-product="${p.id}">Sửa</button></div></div>`).join("");
  $$("[data-stock]").forEach(b=>b.onclick=()=>showStockSet(b.dataset.stock));$$("[data-edit-product]").forEach(b=>b.onclick=()=>showProductForm(b.dataset.editProduct));
}
$("#productSearch").oninput=renderCatalog;
$("#addProduct").onclick=()=>showProductForm("");
function showStockSet(id){const p=state.store.products.find(x=>x.id===id);modal(`<h3>Điều chỉnh tồn · ${esc(p.name)}</h3><label>Tồn mới<input id="mStock" type="number" value="${p.stock}"></label><button id="mSave" class="primary full">Lưu</button>`);$("#mSave").onclick=async()=>{try{await mutate("product.stock.set",{id,stock:$("#mStock").value});closeModal();toast("Đã cập nhật tồn")}catch(e){toast(e.message,true)}}}
function showProductForm(id){const p=id?state.store.products.find(x=>x.id===id):null;modal(`<h3>${p?"Sửa":"Thêm"} mặt hàng</h3><div class="form-grid"><label class="wide">Tên<input id="mName" value="${esc(p?.name||"")}"></label><label>Danh mục<input id="mCategory" value="${esc(p?.category||"Nước")}"></label><label>Đơn vị<input id="mUnit" value="${esc(p?.unit||"chai")}"></label><label>Quy cách/thùng<input id="mPack" type="number" value="${p?.packSize||24}"></label><label>Giá vốn<input id="mCost" inputmode="numeric" value="${p?.costPrice||0}"></label><label>Giá bán<input id="mSale" inputmode="numeric" value="${p?.salePrice||0}"></label><label>Tồn<input id="mStock" type="number" value="${p?.stock||0}"></label><label>Tồn tối thiểu<input id="mMin" type="number" value="${p?.minStock||0}"></label></div><button id="mSave" class="primary full">Lưu</button>`);$("#mSave").onclick=async()=>{const payload={id,name:$("#mName").value,category:$("#mCategory").value,unit:$("#mUnit").value,packSize:$("#mPack").value,costPrice:$("#mCost").value,salePrice:$("#mSale").value,stock:$("#mStock").value,minStock:$("#mMin").value};try{await mutate(id?"product.update":"product.create",payload);closeModal();toast("Đã lưu mặt hàng")}catch(e){toast(e.message,true)}}}

function showMoreHome(){$$(".more-section").forEach(x=>x.classList.add("hidden"));$(".more-grid").classList.remove("hidden")}
$$("[data-more-target]").forEach(b=>b.onclick=()=>{$(".more-grid").classList.add("hidden");$$(".more-section").forEach(x=>x.classList.toggle("hidden",x.dataset.moreSection!==b.dataset.moreTarget));renderMore()});
$$(".back-more").forEach(b=>b.onclick=showMoreHome);
function renderMore(){
  $("#ingredientList").innerHTML=(state.store.ingredients||[]).map(i=>`<div class="list-row"><div><strong>${esc(i.name)}</strong><small>${money(i.purchasePrice)} / ${i.packageQty} ${esc(i.unit)} · tồn ${i.stock}</small></div><button class="ghost small" data-edit-ing="${i.id}">Sửa</button></div>`).join("")||'<div class="empty">Chưa có nguyên liệu.</div>';
  $$("[data-edit-ing]").forEach(b=>b.onclick=()=>showIngredientForm(b.dataset.editIng));
  $("#activityList").innerHTML=[...(state.store.transactions||[])].reverse().slice(0,60).map(t=>`<div class="list-row"><div><strong>${esc(t.summary||t.type)}</strong><small>${fmtDate(t.createdAt)}</small></div></div>`).join("")||'<div class="empty">Chưa có nhật ký.</div>';
}
$("#addIngredient").onclick=()=>showIngredientForm("");
function showIngredientForm(id){const i=id?state.store.ingredients.find(x=>x.id===id):null;modal(`<h3>${i?"Sửa":"Thêm"} nguyên liệu</h3><div class="form-grid"><label class="wide">Tên<input id="mName" value="${esc(i?.name||"")}"></label><label>Đơn vị<input id="mUnit" value="${esc(i?.unit||"g")}"></label><label>Giá mua<input id="mPrice" value="${i?.purchasePrice||0}"></label><label>Quy cách<input id="mQty" value="${i?.packageQty||1}"></label><label>Tồn<input id="mStock" value="${i?.stock||0}"></label><label class="wide">Ghi chú<input id="mNote" value="${esc(i?.note||"")}"></label></div><button id="mSave" class="primary full">Lưu</button>`);$("#mSave").onclick=async()=>{try{await mutate(id?"ingredient.update":"ingredient.create",{id,name:$("#mName").value,unit:$("#mUnit").value,purchasePrice:$("#mPrice").value,packageQty:$("#mQty").value,stock:$("#mStock").value,note:$("#mNote").value});closeModal();toast("Đã lưu nguyên liệu")}catch(e){toast(e.message,true)}}}

$("#askAI").onclick=async()=>{const msg=$("#aiInput").value.trim();if(!msg)return;try{const r=await api("/api/ai/plan",{method:"POST",body:JSON.stringify({storeId:state.storeId,message:msg,context:{}})});if(r.type==="plan"){$("#aiResult").innerHTML=`<p>${esc(r.summary||"AI đã lập kế hoạch")}</p><button id="confirmAI" class="primary">Xác nhận</button>`;$("#confirmAI").onclick=async()=>{try{await mutate("ai.execute",{plan:r.plan,message:msg});toast("Đã thực hiện lệnh AI");$("#aiResult").textContent="Đã thực hiện."}catch(e){toast(e.message,true)}}}else $("#aiResult").textContent=r.answer||"Không có câu trả lời."}catch(e){toast(e.message,true)}};

$("#exportStore").onclick=()=>downloadJson(state.store,`cantin-store-${todayKey()}.json`);
$("#importStore").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const o=JSON.parse(await f.text());if(!confirm("Nhập file này sẽ thay dữ liệu cửa hàng hiện tại. Tiếp tục?"))return;await mutate("store.import",{store:o.store||o});toast("Đã nhập dữ liệu cửa hàng")}catch(err){toast(err.message,true)}e.target.value=""};
$("#newStore").onclick=()=>{modal('<h3>Tạo cửa hàng mới</h3><label>Tên cửa hàng<input id="mName"></label><button id="mSave" class="primary full">Tạo</button>');$("#mSave").onclick=async()=>{try{await mutate("store.create",{name:$("#mName").value});closeModal();toast("Đã tạo cửa hàng")}catch(e){toast(e.message,true)}}};

function renderAll(){if(!state.store)return;renderHeader();renderDashboard();renderSales();renderDebts();renderWarehouse();renderCatalog();renderMore()}
boot();

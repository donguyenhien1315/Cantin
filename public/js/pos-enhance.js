const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const vn=n=>`${Math.round(Number(n)||0).toLocaleString('vi-VN')} ₫`;
const n=v=>Number(v)||0;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let reportStore=null;

function inRange(value,range){
  if(range==='all')return true;
  const d=new Date(value); if(Number.isNaN(d.getTime()))return false;
  const now=new Date();
  if(range==='today')return d.toLocaleDateString()===now.toLocaleDateString();
  const days=Math.max(1,Number(range)||30),from=new Date();
  from.setHours(0,0,0,0); from.setDate(from.getDate()-(days-1));
  return d>=from;
}
function reportLabel(range){return range==='today'?'Hôm nay':range==='all'?'Toàn bộ dữ liệu':`${range} ngày gần nhất`}
function paymentOf(sale){
  const p=sale.payments||{};
  if(Object.keys(p).length)return {cash:n(p.cash),transfer:n(p.transfer),debt:n(p.debt)};
  return {cash:sale.paymentMethod==='cash'?n(sale.total):0,transfer:sale.paymentMethod==='transfer'?n(sale.total):0,debt:sale.paymentMethod==='debt'?n(sale.total):0};
}
function productCost(product){
  const pack=Math.max(1,n(product?.packSize||1)),cost=n(product?.costPrice),sale=n(product?.salePrice);
  return pack>1&&sale>0&&cost>sale&&cost/pack<sale?cost/pack:cost;
}
async function loadStore(){
  const r=await fetch('/api/bootstrap',{headers:{'Content-Type':'application/json'}});
  if(!r.ok)throw new Error('Không tải được dữ liệu báo cáo');
  const d=await r.json(); reportStore=d.store; return d.store;
}
function renderReports(){
  const s=reportStore;if(!s)return;
  const range=q('#reportRange')?.value||'30';
  const sales=(s.sales||[]).filter(x=>inRange(x.createdAt,range));
  const revenue=sales.reduce((a,x)=>a+n(x.total),0);
  const profit=sales.reduce((a,x)=>a+(x.profit!==undefined?n(x.profit):n(x.total)-n(x.costTotal)),0);
  const orders=sales.length,avg=orders?revenue/orders:0;
  q('#reportRevenue').textContent=vn(revenue);q('#reportProfit').textContent=vn(profit);q('#reportOrders').textContent=orders.toLocaleString('vi-VN');q('#reportAverageOrder').textContent=vn(avg);q('#reportRangeLabel').textContent=reportLabel(range);

  const productMap=new Map();
  for(const sale of sales)for(const line of (sale.items||[])){
    const key=line.productId||line.name||'unknown',cur=productMap.get(key)||{name:line.name||'Mặt hàng',qty:0,revenue:0};
    cur.qty+=n(line.quantity);cur.revenue+=n(line.subtotal!==undefined?line.subtotal:n(line.quantity)*n(line.unitPrice));productMap.set(key,cur);
  }
  const top=[...productMap.values()].sort((a,b)=>b.qty-a.qty||b.revenue-a.revenue).slice(0,8),max=Math.max(1,...top.map(x=>x.qty));
  q('#reportTopProducts').innerHTML=top.length?top.map(x=>`<div class="report-bar-row"><div class="report-bar-name"><strong>${esc(x.name)}</strong><small>${x.qty.toLocaleString('vi-VN')} sản phẩm</small></div><div class="report-bar-track"><div class="report-bar-fill" style="width:${Math.max(3,x.qty/max*100)}%"></div></div><div class="report-bar-value">${vn(x.revenue)}</div></div>`).join(''):'<div class="report-empty">Chưa có đơn hàng trong kỳ.</div>';

  const pm=sales.reduce((a,x)=>{const p=paymentOf(x);a.cash+=p.cash;a.transfer+=p.transfer;a.debt+=p.debt;return a},{cash:0,transfer:0,debt:0}),pmTotal=Math.max(1,pm.cash+pm.transfer+pm.debt);
  const paymentRows=[['Tiền mặt',pm.cash],['Chuyển khoản',pm.transfer],['Ghi nợ',pm.debt]];
  q('#reportPayments').innerHTML=paymentRows.map(([name,value])=>`<div class="payment-row-pos"><span>${name}</span><div class="track"><div class="fill" style="width:${value/pmTotal*100}%"></div></div><strong>${vn(value)}</strong></div>`).join('');

  const low=(s.products||[]).filter(p=>p.active!==false&&p.trackStock!==false&&n(p.stock)<=n(p.minStock)).sort((a,b)=>n(a.stock)-n(b.stock));
  q('#reportStock').innerHTML=low.length?low.slice(0,10).map(p=>`<div class="list-row"><div><strong>${esc(p.name)}</strong><small>Tồn ${n(p.stock)} ${esc(p.unit||'')} · mức tối thiểu ${n(p.minStock)}</small></div><strong class="${n(p.stock)<=0?'negative':''}">${n(p.stock)<=0?'Hết hàng':'Sắp hết'}</strong></div>`).join(''):'<div class="report-empty">Không có mặt hàng dưới mức tồn tối thiểu.</div>';

  const customerDebt=(s.debts||[]).reduce((a,d)=>a+n(d.balance),0),supplierDebt=(s.supplierDebts||[]).reduce((a,d)=>a+n(d.balance),0),stockValue=(s.products||[]).filter(p=>p.active!==false).reduce((a,p)=>a+n(p.stock)*productCost(p),0);
  q('#reportDebt').innerHTML=`<div class="report-debt-card"><span>Khách đang nợ</span><strong>${vn(customerDebt)}</strong></div><div class="report-debt-card"><span>Nợ nhà cung cấp</span><strong>${vn(supplierDebt)}</strong></div><div class="report-debt-card"><span>Giá trị vốn tồn kho</span><strong>${vn(stockValue)}</strong></div><div class="report-debt-card"><span>Biên lợi nhuận kỳ chọn</span><strong>${revenue?Math.round(profit/revenue*1000)/10:0}%</strong></div>`;
}
async function refreshReports(){
  try{await loadStore();renderReports()}catch(e){const box=q('#reportTopProducts');if(box)box.innerHTML=`<div class="report-empty">${esc(e.message)}</div>`}
}

// Preserve the user's current module after refresh.
const PAGE_KEY='cantin-pos:last-page';
qa('.nav').forEach(btn=>btn.addEventListener('click',()=>{localStorage.setItem(PAGE_KEY,btn.dataset.target||'dashboard');if(btn.dataset.target==='reports')refreshReports()}));
setTimeout(()=>{const saved=localStorage.getItem(PAGE_KEY);const btn=saved&&q(`.nav[data-target="${CSS.escape(saved)}"]`);if(btn)btn.click()},80);

q('#reportRange')?.addEventListener('change',renderReports);
q('#syncBtn')?.addEventListener('click',()=>{const el=q('#posSyncState');if(el)el.textContent='Đang đồng bộ…';setTimeout(()=>{if(el)el.textContent='Đồng bộ trực tuyến';refreshReports()},900)});

// Fast POS shortcuts: F2 opens sales, Ctrl/Cmd+K focuses product search.
document.addEventListener('keydown',e=>{
  if(e.key==='F2'){e.preventDefault();q('.nav[data-target="sales"]')?.click();setTimeout(()=>q('#saleSearch')?.focus(),60)}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();q('.nav[data-target="sales"]')?.click();setTimeout(()=>q('#saleSearch')?.focus(),60)}
});

document.addEventListener('visibilitychange',()=>{if(!document.hidden&&q('.page[data-page="reports"]')?.classList.contains('active'))refreshReports()});
refreshReports();

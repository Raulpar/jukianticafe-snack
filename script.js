'use strict';
const DEFAULT_PRODUCTS = [
  {id:'p1',name:'Empanadas',price:2},{id:'p2',name:'Pan de chocolate',price:2},
  {id:'p3',name:'Papas bolivar',price:2},{id:'p4',name:'Chicle',price:1},
  {id:'p5',name:'Gomitas',price:7},{id:'p6',name:'Chicharrón',price:2},
  {id:'p7',name:'Cereal',price:2},{id:'p8',name:'Snacks',price:15},
  {id:'p9',name:'Papas grandes',price:12},{id:'p10',name:'Pilfrut',price:2},
  {id:'p11',name:'Alfajor',price:3},{id:'p12',name:'Queque',price:3},
  {id:'p13',name:'Empanada chiquita',price:2},{id:'p14',name:'Chistosos',price:15}
];
const STORAGE_KEY = 'juki-anticafe-v2';
const $ = id => document.getElementById(id);
const money = amount => `${Number(amount).toLocaleString('es-BO',{minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits:2})} Bs`;
let products = DEFAULT_PRODUCTS.map(p=>({...p}));
let orders = [];
let nextProductId = 15;
let nextOrderId = 1;

function save(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({products,orders,nextProductId,nextOrderId})); }
  catch(error){ console.warn('No se pudo guardar en este navegador.', error); }
}
function load(){
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(data && Array.isArray(data.products) && Array.isArray(data.orders)){
      products=data.products; orders=data.orders;
      nextProductId=data.nextProductId || products.length+1;
      nextOrderId=data.nextOrderId || orders.length+1;
    }
  } catch(error){ console.warn('No se pudieron cargar los datos guardados.',error); }
}
function productById(id){return products.find(p=>p.id===id);}
function orderTotal(order){return order.items.reduce((sum,item)=>sum+item.price*item.qty,0);}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function renderProductSelect(){
  const select=$('productSelect'); const current=select.value;
  select.innerHTML='';
  products.forEach(p=>select.add(new Option(`${p.name} — ${money(p.price)}`,p.id)));
  if(products.some(p=>p.id===current))select.value=current;
}
function renderPrices(){
  const root=$('prices');root.innerHTML='';
  products.forEach(product=>{
    const name=document.createElement('span');name.className='price-name';name.textContent=product.name;
    const actions=document.createElement('div');actions.className='catalog-actions';
    const price=document.createElement('strong');price.textContent=money(product.price);
    const edit=document.createElement('button');edit.type='button';edit.className='catalog-btn';edit.textContent='Editar';edit.title=`Editar precio de ${product.name}`;
    edit.addEventListener('click',()=>editPrice(product.id));
    actions.append(price,edit);root.append(name,actions);
  });
}
function editPrice(id){
  const product=productById(id);if(!product)return;
  const answer=prompt(`Nuevo precio por unidad para ${product.name} (Bs):`,String(product.price));
  if(answer===null)return;
  const price=Number(answer.replace(',','.'));
  if(!Number.isFinite(price)||price<=0||price>100000){alert('Escribe un precio válido mayor que 0 Bs.');return;}
  product.price=Math.round(price*100)/100;
  // Los pedidos ya registrados conservan el precio que tenían al venderse.
  save();renderProductSelect();renderPrices();render();
}
function render(){
  const root=$('orders');root.innerHTML='';
  if(!orders.length)root.innerHTML='<div class="empty"><div class="emoji">🧾</div>Todavía no hay pedidos.<br>¡Agrega el primer cliente arriba!</div>';
  orders.forEach(order=>{
    const card=document.createElement('article');card.className='customer';
    const top=document.createElement('div');top.className='customer-top';
    const name=document.createElement('div');name.className='customer-name';name.textContent='👤 '+order.name;
    const sum=document.createElement('div');sum.className='customer-total';sum.textContent=money(orderTotal(order));top.append(name,sum);card.append(top);
    order.items.forEach((item,index)=>{
      const line=document.createElement('div');line.className='itemline';
      const left=document.createElement('div');left.className='item-name';left.textContent=item.name;
      const detail=document.createElement('small');detail.textContent=` · ${money(item.price)} c/u`;left.append(detail);
      const actions=document.createElement('div');actions.className='item-actions';
      const minus=document.createElement('button');minus.className='mini';minus.textContent='−';minus.title='Restar una unidad';minus.setAttribute('aria-label','Restar una unidad');
      minus.onclick=()=>{item.qty--;if(item.qty<=0)order.items.splice(index,1);if(!order.items.length)orders=orders.filter(o=>o.id!==order.id);save();render();};
      const quantity=document.createElement('strong');quantity.textContent=item.qty;
      const plus=document.createElement('button');plus.className='mini';plus.textContent='+';plus.title='Agregar una unidad';plus.setAttribute('aria-label','Agregar una unidad');
      plus.onclick=()=>{if(item.qty<999)item.qty++;save();render();};
      const subtotal=document.createElement('strong');subtotal.textContent=money(item.price*item.qty);
      const del=document.createElement('button');del.className='removeitem';del.textContent='×';del.title='Quitar producto';del.setAttribute('aria-label','Quitar producto');
      del.onclick=()=>{order.items.splice(index,1);if(!order.items.length)orders=orders.filter(o=>o.id!==order.id);save();render();};
      actions.append(minus,quantity,plus,subtotal,del);line.append(left,actions);card.append(line);
    });
    const bottom=document.createElement('div');bottom.className='customer-bottom';
    const units=order.items.reduce((sum,item)=>sum+item.qty,0);const count=document.createElement('small');count.className='muted';count.textContent=`${units} unidad${units===1?'':'es'}`;
    const remove=document.createElement('button');remove.className='textbtn';remove.textContent='Eliminar cliente';remove.onclick=()=>{if(confirm(`¿Eliminar el pedido de ${order.name}?`)){orders=orders.filter(o=>o.id!==order.id);save();render();}};
    bottom.append(count,remove);card.append(bottom);root.append(card);
  });
  const total=orders.reduce((sum,order)=>sum+orderTotal(order),0);
  const units=orders.reduce((sum,order)=>sum+order.items.reduce((n,item)=>n+item.qty,0),0);
  const unique=new Set(orders.flatMap(order=>order.items.map(item=>item.name))).size;
  $('grandTotal').textContent=money(total);$('clientCount').textContent=orders.length;
  $('unitCount').textContent=units;$('productCount').textContent=unique;
}
$('addForm').addEventListener('submit',event=>{
  event.preventDefault();const name=$('customerName').value.trim();const product=productById($('productSelect').value);
  const qty=Math.max(1,Math.min(999,Math.floor(Number($('qty').value)||1)));
  if(!name||!product){alert('Escribe el nombre del cliente y agrega al menos un producto al catálogo.');return;}
  let order=orders.find(o=>o.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'));
  if(!order){order={id:nextOrderId++,name,items:[]};orders.push(order);}
  // Guardar nombre y precio dentro de la línea para conservar el precio histórico de la venta.
  const item=order.items.find(it=>it.productId===product.id&&it.price===product.price);
  if(item)item.qty=Math.min(999,item.qty+qty);
  else order.items.push({productId:product.id,name:product.name,price:product.price,qty});
  $('customerName').value='';$('qty').value='1';save();render();$('customerName').focus();
});
$('productForm').addEventListener('submit',event=>{
  event.preventDefault();const name=$('newProductName').value.trim();const raw=$('newProductPrice').value;
  const price=Number(String(raw).replace(',','.'));
  if(!name){alert('Escribe el nombre del producto.');return;}
  if(!Number.isFinite(price)||price<=0||price>100000){alert('Escribe un precio válido mayor que 0 Bs.');return;}
  if(products.some(p=>p.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){alert('Ya existe un producto con ese nombre. Puedes editar su precio desde el catálogo.');return;}
  products.push({id:`p${nextProductId++}`,name,price:Math.round(price*100)/100});
  $('newProductName').value='';$('newProductPrice').value='';save();renderProductSelect();renderPrices();$('productSelect').value=products[products.length-1].id;$('newProductName').focus();
});
$('clearBtn').addEventListener('click',()=>{
  if(orders.length&&confirm('¿Seguro que quieres borrar todos los pedidos? Esta acción no se puede deshacer.')){orders=[];save();render();}
});
$('copyBtn').addEventListener('click',async()=>{
  const lines=['JUKI ANTICAFÉ — RESUMEN DE VENTAS',''];
  orders.forEach(order=>{lines.push(order.name);order.items.forEach(item=>lines.push(`  ${item.name} x${item.qty} = ${money(item.price*item.qty)}`));lines.push(`  Subtotal: ${money(orderTotal(order))}`,'');});
  lines.push(`TOTAL DE VENTAS: ${$('grandTotal').textContent}`);const text=lines.join('\n');
  try{await navigator.clipboard.writeText(text);$('copyBtn').textContent='✓ Resumen copiado';setTimeout(()=>$('copyBtn').textContent='Copiar resumen de ventas',1800);}
  catch(error){alert(text);}
});
load();renderProductSelect();renderPrices();render();

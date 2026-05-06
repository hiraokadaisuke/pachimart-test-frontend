import assert from "node:assert/strict";
import { ensurePurchaseAndPaymentOnInboundComplete, ensureSalesAndPaymentOnOutboundComplete } from "./auto-records";

const db: any = { purchaseRecords: [], salesRecords: [], paymentRecords: [], inventoryItems: [{id:"item1", purchaseUnitPrice:1000, plannedSaleUnitPrice:2000}] };
const tx: any = {
  purchaseRecord: { findFirst: async ({where}: any) => db.purchaseRecords.find((r: any)=>r.memo===where.memo), create: async ({data}: any)=>{ const row={id:`p${db.purchaseRecords.length+1}`,...data}; db.purchaseRecords.push(row); return row;} },
  salesRecord: { findFirst: async ({where}: any) => db.salesRecords.find((r: any)=>r.memo===where.memo), create: async ({data}: any)=>{ const row={id:`s${db.salesRecords.length+1}`,...data}; db.salesRecords.push(row); return row;} },
  paymentRecord: { findFirst: async ({where}: any)=> db.paymentRecords.find((p:any)=>p.sourceType===where.sourceType&&p.sourceId===where.sourceId), create: async ({data}:any)=>{db.paymentRecords.push(data); return data;} },
  inventoryItem: { findUnique: async ({where}:any)=> db.inventoryItems.find((i:any)=>i.id===where.id) },
};

(async () => {
  const now = new Date("2026-05-06T00:00:00Z");
  await ensurePurchaseAndPaymentOnInboundComplete(tx,{ownerUserId:"u1",schedule:{id:"in1",sourceType:"DEALING",sourceId:"10",note:null} as any,inventoryItemId:"item1",quantity:2,committedAt:now});
  assert.equal(db.purchaseRecords.length,1);
  await ensurePurchaseAndPaymentOnInboundComplete(tx,{ownerUserId:"u1",schedule:{id:"in1",sourceType:"DEALING",sourceId:"10",note:null} as any,inventoryItemId:"item1",quantity:2,committedAt:now});
  assert.equal(db.purchaseRecords.length,1);

  await ensureSalesAndPaymentOnOutboundComplete(tx,{ownerUserId:"u1",schedule:{id:"out1",sourceType:"DEALING",sourceId:"10",note:null} as any,inventoryItemId:"item1",quantity:1,committedAt:now});
  assert.equal(db.salesRecords.length,1);
  await ensureSalesAndPaymentOnOutboundComplete(tx,{ownerUserId:"u1",schedule:{id:"out1",sourceType:"DEALING",sourceId:"10",note:null} as any,inventoryItemId:"item1",quantity:1,committedAt:now});
  assert.equal(db.salesRecords.length,1);

  assert.equal(db.paymentRecords.length,2);
  console.log("auto-record cases passed");
})();

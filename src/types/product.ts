export type ProductType = '本体' | '枠のみ' | 'セルのみ' | 'その他タイプ';

export interface Product {
  id: number;
  updatedAt: string;
  status: '出品中' | '成約済' | '下書き';
  prefecture: string;
  maker: string;
  name: string;
  type: ProductType;
  quantity: number;
  price: number;
  removalDate: string;
  replyTime: string;
  sellerName: string;
  note?: string;
  shippingUnit: 1 | 2;
  handlingUnit: 1 | 2;
  allowSplitSale: boolean;
  hasNailSheet: boolean;
  hasManual: boolean;
  allowPickup: boolean;
  removalStatus: '撤去済' | '未撤去';
  shippingSpecifyDate: string;
  warehouseName: string;
  ownerUserId: string;
}

"use client";

import MainContainer from "@/components/layout/MainContainer";
import { TradeRequestEditor } from "@/components/trade-navi/TradeRequestEditor";

export default function TransactionNaviEditPage() {
  return (
    <MainContainer variant="wide">
      <TradeRequestEditor />
    </MainContainer>
  );
}

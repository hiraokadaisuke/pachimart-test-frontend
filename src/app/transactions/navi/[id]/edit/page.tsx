"use client";

import MainContainer from "@/components/layout/MainContainer";
import { NaviRequestEditor } from "@/components/navi/NaviRequestEditor";

export default function TransactionNaviEditPage() {
  return (
    <MainContainer variant="wide">
      <NaviRequestEditor />
    </MainContainer>
  );
}

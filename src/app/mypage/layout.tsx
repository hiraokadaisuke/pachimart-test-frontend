import { ReactNode } from "react";

import { MypageLayoutClient } from "./MypageLayoutClient";

export default function MypageLayout({ children }: { children: ReactNode }) {
  return <MypageLayoutClient>{children}</MypageLayoutClient>;
}

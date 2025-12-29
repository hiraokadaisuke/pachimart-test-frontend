import { ListingType } from "@prisma/client";
import { redirect } from "next/navigation";

import { ExhibitSubTabs } from "@/components/exhibits/ExhibitSubTabs";
import { SellForm } from "@/components/exhibits/SellForm";
import { prisma } from "@/lib/server/prisma";

const TYPE_MAP: Record<string, ListingType | undefined> = {
  pachinko: ListingType.PACHINKO,
  slot: ListingType.SLOT,
};

export default async function NewExhibitTypePage({ params }: { params: { type?: string } }) {
  const listingType = params?.type ? TYPE_MAP[params.type.toLowerCase()] : undefined;

  if (!listingType) {
    redirect("/mypage/exhibits/new");
  }

  const [makers, machineModels] = await Promise.all([
    prisma.maker.findMany({
      where: { machineModels: { some: { type: listingType } } },
      orderBy: { name: "asc" },
    }),
    prisma.machineModel.findMany({
      where: { type: listingType },
      orderBy: { name: "asc" },
    }),
  ]);

  const makerOptions = makers.map((maker) => ({ id: maker.id, name: maker.name }));
  const machineModelOptions = machineModels.map((model) => ({
    id: model.id,
    makerId: model.makerId,
    name: model.name,
  }));

  return (
    <div className="space-y-6">
      <ExhibitSubTabs activeTab="new" />
      <SellForm
        listingType={listingType}
        makers={makerOptions}
        machineModels={machineModelOptions}
      />
    </div>
  );
}

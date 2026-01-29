export type InventoryModelMaster = {
  id: string;
  maker: string;
  model: string;
  aliases?: string[];
  keywords?: string[];
  modelNumbers?: string[];
};

export const inventoryModelMasters: InventoryModelMaster[] = [
  {
    id: "master-sanyo-01",
    maker: "SANYO",
    model: "P海物語 極JAPAN",
    aliases: ["海物語", "UMI"],
    keywords: ["JAPAN", "Kiwami"],
    modelNumbers: ["P1234", "SNY-77"],
  },
  {
    id: "master-sankyo-01",
    maker: "SANKYO",
    model: "Pフィーバーからくりサーカス",
    aliases: ["からくり", "KARAKURI"],
    keywords: ["Fever", "Circus"],
    modelNumbers: ["P6789", "SKY-21"],
  },
  {
    id: "master-sammy-01",
    maker: "Sammy",
    model: "北斗の拳9",
    aliases: ["北斗", "HOKUTO"],
    keywords: ["拳", "9"],
    modelNumbers: ["SAM-900", "HKT-09"],
  },
  {
    id: "master-universal-01",
    maker: "UNIVERSAL",
    model: "沖ドキ!DUO",
    aliases: ["沖ドキ", "OKIDOKI"],
    keywords: ["DUO"],
    modelNumbers: ["UNI-552", "OD-2"],
  },
  {
    id: "master-heiwa-01",
    maker: "HEIWA",
    model: "戦国乙女4",
    aliases: ["戦国乙女", "OTOME"],
    keywords: ["SENGOKU"],
    modelNumbers: ["HW-404", "OT-04"],
  },
  {
    id: "master-olympia-01",
    maker: "OLYMPIA",
    model: "ルパン三世 消されたルパン",
    aliases: ["ルパン", "LUPIN"],
    keywords: ["LUPIN", "3"],
    modelNumbers: ["OLY-303", "LP-3"],
  },
];

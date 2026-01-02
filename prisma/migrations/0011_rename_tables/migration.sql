-- Rename tables to match Exhibit/Dealing/Navi naming
ALTER TABLE "Listing" RENAME TO "Exhibit";
ALTER TABLE "Trade" RENAME TO "Dealing";
ALTER TABLE "TradeNavi" RENAME TO "Navi";

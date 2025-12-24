const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const listingId = process.env.SMOKE_LISTING_ID ?? "listing_dev_1";
const sellerUserId = process.env.SMOKE_SELLER_USER_ID ?? "dev_user_1";
const buyerUserId = process.env.SMOKE_BUYER_USER_ID ?? "dev_user_2";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? "30000");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const requestJson = async (path: string, options?: RequestInit) => {
  const url = new URL(path, baseUrl).toString();
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} - ${url}\n${text}`);
  }

  return response.json();
};

const waitForHealth = async () => {
  const start = Date.now();
  const healthUrl = "/api/health/db";
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(new URL(healthUrl, baseUrl));
      if (response.ok) {
        return;
      }
    } catch (error) {
      // ignore until timeout
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for ${healthUrl}`);
};

const run = async () => {
  console.log(`Smoke test base URL: ${baseUrl}`);
  await waitForHealth();

  console.log("GET /api/listings");
  await requestJson("/api/listings");

  console.log("GET /api/listings?sellerUserId=dev_user_1");
  await requestJson(`/api/listings?sellerUserId=${sellerUserId}`);

  console.log("GET /api/machine-storage-locations");
  const storageLocations = (await requestJson("/api/machine-storage-locations", {
    headers: {
      "x-dev-user-id": sellerUserId,
    },
  })) as Array<{ id: string; name: string }>;
  const storageLocationId = storageLocations[0]?.id;

  if (!storageLocationId) {
    throw new Error("No machine storage locations available for smoke test.");
  }

  console.log("POST /api/listings");
  await requestJson("/api/listings", {
    method: "POST",
    headers: {
      "x-dev-user-id": sellerUserId,
    },
    body: JSON.stringify({
      kind: "P",
      maker: "スモークテストメーカー",
      machineName: "スモークテスト機種",
      quantity: 1,
      unitPriceExclTax: 1000,
      isNegotiable: false,
      storageLocationId,
      shippingFeeCount: 0,
      handlingFeeCount: 0,
      allowPartial: false,
      note: "smoke-test",
      removalStatus: "SCHEDULED",
      removalDate: "2099-12-31",
      hasNailSheet: false,
      hasManual: false,
      pickupAvailable: true,
      status: "DRAFT",
      isVisible: false,
    }),
  });

  console.log("POST /api/online-inquiries");
  await requestJson("/api/online-inquiries", {
    method: "POST",
    body: JSON.stringify({
      listingId,
      quantity: 1,
      buyerUserId,
      buyerMemo: "smoke-test",
      shippingAddress: "東京都千代田区丸の内1-1-1",
      contactPerson: "スモークテスト担当",
      desiredShipDate: "2099-12-31",
      desiredPaymentDate: "2099-12-31",
    }),
  });

  console.log("GET /api/trades");
  await requestJson("/api/trades");

  console.log("Smoke test completed successfully.");
};

run().catch((error) => {
  console.error("Smoke test failed.");
  console.error(error);
  process.exit(1);
});

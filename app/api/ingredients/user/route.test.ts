import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

const fakeUser = { id: "user-1" };
const fakeIngredient = { id: "ing-1", name: "Eggs", category: "dairy" };
const fakeIngredient2 = { id: "ing-2", name: "Milk", category: "dairy" };

const fakeOwnedRow = {
  id: "ui-1",
  quantity: null,
  expires_at: null,
  created_at: "2026-01-01T00:00:00Z",
  ingredient: fakeIngredient,
};

function buildChain(result: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);

  // Make await-able: returns { data, error }
  const resolved = { data: result, error };
  Object.defineProperty(chain, "then", {
    value: (resolve: (v: unknown) => unknown) => resolve(resolved),
    writable: true,
  });
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePost(body: unknown, token = "tok-1") {
  const req = new Request("http://localhost/api/ingredients/user", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return POST(req);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/ingredients/user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
  });

  it("rejects null / non-object / missing-id items with 400", async () => {
    for (const badInput of [
      [null],
      ["string"],
      [{ noId: true }],
      [{ id: "" }],
      [{ id: 123 }],
    ]) {
      // Reset auth mock for each iteration
      mockGetUser.mockResolvedValueOnce({ data: { user: fakeUser }, error: null });

      const res = await makePost({ items: badInput });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/string id/i);
    }
  });

  it("legacy ids-only request does not overwrite existing quantity/expires_at", async () => {
    // First call: auth.getUser; then ingredients.select.in returns the ingredient
    // Then user_ingredients.upsert(...).select returns the existing row
    const authChain = buildChain({ user: fakeUser }, null);
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const ingredientsChain = buildChain([fakeIngredient], null);
    const upsertChain = buildChain([fakeOwnedRow], null);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return ingredientsChain;
      return upsertChain;
    });

    const res = await makePost({ ids: ["ing-1"] });
    expect(res.status).toBe(201);

    // The upsert call should NOT include quantity or expires_at
    const upsertCall = upsertChain.upsert as ReturnType<typeof vi.fn>;
    expect(upsertCall).toHaveBeenCalledTimes(1);
    const rows = upsertCall.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows.length).toBe(1);
    expect(rows[0]).not.toHaveProperty("quantity");
    expect(rows[0]).not.toHaveProperty("expires_at");
    expect(rows[0].ingredient_id).toBe("ing-1");
    expect(rows[0].user_id).toBe("user-1");
  });

  it("items with quantity and expires_at include them in the upsert", async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const extendedRow = {
      ...fakeOwnedRow,
      quantity: "3",
      expires_at: "2026-12-31",
    };

    const ingredientsChain = buildChain([fakeIngredient], null);
    const upsertChain = buildChain([extendedRow], null);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return ingredientsChain;
      return upsertChain;
    });

    const res = await makePost({
      items: [{ id: "ing-1", quantity: 3, expires_at: "2026-12-31" }],
    });
    expect(res.status).toBe(201);

    const upsertCall = upsertChain.upsert as ReturnType<typeof vi.fn>;
    const rows = upsertCall.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows.length).toBe(1);
    expect(rows[0].quantity).toBe("3");
    expect(rows[0].expires_at).toBe("2026-12-31");
  });

  it("mixed batch splits into base-only and extended upserts", async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const baseRow = { ...fakeOwnedRow, id: "ui-1" };
    const extRow = { ...fakeOwnedRow, id: "ui-2", quantity: "5", expires_at: "2027-06-01" };

    const ingredientsChain = buildChain([fakeIngredient, fakeIngredient2], null);
    const baseUpsertChain = buildChain([baseRow], null);
    const extUpsertChain = buildChain([extRow], null);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return ingredientsChain;
      if (callCount === 2) return baseUpsertChain;
      return extUpsertChain;
    });

    const res = await makePost({
      items: [
        { id: "ing-1" },
        { id: "ing-2", quantity: 5, expires_at: "2027-06-01" },
      ],
    });
    expect(res.status).toBe(201);

    // Two separate upsert calls
    expect(baseUpsertChain.upsert).toHaveBeenCalledTimes(1);
    expect(extUpsertChain.upsert).toHaveBeenCalledTimes(1);

    // First upsert: base-only rows (no quantity/expires_at)
    const firstRows = baseUpsertChain.upsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(firstRows[0]).not.toHaveProperty("quantity");
    expect(firstRows[0]).not.toHaveProperty("expires_at");

    // Second upsert: extended rows (with quantity/expires_at)
    const secondRows = extUpsertChain.upsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(secondRows[0].quantity).toBe("5");
    expect(secondRows[0].expires_at).toBe("2027-06-01");
  });
});

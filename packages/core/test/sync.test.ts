import { describe, expect, it } from "vitest";
import {
  backoffSeconds,
  batchOutbox,
  clampClientTime,
  keysetFilter,
  overlapCursor,
  remoteWins,
} from "../src";

describe("sukobi", () => {
  const base = { clientUpdatedAt: "2026-10-16T10:00:00.000Z", rev: 1 };

  it("nema lokalnog zapisa: pobjeđuje udaljeni", () => {
    expect(remoteWins(null, base)).toBe(true);
  });

  it("novija izmjena na uređaju pobjeđuje bez obzira na redoslijed stizanja", () => {
    const local = { clientUpdatedAt: "2026-10-16T10:05:00.000Z", rev: 2 };
    const olderRemote = { clientUpdatedAt: "2026-10-16T10:01:00.000Z", rev: 9 };
    expect(remoteWins(local, olderRemote)).toBe(false); // offline izmjena kasnije poslana ne pregazi novije
    expect(remoteWins(olderRemote, local)).toBe(true);
  });

  it("isto vrijeme: odlučuje veći rev, a jednako ostavlja lokalno", () => {
    expect(remoteWins({ ...base, rev: 1 }, { ...base, rev: 2 })).toBe(true);
    expect(remoteWins({ ...base, rev: 2 }, { ...base, rev: 1 })).toBe(false);
    expect(remoteWins({ ...base, rev: 2 }, { ...base, rev: 2 })).toBe(false);
  });

  it("vrijeme se uspoređuje kao trenutak, ne kao tekst", () => {
    const a = { clientUpdatedAt: "2026-10-16T10:00:00.000Z", rev: 0 };
    const b = { clientUpdatedAt: "2026-10-16T12:00:00+02:00", rev: 0 }; // isti trenutak
    expect(remoteWins(a, b)).toBe(false);
    expect(remoteWins(b, { clientUpdatedAt: "2026-10-16T10:00:01.000Z", rev: 0 })).toBe(true);
  });

  it("pogrešan sat u budućnosti se ograničava", () => {
    const now = Date.parse("2026-10-16T10:00:00.000Z");
    expect(clampClientTime("2099-01-01T00:00:00.000Z", now)).toBe("2026-10-16T10:05:00.000Z");
    expect(clampClientTime("2026-10-16T09:00:00.000Z", now)).toBe("2026-10-16T09:00:00.000Z");
    expect(clampClientTime("nije datum", now)).toBe("2026-10-16T10:00:00.000Z");
  });
});

describe("povlačenje", () => {
  it("preklop od 5 s i keyset filter", () => {
    const c = overlapCursor({ updatedAt: "2026-10-16T10:00:10.000Z", id: "abc" });
    expect(c?.updatedAt).toBe("2026-10-16T10:00:05.000Z");
    expect(overlapCursor({ updatedAt: "2026-10-16T10:00:10.123456+00:00", id: "abc" })?.updatedAt).toBe("2026-10-16T10:00:05.123Z");
    expect(overlapCursor(null)).toBeNull();
    expect(keysetFilter({ updatedAt: "2026-10-16T10:00:05.000Z", id: "11111111-1111-4111-8111-111111111111" })).toBe(
      "updated_at.gt.2026-10-16T10:00:05.000Z,and(updated_at.eq.2026-10-16T10:00:05.000Z,id.gt.11111111-1111-4111-8111-111111111111)",
    );
  });
});

describe("outbox", () => {
  const r = (seq: number, table: string, op: "upsert" | "delete") => ({ seq, table, op });

  it("grupira uzastopne iste tablice/operacije i čuva redoslijed (roditelji prije djece)", () => {
    const rows = [
      r(1, "categories", "upsert"),
      r(2, "categories", "upsert"),
      r(3, "transactions", "upsert"),
      r(4, "transactions", "upsert"),
      r(5, "transactions", "delete"),
      r(6, "transactions", "upsert"),
    ];
    const g = batchOutbox(rows);
    expect(g.map((x) => x.map((y) => y.seq))).toEqual([[1, 2], [3, 4], [5], [6]]);
  });

  it("poštuje najveću veličinu skupine", () => {
    const rows = Array.from({ length: 5 }, (_, i) => r(i + 1, "transactions", "upsert"));
    expect(batchOutbox(rows, 2).map((x) => x.length)).toEqual([2, 2, 1]);
    expect(batchOutbox([], 2)).toEqual([]);
  });

  it("čekanje raste eksponencijalno do 15 minuta", () => {
    expect([0, 1, 2, 3].map(backoffSeconds)).toEqual([1, 2, 4, 8]);
    expect(backoffSeconds(30)).toBe(900);
  });
});

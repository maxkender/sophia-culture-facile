import { describe, expect, it } from "vitest";
import { classifyLink } from "./notion-sync.server";

describe("Notion link classifier", () => {
  const video = [
    "https://www.tiktok.com/@max/video/7412345678901234567",
    "https://www.tiktok.com/@max/video/7412345678901234567?is_from_webapp=1&lang=fr",
    "https://www.tiktok.com/t/ZTAbCdEf/",
    "https://vm.tiktok.com/ZMabc123/",
    "https://vt.tiktok.com/ZSxyz/",
    "https://www.instagram.com/reel/C9xYz12AbC/",
    "https://www.instagram.com/reels/C9xYz12AbC",
    "https://instagram.com/p/C9xYz12AbC/?igsh=abc",
  ];
  it.each(video)("video: %s", (u) => expect(classifyLink(u).kind).toBe("video"));
  it("dedupes reel/reels/p to one key", () => {
    const keys = ["https://www.instagram.com/reel/AbC/", "https://www.instagram.com/reels/AbC", "https://instagram.com/p/AbC/?x=1"].map((u) => (classifyLink(u) as { key: string }).key);
    expect(new Set(keys).size).toBe(1);
  });
  const profiles = ["https://www.tiktok.com/@max", "https://www.tiktok.com/@max/", "https://www.tiktok.com/@max?lang=fr", "https://www.instagram.com/someone", "https://www.instagram.com/someone/reels/", "https://instagram.com/someone/?hl=fr"];
  it.each(profiles)("profile: %s", (u) => expect(classifyLink(u).kind).toBe("profile"));
  it.each(["", "pas un lien", "https://youtube.com/shorts/abc", "https://www.instagram.com/explore/"])("other: %s", (u) => expect(classifyLink(u).kind).toBe("other"));
});

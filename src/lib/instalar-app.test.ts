import { describe, expect, it } from "vitest";
import { aparelhoDe, deveMostrarBanner } from "./instalar-app";

const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

describe("aparelho", () => {
  it("reconhece Android, iPhone, iPad (que se diz Mac, mas tem toque) e computador", () => {
    expect(aparelhoDe(ANDROID)).toBe("android");
    expect(aparelhoDe(IPHONE)).toBe("iphone");
    expect(aparelhoDe(MAC, 5)).toBe("iphone");
    expect(aparelhoDe(MAC, 0)).toBe("computador");
    expect(aparelhoDe(WINDOWS)).toBe("computador");
  });
});

describe("banner de instalar o app", () => {
  const agora = new Date("2026-10-26T12:00:00Z");

  it("só no celular e fora do app já instalado", () => {
    expect(deveMostrarBanner({ aparelho: "android", comoApp: false, escolha: null, agora })).toBe(true);
    expect(deveMostrarBanner({ aparelho: "iphone", comoApp: false, escolha: null, agora })).toBe(true);
    expect(deveMostrarBanner({ aparelho: "computador", comoApp: false, escolha: null, agora })).toBe(false);
    expect(deveMostrarBanner({ aparelho: "android", comoApp: true, escolha: null, agora })).toBe(false);
  });

  it("instalado, nunca mais", () => {
    expect(deveMostrarBanner({ aparelho: "android", comoApp: false, escolha: "instalado", agora })).toBe(false);
  });

  it('"Agora não" esconde por 30 dias e depois volta', () => {
    const ate = new Date(agora.getTime() + 30 * 86_400_000).toISOString();
    expect(deveMostrarBanner({ aparelho: "iphone", comoApp: false, escolha: ate, agora: new Date(agora.getTime() + 29 * 86_400_000) })).toBe(false);
    expect(deveMostrarBanner({ aparelho: "iphone", comoApp: false, escolha: ate, agora: new Date(agora.getTime() + 30 * 86_400_000) })).toBe(true);
  });
});

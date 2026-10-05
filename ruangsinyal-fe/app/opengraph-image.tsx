import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 20% 22%, rgba(255,211,77,0.42) 0, rgba(255,211,77,0) 30%), radial-gradient(circle at 88% 24%, rgba(255,122,26,0.22) 0, rgba(255,122,26,0) 25%), linear-gradient(135deg, #fff8f0 0%, #fffaf6 52%, #ffe7d3 100%)",
          color: "#561546",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(125deg, rgba(255,255,255,0.42) 0%, rgba(255,122,26,0.08) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: -110,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(255,211,127,0.32)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: -90,
            width: 320,
            height: 320,
            borderRadius: 9999,
            background: "rgba(86,21,70,0.10)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 62px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              width: 700,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 24,
                fontWeight: 700,
                opacity: 0.94,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                24
              </div>
              Pijarivo
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 68,
                  lineHeight: 1.04,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                Top Up Gampang,
              </div>
              <div
                style={{
                  fontSize: 68,
                  lineHeight: 1.04,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                Untuk Semua
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.4,
                color: "#806172",
                width: 680,
              }}
            >
              Website isi pulsa, paket data, e-wallet, token listrik, game, dan PPOB dengan alur yang ringan dari awal sampai selesai.
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", width: 760 }}>
            {["Pulsa Telkomsel", "Paket Data", "Top Up DANA", "Token Listrik", "Top Up Game", "PPOB"].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderRadius: 9999,
                  fontSize: 22,
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(255,178,121,0.72)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 60,
            top: 92,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            width: 260,
          }}
        >
          {[
            { title: "Pulsa", value: "Semua operator" },
            { title: "E-Wallet", value: "DANA, OVO, GoPay" },
            { title: "Rumah Tangga", value: "Listrik, BPJS, PDAM" },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "18px 20px",
                borderRadius: 24,
                background: "rgba(255,255,255,0.80)",
                border: "1px solid rgba(255,224,204,0.92)",
                boxShadow: "0 18px 42px rgba(92,34,57,0.10)",
              }}
            >
              <div style={{ fontSize: 20, opacity: 0.75 }}>{card.title}</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

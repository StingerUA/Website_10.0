(() => {
  const TOPICS = {
    PLANETS: { label: "🟣 Gezegenler" },
    SATELLITES: { label: "🔵 Uydular" },
    TELESCOPES: { label: "🟢 Teleskoplar" },
    ROVERS: { label: "🟠 Mars araçları" },
    TURKISH_SATELLITES: { label: "🟡 Türk uyduları" }
  };
  const PRESENTATION_MODES = {
    "3D": { label: "3D · masalardaki dizüstü bilgisayarlar", description: "Her öğrencinin dizüstü bilgisayarında tam istasyon arayüzü." },
    "AR": { label: "AR · telefonlar ve ankrajlar", description: "İstasyon arayüzü, masa ankrajı üzerinden telefon kamerasının üstünde görüntülenir." }
  };
  const MODES = {
    SPRINT: { label: "⚡ Sprint", answer: { EASY: 12, NORMAL: 17, HARD: 22, EXPERT: 27 } },
    STANDARD: { label: "⚖️ Standart", answer: { EASY: 15, NORMAL: 24, HARD: 30, EXPERT: 36 } },
    LEARNING: { label: "🐢 Öğrenme", answer: { EASY: 20, NORMAL: 30, HARD: 38, EXPERT: 45 } }
  };
  const ECON = { start: 300, participation: 10, winner: 30, graduation: 350, small: 650, large: 950 };
  const MAX = { small: 7, large: 3, knowledge: 4 };
  const rank = room => [...(room?.players || [])].sort((a, b) => (b.small + b.large) - (a.small + a.large) || b.credits - a.credits || b.graduates - a.graduates);
  const freeSeats = player => (player?.seatCapacity || 0) - (player?.cadets || []).filter(cadet => cadet.status === "ACTIVE").length;
  window.AlbaSpace = { TOPICS, PRESENTATION_MODES, MODES, ECON, MAX, rank, freeSeats };
})();

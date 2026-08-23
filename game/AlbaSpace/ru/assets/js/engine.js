(() => {
  const TOPICS = {
    PLANETS: { label: "🟣 Планеты" },
    SATELLITES: { label: "🔵 Спутники" },
    TELESCOPES: { label: "🟢 Телескопы" },
    ROVERS: { label: "🟠 Марсоходы" },
    TURKISH_SATELLITES: { label: "🟡 Турецкие спутники" }
  };
  const PRESENTATION_MODES = {
    "3D": { label: "3D · ноутбуки на столе", description: "Полный интерфейс станции на ноутбуке каждого ребёнка." },
    "AR": { label: "AR · телефоны и якоря", description: "Интерфейс станции поверх камеры телефона с якорем на столе." }
  };
  const MODES = {
    SPRINT: { label: "⚡ Спринт", answer: { EASY: 12, NORMAL: 17, HARD: 22, EXPERT: 27 } },
    STANDARD: { label: "⚖️ Стандарт", answer: { EASY: 15, NORMAL: 24, HARD: 30, EXPERT: 36 } },
    LEARNING: { label: "🐢 Обучение", answer: { EASY: 20, NORMAL: 30, HARD: 38, EXPERT: 45 } }
  };
  const ECON = { start: 300, participation: 10, winner: 30, graduation: 350, small: 650, large: 950 };
  const MAX = { small: 7, large: 3, knowledge: 4 };
  const rank = room => [...(room?.players || [])].sort((a, b) => (b.small + b.large) - (a.small + a.large) || b.credits - a.credits || b.graduates - a.graduates);
  const freeSeats = player => (player?.seatCapacity || 0) - (player?.cadets || []).filter(cadet => cadet.status === "ACTIVE").length;
  window.AlbaSpace = { TOPICS, PRESENTATION_MODES, MODES, ECON, MAX, rank, freeSeats };
})();

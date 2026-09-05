(() => {
  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const COPY = {
    ru: {
      topics: { PLANETS:"🟣 Планеты", SATELLITES:"🔵 Спутники", TELESCOPES:"🟢 Телескопы", ROVERS:"🟠 Марсоходы", TURKISH_SATELLITES:"🟡 Турецкие спутники" },
      presentation: { "3D": ["3D · ноутбуки на столе", "Полный интерфейс станции на ноутбуке каждого ребёнка."], AR: ["AR · телефоны и якоря", "Интерфейс станции поверх камеры телефона с якорем на столе."] },
      modes: { SPRINT:"⚡ Спринт", STANDARD:"⚖️ Стандарт", LEARNING:"🐢 Обучение" }
    },
    tr: {
      topics: { PLANETS:"🟣 Gezegenler", SATELLITES:"🔵 Uydular", TELESCOPES:"🟢 Teleskoplar", ROVERS:"🟠 Mars araçları", TURKISH_SATELLITES:"🟡 Türk uyduları" },
      presentation: { "3D": ["3D · masadaki dizüstü bilgisayarlar", "Her çocuğun dizüstü bilgisayarında tam istasyon arayüzü."], AR: ["AR · telefonlar ve masa işaretçileri", "İstasyon arayüzü, masadaki işaretçi üzerinden telefon kamerasına yerleştirilir."] },
      modes: { SPRINT:"⚡ Sprint", STANDARD:"⚖️ Standart", LEARNING:"🐢 Öğrenme" }
    },
    en: {
      topics: { PLANETS:"🟣 Planets", SATELLITES:"🔵 Satellites", TELESCOPES:"🟢 Telescopes", ROVERS:"🟠 Mars rovers", TURKISH_SATELLITES:"🟡 Turkish satellites" },
      presentation: { "3D": ["3D · laptops on the tables", "Full station interface on each child's laptop."], AR: ["AR · phones and table anchors", "The station interface appears in the phone camera view using a table anchor."] },
      modes: { SPRINT:"⚡ Sprint", STANDARD:"⚖️ Standard", LEARNING:"🐢 Learning" }
    }
  };
  const c = COPY[LOCALE];
  const TOPICS = Object.fromEntries(Object.entries(c.topics).map(([key,label]) => [key,{label}]));
  const PRESENTATION_MODES = Object.fromEntries(Object.entries(c.presentation).map(([key,value]) => [key,{label:value[0],description:value[1]}]));
  const MODES = {
    SPRINT: { label:c.modes.SPRINT, answer:{EASY:12,NORMAL:17,HARD:22,EXPERT:27} },
    STANDARD: { label:c.modes.STANDARD, answer:{EASY:15,NORMAL:24,HARD:30,EXPERT:36} },
    LEARNING: { label:c.modes.LEARNING, answer:{EASY:20,NORMAL:30,HARD:38,EXPERT:45} }
  };
  const ECON = { start:300, participation:10, winner:30, graduation:350, small:650, large:950 };
  const MAX = { small:7, large:3, knowledge:4 };
  const rank = room => [...(room?.players || [])].sort((a,b) => (b.small+b.large)-(a.small+a.large) || b.credits-a.credits || b.graduates-a.graduates);
  const freeSeats = player => (player?.seatCapacity || 0) - (player?.cadets || []).filter(cadet => cadet.status === "ACTIVE").length;
  window.AlbaSpace = { LOCALE, TOPICS, PRESENTATION_MODES, MODES, ECON, MAX, rank, freeSeats };
})();

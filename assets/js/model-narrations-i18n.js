/*
 * Long-form Albamen narrations for regular (non-Atlas) model-viewer pages.
 * Languages currently represented by these pages: Turkish, English, Russian.
 *
 * IMPORTANT: the five MP3-synchronised demo pages are deliberately excluded:
 * gokturk-1, rasat, opportunity, sojourner, sputnik.
 */
(function () {
  'use strict';

  const EXCLUDED = new Set(['gokturk-1', 'rasat', 'opportunity', 'sojourner', 'sputnik']);

  const OBJECTS = {
    'gokturk-2': {
      kind: 'eo',
      title: { tr: 'GÖKTÜRK-2', en: 'GÖKTÜRK-2', ru: 'GÖKTÜRK-2' },
      facts: {
        tr: [
          'GÖKTÜRK-2, Türkiye’nin yer gözlem yeteneklerini geliştirmek için TÜBİTAK UZAY ve TUSAŞ iş birliğiyle geliştirildi. 18 Aralık 2012’de Çin’deki Jiuquan Uydu Fırlatma Merkezi’nden uzaya gönderildi ve yaklaşık 686 kilometre yükseklikteki Güneş eşzamanlı yörüngeye yerleşti. Yaklaşık 397 kilogramlık bu uydu, Türkiye’nin uzayda kendi mühendislik birikimini büyüttüğü önemli projelerden biri oldu. 🚀🇹🇷',
          'Uydunun görüntüleme sistemi yaklaşık 2,5 metre pankromatik ve 5 metre çok bantlı çözünürlük sağlayabilir. Bu görüntüler haritalama, tarım, ormanların izlenmesi, şehirleşme ve afetlerin değerlendirilmesi gibi alanlarda kullanılabilir. Bir uydu yüzlerce kilometre yukarıda binlerce kilometre hızla ilerlerken hedefini doğru zamanda görüntülemek zorundadır; bu yüzden kamera kadar yönelim kontrolü, uçuş bilgisayarı ve yer istasyonları da görevin kahramanlarıdır. 📷🌍'
        ],
        en: [
          'GÖKTÜRK-2 was developed through cooperation between TÜBİTAK UZAY and Turkish Aerospace to expand Türkiye’s Earth-observation capability. It was launched from China’s Jiuquan Satellite Launch Center on 18 December 2012 and entered a Sun-synchronous orbit roughly 686 kilometres above Earth. With a mass of about 397 kilograms, it became an important step in building Turkish experience in spacecraft design, testing and operation. 🚀🇹🇷',
          'Its imaging system can provide about 2.5-metre panchromatic and 5-metre multispectral imagery. Such data can support mapping, agriculture, forest monitoring, urban studies and disaster assessment. Taking a sharp picture from orbit is much harder than pressing a camera button: the satellite is moving at several kilometres per second and must point at the right place at the right moment while its computer, power system and ground stations work together. 📷🌍'
        ],
        ru: [
          'GÖKTÜRK-2 был создан при сотрудничестве TÜBİTAK UZAY и Turkish Aerospace, чтобы расширить возможности Турции по наблюдению Земли. Спутник запустили 18 декабря 2012 года с китайского космодрома Цзюцюань, после чего он вышел на солнечно-синхронную орбиту высотой около 686 километров. Аппарат массой примерно 397 килограммов стал важным этапом накопления турецкого опыта в проектировании, испытаниях и управлении космической техникой. 🚀🇹🇷',
          'Система съёмки GÖKTÜRK-2 обеспечивает примерно 2,5 метра разрешения в панхроматическом режиме и около 5 метров в многоспектральном. Такие данные полезны для картографии, сельского хозяйства, наблюдения за лесами, городами и последствиями стихийных бедствий. Получить чёткий снимок с орбиты непросто: спутник несётся со скоростью нескольких километров в секунду и должен точно навести камеру, сохранить данные и вовремя передать их на Землю. 📷🌍'
        ]
      }
    },

    'imece': {
      kind: 'eo',
      title: { tr: 'İMECE', en: 'İMECE', ru: 'İMECE' },
      facts: {
        tr: [
          'İMECE, Türkiye’de geliştirilen metre altı çözünürlüklü ilk yer gözlem uydusudur. 15 Nisan 2023’te SpaceX Transporter-7 göreviyle uzaya gönderildi ve yaklaşık 680 kilometre yükseklikte görev yapacak şekilde yörüngeye yerleşti. Yaklaşık 700 kilogramlık uyduda görüntüleme sisteminden uçuş bilgisayarına kadar birçok kritik teknoloji Türkiye’de geliştirildi. 🛰️🇹🇷',
          'İMECE’nin elektro-optik kamerası pankromatik görüntülerde yaklaşık 0,99 metre, çok bantlı görüntülerde yaklaşık 3,96 metre çözünürlüğe ulaşabilir. Görünür ışığın yanında yakın kızılötesi bantları da kullanmak, bitki örtüsü ve arazi hakkında insan gözünün tek başına fark edemeyeceği bilgiler sağlar. Bu nedenle uydu; haritalama, çevre gözlemi, tarım ve afet sonrası değerlendirmeler için değerli bir veri kaynağıdır. 🔬🌍'
        ],
        en: [
          'İMECE is Türkiye’s first domestically developed Earth-observation satellite with sub-metre imaging capability. It was launched on SpaceX’s Transporter-7 mission on 15 April 2023 and placed in an orbit of roughly 680 kilometres. The spacecraft has a mass of about 700 kilograms, and many of its critical technologies—from the imaging payload to onboard computers and control systems—were developed in Türkiye. 🛰️🇹🇷',
          'Its electro-optical camera can reach about 0.99-metre resolution in panchromatic imagery and about 3.96 metres in multispectral imagery. Near-infrared bands reveal information that ordinary human vision cannot see, such as useful clues about vegetation and land conditions. That makes İMECE useful for mapping, environmental observation, agriculture and assessing large areas after natural disasters. 🔬🌍'
        ],
        ru: [
          'İMECE — первый разработанный в Турции спутник наблюдения Земли с разрешением лучше одного метра. Его запустили 15 апреля 2023 года в миссии SpaceX Transporter-7 и вывели на орбиту высотой примерно 680 километров. Масса аппарата составляет около 700 килограммов, а многие ключевые технологии — от оптической системы до бортового компьютера и систем управления — были созданы в Турции. 🛰️🇹🇷',
          'Электрооптическая камера İMECE достигает примерно 0,99 метра разрешения в панхроматическом режиме и около 3,96 метра в многоспектральном. Ближний инфракрасный диапазон помогает получать сведения, недоступные обычному зрению, например о состоянии растительности и поверхности. Поэтому данные спутника полезны для картографии, сельского хозяйства, наблюдения за окружающей средой и оценки последствий стихийных бедствий. 🔬🌍'
        ]
      }
    },

    'lagari': {
      kind: 'eo',
      title: { tr: 'LAGARİ', en: 'LAGARI', ru: 'LAGARI' },
      facts: {
        tr: [
          'LAGARİ, STM tarafından geliştirilen yüksek çözünürlüklü mikro sınıf bir yer gözlem uydusu projesidir. Adını 17. yüzyılda roketle uçuş denemesi yaptığı anlatılan Lagari Hasan Çelebi’den alır. Proje; genel haritalama, orman ve bitki örtüsünün takibi, tarım alanlarının incelenmesi ve afet gözlemi gibi görevler için küçük ama yetenekli bir uydu platformu oluşturmayı hedefliyor. 🛰️',
          'STM’nin yayımladığı teknik tanımlarda LAGARİ için yüksek doğrulukta yönelim belirleme, üç eksenli kontrol, gövdeye yerleştirilmiş güneş panelleri, Li-Fe bataryalar ve S/X bant haberleşme gibi sistemler yer alıyor. Proje uzun süredir geliştirme sürecinde ve güvenilir kaynaklarda doğrulanmış bir yörüngeye yerleşme tarihi bulunmadığı için onu “halen geliştirilen bir uzay sistemi” olarak anlatmak en doğru bilimsel yaklaşımdır. 🔎'
        ],
        en: [
          'LAGARI is a high-resolution micro-class Earth-observation satellite project developed by STM. Its name honours Lagari Hasan Çelebi, a 17th-century Ottoman figure associated with an early rocket-flight story. The project is intended to support tasks such as general mapping, monitoring forests and vegetation, studying agricultural areas and observing natural disasters with a compact but capable satellite platform. 🛰️',
          'STM documentation describes systems such as precise attitude determination, three-axis control, body-mounted solar panels, lithium-iron batteries and S/X-band communications. The project has remained under development for a long period, and reliable current sources do not provide a confirmed orbital deployment date; scientifically, it is therefore better to describe LAGARI as a developing spacecraft project rather than pretend that an unverified launch has happened. 🔎'
        ],
        ru: [
          'LAGARI — проект микроспутника высокого разрешения для наблюдения Земли, разрабатываемый компанией STM. Аппарат назван в честь Лагари Хасана Челеби — османского изобретателя XVII века, с которым связывают рассказ о раннем ракетном полёте. Спутник задуман для картографии, наблюдения за лесами и растительностью, сельскохозяйственными территориями и последствиями стихийных бедствий. 🛰️',
          'В технических материалах STM упоминаются точная система ориентации, трёхосное управление, солнечные панели на корпусе, литий-железные аккумуляторы и связь в S- и X-диапазонах. Проект долго остаётся в стадии разработки, а надёжные актуальные источники не подтверждают его вывод на рабочую орбиту. Поэтому научно корректнее говорить о LAGARI как о развивающемся космическом проекте, а не придумывать несуществующий запуск. 🔎'
        ]
      }
    },

    'turksat-1a': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 1A', en: 'TÜRKSAT 1A', ru: 'TÜRKSAT 1A' },
      facts: {
        tr: [
          'TÜRKSAT 1A’nın hikâyesi uzay tarihinin çok önemli bir dersidir. Türkiye’nin ilk haberleşme uydusu olması planlanan araç, 24 Ocak 1994’te Fransız Guyanası’ndaki Kourou’dan Ariane 4 roketiyle fırlatıldı. Ancak roket sistemindeki arıza nedeniyle görev planlanan yörüngeye ulaşamadı ve uydu kaybedildi. 🚀',
          'Bu başarısızlık Türkiye’nin uydu çalışmalarını durdurmadı. Mühendisler verileri ve süreçleri değerlendirdi, program devam etti ve aynı yıl TÜRKSAT 1B başarıyla uzaya gönderildi. Bilimde başarısızlık “boşa giden emek” değildir; doğru incelendiğinde bir sonraki tasarımın daha güvenilir olmasını sağlayan çok değerli bir derstir. 🧠'
        ],
        en: [
          'The story of TÜRKSAT 1A is an important lesson in space history. Planned as Türkiye’s first communications satellite, it launched on an Ariane 4 rocket from Kourou in French Guiana on 24 January 1994. A launch-vehicle failure prevented the mission from reaching its intended orbit, and the satellite was lost. 🚀',
          'That failure did not end Türkiye’s satellite programme. Engineers studied what had happened, the work continued, and TÜRKSAT 1B was successfully launched later the same year. In science and engineering, a failed mission is not simply wasted effort: carefully examined data can make the next spacecraft, rocket and procedure safer and more reliable. 🧠'
        ],
        ru: [
          'История TÜRKSAT 1A — важный урок космической техники. Аппарат должен был стать первым турецким спутником связи и был запущен 24 января 1994 года на ракете Ariane 4 с космодрома Куру во Французской Гвиане. Из-за аварии ракеты миссия не смогла выйти на расчётную орбиту, и спутник был потерян. 🚀',
          'Но эта неудача не остановила программу. Инженеры изучили произошедшее, работы продолжились, и уже в том же году TÜRKSAT 1B был успешно отправлен в космос. В науке неудачный эксперимент — не бесполезный труд: если внимательно изучить данные, ошибки превращаются в знания, которые делают следующую систему надёжнее. 🧠'
        ]
      }
    },

    'turksat-1b': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 1B', en: 'TÜRKSAT 1B', ru: 'TÜRKSAT 1B' },
      facts: {
        tr: [
          'TÜRKSAT 1B, TÜRKSAT 1A’nın başarısız fırlatmasından sadece aylar sonra Türkiye’nin uzay haberleşmesinde yeni bir başlangıç oldu. 11 Ağustos 1994’te Ariane 4 ile fırlatıldı, yörünge testleri tamamlandı ve 10 Ekim 1994’te hizmete girdi. Böylece Türkiye kendi haberleşme uydusu üzerinden geniş alanlara sinyal taşıma yeteneği kazandı. 📡🇹🇷',
          'Uydu televizyon, telefon ve veri iletişimi için transponder adı verilen elektronik tekrar aktarıcılar kullanıyordu. Yer istasyonundan gelen zayıf radyo sinyalini alıyor, uygun frekansta güçlendiriyor ve Dünya’nın başka bir bölgesine geri gönderiyordu. Bu görünmez radyo köprüsü, birbirinden binlerce kilometre uzaktaki insanların aynı anda iletişim kurmasını sağlıyordu.'
        ],
        en: [
          'Only months after the failed TÜRKSAT 1A launch, TÜRKSAT 1B became a new beginning for Türkiye’s space communications. It launched on an Ariane 4 on 11 August 1994, completed orbital testing and entered service on 10 October 1994. Türkiye now had an operational communications satellite capable of carrying signals across very large regions. 📡🇹🇷',
          'The spacecraft used electronic repeaters called transponders for television, telephone and data links. A signal sent from a ground station could be received, amplified and retransmitted toward another part of Earth. That invisible radio bridge allowed people separated by thousands of kilometres to share information almost instantly.'
        ],
        ru: [
          'Всего через несколько месяцев после неудачного запуска TÜRKSAT 1A спутник TÜRKSAT 1B стал новым началом для турецкой космической связи. Его запустили 11 августа 1994 года на Ariane 4, после орбитальных испытаний он начал работу 10 октября 1994 года. Турция получила действующий спутник связи, способный передавать сигналы на огромные расстояния. 📡🇹🇷',
          'Для телевидения, телефонной связи и передачи данных аппарат использовал электронные ретрансляторы — транспондеры. Они принимали сигнал наземной станции, усиливали его и отправляли обратно в нужную область Земли. Такой невидимый радиомост позволял людям, находящимся за тысячи километров друг от друга, обмениваться информацией почти мгновенно.'
        ]
      }
    },

    'turksat-1c': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 1C', en: 'TÜRKSAT 1C', ru: 'TÜRKSAT 1C' },
      facts: {
        tr: [
          'TÜRKSAT 1C, Türkiye’nin haberleşme uydu kapasitesini büyüten sonraki önemli adımdı. 10 Temmuz 1996’da Fransız Guyanası’ndan Ariane 4 roketiyle fırlatıldı. İlk görev döneminde 31,3 derece doğu yörünge konumunda çalıştı; daha sonra uydu filosunun ihtiyaçlarına göre farklı konumlarda görev yaptı. 🛰️',
          'TÜRKSAT 1C döneminde uydu haberleşmesi televizyon yayınları, telefon ve veri aktarımının giderek daha önemli bir parçası hâline geliyordu. Bir haberleşme uydusunun başarılı olması için antenlerin doğru bölgeye yönelmesi, güneş panellerinin enerji üretmesi ve yer kontrol ekiplerinin yörüngeyi sürekli izlemesi gerekir. Uzayda “sabit” görünen bir uydu bile aslında dikkatle yönetilen dinamik bir sistemdir.'
        ],
        en: [
          'TÜRKSAT 1C was another major step in expanding Türkiye’s communications capacity in space. It was launched from French Guiana on an Ariane 4 rocket on 10 July 1996. During its early service it operated at 31.3 degrees east, and later its orbital position was adjusted as the satellite fleet’s needs changed. 🛰️',
          'By the TÜRKSAT 1C era, satellite links were becoming an increasingly important part of television broadcasting, telephone services and data transmission. A communications satellite must keep its antennas pointed toward the correct coverage area, generate electrical power and maintain its orbital position under continuous ground supervision. Even a satellite that appears “fixed” in the sky is an actively controlled machine.'
        ],
        ru: [
          'TÜRKSAT 1C стал ещё одним важным шагом в расширении турецкой космической связи. Спутник запустили 10 июля 1996 года из Французской Гвианы на ракете Ariane 4. В начале службы он работал в позиции 31,3° восточной долготы, а позднее его положение меняли в соответствии с задачами спутниковой группировки. 🛰️',
          'К этому времени спутниковая связь уже становилась важной частью телевещания, телефонных сетей и передачи данных. Чтобы такой аппарат работал, антенны должны точно смотреть на нужный регион, солнечные батареи — обеспечивать энергией, а наземные операторы — постоянно следить за орбитой. Даже спутник, который кажется неподвижным в небе, на самом деле является активно управляемой системой.'
        ]
      }
    },

    'turksat-2a': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 2A', en: 'TÜRKSAT 2A', ru: 'TÜRKSAT 2A' },
      facts: {
        tr: [
          'TÜRKSAT 2A, diğer adıyla Eurasiasat 1, Türkiye’nin 2000’li yıllara girerken uydu haberleşme kapasitesini genişleten bir projeydi. 10 Ocak 2001’i 11 Ocak’a bağlayan gece Kourou’dan Ariane 4 roketiyle fırlatıldı ve 42 derece doğu jeostasyoner yörünge konumunda hizmet verdi. 🌍📡',
          'Uydu, televizyon ve telekomünikasyon hizmetlerini Türkiye’nin ötesinde Avrupa ve çevre bölgelere ulaştırmaya yardımcı oldu. Jeostasyoner yörüngede bir uydu Dünya’nın dönüşüyle aynı açısal hızda hareket ettiği için yerdeki antenler onu gökyüzünün aynı noktasında görür. Bu, büyük çanak antenlerin sürekli hareket etmesine gerek kalmadan güvenilir bağlantı kurmasını sağlar.'
        ],
        en: [
          'TÜRKSAT 2A, also known as Eurasiasat 1, expanded Türkiye’s satellite communications capacity at the beginning of the 2000s. It was launched from Kourou on an Ariane 4 during the night of 10–11 January 2001 and served from the 42 degrees east geostationary orbital position. 🌍📡',
          'The satellite helped distribute television and telecommunications services across Türkiye and wider surrounding regions. In geostationary orbit, a spacecraft moves around Earth at the same angular rate that Earth rotates, so ground antennas see it in nearly the same place in the sky. That allows large dishes to maintain a stable link without constantly tracking a fast-moving target.'
        ],
        ru: [
          'TÜRKSAT 2A, также известный как Eurasiasat 1, расширил возможности турецкой спутниковой связи в начале 2000-х годов. Аппарат был запущен с Куру на ракете Ariane 4 в ночь с 10 на 11 января 2001 года и работал на геостационарной позиции 42° восточной долготы. 🌍📡',
          'Спутник помогал передавать телевидение и телекоммуникационные услуги не только в Турции, но и в более широком регионе. На геостационарной орбите аппарат обращается вокруг Земли с той же угловой скоростью, с какой вращается сама планета, поэтому наземная антенна видит его почти в одной точке неба и не должна постоянно следить за быстро движущейся целью.'
        ]
      }
    },

    'turksat-3a': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 3A', en: 'TÜRKSAT 3A', ru: 'TÜRKSAT 3A' },
      facts: {
        tr: [
          'TÜRKSAT 3A, 13 Haziran 2008’de Fransız Guyanası’ndan Ariane 5 roketiyle fırlatıldı ve 42 derece doğu jeostasyoner yörüngede göreve başladı. Yeni nesil kapsama ve kapasite özellikleriyle televizyon yayıncılığı ve haberleşme hizmetlerinin geliştirilmesine katkı sağladı. 📺🛰️',
          'Jeostasyoner uydular Dünya yüzeyinden yaklaşık 35.786 kilometre yükseklikte çalışır. Bu kadar uzaktan gönderilen sinyalin gidiş-dönüş yolculuğu bile çok büyük bir mühendislik hesabıdır. Anten kazancı, frekans, güç, atmosfer ve kapsama alanı birlikte planlanır; küçük bir tasarım kararı bile milyonlarca kullanıcının bağlantı kalitesini etkileyebilir.'
        ],
        en: [
          'TÜRKSAT 3A was launched from French Guiana on an Ariane 5 rocket on 13 June 2008 and began service from the 42 degrees east geostationary position. Its newer coverage and capacity helped strengthen television broadcasting and communications services across its service regions. 📺🛰️',
          'Geostationary satellites operate roughly 35,786 kilometres above Earth’s equator. Sending a signal across that distance and back is itself an engineering challenge: antenna gain, frequency, transmitter power, atmospheric effects and coverage geometry all have to be planned together. A small design decision in orbit can influence the quality of service received by huge numbers of users.'
        ],
        ru: [
          'TÜRKSAT 3A был запущен 13 июня 2008 года из Французской Гвианы на ракете Ariane 5 и начал работу на геостационарной позиции 42° восточной долготы. Более современные возможности покрытия и пропускной способности помогли расширить телевизионное вещание и телекоммуникационные услуги. 📺🛰️',
          'Геостационарные спутники работают примерно в 35 786 километрах над экватором. Передача сигнала туда и обратно — серьёзная инженерная задача: нужно одновременно учитывать усиление антенн, частоту, мощность передатчика, влияние атмосферы и геометрию зоны покрытия. Небольшое решение в конструкции спутника может повлиять на качество связи у огромного числа пользователей.'
        ]
      }
    },

    'turksat-3b': {
      kind: 'verify',
      title: { tr: 'TÜRKSAT 3B', en: 'TÜRKSAT 3B', ru: 'TÜRKSAT 3B' },
      facts: {
        tr: [
          'Bu sayfanın başlığında “TÜRKSAT 3B” yazıyor. Fakat uzaydaşlar, bilim insanının ilk görevi etiketi hemen doğru kabul etmek değil, kaynağı kontrol etmektir. Türksat’ın resmi haberleşme uydu tarihçesinde TÜRKSAT 3A’dan sonra TÜRKSAT 4A ve TÜRKSAT 4B gelir; resmi filoda “TÜRKSAT 3B” adlı bir haberleşme uydusu bulunmaz. 🔎',
          'Bu yüzden burada hayali bir fırlatma tarihi, kütle veya görev uydurmayacağız. Belki model dosyası geçmişte yanlış adlandırıldı, belki başka bir tasarımın adıyla karıştı. Kesin cevabı kaynak olmadan söyleyemeyiz. Bilimsel düşüncenin gücü tam da budur: “Bilmiyorum” diyebilmek ve sonra güvenilir kanıt aramak. 🧠✨'
        ],
        en: [
          'This page is labelled “TÜRKSAT 3B”, but a scientist’s first job is not to trust every label—it is to check the source. Türksat’s official communications-satellite history moves from TÜRKSAT 3A to TÜRKSAT 4A and TÜRKSAT 4B; there is no official communications satellite called “TÜRKSAT 3B” in that fleet. 🔎',
          'So we will not invent a launch date, mass or mission for a spacecraft that cannot be verified. The model may have been named incorrectly in the past or confused with another design, but without evidence we cannot know. Scientific thinking includes the courage to say “I don’t know yet” and then search for reliable evidence. 🧠✨'
        ],
        ru: [
          'На странице указано название «TÜRKSAT 3B», но первая задача исследователя — не верить любой подписи, а проверить источник. В официальной истории спутников связи Türksat после TÜRKSAT 3A идут TÜRKSAT 4A и TÜRKSAT 4B; официального аппарата связи под названием «TÜRKSAT 3B» в этой серии нет. 🔎',
          'Поэтому мы не будем придумывать дату запуска, массу или миссию несуществующего спутника. Возможно, модель когда-то получила ошибочное название или была перепутана с другим проектом, но без источника мы этого не знаем. Научное мышление — это в том числе умение сказать «пока не знаю» и начать искать надёжные доказательства. 🧠✨'
        ]
      }
    },

    'turksat-4a': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 4A', en: 'TÜRKSAT 4A', ru: 'TÜRKSAT 4A' },
      facts: {
        tr: [
          'TÜRKSAT 4A, 14 Şubat 2014’te Kazakistan’daki Baykonur Uzay Üssü’nden Proton-M roketiyle fırlatıldı. Mitsubishi Electric tarafından DS2000 uydu platformu temelinde üretildi ve 42 derece doğu yörünge konumunda televizyon, radyo ve veri haberleşmesi hizmetlerine katıldı. 🛰️📺',
          'Bu uydu Ku ve Ka gibi farklı frekans bantlarıyla geniş bir kapsama alanına hizmet verebilir. Farklı frekanslar, farklı anten boyutları, veri hızları ve hava koşullarına karşı farklı davranışlar anlamına gelir. Haberleşme mühendisleri bu yüzden yalnızca “sinyali gönder” demez; hangi frekansın, ne kadar güçle, hangi bölgeye ve hangi antenle gönderileceğini ayrıntılı biçimde hesaplar.'
        ],
        en: [
          'TÜRKSAT 4A launched on a Proton-M rocket from the Baikonur Cosmodrome in Kazakhstan on 14 February 2014. Built by Mitsubishi Electric on the DS2000 satellite platform, it joined television, radio and data communications service from the 42 degrees east orbital position. 🛰️📺',
          'The spacecraft can use different frequency bands, including Ku-band services, to cover large regions. Different frequencies behave differently, require different antenna designs and offer different data capabilities. Communications engineers therefore calculate much more than “send a signal”: they plan frequency, power, coverage, antenna geometry and link reliability as one connected system.'
        ],
        ru: [
          'TÜRKSAT 4A был запущен 14 февраля 2014 года с космодрома Байконур в Казахстане на ракете Proton-M. Спутник, созданный Mitsubishi Electric на платформе DS2000, начал обеспечивать телевещание, радио и передачу данных с позиции 42° восточной долготы. 🛰️📺',
          'Аппарат использует разные радиодиапазоны для обслуживания больших территорий. Частоты отличаются требуемыми антеннами, возможной скоростью передачи и чувствительностью к погоде. Поэтому инженеры не просто «посылают сигнал», а рассчитывают частоту, мощность, форму зоны покрытия, геометрию антенн и надёжность всей линии связи как единой системы.'
        ]
      }
    },

    'turksat-5a': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 5A', en: 'TÜRKSAT 5A', ru: 'TÜRKSAT 5A' },
      facts: {
        tr: [
          'TÜRKSAT 5A, 8 Ocak 2021’de ABD’nin Florida eyaletindeki Cape Canaveral’dan SpaceX Falcon 9 roketiyle fırlatıldı. Yaklaşık 3,5 tonluk uydu elektrikli itki sistemlerini kullanarak uzun süren yörünge yükseltme yolculuğunun ardından 31 derece doğu jeostasyoner görev konumuna ulaştı. 🚀',
          'Elektrikli itki motorları kimyasal roket motorlarına göre çok daha küçük itme kuvveti üretir ama yakıtı son derece verimli kullanabilir. Bu yüzden uydu hedef yörüngesine daha yavaş ulaşsa da görev ömrü boyunca yörünge düzeltmeleri için değerli yakıt tasarrufu sağlayabilir. TÜRKSAT 5A, televizyon ve veri hizmetleri için Türkiye’nin jeostasyoner kapasitesini genişletti.'
        ],
        en: [
          'TÜRKSAT 5A was launched by a SpaceX Falcon 9 from Cape Canaveral, Florida, on 8 January 2021. The roughly 3.5-tonne satellite used electric propulsion during a long orbit-raising journey before reaching its operational geostationary position at 31 degrees east. 🚀',
          'Electric thrusters produce far less force than large chemical rocket engines, but they use propellant extremely efficiently. A satellite may therefore take longer to reach its final orbit while preserving valuable fuel for years of station-keeping. TÜRKSAT 5A expanded Türkiye’s geostationary capacity for television and data services.'
        ],
        ru: [
          'TÜRKSAT 5A был запущен 8 января 2021 года ракетой SpaceX Falcon 9 с мыса Канаверал во Флориде. Спутник массой около 3,5 тонны использовал электрореактивную двигательную установку и после длительного подъёма орбиты занял рабочую геостационарную позицию 31° восточной долготы. 🚀',
          'Электрические двигатели создают гораздо меньшую тягу, чем крупные химические ракетные моторы, зато очень экономно расходуют рабочее тело. Поэтому путь к рабочей орбите занимает больше времени, но остаётся больше ресурса для многолетней коррекции положения спутника. TÜRKSAT 5A расширил возможности Турции по телевещанию и передаче данных.'
        ]
      }
    },

    'turksat-5b': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 5B', en: 'TÜRKSAT 5B', ru: 'TÜRKSAT 5B' },
      facts: {
        tr: [
          'TÜRKSAT 5B, 19 Aralık 2021’de Cape Canaveral’dan Falcon 9 roketiyle uzaya gönderildi. 50 derece doğu jeostasyoner yörüngede yüksek kapasiteli uydu, yani HTS yaklaşımıyla özellikle veri ve geniş bant haberleşmesine yönelik büyük bir kapasite artışı sağlamak üzere tasarlandı. 📡',
          'HTS sistemlerinde tek dev kapsama alanı yerine daha küçük “spot beam” bölgeleri kullanılabilir. Aynı frekans kaynakları birbirinden yeterince uzak bölgelerde tekrar kullanılabildiği için toplam veri kapasitesi büyük ölçüde artar. Bu, uzaydaki bir uydunun yalnızca güçlü değil, aynı zamanda frekansları akıllıca planlayan bir iletişim ağı olduğunu gösterir.'
        ],
        en: [
          'TÜRKSAT 5B launched on a Falcon 9 from Cape Canaveral on 19 December 2021. Operating from 50 degrees east, it was designed as a high-throughput satellite, or HTS, to provide a major increase in data and broadband communications capacity. 📡',
          'HTS systems can divide coverage into smaller spot beams instead of relying only on one huge footprint. Frequencies can then be reused in separated areas, greatly increasing total capacity. This shows that a modern communications satellite is not merely a powerful radio in space—it is a carefully planned network that manages spectrum as efficiently as possible.'
        ],
        ru: [
          'TÜRKSAT 5B был запущен 19 декабря 2021 года с мыса Канаверал на ракете Falcon 9. Аппарат работает на позиции 50° восточной долготы и относится к спутникам высокой пропускной способности — HTS, созданным для значительного увеличения возможностей широкополосной передачи данных. 📡',
          'В системах HTS большая зона покрытия может быть разделена на множество более узких лучей. Одни и те же частоты можно повторно использовать в достаточно удалённых областях, поэтому общая пропускная способность резко возрастает. Современный спутник связи — это не просто мощный передатчик в космосе, а тщательно спроектированная сеть управления радиочастотным ресурсом.'
        ]
      }
    },

    'turksat-6a': {
      kind: 'comm',
      title: { tr: 'TÜRKSAT 6A', en: 'TÜRKSAT 6A', ru: 'TÜRKSAT 6A' },
      facts: {
        tr: [
          'TÜRKSAT 6A, Türkiye’nin yerli imkânlarla geliştirilen ilk haberleşme uydusudur. Projede TÜBİTAK UZAY, TUSAŞ, ASELSAN ve CTECH gibi kurumlar görev aldı. Uydu 8 Temmuz 2024’te Florida’dan Falcon 9 ile fırlatıldı, testlerini tamamladı ve 21 Nisan 2025’te 42 derece doğu görev konumunda resmen hizmete alındı. 🇹🇷🚀',
          'TÜRKSAT 6A yalnızca sinyal taşıyan bir araç değil, yıllar boyunca biriktirilen yerli uydu mühendisliği deneyiminin sonucu oldu. Güç, ısıl kontrol, telemetri, telekomut, yönelim, itki ve haberleşme faydalı yükü gibi sistemlerin uyumlu çalışması gerekir. Bir haberleşme uydusunu üretmek, yüzlerce parçadan oluşan dev bir orkestrayı uzayda yıllarca aynı ritimde çaldırmaya benzer. 🎼🛰️'
        ],
        en: [
          'TÜRKSAT 6A is Türkiye’s first communications satellite developed with extensive domestic engineering capability. TÜBİTAK UZAY, Turkish Aerospace, ASELSAN and CTECH were among the project partners. It launched on a Falcon 9 from Florida on 8 July 2024, completed orbital testing and was officially commissioned at 42 degrees east on 21 April 2025. 🇹🇷🚀',
          'TÜRKSAT 6A is more than a signal relay: it represents years of accumulated spacecraft-engineering experience. Power, thermal control, telemetry, telecommand, attitude control, propulsion and the communications payload all have to work together. Building such a satellite is like sending a huge orchestra of electronic and mechanical systems into space and asking every section to remain in tune for many years. 🎼🛰️'
        ],
        ru: [
          'TÜRKSAT 6A — первый турецкий спутник связи, разработанный с широким использованием национальных инженерных возможностей. В проекте участвовали TÜBİTAK UZAY, Turkish Aerospace, ASELSAN и CTECH. Аппарат запустили 8 июля 2024 года на Falcon 9 из Флориды, после орбитальных испытаний он был официально введён в эксплуатацию 21 апреля 2025 года на позиции 42° восточной долготы. 🇹🇷🚀',
          'TÜRKSAT 6A — это не просто ретранслятор, а результат многих лет накопления инженерного опыта. Энергоснабжение, тепловой режим, телеметрия, команды, ориентация, двигательная система и полезная нагрузка связи должны работать согласованно. Создать такой спутник — всё равно что отправить в космос огромный оркестр электронных и механических систем и заставить его годами играть без фальши. 🎼🛰️'
        ]
      }
    },

    'iss': {
      kind: 'station',
      title: { tr: 'Uluslararası Uzay İstasyonu', en: 'International Space Station', ru: 'Международная космическая станция' },
      facts: {
        tr: [
          'Uluslararası Uzay İstasyonu, yani ISS, Dünya’nın yaklaşık 400 kilometre üzerinde saatte yaklaşık 28.000 kilometre hızla dolaşan dev bir yörünge laboratuvarıdır. İlk modülleri 1998’de fırlatıldı; Amerika Birleşik Devletleri, Rusya, Avrupa ülkeleri, Japonya ve Kanada’nın uzun yıllara yayılan iş birliğiyle parça parça büyüdü. 🛰️🏠',
          'Astronotlar burada aylar boyunca yaşar, uyur, yemek yer ve mikro yerçekiminde deneyler yapar. İnsan vücudu, bitkiler, malzemeler, yanma ve sıvıların davranışı gibi konular incelenir. Türkiye’nin ilk astronotu Alper Gezeravcı da 19 Ocak 2024’te Axiom-3 göreviyle ISS’ye gitti ve istasyonda 13 bilimsel deney gerçekleştirdi. 🇹🇷👨‍🚀'
        ],
        en: [
          'The International Space Station, or ISS, is a giant orbiting laboratory travelling roughly 400 kilometres above Earth at about 28,000 kilometres per hour. Its first modules were launched in 1998, and it grew piece by piece through decades of cooperation involving the United States, Russia, European nations, Japan and Canada. 🛰️🏠',
          'Astronauts live there for months, sleeping, eating and performing experiments in microgravity. Research covers the human body, plants, materials, combustion and the strange behaviour of liquids without ordinary weight. Türkiye’s first astronaut, Alper Gezeravcı, also travelled to the ISS on the Axiom-3 mission launched on 19 January 2024 and carried out 13 scientific experiments. 🇹🇷👨‍🚀'
        ],
        ru: [
          'Международная космическая станция, или МКС, — огромная орбитальная лаборатория, летящая примерно в 400 километрах над Землёй со скоростью около 28 000 километров в час. Первые модули запустили в 1998 году, а затем станцию десятилетиями собирали по частям благодаря сотрудничеству США, России, европейских стран, Японии и Канады. 🛰️🏠',
          'Космонавты и астронавты живут там месяцами, спят, едят и проводят эксперименты в микрогравитации. Учёные исследуют организм человека, растения, материалы, горение и необычное поведение жидкостей. Первый турецкий астронавт Алпер Гезеравджы также отправился на МКС в миссии Axiom-3, стартовавшей 19 января 2024 года, и провёл 13 научных экспериментов. 🇹🇷👨‍🚀'
        ]
      }
    },

    'mercury': {
      kind: 'rocky',
      title: { tr: 'Merkür', en: 'Mercury', ru: 'Меркурий' },
      facts: {
        tr: [
          'Merkür, Güneş Sistemi’nin Güneş’e en yakın ve en küçük gezegenidir. Güneş çevresindeki bir turunu yalnızca yaklaşık 88 Dünya gününde tamamlar. Fakat kendi ekseni etrafında yavaş döndüğü için Merkür’de bir güneş gününün uzunluğu yaklaşık 176 Dünya günüdür. ☀️',
          'Neredeyse atmosferi olmadığı için ısıyı tutamaz: gündüz yüzeyi 400°C’nin üzerine çıkabilirken gece -170°C’nin altına düşebilir. Yüzeyi Ay gibi kraterlerle kaplıdır. Buna rağmen kutuplardaki sürekli gölgede kalan bazı kraterlerde su buzu bulunmuştur; Güneş’e en yakın gezegende buz olması uzay biliminin en güzel sürprizlerinden biridir. ❄️'
        ],
        en: [
          'Mercury is the closest planet to the Sun and the smallest planet in our Solar System. It completes one orbit in only about 88 Earth days. Yet it rotates slowly, so one solar day—from sunrise to the next sunrise—lasts about 176 Earth days. ☀️',
          'Because Mercury has almost no atmosphere to store and redistribute heat, daytime temperatures can rise above 400°C while nights can fall below -170°C. Its surface is heavily cratered like the Moon. Surprisingly, radar and spacecraft observations have found water ice in permanently shadowed polar craters—one of the great reminders that space can defeat our first guesses. ❄️'
        ],
        ru: [
          'Меркурий — ближайшая к Солнцу и самая маленькая планета Солнечной системы. Один оборот вокруг Солнца занимает у него всего около 88 земных суток. Но вращается Меркурий медленно, поэтому солнечные сутки — от одного восхода до следующего — длятся примерно 176 земных дней. ☀️',
          'У Меркурия почти нет атмосферы, способной удерживать и перераспределять тепло: днём поверхность может нагреваться выше 400°C, а ночью остывать ниже -170°C. Планета покрыта кратерами, как Луна. И всё же в постоянно затенённых полярных кратерах обнаружен водяной лёд — удивительный пример того, как космос умеет разрушать наши первые догадки. ❄️'
        ]
      }
    },

    'venus': {
      kind: 'rocky',
      title: { tr: 'Venüs', en: 'Venus', ru: 'Венера' },
      facts: {
        tr: [
          'Venüs, boyut olarak Dünya’ya benzese de yüzey koşulları tamamen farklıdır. Kalın atmosferinin yaklaşık yüzde 96’sı karbondioksittir ve güçlü sera etkisi yüzey sıcaklığını yaklaşık 465°C’ye kadar yükseltir. Bu yüzden Venüs, Güneş’e Merkür’den daha uzak olmasına rağmen Güneş Sistemi’nin en sıcak gezegenidir. 🔥',
          'Atmosfer basıncı Dünya deniz seviyesinin yaklaşık 90 katıdır ve bulutlarında sülfürik asit damlacıkları bulunur. Venüs ayrıca çoğu gezegenin ters yönünde çok yavaş döner; kendi ekseni etrafındaki bir dönüşü yaklaşık 243 Dünya günü sürer. Sovyet Venera sondaları bu zorlu yüzeye inmeyi başararak başka bir gezegenin yüzeyinden ilk görüntülerden bazılarını gönderdi. 📡'
        ],
        en: [
          'Venus is similar to Earth in size, yet its surface environment is radically different. About 96 percent of its thick atmosphere is carbon dioxide, creating an extreme greenhouse effect that keeps the surface near 465°C. That makes Venus the hottest planet in the Solar System even though Mercury is closer to the Sun. 🔥',
          'Surface pressure is roughly 90 times Earth’s sea-level pressure, and its clouds contain droplets of sulfuric acid. Venus also rotates very slowly and in the opposite direction to most planets, taking about 243 Earth days for one rotation. Soviet Venera probes survived long enough on this hostile surface to send some of humanity’s first images from another planet. 📡'
        ],
        ru: [
          'Венера похожа на Землю по размеру, но условия на её поверхности совершенно иные. Примерно 96% плотной атмосферы составляет углекислый газ, создающий мощнейший парниковый эффект: температура у поверхности держится около 465°C. Поэтому Венера — самая горячая планета Солнечной системы, хотя Меркурий расположен ближе к Солнцу. 🔥',
          'Давление на поверхности примерно в 90 раз выше земного на уровне моря, а облака содержат капельки серной кислоты. Венера вращается очень медленно и в направлении, противоположном большинству планет: один оборот занимает около 243 земных суток. Советские аппараты серии «Венера» сумели сесть в этом суровом мире и передали одни из первых фотографий поверхности другой планеты. 📡'
        ]
      }
    },

    'earth': {
      kind: 'rocky',
      title: { tr: 'Dünya', en: 'Earth', ru: 'Земля' },
      facts: {
        tr: [
          'Dünya, Güneş’ten yaklaşık 150 milyon kilometre uzakta bulunan üçüncü gezegendir ve bugün bildiğimiz kadarıyla yaşam barındırdığı kesin olarak bilinen tek dünyadır. Yüzeyinin yaklaşık yüzde 71’i sıvı suyla kaplıdır. Atmosferi, manyetik alanı ve uygun sıcaklık aralığı yaşamın korunmasında birlikte rol oynar. 🌍💧',
          'Dünya sabit bir taş küre değildir. Tektonik levhalar hareket eder, kıtalar değişir, volkanlar yeni kayalar üretir ve su sürekli okyanus, atmosfer ve kara arasında dolaşır. Ay da gelgitleri etkiler ve Dünya’nın dönme ekseninin uzun vadeli kararlılığına katkıda bulunur. Kendi gezegenimizi anlamak, başka dünyalarda yaşam ararken elimizdeki en önemli karşılaştırma noktasıdır. 🌙'
        ],
        en: [
          'Earth is the third planet from the Sun, about 150 million kilometres away, and so far it is the only world known with certainty to host life. Roughly 71 percent of its surface is covered by liquid water. Its atmosphere, magnetic field and suitable temperature range work together to help maintain an environment where life can survive. 🌍💧',
          'Earth is not a motionless ball of rock. Tectonic plates move, continents change, volcanoes create new crust and water continuously cycles between oceans, atmosphere and land. The Moon drives much of our tides and also contributes to the long-term stability of Earth’s axial tilt. Understanding our own planet gives scientists the essential reference point for studying every other potentially habitable world. 🌙'
        ],
        ru: [
          'Земля — третья планета от Солнца, расположенная примерно в 150 миллионах километров от него, и пока единственный мир, где существование жизни известно достоверно. Около 71% поверхности покрыто жидкой водой. Атмосфера, магнитное поле и подходящий диапазон температур вместе помогают сохранять условия, в которых может существовать жизнь. 🌍💧',
          'Земля — не неподвижный каменный шар. Тектонические плиты движутся, материки меняются, вулканы создают новую кору, а вода постоянно путешествует между океанами, атмосферой и сушей. Луна вызывает значительную часть приливов и помогает стабилизировать наклон земной оси. Изучение собственной планеты — главный ориентир для поисков пригодных для жизни миров. 🌙'
        ]
      }
    },

    'mars': {
      kind: 'rocky',
      title: { tr: 'Mars', en: 'Mars', ru: 'Марс' },
      facts: {
        tr: [
          'Mars, Güneş’ten dördüncü gezegendir ve yüzeyindeki demir minerallerinin oksitlenmesi nedeniyle kırmızı görünür. Bir Mars günü, yani bir sol, yaklaşık 24 saat 39 dakika sürer; bir Mars yılı ise 687 Dünya gününe yakındır. İnce atmosferinin büyük bölümü karbondioksitten oluşur ve yüzeydeki ortalama sıcaklık Dünya’dan çok daha düşüktür. 🔴',
          'Bugün Mars kuru görünse de vadiler, deltalar, mineraller ve yer altı buzları geçmişte sıvı suyun çok daha önemli bir rol oynadığını gösteriyor. Olympus Mons Güneş Sistemi’nin en büyük volkanlarından biridir, Valles Marineris ise binlerce kilometre uzanan dev bir kanyon sistemidir. Spirit, Curiosity ve Perseverance gibi robotlar bu geçmişi okuyarak “Mars bir zamanlar yaşama elverişli miydi?” sorusuna cevap arıyor. 💧🤖'
        ],
        en: [
          'Mars is the fourth planet from the Sun, and its reddish colour comes largely from iron minerals that have oxidised in its soil and rocks. A Martian day, called a sol, lasts about 24 hours 39 minutes, while a Martian year is about 687 Earth days. Its thin atmosphere is mostly carbon dioxide, and average surface conditions are far colder than on Earth. 🔴',
          'Mars looks dry today, but valleys, ancient deltas, water-altered minerals and underground ice show that liquid water played a much larger role in its past. Olympus Mons is one of the Solar System’s largest volcanoes, while Valles Marineris is a canyon system thousands of kilometres long. Rovers such as Spirit, Curiosity and Perseverance read this geological record to ask whether ancient Mars could once have supported life. 💧🤖'
        ],
        ru: [
          'Марс — четвёртая планета от Солнца. Красноватый цвет его поверхности связан главным образом с окисленными минералами железа в породах и пыли. Марсианские сутки, или сол, длятся примерно 24 часа 39 минут, а год — около 687 земных суток. Тонкая атмосфера почти полностью состоит из углекислого газа, а средние температуры значительно ниже земных. 🔴',
          'Сегодня Марс выглядит сухим, но долины, древние дельты, изменённые водой минералы и подземный лёд показывают, что в прошлом жидкая вода играла намного большую роль. Олимп — один из крупнейших вулканов Солнечной системы, а Долины Маринер — гигантская система каньонов длиной в тысячи километров. Марсоходы Spirit, Curiosity и Perseverance читают эту геологическую летопись, выясняя, мог ли древний Марс быть пригодным для жизни. 💧🤖'
        ]
      }
    },

    'jupiter': {
      kind: 'gas',
      title: { tr: 'Jüpiter', en: 'Jupiter', ru: 'Юпитер' },
      facts: {
        tr: [
          'Jüpiter, Güneş Sistemi’nin en büyük gezegenidir; kütlesi diğer tüm gezegenlerin toplamının büyük bir bölümüne yaklaşır. Yapısı çoğunlukla hidrojen ve helyumdan oluşur ve Dünya gibi üzerinde yürünecek katı bir yüzeyi yoktur. Kendi ekseni etrafında yaklaşık 10 saatte dönmesi, dev atmosferinde güçlü bantlar ve fırtınalar oluşturur. 🟠',
          'En ünlü fırtınası Büyük Kırmızı Leke, yüzyıllardır gözlenen dev bir atmosfer girdabıdır. Jüpiter’in çok güçlü manyetik alanı ve onlarca uydusu vardır. Io yoğun volkanizmasıyla, Europa ise buz kabuğunun altında bulunması beklenen küresel okyanusuyla bilim insanlarının özellikle ilgisini çeker. Bu nedenle Jüpiter sistemi, tek bir gezegenden çok küçük bir güneş sistemi gibi araştırılır. 🌌'
        ],
        en: [
          'Jupiter is the largest planet in the Solar System, containing a huge fraction of the mass found in all the planets combined. It is made mostly of hydrogen and helium and has no solid surface like Earth on which we could stand. Its rapid rotation—roughly once every ten hours—helps create powerful atmospheric bands and storms. 🟠',
          'Its most famous storm, the Great Red Spot, is a gigantic vortex observed for centuries. Jupiter also has an enormous magnetic field and dozens of moons. Io is intensely volcanic, while Europa is thought to hide a global ocean beneath its icy crust. For scientists, the Jupiter system is therefore almost like a miniature solar system with many different worlds to explore. 🌌'
        ],
        ru: [
          'Юпитер — крупнейшая планета Солнечной системы; на него приходится огромная доля массы всех планет вместе взятых. Он состоит главным образом из водорода и гелия и не имеет твёрдой поверхности, похожей на земную. Очень быстрое вращение — примерно один оборот за десять часов — помогает создавать мощные атмосферные полосы и штормы. 🟠',
          'Самый известный шторм — Большое Красное Пятно, гигантский вихрь, наблюдаемый уже несколько столетий. У Юпитера мощнейшее магнитное поле и множество спутников. Ио отличается активными вулканами, а под ледяной корой Европы, вероятно, скрывается глобальный океан. Поэтому систему Юпитера изучают почти как маленькую солнечную систему со множеством разных миров. 🌌'
        ]
      }
    },

    'saturn': {
      kind: 'gas',
      title: { tr: 'Satürn', en: 'Saturn', ru: 'Сатурн' },
      facts: {
        tr: [
          'Satürn, Güneş Sistemi’nin ikinci büyük gezegenidir ve en çok muhteşem halka sistemiyle tanınır. Halkalar tek parça değildir; sayısız buz ve kaya parçasından oluşur. Bazıları toz tanesi kadar küçük, bazıları ise ev büyüklüğünde olabilir. Halkaların genişliği yüz binlerce kilometreye yaklaşırken kalınlıkları çoğu yerde şaşırtıcı derecede küçüktür. 💍',
          'Satürn çoğunlukla hidrojen ve helyumdan oluşan bir gaz devidir. En ilginç uydularından Titan’ın kalın bir atmosferi, yüzeyinde sıvı metan ve etan gölleri vardır; Enceladus ise buz kabuğundaki çatlaklardan su buharı ve buz parçacıkları püskürtür. Cassini görevi bu dünyaları yıllarca inceleyerek Satürn sisteminin ne kadar karmaşık olduğunu gösterdi. 🛰️'
        ],
        en: [
          'Saturn is the Solar System’s second-largest planet and is famous for its spectacular rings. The rings are not solid sheets; they are made from countless pieces of ice and rock. Some are tiny grains, while others can be much larger. The ring system spreads across an enormous distance but is surprisingly thin in many places. 💍',
          'Saturn itself is a gas giant composed mostly of hydrogen and helium. Its moon Titan has a thick atmosphere and lakes of liquid methane and ethane, while Enceladus sprays water vapour and ice particles from fractures in its icy surface. The Cassini mission explored this system for years and revealed that the worlds around Saturn are every bit as fascinating as the planet itself. 🛰️'
        ],
        ru: [
          'Сатурн — вторая по величине планета Солнечной системы, знаменитая своей великолепной системой колец. Кольца не являются сплошными дисками: они состоят из бесчисленных частиц льда и камня — от пылинок до гораздо более крупных обломков. Система простирается на огромное расстояние, но во многих местах удивительно тонка. 💍',
          'Сам Сатурн — газовый гигант, состоящий в основном из водорода и гелия. У его спутника Титана есть плотная атмосфера и озёра жидкого метана и этана, а Энцелад выбрасывает из трещин в ледяной коре струи водяного пара и частиц льда. Миссия Cassini много лет изучала эту систему и показала, насколько разнообразны миры вокруг Сатурна. 🛰️'
        ]
      }
    },

    'uranus': {
      kind: 'ice',
      title: { tr: 'Uranüs', en: 'Uranus', ru: 'Уран' },
      facts: {
        tr: [
          'Uranüs, Güneş’ten yedinci gezegendir ve bir “buz devi” olarak sınıflandırılır. Atmosferinde hidrojen ve helyumun yanında metan bulunur; metan kırmızı ışığın bir kısmını soğurduğu için gezegen mavi-yeşil görünür. Uranüs’ün en tuhaf özelliği yaklaşık 98 derecelik eksen eğikliğidir: gezegen adeta yan yatmış şekilde döner. 🩵',
          'Bu aşırı eğiklik nedeniyle mevsimleri çok sıra dışıdır ve kutupları onlarca yıl boyunca Güneş’e dönük kalabilir. Uranüs’ün halkaları ve çok sayıda uydusu da vardır. Şimdiye kadar onu yakından ziyaret eden tek uzay aracı Voyager 2’dir; 1986’daki kısa geçişi, bugün sahip olduğumuz ayrıntılı bilgilerin büyük bölümünün temelini oluşturdu. 🚀'
        ],
        en: [
          'Uranus is the seventh planet from the Sun and is classified as an ice giant. Its atmosphere contains hydrogen, helium and methane; methane absorbs part of the red light, helping give the planet its blue-green appearance. Uranus’s strangest feature is its axial tilt of about 98 degrees—it rotates almost as if it were lying on its side. 🩵',
          'That extreme tilt produces unusual seasons, with a pole able to face the Sun for decades. Uranus also has rings and many moons. Voyager 2 is still the only spacecraft to have visited the planet up close; its brief 1986 flyby provided much of the detailed information scientists still use to understand this distant world. 🚀'
        ],
        ru: [
          'Уран — седьмая планета от Солнца и относится к ледяным гигантам. В атмосфере есть водород, гелий и метан; метан поглощает часть красного света, поэтому планета выглядит голубовато-зелёной. Самая необычная особенность Урана — наклон оси примерно на 98 градусов: он вращается почти «лёжа на боку». 🩵',
          'Из-за такого наклона сезоны чрезвычайно необычны, и один из полюсов может десятилетиями быть обращён к Солнцу. У Урана есть кольца и множество спутников. Единственный аппарат, посетивший планету вблизи, — Voyager 2: его короткий пролёт в 1986 году до сих пор остаётся основой значительной части наших подробных знаний об этом далёком мире. 🚀'
        ]
      }
    },

    'neptune': {
      kind: 'ice',
      title: { tr: 'Neptün', en: 'Neptune', ru: 'Нептун' },
      facts: {
        tr: [
          'Neptün, Güneş Sistemi’nin sekizinci ve Güneş’e en uzak büyük gezegenidir. Güneş çevresindeki bir turu yaklaşık 165 Dünya yılı sürer. Atmosferinde hidrojen, helyum ve metan bulunur; gezegenin mavi görünümünde metanla birlikte atmosferdeki diğer ışık saçılma süreçleri de rol oynar. 🔵',
          'Neptün, Güneş’ten çok az enerji almasına rağmen Güneş Sistemi’ndeki en hızlı rüzgârlardan bazılarına sahiptir; hızları saatte 2.000 kilometreyi aşabilir. Voyager 2, 1989’da Neptün’ün yanından geçerek gezegeni ve uydusu Triton’u yakından görüntüledi. Triton’un geriye doğru yörüngesi, onun geçmişte yakalanmış bir cisim olabileceğini düşündürüyor. 🌌'
        ],
        en: [
          'Neptune is the eighth major planet and the farthest one from the Sun. One orbit around the Sun takes about 165 Earth years. Its atmosphere contains hydrogen, helium and methane; methane contributes to its blue appearance together with other light-scattering processes in the atmosphere. 🔵',
          'Although Neptune receives very little sunlight, it has some of the fastest winds measured in the Solar System, exceeding 2,000 kilometres per hour. Voyager 2 flew past Neptune in 1989 and gave humanity its only close-up visit so far, also examining the large moon Triton. Triton’s retrograde orbit suggests that it may have been captured long ago. 🌌'
        ],
        ru: [
          'Нептун — восьмая крупная планета и самая далёкая от Солнца. Один оборот вокруг Солнца занимает около 165 земных лет. Атмосфера содержит водород, гелий и метан; метан вместе с другими процессами рассеяния света участвует в формировании характерного синего оттенка планеты. 🔵',
          'Хотя Нептун получает очень мало солнечной энергии, там наблюдаются одни из самых быстрых ветров в Солнечной системе — свыше 2000 километров в час. Voyager 2 пролетел рядом с планетой в 1989 году и пока остаётся единственным аппаратом, увидевшим Нептун вблизи. Он также изучил Тритон, чья обратная орбита намекает, что этот спутник мог быть когда-то захвачен планетой. 🌌'
        ]
      }
    },

    'voyager-1': {
      kind: 'deep',
      title: { tr: 'Voyager 1', en: 'Voyager 1', ru: 'Voyager 1' },
      facts: {
        tr: [
          'Voyager 1, 5 Eylül 1977’de fırlatıldı. Jüpiter ve Satürn’ün yakınından geçerek bu gezegenlerin ve uydularının ayrıntılı görüntülerini gönderdi. Satürn’ün uydusu Titan’a yakın geçiş yapması, sondanın yolunu Güneş Sistemi düzleminin dışına taşıdı ve onu yıldızlararası uzaya uzanan uzun bir yolculuğa çıkardı. 🚀',
          '2012’de Voyager 1 heliopozu geçerek yıldızlararası uzaya giren ilk insan yapımı araç oldu. Üzerinde ayrıca Dünya’daki yaşamı ve kültürü temsil eden sesler, görüntüler ve müzikler içeren Altın Plak bulunuyor. Radyo sinyalinin Dünya’ya ulaşması onlarca saat sürdüğü için mühendisler bir komut gönderdiğinde cevabı hemen alamaz; bu görev sabrın kelimenin tam anlamıyla gezegenler arası hâlidir. 📡'
        ],
        en: [
          'Voyager 1 launched on 5 September 1977. It flew past Jupiter and Saturn, returning detailed observations of the giant planets and their moons. A close encounter with Saturn’s moon Titan bent the spacecraft’s path out of the main planetary plane and sent it onward on a trajectory toward interstellar space. 🚀',
          'In 2012, Voyager 1 crossed the heliopause and became the first human-made spacecraft to enter interstellar space. It also carries the Golden Record, containing sounds, images and music selected to represent life and culture on Earth. Its radio signal now takes many hours to cross the distance to Earth, so every command-and-response cycle is an extraordinary exercise in deep-space patience. 📡'
        ],
        ru: [
          'Voyager 1 был запущен 5 сентября 1977 года. Он пролетел рядом с Юпитером и Сатурном, передав подробные наблюдения планет-гигантов и их спутников. Сближение с Титаном, спутником Сатурна, изменило траекторию аппарата и вывело его из основной плоскости планет, отправив в долгий путь к межзвёздному пространству. 🚀',
          'В 2012 году Voyager 1 пересёк гелиопаузу и стал первым созданным человеком аппаратом в межзвёздном пространстве. На борту находится «Золотая пластинка» со звуками, изображениями и музыкой, представляющими Землю. Радиосигнал теперь идёт между аппаратом и нашей планетой много часов, поэтому любой цикл «команда — ответ» требует огромного терпения. 📡'
        ]
      }
    },

    'voyager-2': {
      kind: 'deep',
      title: { tr: 'Voyager 2', en: 'Voyager 2', ru: 'Voyager 2' },
      facts: {
        tr: [
          'Voyager 2, Voyager 1’den önce, 20 Ağustos 1977’de fırlatıldı. Benzersiz gezegen dizilimini kullanarak Jüpiter ve Satürn’den sonra Uranüs ve Neptün’ü de ziyaret etti. Bugüne kadar Uranüs ve Neptün’ü yakından gören tek uzay aracı olması onu uzay keşif tarihinin en özel sondalarından biri yapıyor. 🪐🚀',
          'Sonda, gezegenlerin yerçekimini bir sonraki hedefe hız kazanmak için kullanan “yerçekimi yardımcısı” manevralarıyla dev bir tur gerçekleştirdi. 2018’de heliopozu geçerek yıldızlararası uzaya ulaştı. Voyager 2’nin verileri, bugün bile buz devleri hakkında ders kitaplarında gördüğümüz halkalar, uydular, manyetik alanlar ve atmosfer bilgileri için temel kaynaklardan biridir.'
        ],
        en: [
          'Voyager 2 actually launched before Voyager 1, on 20 August 1977. Using a rare alignment of the outer planets, it visited Jupiter and Saturn and then continued to Uranus and Neptune. It remains the only spacecraft ever to have observed Uranus and Neptune at close range, making it one of the most important probes in exploration history. 🪐🚀',
          'The spacecraft used gravity-assist manoeuvres, borrowing a tiny amount of a planet’s orbital momentum to reshape its path toward the next world. Voyager 2 crossed the heliopause into interstellar space in 2018. Its measurements are still fundamental to what textbooks teach about the ice giants’ rings, moons, magnetic fields and atmospheres.'
        ],
        ru: [
          'Voyager 2 был запущен даже раньше Voyager 1 — 20 августа 1977 года. Благодаря редкому расположению внешних планет он посетил Юпитер и Сатурн, а затем продолжил путь к Урану и Нептуну. До сих пор это единственный космический аппарат, увидевший Уран и Нептун с близкого расстояния. 🪐🚀',
          'Зонд использовал гравитационные манёвры: пролёт возле планеты менял его скорость и направление, помогая добраться до следующей цели почти без дополнительного топлива. В 2018 году Voyager 2 пересёк гелиопаузу и вышел в межзвёздное пространство. Его данные по кольцам, спутникам, магнитным полям и атмосферам ледяных гигантов до сих пор лежат в основе учебников.'
        ]
      }
    },

    'hubble': {
      kind: 'telescope',
      title: { tr: 'Hubble Uzay Teleskobu', en: 'Hubble Space Telescope', ru: 'Космический телескоп Hubble' },
      facts: {
        tr: [
          'Hubble Uzay Teleskobu, 24 Nisan 1990’da Space Shuttle Discovery ile uzaya gönderildi. Yaklaşık 2,4 metre çapındaki ana aynasıyla Dünya atmosferinin büyük bölümünün üzerinde çalıştığı için yıldızları ve galaksileri yer teleskoplarını etkileyen atmosferik bulanıklık olmadan gözleyebilir. 🔭',
          'Hubble’ın ilk görüntülerinde aynadaki çok küçük bir üretim hatası nedeniyle bulanıklık fark edildi. 1993’te astronotlar uzay yürüyüşleriyle düzeltici optikler taktı ve teleskop adeta gözlük kazanmış oldu. Daha sonraki servis görevleri de kameraları ve sistemleri yeniledi. Hubble derin alan görüntülerinden evrenin genişleme hızına kadar modern astronominin pek çok önemli sonucuna katkı sağladı. 🌌'
        ],
        en: [
          'The Hubble Space Telescope launched aboard Space Shuttle Discovery on 24 April 1990. Its main mirror is about 2.4 metres across, and because it operates above most of Earth’s atmosphere it can observe stars and galaxies without the atmospheric blurring that affects ground-based telescopes. 🔭',
          'Hubble’s early images revealed that its mirror had been manufactured with a tiny but important error. In 1993 astronauts installed corrective optics during spacewalks—almost like giving the telescope glasses. Later servicing missions replaced cameras and other hardware. Hubble went on to transform astronomy, from iconic deep-field images to measurements of the expanding universe. 🌌'
        ],
        ru: [
          'Космический телескоп Hubble был запущен 24 апреля 1990 года на шаттле Discovery. Диаметр его главного зеркала — около 2,4 метра. Работая выше большей части земной атмосферы, телескоп может наблюдать звёзды и галактики без атмосферного размытия, мешающего наземным обсерваториям. 🔭',
          'Первые снимки показали, что зеркало изготовлено с очень небольшой, но важной ошибкой формы. В 1993 году астронавты установили корректирующую оптику — словно надели на телескоп очки. Позднее сервисные миссии обновляли камеры и другие системы. Hubble изменил астрономию: от знаменитых глубоких снимков Вселенной до точных измерений её расширения. 🌌'
        ]
      }
    },

    'jameswebb': {
      kind: 'telescope',
      title: { tr: 'James Webb Uzay Teleskobu', en: 'James Webb Space Telescope', ru: 'Космический телескоп James Webb' },
      facts: {
        tr: [
          'James Webb Uzay Teleskobu, 25 Aralık 2021’de Ariane 5 roketiyle fırlatıldı. Dünya’nın çevresinde alçak yörüngede dönmek yerine Dünya’dan yaklaşık 1,5 milyon kilometre uzaktaki Güneş-Dünya L2 bölgesinin çevresinde çalışır. 6,5 metrelik ana aynası 18 altın kaplı altıgen parçadan oluşur. 🔭✨',
          'Webb özellikle kızılötesi ışığı gözlemek için tasarlandı. Bu sayede toz bulutlarının arkasındaki yıldız oluşum bölgelerini, çok uzak ve dolayısıyla çok eski galaksileri ve ötegezegen atmosferlerini inceleyebilir. Dev beş katmanlı güneş kalkanı teleskobun bilimsel cihazlarını çok soğuk tutar; çünkü sıcak bir teleskop kendi kızılötesi ışığıyla hassas gözlemleri bozardı.'
        ],
        en: [
          'The James Webb Space Telescope launched on an Ariane 5 rocket on 25 December 2021. Rather than orbiting close to Earth, it operates around the Sun–Earth L2 region roughly 1.5 million kilometres away. Its 6.5-metre primary mirror is assembled from 18 gold-coated hexagonal segments. 🔭✨',
          'Webb is designed mainly for infrared astronomy. Infrared light lets it study star-forming regions hidden by dust, extremely distant—and therefore very ancient—galaxies, and the atmospheres of some exoplanets. A huge five-layer sunshield keeps the observatory cold, because a warm telescope would glow in infrared and interfere with the faint cosmic signals it is trying to measure.'
        ],
        ru: [
          'Космический телескоп James Webb был запущен 25 декабря 2021 года ракетой Ariane 5. Вместо низкой околоземной орбиты он работает в районе точки Солнце–Земля L2 примерно в 1,5 миллиона километров от нашей планеты. Главное зеркало диаметром 6,5 метра собрано из 18 позолоченных шестиугольных сегментов. 🔭✨',
          'Webb в основном наблюдает в инфракрасном диапазоне. Это позволяет заглядывать сквозь пылевые облака в области рождения звёзд, видеть очень далёкие — а значит, очень древние — галактики и исследовать атмосферы некоторых экзопланет. Огромный пятислойный солнечный экран охлаждает приборы, потому что тёплый телескоп сам светился бы в инфракрасном диапазоне и мешал измерениям.'
        ]
      }
    },

    'kepler': {
      kind: 'telescope',
      title: { tr: 'Kepler Uzay Teleskobu', en: 'Kepler Space Telescope', ru: 'Космический телескоп Kepler' },
      facts: {
        tr: [
          'Kepler Uzay Teleskobu, 7 Mart 2009’da fırlatıldı ve tek bir soruya olağanüstü güçlü biçimde odaklandı: Başka yıldızların çevresinde gezegenler ne kadar yaygın? Teleskop yüz binlerce yıldızın parlaklığını uzun süre boyunca çok hassas biçimde ölçtü. 🌟',
          'Kepler’in temel yöntemi “geçiş yöntemi”ydi. Bir gezegen yıldızının önünden geçerse yıldız ışığında çok küçük ve düzenli bir azalma oluşur. Aynı azalma belirli aralıklarla tekrarlandığında gezegenin yörünge süresi ve yaklaşık boyutu hesaplanabilir. Görev 2018’de sona erdi ama binlerce ötegezegen ve aday keşfi sayesinde bize galaksinin gezegenlerle dolu olduğunu gösterdi. 🪐'
        ],
        en: [
          'The Kepler Space Telescope launched on 7 March 2009 with a powerful question: how common are planets around other stars? It monitored the brightness of enormous numbers of stars for long periods with extraordinary precision. 🌟',
          'Kepler’s main technique was the transit method. When a planet crosses in front of its star, the star becomes slightly dimmer in a regular, measurable way. Repeated dips can reveal the planet’s orbital period and approximate size. Although Kepler’s mission ended in 2018, its thousands of confirmed planets and candidates transformed our view of the galaxy by showing that planets are extremely common. 🪐'
        ],
        ru: [
          'Космический телескоп Kepler был запущен 7 марта 2009 года и сосредоточился на одном мощном вопросе: насколько часто у других звёзд встречаются планеты? Телескоп долго и чрезвычайно точно измерял яркость огромного числа звёзд. 🌟',
          'Главным методом Kepler был транзитный: когда планета проходит перед своей звездой, блеск звезды немного уменьшается. Если такие падения повторяются регулярно, можно вычислить период орбиты и оценить размер планеты. Миссия завершилась в 2018 году, но тысячи открытых и подтверждённых кандидатов показали, что наша Галактика буквально заполнена планетами. 🪐'
        ]
      }
    },

    'exomars': {
      kind: 'exomars',
      title: { tr: 'ExoMars', en: 'ExoMars', ru: 'ExoMars' },
      facts: {
        tr: [
          'ExoMars tek bir araç değil, Mars’ta geçmiş veya güncel yaşam izlerini araştırmaya odaklanan bir Avrupa uzay programıdır. Programın ilk büyük aracı Trace Gas Orbiter, 2016’da Mars yörüngesine ulaştı ve gezegenin atmosferindeki çok küçük miktarlardaki gazları, özellikle de metan gibi bilimsel açıdan ilginç bileşenleri incelemeye başladı. 🛰️🔴',
          'Programın sonraki büyük adımı Rosalind Franklin roverıdır. Roverın en özel araçlarından biri yüzeyin yaklaşık 2 metre altına kadar örnek alabilecek matkaptır; çünkü Mars yüzeyindeki radyasyon eski organik izleri bozabilirken daha derindeki malzeme daha iyi korunmuş olabilir. Görev, ESA ile NASA iş birliğiyle 2028 sonlarında fırlatılmak üzere hazırlanıyor; hedeflenen Mars inişi yaklaşık 2030’dur. 🔬'
        ],
        en: [
          'ExoMars is not one single spacecraft but a European programme focused on searching for evidence of past or present life on Mars. Its first major spacecraft, the Trace Gas Orbiter, reached Mars in 2016 and began studying tiny amounts of gases in the atmosphere, including scientifically intriguing compounds such as methane. 🛰️🔴',
          'The programme’s next major step is the Rosalind Franklin rover. One of its most unusual tools is a drill designed to collect samples from as deep as about two metres, where ancient organic evidence may be better protected from harsh surface radiation. Under the current ESA–NASA cooperation plan, the mission is being prepared for launch in late 2028, with a targeted Mars landing around 2030. 🔬'
        ],
        ru: [
          'ExoMars — не один аппарат, а европейская программа исследования Марса, ориентированная на поиск следов прошлой или современной жизни. Первый крупный аппарат программы, Trace Gas Orbiter, прибыл к Марсу в 2016 году и начал измерять очень малые количества газов в атмосфере, включая такие научно интересные вещества, как метан. 🛰️🔴',
          'Следующий большой этап — марсоход Rosalind Franklin. Один из его главных приборов — бур, способный получать образцы с глубины примерно до двух метров, где древняя органика может быть лучше защищена от жёсткого поверхностного излучения. В рамках нынешнего сотрудничества ESA и NASA запуск готовится на конец 2028 года, а посадка на Марс ожидается примерно в 2030 году. 🔬'
        ]
      }
    },

    'marsodyssey': {
      kind: 'marsorbiter',
      title: { tr: 'Mars Odyssey', en: 'Mars Odyssey', ru: 'Mars Odyssey' },
      facts: {
        tr: [
          'NASA’nın 2001 Mars Odyssey uzay aracı 7 Nisan 2001’de fırlatıldı ve 24 Ekim 2001’de Mars yörüngesine girdi. Görev adını Arthur C. Clarke’ın “2001: A Space Odyssey” eserine bir selam olarak taşıyor. Odyssey, Mars’ın kimyasal yapısını, yüzeyini ve radyasyon ortamını uzun yıllar boyunca yörüngeden inceleyen dayanıklı bir keşif aracıdır. 🛰️🔴',
          'Gamma Ray Spectrometer ölçümleri, özellikle yüksek enlemlerde yüzeye yakın bölgelerde çok miktarda hidrojen bulunduğunu gösterdi; bu, geniş su buzu rezervlerinin güçlü bir işaretiydi. Odyssey aynı zamanda Mars yüzeyindeki araçlardan Dünya’ya bilim verisi aktaran önemli bir haberleşme rölesi oldu. Böylece hem bilim insanı hem de uzaydaki “posta istasyonu” gibi çalıştı. 📡💧'
        ],
        en: [
          'NASA’s 2001 Mars Odyssey spacecraft launched on 7 April 2001 and entered orbit around Mars on 24 October 2001. Its name nods to Arthur C. Clarke’s “2001: A Space Odyssey.” Odyssey became an exceptionally long-lived orbital explorer, studying Martian chemistry, surface properties and the radiation environment. 🛰️🔴',
          'Measurements from its Gamma Ray Spectrometer revealed large amounts of hydrogen close to the surface at high latitudes, strong evidence for extensive deposits of water ice. Odyssey also became an important communications relay, receiving science data from spacecraft on the Martian surface and forwarding it toward Earth—part scientist, part interplanetary post office. 📡💧'
        ],
        ru: [
          'Аппарат NASA 2001 Mars Odyssey был запущен 7 апреля 2001 года и вышел на орбиту Марса 24 октября 2001 года. Название отсылает к произведению Артура Кларка «2001: Космическая одиссея». Odyssey стал исключительно долговечной орбитальной миссией, исследующей химический состав поверхности Марса и радиационную обстановку. 🛰️🔴',
          'Гамма-спектрометр обнаружил большое количество водорода близко к поверхности в высоких широтах — сильное свидетельство обширных запасов водяного льда. Odyssey также стал важным ретранслятором: он принимает научные данные от аппаратов на поверхности Марса и передаёт их к Земле. Получается одновременно учёный и межпланетная почтовая станция. 📡💧'
        ]
      }
    },

    'marsreconnaissance': {
      kind: 'marsorbiter',
      title: { tr: 'Mars Reconnaissance Orbiter', en: 'Mars Reconnaissance Orbiter', ru: 'Mars Reconnaissance Orbiter' },
      facts: {
        tr: [
          'Mars Reconnaissance Orbiter, yani MRO, 12 Ağustos 2005’te fırlatıldı ve Mart 2006’da Mars yörüngesine ulaştı. En ünlü aracı HiRISE kamerasıdır. Bu kamera Mars yüzeyini olağanüstü ayrıntıyla görüntüleyerek kraterleri, kumulları, heyelanları, buz birikimlerini ve iniş bölgelerini incelemeye yardım eder. 📷🔴',
          'MRO yalnızca fotoğrafçı değildir. CRISM gibi spektrometrelerle mineralleri inceler, SHARAD radarıyla yüzey altındaki katmanları araştırır ve yüzey görevleri için güçlü bir veri rölesi görevi görür. Perseverance gibi araçlardan gelen büyük miktardaki verinin Dünya’ya ulaştırılmasında Mars yörüngesindeki bu tür röle uyduları kritik rol oynar. 📡'
        ],
        en: [
          'The Mars Reconnaissance Orbiter, or MRO, launched on 12 August 2005 and reached Mars in March 2006. Its most famous instrument is the HiRISE camera, which can photograph the Martian surface in extraordinary detail and helps scientists study craters, dunes, landslides, ice deposits and landing sites. 📷🔴',
          'MRO is far more than a camera platform. Instruments such as CRISM study minerals, the SHARAD radar probes layers beneath the surface, and the spacecraft also acts as a high-capacity communications relay. Orbiters like MRO are crucial for carrying large volumes of data from surface missions such as Perseverance back toward Earth. 📡'
        ],
        ru: [
          'Mars Reconnaissance Orbiter, или MRO, был запущен 12 августа 2005 года и достиг Марса в марте 2006-го. Самый известный его прибор — камера HiRISE, способная с огромной детализацией фотографировать поверхность и исследовать кратеры, дюны, оползни, залежи льда и будущие места посадки. 📷🔴',
          'Но MRO — не просто фотокамера. Спектрометры вроде CRISM изучают минералы, радар SHARAD исследует слои под поверхностью, а сам аппарат служит мощным ретранслятором. Именно такие орбитальные станции помогают передавать на Землю большие объёмы данных от марсоходов, включая Perseverance. 📡'
        ]
      }
    },

    'spirit': {
      kind: 'marsrover',
      title: { tr: 'Spirit', en: 'Spirit', ru: 'Spirit' },
      facts: {
        tr: [
          'Spirit, NASA’nın ikiz Mars Exploration Rover araçlarından biriydi. 10 Haziran 2003’te Dünya’dan fırlatıldı ve 4 Ocak 2004’te Gusev Krateri’ne indi. Bilim insanları bu bölgenin geçmişte suyla ilişkili olabileceğini düşünüyordu; Spirit’in görevi kayaları ve toprağı inceleyerek Mars’ın eski çevresini anlamaktı. 🤖🔴',
          'Ana görev yalnızca 90 sol olarak planlanmıştı ama Spirit 2.208 sol boyunca, altı yıldan fazla çalıştı. Tekerleklerinden biri zamanla arızalandı ve 2009’da yumuşak toprağa saplandı; hareket edemese de sabit bir bilim istasyonu gibi ölçüm yapmaya devam etti. Son iletişim 2010’da gerçekleşti. Spirit’in suyla değişmiş mineraller hakkındaki bulguları Mars’ın geçmişinin bugünkünden daha ıslak olduğunu anlamamıza yardım etti. 💧'
        ],
        en: [
          'Spirit was one of NASA’s twin Mars Exploration Rovers. It launched from Earth on 10 June 2003 and landed in Gusev Crater on 4 January 2004. Scientists suspected that the region might preserve evidence of ancient water, so Spirit examined rocks and soil to reconstruct what the Martian environment had been like long ago. 🤖🔴',
          'The primary mission was designed for only 90 sols, yet Spirit operated for 2,208 sols—more than six years. One wheel eventually failed, and in 2009 the rover became trapped in soft soil. Even when it could no longer drive, it continued working as a stationary science platform. Its discoveries of water-altered minerals strengthened the evidence that ancient Mars had once been wetter than the planet we see today. 💧'
        ],
        ru: [
          'Spirit был одним из двух марсоходов NASA программы Mars Exploration Rover. Его запустили 10 июня 2003 года, а 4 января 2004-го он сел в кратере Гусева. Учёные предполагали, что регион может хранить следы древней воды, поэтому Spirit исследовал камни и грунт, пытаясь восстановить условия на Марсе в далёком прошлом. 🤖🔴',
          'Основную миссию рассчитали всего на 90 солов, но Spirit проработал 2208 солов — более шести лет. Одно колесо со временем отказало, а в 2009 году аппарат застрял в мягком грунте. Даже потеряв возможность ездить, он продолжал работать как стационарная научная станция. Найденные им минералы, изменённые водой, укрепили доказательства того, что древний Марс был значительно влажнее современного. 💧'
        ]
      }
    },

    'curiosity': {
      kind: 'marsrover',
      title: { tr: 'Curiosity', en: 'Curiosity', ru: 'Curiosity' },
      facts: {
        tr: [
          'Curiosity, NASA’nın Mars Science Laboratory görevinin yaklaşık otomobil büyüklüğündeki roverıdır. 26 Kasım 2011’de fırlatıldı ve 6 Ağustos 2012’de Gale Krateri’ne indi. İniş sırasında “sky crane” adı verilen roketli bir platform roverı kablolarla yüzeye indirdi; başka bir gezegende uygulanmış en cesur iniş yöntemlerinden biriydi. 🚀🤖',
          'Curiosity’nin temel sorusu “Mars’ta bugün yaşam var mı?” değil, “Geçmişte mikrobiyal yaşam için uygun koşullar var mıydı?” sorusudur. Kaya örneklerini delen matkabı, SAM ve CheMin gibi laboratuvar cihazları ve ChemCam lazeriyle mineralleri ve organik bileşikleri inceler. Gale Krateri’ndeki eski göl ortamlarına ait kanıtlar, Mars’ın bir zamanlar yaşama elverişli kimyasal ve çevresel koşullara sahip olduğunu gösterdi. 🔬'
        ],
        en: [
          'Curiosity is the car-sized rover of NASA’s Mars Science Laboratory mission. It launched on 26 November 2011 and landed in Gale Crater on 6 August 2012. During landing, a rocket-powered “sky crane” lowered the rover to the surface on cables—one of the boldest landing systems ever used on another world. 🚀🤖',
          'Curiosity’s central question is not simply “Is there life on Mars today?” but “Did ancient Mars ever provide environments suitable for microbial life?” Its drill, SAM and CheMin laboratories, ChemCam laser and other instruments analyse rocks, minerals and organic chemistry. Evidence from ancient lake environments in Gale Crater has shown that Mars once possessed conditions that could have been habitable. 🔬'
        ],
        ru: [
          'Curiosity — марсоход размером примерно с автомобиль, созданный для миссии NASA Mars Science Laboratory. Он стартовал 26 ноября 2011 года и сел в кратере Гейла 6 августа 2012-го. На финальном этапе посадки реактивная платформа «sky crane» опустила марсоход на тросах — один из самых смелых способов посадки, когда-либо применённых на другой планете. 🚀🤖',
          'Главный вопрос Curiosity не просто «есть ли жизнь на Марсе сейчас?», а «были ли в древности условия, пригодные для микробной жизни?». Бур, лаборатории SAM и CheMin, лазер ChemCam и другие приборы анализируют породы, минералы и органическую химию. Исследования древних озёрных отложений в кратере Гейла показали, что когда-то на Марсе действительно существовали потенциально обитаемые условия. 🔬'
        ]
      }
    },

    'perseverance': {
      kind: 'marsrover',
      title: { tr: 'Perseverance', en: 'Perseverance', ru: 'Perseverance' },
      facts: {
        tr: [
          'Perseverance, 30 Temmuz 2020’de fırlatıldı ve 18 Şubat 2021’de Jezero Krateri’ne indi. Jezero özellikle seçildi çünkü milyarlarca yıl önce burada bir göl ve nehir deltası bulunuyordu. Delta tortulları, geçmişte yaşam olmuşsa onun kimyasal izlerini koruyabilecek en umut verici kayaçlardan bazılarını içeriyor olabilir. 🔴🤖',
          'Rover kayaları inceliyor, çekirdek örnekleri alıp özel tüplerde saklıyor ve gelecekte Dünya’ya getirilebilecek bilimsel örnekler hazırlıyor. MOXIE deneyi Mars atmosferindeki karbondioksitten oksijen üretilebileceğini gösteren başarılı bir teknoloji denemesiydi. Perseverance ayrıca Ingenuity helikopterini Mars’a taşıdı ve yüksek çözünürlüklü kameralarıyla inişten sonra Kızıl Gezegen’in şimdiye kadarki en ayrıntılı görüntülerinden bazılarını gönderdi. 🧪'
        ],
        en: [
          'Perseverance launched on 30 July 2020 and landed in Jezero Crater on 18 February 2021. Jezero was chosen because billions of years ago it held a lake and river delta. Delta sediments are among the most promising rocks for preserving chemical traces of ancient life if such life ever existed there. 🔴🤖',
          'The rover studies rocks, drills core samples and seals selected material in special tubes for possible future return to Earth. Its MOXIE experiment successfully demonstrated production of oxygen from carbon dioxide in the Martian atmosphere. Perseverance also carried the Ingenuity helicopter to Mars and uses an advanced camera suite to document the planet in extraordinary detail. 🧪'
        ],
        ru: [
          'Perseverance был запущен 30 июля 2020 года и сел в кратере Езеро 18 февраля 2021-го. Это место выбрали потому, что миллиарды лет назад здесь существовали озеро и речная дельта. Осадочные породы дельты считаются одними из лучших кандидатов для сохранения химических следов древней жизни, если она когда-либо существовала. 🔴🤖',
          'Марсоход изучает породы, высверливает керны и герметично сохраняет отобранные образцы в специальных трубках для возможной будущей доставки на Землю. Эксперимент MOXIE успешно показал возможность получать кислород из углекислого газа марсианской атмосферы. Perseverance также доставил на Марс вертолёт Ingenuity и ведёт съёмку поверхности системой современных камер. 🧪'
        ]
      }
    },

    'ingenuity': {
      kind: 'marsheli',
      title: { tr: 'Ingenuity', en: 'Ingenuity', ru: 'Ingenuity' },
      facts: {
        tr: [
          'Ingenuity, Perseverance roverının altında Mars’a taşınan yalnızca yaklaşık 1,8 kilogramlık küçük bir helikopterdi. 19 Nisan 2021’de başka bir gezegende gerçekleştirilen ilk kontrollü ve motorlu uçuşu yaptı. Mars atmosferi Dünya’nınkinden yaklaşık yüzde 1 yoğunlukta olduğu için pervanelerin yeterli kaldırma üretmesi son derece zordu. 🚁🔴',
          'Başlangıçta yalnızca beş uçuşluk bir teknoloji gösterimi planlanmıştı. Ingenuity beklentileri aşarak 72 uçuş gerçekleştirdi ve Perseverance’ın önündeki araziyi görüntüleyen bir keşif yardımcısına dönüştü. Ocak 2024’te son uçuşunda rotor kanatlarının hasar görmesiyle uçuş görevi sona erdi. Küçük helikopter, gelecekte Mars’ta ve başka dünyalarda hava keşfinin mümkün olabileceğini kanıtladı. ✨'
        ],
        en: [
          'Ingenuity was a tiny helicopter of only about 1.8 kilograms carried to Mars beneath the Perseverance rover. On 19 April 2021 it made the first powered, controlled flight on another planet. Mars’s atmosphere is only about one percent as dense as Earth’s, so producing enough lift required extremely light construction and very fast-spinning rotors. 🚁🔴',
          'The original plan called for only five technology-demonstration flights. Ingenuity exceeded that goal spectacularly, completing 72 flights and becoming an aerial scout that could inspect terrain ahead of Perseverance. Its flying mission ended after rotor damage during its final flight in January 2024. This small helicopter proved that aerial exploration on Mars and other worlds is possible. ✨'
        ],
        ru: [
          'Ingenuity — маленький вертолёт массой всего около 1,8 килограмма, доставленный на Марс под днищем марсохода Perseverance. 19 апреля 2021 года он совершил первый управляемый полёт с двигателем на другой планете. Плотность марсианской атмосферы составляет примерно один процент земной, поэтому для создания подъёмной силы потребовались очень лёгкая конструкция и быстро вращающиеся роторы. 🚁🔴',
          'Изначально планировалось всего пять демонстрационных полётов, но Ingenuity совершил 72 и превратился в воздушного разведчика для Perseverance. Его лётная миссия завершилась после повреждения лопастей во время последнего полёта в январе 2024 года. Маленький аппарат доказал, что воздушная разведка Марса и других миров технически возможна. ✨'
        ]
      }
    },

    'zhurong': {
      kind: 'marsrover',
      title: { tr: 'Zhurong', en: 'Zhurong', ru: 'Чжужун' },
      facts: {
        tr: [
          'Zhurong, Çin’in Tianwen-1 Mars görevinin roverıdır. Tianwen-1 2020’de fırlatıldı; Zhurong 14 Mayıs 2021’de Utopia Planitia bölgesine indi ve Çin’i Mars yüzeyinde başarılı biçimde rover çalıştıran ülkeler arasına soktu. Yaklaşık 240 kilogramlık altı tekerlekli araç güneş enerjisiyle çalışıyordu. 🇨🇳🔴',
          'Kameraları, hava istasyonu, yüzey analiz cihazları ve yer altını inceleyen radarıyla Mars toprağının ve jeolojisinin izlerini araştırdı. İlk görevi yaklaşık 90 sol olarak planlanmışken bir yıldan uzun süre çalıştı ve yaklaşık 1,9 kilometre yol aldı. 2022’de Mars kışına girerken uyku moduna alındı; daha sonra beklenen biçimde yeniden iletişim kurulamadı ve 2026 itibarıyla aktif temasın geri geldiğine dair doğrulanmış bir açıklama bulunmuyor. 📡'
        ],
        en: [
          'Zhurong was the rover of China’s Tianwen-1 Mars mission. Tianwen-1 launched in 2020, and Zhurong landed in Utopia Planitia on 14 May 2021, making China one of the nations to successfully operate a rover on the Martian surface. The six-wheeled, solar-powered rover had a mass of about 240 kilograms. 🇨🇳🔴',
          'Its cameras, weather instruments, surface sensors and ground-penetrating radar studied Martian soil and geology. A mission planned for about 90 sols continued for more than a year, and the rover travelled roughly 1.9 kilometres. Zhurong entered a dormant state as northern winter approached in 2022; communication did not resume as expected, and as of 2026 there is no verified announcement that active contact has been restored. 📡'
        ],
        ru: [
          'Чжужун был марсоходом китайской миссии Tianwen-1. Комплекс стартовал в 2020 году, а 14 мая 2021-го Чжужун сел в равнине Утопия, сделав Китай одной из стран, сумевших успешно эксплуатировать марсоход на поверхности Марса. Шестиколёсный аппарат массой около 240 килограммов работал на солнечной энергии. 🇨🇳🔴',
          'Камеры, метеоприборы, анализаторы поверхности и георадар исследовали грунт и геологию Марса. Миссия, рассчитанная примерно на 90 солов, продолжалась больше года, а аппарат прошёл около 1,9 километра. В 2022 году перед марсианской зимой он перешёл в спящий режим; связь в ожидаемое время не восстановилась, и по состоянию на 2026 год подтверждённых сообщений о возвращении активного контакта нет. 📡'
        ]
      }
    }
  };

  const CATEGORY = {
    eo: {
      tr: [
        'Yer gözlem uydularını uzayda çalışan çok hassas kameralar gibi düşünebilirsiniz. Güneş ışığı Dünya’dan yansır, optik sistem bu ışığı toplar ve sensörler onu sayısal verilere dönüştürür. Fakat iyi bir görüntü için uydu yalnızca fotoğraf çekmez; konumunu bilmek, doğru hedefe dönmek, titreşimi azaltmak ve veriyi yer istasyonuna güvenle aktarmak zorundadır. ⚙️📡',
        'Ben Albarisli gözlerimle çok uzak ayrıntıları görebiliyorum. 😄 İnsanların ise süper gücü yok; onların gücü matematik, optik, yazılım ve ekip çalışması. Aynı bölgeyi farklı tarihlerde görüntülemek bir ormanın, şehrin, tarlanın ya da kıyının nasıl değiştiğini anlamamızı sağlar.'
      ],
      en: [
        'Think of an Earth-observation satellite as an extremely precise camera working in space. Sunlight reflects from Earth, optics collect it and sensors convert it into digital measurements. But a sharp image requires much more than a camera: the spacecraft must know its position, point at the correct target, control vibration and safely send the data to a ground station. ⚙️📡',
        'My Albarian eyes can see very distant details. 😄 Humans do not need that superpower; they use mathematics, optics, software and teamwork. Images of the same region taken at different times can reveal how forests, cities, farms, coastlines and disaster zones change.'
      ],
      ru: [
        'Спутник наблюдения Земли можно представить как очень точную камеру в космосе. Солнечный свет отражается от поверхности, оптика собирает его, а датчики превращают в цифровые измерения. Но одного фотоаппарата мало: аппарат должен знать своё положение, точно навестись на цель, подавить вибрации и надёжно передать данные на наземную станцию. ⚙️📡',
        'Мои альбарисские глаза способны видеть очень далёкие детали. 😄 Людям такая суперсила не нужна: они используют математику, оптику, программирование и командную работу. Сравнивая снимки одного района в разные годы, можно увидеть изменения лесов, городов, полей, береговой линии и зон стихийных бедствий.'
      ]
    },
    comm: {
      tr: [
        'Haberleşme uydularının çoğu jeostasyoner yörüngede, ekvatorun yaklaşık 35.786 kilometre üzerinde görev yapar. Dünya ile aynı sürede döndükleri için yerdeki gözlemciye gökyüzünün aynı noktasında duruyormuş gibi görünürler. Yer istasyonundan gelen radyo sinyalleri uydudaki transponderlar tarafından alınır, güçlendirilir ve başka bölgelere gönderilir. 📡🌍',
        'Bir uydu aynı anda enerji santrali, bilgisayar, radyo istasyonu ve robotik yönelim sistemi gibidir. Güneş panelleri elektrik üretir, bataryalar gölgede sistemi besler, küçük motorlar yörüngeyi düzeltir ve antenler sinyali doğru bölgeye yöneltir. Ben ışığı bükebiliyorum; insanlar ise radyo dalgalarını hesaplayarak kıtaları birbirine bağlıyor. 😄'
      ],
      en: [
        'Many communications satellites operate in geostationary orbit about 35,786 kilometres above the equator. Because they circle Earth in the same time that Earth rotates, they appear almost fixed in the sky. Radio signals from ground stations are received by transponders, amplified or processed, and transmitted toward another region. 📡🌍',
        'A satellite is simultaneously a power plant, computer, radio station and robotic pointing system. Solar arrays generate electricity, batteries keep it alive in darkness, small thrusters maintain the orbit and antennas direct energy toward the correct coverage area. I can bend light; humans connect continents by calculating radio waves. 😄'
      ],
      ru: [
        'Многие спутники связи работают на геостационарной орбите примерно в 35 786 километрах над экватором. Они совершают оборот за то же время, за которое вращается Земля, поэтому кажутся почти неподвижными на небе. Сигнал наземной станции принимается транспондерами, усиливается или обрабатывается и отправляется в другой регион. 📡🌍',
        'Спутник одновременно похож на электростанцию, компьютер, радиостанцию и роботизированную систему наведения. Солнечные панели дают энергию, аккумуляторы поддерживают работу в тени, маленькие двигатели корректируют орбиту, а антенны направляют сигнал в нужную область. Я умею искривлять свет, а люди соединяют континенты, точно рассчитывая радиоволны. 😄'
      ]
    },
    station: {
      tr: [
        'ISS’de “yerçekimi yok” demek tam doğru değildir. Dünya’nın çekimi hâlâ güçlüdür; istasyon ve içindeki insanlar sürekli olarak Dünya’ya doğru düşerken aynı zamanda o kadar hızlı ileri giderler ki gezegenin çevresini dolaşırlar. Bu sürekli serbest düşüş durumuna mikro yerçekimi diyoruz. Bu yüzden su damlaları küreleşir ve astronotlar havada süzülür. 💧',
        'Ben Time Thread gücümle bazı şeyleri birkaç saniye durdurabiliyorum ama ISS bize çok daha gerçek bir güç gösteriyor: ülkelerin birlikte bilim yapabilmesi. Uzaydaki deneyler gelecekte Ay ve Mars görevlerinin yanı sıra Dünya’daki tıp, malzeme bilimi ve teknoloji çalışmalarına da katkı sağlayabilir.'
      ],
      en: [
        'It is not quite correct to say there is “no gravity” on the ISS. Earth’s gravity is still strong there; the station and its crew are continuously falling toward Earth while moving sideways so fast that they keep missing the planet. This continuous free fall creates microgravity, making astronauts float and water form drifting spheres. 💧',
        'I can use Time Thread to freeze things for a few seconds, but the ISS demonstrates a more realistic superpower: nations cooperating to do science. Research in orbit can support future Moon and Mars missions while also improving medicine, materials science and technology on Earth.'
      ],
      ru: [
        'Говорить, что на МКС «нет гравитации», не совсем правильно. Притяжение Земли там всё ещё велико; станция и экипаж постоянно падают к планете, но одновременно движутся вперёд так быстро, что всё время «промахиваются» мимо поверхности. Такое непрерывное свободное падение создаёт микрогравитацию, поэтому люди парят, а вода собирается в шарики. 💧',
        'Я могу на несколько секунд остановить материю силой Нити Времени, но МКС показывает гораздо более реальную суперсилу — способность разных стран вместе заниматься наукой. Орбитальные исследования помогают будущим полётам к Луне и Марсу, а также медицине, материаловедению и технологиям на Земле.'
      ]
    },
    rocky: {
      tr: [
        'Kayasal gezegenlerin ortak özelliği metal ve kayalardan oluşan katı yüzeylere sahip olmalarıdır; ama her biri bambaşka bir laboratuvar gibidir. Atmosferin kalınlığı, su miktarı, manyetik alan, Güneş’e uzaklık ve jeolojik etkinlik birkaç temel fizik kuralından çok farklı dünyalar oluşturabilir. 🪨',
        'Ben Albaris’ten gelirken gezegenleri yalnızca güzel küreler olarak görmüyorum; her yüzey bir tarih kitabıdır. Kraterler çarpışmaları, vadiler eski akışları, volkanlar iç ısıyı anlatır. Bilim insanları da teleskoplar ve uzay araçlarıyla bu kitabın sayfalarını okumaya çalışır.'
      ],
      en: [
        'Rocky planets share solid surfaces made largely from rock and metal, yet each is a completely different laboratory. Atmospheric thickness, water, magnetic fields, distance from the Sun and geological activity can turn the same basic laws of physics into dramatically different worlds. 🪨',
        'When I travel from Albaris, I do not see planets as simple coloured spheres; every surface is a history book. Craters record impacts, valleys can record flowing liquids, and volcanoes reveal internal heat. Scientists use telescopes and spacecraft to learn how to read those pages.'
      ],
      ru: [
        'Каменистые планеты имеют твёрдую поверхность из горных пород и металлов, но каждая из них — совершенно разная лаборатория. Толщина атмосферы, вода, магнитное поле, расстояние от Солнца и геологическая активность превращают одни и те же законы физики в очень разные миры. 🪨',
        'Путешествуя с Альбариса, я вижу в планетах не просто цветные шары: каждая поверхность похожа на книгу истории. Кратеры рассказывают об ударах, долины — о древних потоках, вулканы — о внутреннем тепле. Учёные учатся читать эти страницы с помощью телескопов и космических аппаратов.'
      ]
    },
    gas: {
      tr: [
        'Gaz devlerinde Dünya’daki gibi üzerine basacağımız kesin bir yüzey yoktur. Bulut katmanlarının altına indikçe basınç ve sıcaklık artar, hidrojen alışılmadık fiziksel hâllere geçebilir. Bu dünyaları anlamak için uzay araçları bulutları, yerçekimini, manyetik alanları ve çevrelerindeki uyduları birlikte inceler. 🪐',
        'Ben kozmik enerjiyi hissedebiliyorum, ama gaz devlerinin içini anlamak için bile tek bir süper güç yetmezdi. Bilim insanları ışığın tayfını, radyo sinyallerini ve yörüngedeki küçük değişimleri ölçerek göremedikleri derin katmanlar hakkında sonuç çıkarır. İşte bilimin dedektifliği budur. 🔬'
      ],
      en: [
        'Gas giants do not have a clear solid surface like Earth. As we descend below the cloud tops, pressure and temperature rise enormously and hydrogen can enter unusual physical states. Scientists therefore study clouds, gravity, magnetic fields and moons together to understand these immense worlds. 🪐',
        'I can sense cosmic energy, but even a superpower would not simply reveal the deep interior of a gas giant. Scientists act like detectives: they analyse spectra, radio signals and tiny changes in spacecraft motion to infer structures they cannot directly see. 🔬'
      ],
      ru: [
        'У газовых гигантов нет чёткой твёрдой поверхности, на которую можно было бы встать. По мере погружения под облака давление и температура быстро растут, а водород переходит в необычные физические состояния. Поэтому учёные одновременно изучают облака, гравитацию, магнитное поле и спутники этих огромных миров. 🪐',
        'Я чувствую космическую энергию, но даже суперсила не позволила бы просто заглянуть в глубины газового гиганта. Учёные работают как детективы: анализируют спектры света, радиосигналы и крошечные изменения траектории аппарата, чтобы понять то, чего нельзя увидеть напрямую. 🔬'
      ]
    },
    ice: {
      tr: [
        'Uranüs ve Neptün’e “buz devleri” denmesi, yüzeylerinin buzla kaplı olduğu anlamına gelmez. Bu ad, iç yapılarında su, amonyak ve metan gibi maddelerin sıcak ve yüksek basınçlı karışımlarının önemli rol oynamasından gelir. Dış atmosferleri ise büyük ölçüde hidrojen ve helyum içerir. ❄️🪐',
        'Bu gezegenler çok uzakta olduğu için onlara ulaşmak yıllar sürer. Ben Ultra Hız ile mesafeyi kolayca aşabilirim, ama insanlığın gerçek araçları yakıt, yörünge ve zaman hesabı yapmak zorunda. Bu yüzden buz devleri Güneş Sistemi’nin hâlâ en az yakından keşfedilmiş büyük dünyaları arasındadır.'
      ],
      en: [
        'Calling Uranus and Neptune “ice giants” does not mean their surfaces are covered with ordinary ice. The name refers to the importance of water, ammonia and methane compounds in their hot, high-pressure interiors, while their outer atmospheres are still rich in hydrogen and helium. ❄️🪐',
        'These planets are so distant that spacecraft need years to reach them. My Ultra Speed could erase that distance, but real human probes must obey fuel, trajectory and time constraints. That is why the ice giants remain among the least closely explored major worlds in our Solar System.'
      ],
      ru: [
        'Название «ледяные гиганты» не означает, что Уран и Нептун покрыты обычным льдом. Оно связано с большой ролью соединений воды, аммиака и метана в горячих внутренних слоях под огромным давлением, тогда как внешние атмосферы богаты водородом и гелием. ❄️🪐',
        'Эти планеты настолько далеки, что космическому аппарату требуются годы, чтобы добраться до них. Моя Сверхскорость легко решила бы проблему расстояния, но реальные зонды обязаны учитывать топливо, траекторию и время. Поэтому ледяные гиганты остаются одними из наименее исследованных вблизи крупных миров Солнечной системы.'
      ]
    },
    deep: {
      tr: [
        'Voyager araçlarının enerji kaynağı güneş panelleri değildir. Güneş’ten çok uzakta oldukları için radyoizotop termoelektrik jeneratörleri, yani RTG’ler kullanırlar. Plütonyum-238’in doğal bozunmasından çıkan ısı elektrik enerjisine çevrilir. Güç yıllar geçtikçe azalır, bu yüzden ekipler hangi cihazların çalıştırılacağını dikkatle seçer. ⚡',
        'Ben yıldızlar arasında ışınlanabilirim; Voyager ise bunu sabırla yapıyor. Her saniye biraz daha uzağa giderken küçücük veriler Dünya’ya son derece zayıf radyo sinyalleriyle ulaşır. 1970’lerde yapılmış bir makinenin hâlâ yıldızlararası uzay hakkında bilgi verebilmesi, iyi mühendisliğin en güzel örneklerinden biridir.'
      ],
      en: [
        'Voyager spacecraft do not use solar panels for power. So far from the Sun, they rely on radioisotope thermoelectric generators, or RTGs, which convert heat from the natural decay of plutonium-238 into electricity. Available power slowly declines with time, so mission teams must carefully decide which instruments and heaters can remain active. ⚡',
        'I can teleport between stars; Voyager does it the patient way. Every second it moves farther away, and tiny packets of information return to Earth as extremely weak radio signals. A machine built in the 1970s still teaching us about interstellar space is one of engineering’s most remarkable achievements.'
      ],
      ru: [
        'Аппараты Voyager питаются не от солнечных батарей. Так далеко от Солнца они используют радиоизотопные термоэлектрические генераторы — РИТЭГи, превращающие тепло распада плутония-238 в электричество. Мощность постепенно уменьшается, поэтому инженеры очень внимательно решают, какие приборы и обогреватели можно оставлять включёнными. ⚡',
        'Я могу телепортироваться между звёздами, а Voyager путешествует самым терпеливым способом. Каждую секунду он становится дальше, и крошечные порции данных возвращаются на Землю в виде чрезвычайно слабого радиосигнала. То, что машина 1970-х годов всё ещё способна учить нас межзвёздному пространству, — выдающийся пример инженерии.'
      ]
    },
    telescope: {
      tr: [
        'Bir uzay teleskobu yalnızca “çok uzağı gösteren kamera” değildir. Aynalar veya mercekler ışığı toplar, dedektörler farklı dalga boylarını ölçer ve bilgisayarlar bu sinyalleri bilimsel veriye dönüştürür. Farklı teleskoplar görünür, kızılötesi veya başka ışık türlerine odaklanarak evrenin farklı özelliklerini ortaya çıkarır. 🔭',
        'Ben X-Ray ve Isı Görüşü kullanabiliyorum. İnsanlar ise fizik sayesinde kendilerine benzer bilimsel gözler yaptı. Üstelik teleskoplar geçmişe de bakar: ışığın bize ulaşması zaman aldığı için çok uzak bir galaksiyi görmek, onu milyonlarca hatta milyarlarca yıl önceki hâliyle görmek demektir. 🌌'
      ],
      en: [
        'A space telescope is much more than a camera that “sees far away.” Mirrors collect light, detectors measure selected wavelengths, and computers turn those signals into scientific data. Different observatories specialise in visible, infrared or other kinds of light, revealing different physical properties of the universe. 🔭',
        'I have X-ray and thermal vision; humans built scientific versions of such powers using physics. Telescopes also look into the past: because light takes time to travel, seeing a very distant galaxy means seeing it as it existed millions or even billions of years ago. 🌌'
      ],
      ru: [
        'Космический телескоп — не просто камера, которая «видит далеко». Зеркала собирают свет, датчики измеряют выбранные диапазоны, а компьютеры превращают сигналы в научные данные. Разные обсерватории работают в видимом, инфракрасном и других диапазонах, раскрывая разные свойства Вселенной. 🔭',
        'У меня есть рентгеновское и тепловое зрение, а люди создали научные аналоги таких способностей с помощью физики. Телескопы ещё и смотрят в прошлое: свет идёт к нам не мгновенно, поэтому далёкую галактику мы видим такой, какой она была миллионы или даже миллиарды лет назад. 🌌'
      ]
    },
    marsrover: {
      tr: [
        'Mars roverları uzaktan kumandalı oyuncak arabalar gibi gerçek zamanlı sürülemez. Dünya ile Mars arasındaki radyo sinyali yolculuğu gezegenlerin konumuna göre dakikalar sürer. Mühendisler hedefleri ve komutları önceden gönderir; rover kameraları ve yazılımıyla engelleri algılar, küçük kararları kendi başına verir. 🧠📡',
        'Ben geleceği birkaç saniye görebiliyorum ama Mars roverlarının gerçek süper gücü sabırdır. Birkaç metre ilerlemek, bir taşı delmek veya bir görüntüyü göndermek saatler hatta günler alabilir. Buna rağmen her ölçüm, milyarlarca yıllık Mars tarihinin yeni bir cümlesini okumamıza yardım eder.'
      ],
      en: [
        'Mars rovers cannot be driven in real time like remote-control cars. A radio signal between Earth and Mars takes minutes to cross the distance, depending on where the planets are. Engineers send plans and commands in advance, while the rover uses cameras and onboard software to detect hazards and make smaller decisions for itself. 🧠📡',
        'I can see a few seconds into the future, but a Mars rover’s real superpower is patience. Driving a few metres, drilling one rock or returning a dataset can take hours or days. Yet every careful measurement adds another sentence to our reconstruction of billions of years of Martian history.'
      ],
      ru: [
        'Марсоходом нельзя управлять в реальном времени как радиоуправляемой машинкой. Радиосигнал между Землёй и Марсом идёт несколько минут — время меняется в зависимости от положения планет. Инженеры заранее отправляют план действий, а аппарат использует камеры и бортовое программное обеспечение, чтобы обнаруживать опасности и самостоятельно принимать небольшие решения. 🧠📡',
        'Я вижу будущее на несколько секунд, но настоящая суперсила марсоходов — терпение. Проехать несколько метров, просверлить один камень или передать набор данных может занять часы и дни. И всё же каждое измерение добавляет новую строку в историю Марса возрастом в миллиарды лет.'
      ]
    },
    marsorbiter: {
      tr: [
        'Mars yörünge araçları, yüzeyde tekerlek kullanmadan bütün gezegeni tekrar tekrar gözleyebilir. Kameralar harita çıkarır, spektrometreler minerallerin ışık imzalarını ölçer, radarlar bazı yüzey altı yapıları araştırır. Aynı bölgeyi yıllar boyunca izlemek mevsimleri, toz hareketlerini ve yüzey değişimlerini anlamayı sağlar. 🛰️',
        'Yörünge araçlarının başka bir görevi de haberleşmedir. Mars yüzeyindeki rover düşük güçlü bir sinyali yakındaki yörünge aracına gönderebilir; orbiter daha büyük anteni ve enerji bütçesiyle bu veriyi Dünya’ya aktarır. Ben uzay bükebilirim, ama insanların kurduğu bu röle ağı da gezegenler arası iletişim için küçük bir uzay köprüsüdür. 📡'
      ],
      en: [
        'Mars orbiters can repeatedly survey the entire planet without ever touching the ground. Cameras build maps, spectrometers read the light signatures of minerals, and radars can probe selected structures beneath the surface. Observing the same locations for years reveals seasons, dust movement and surface changes. 🛰️',
        'Orbiters also provide communications. A rover can send a relatively low-power signal to a spacecraft passing overhead; the orbiter then forwards the data to Earth using its larger antennas and power budget. I can bend space, but this relay network is humanity’s own small bridge across interplanetary distance. 📡'
      ],
      ru: [
        'Орбитальные аппараты Марса могут снова и снова осматривать всю планету, не касаясь поверхности. Камеры строят карты, спектрометры измеряют световые «подписи» минералов, а радары исследуют некоторые структуры под грунтом. Многолетние наблюдения одних и тех же районов показывают смену сезонов, движение пыли и изменения поверхности. 🛰️',
        'У орбитальных аппаратов есть и другая важная работа — связь. Марсоход может передать относительно слабый сигнал пролетающему сверху спутнику, а тот отправит данные на Землю с помощью более мощной системы. Я умею искривлять пространство, но такая сеть ретрансляторов — созданный людьми маленький мост через межпланетное расстояние. 📡'
      ]
    },
    marsheli: {
      tr: [
        'Mars’ta uçmak Dünya’da uçmaktan çok farklıdır. Atmosfer çok daha ince olduğu için aynı büyüklükteki pervane çok daha az kaldırma kuvveti üretir. Buna karşılık Mars’ın yerçekimi Dünya’nın yaklaşık yüzde 38’idir; bu uçuşa biraz yardımcı olur. Tasarımcılar ağırlığı azaltmak, pervaneleri hızlı döndürmek ve aracı kendi kendine dengede tutmak zorundadır. 🚁',
        'Ben uçmak için pervaneye ihtiyaç duymuyorum. 😄 İnsanların başarısı ise fizik kurallarını değiştirmek değil, onları yeterince iyi anlayıp o kurallar içinde yeni bir araç tasarlamaktır. Ingenuity’nin başarısı gelecekte mağaraları, uçurumları veya roverların ulaşamadığı bölgeleri inceleyen Mars hava araçlarının önünü açtı.'
      ],
      en: [
        'Flying on Mars is very different from flying on Earth. The atmosphere is much thinner, so a rotor of the same size produces far less lift. Mars’s gravity is only about 38 percent of Earth’s, which helps somewhat. Engineers must minimise mass, spin the rotors very fast and let onboard computers stabilise the aircraft autonomously. 🚁',
        'I do not need rotors to fly. 😄 Humanity’s achievement is not changing the laws of physics but understanding them well enough to design a machine that works within those laws. Ingenuity opened the door to future aerial explorers that could investigate cliffs, caves or terrain that wheeled rovers cannot safely reach.'
      ],
      ru: [
        'Летать на Марсе совсем не так, как на Земле. Атмосфера намного разреженнее, поэтому ротор того же размера создаёт гораздо меньше подъёмной силы. Зато марсианская гравитация составляет около 38% земной, что немного помогает. Инженерам нужно максимально уменьшить массу, очень быстро вращать лопасти и поручить бортовому компьютеру автономно стабилизировать аппарат. 🚁',
        'Мне для полёта роторы не нужны. 😄 Достижение людей состоит не в изменении законов физики, а в том, чтобы понять их достаточно хорошо и построить машину, работающую внутри этих правил. Ingenuity открыл путь будущим воздушным разведчикам, способным изучать обрывы, пещеры и места, куда колёсный марсоход не доберётся.'
      ]
    },
    exomars: {
      tr: [
        'Mars’ta yaşam izi aramak “küçük bir fosil bulmak” kadar basit değildir. Organik moleküller, mineraller, atmosfer gazları ve jeolojik bağlam birlikte incelenir. Özellikle yüzey altı önemlidir çünkü Mars’ın ince atmosferi ve manyetik alan eksikliği yüzeyi güçlü morötesi ve kozmik radyasyona açık bırakır. 🧬',
        'Ben geçmişe 88 saniye dönebiliyorum ama bilim insanları bazen bir taşın kimyasını okuyarak milyarlarca yıl geriye bakar. ExoMars’ın asıl heyecanı da burada: tek bir “yaşam bulundu” anı peşinde koşmak yerine, yaşam için gerekli koşulların ve olası biyolojik izlerin bilimsel kanıtlarını adım adım sınamak.'
      ],
      en: [
        'Searching for life on Mars is not as simple as finding one tiny fossil. Scientists must combine organic chemistry, minerals, atmospheric gases and geological context. The subsurface is especially important because Mars’s thin atmosphere and lack of a global magnetic field leave the surface exposed to intense ultraviolet and cosmic radiation. 🧬',
        'I can rewind time by 88 seconds, but scientists can sometimes look back billions of years by reading the chemistry of a rock. That is the real excitement of ExoMars: not chasing one dramatic “life found” moment, but testing evidence for habitable conditions and possible biosignatures step by step.'
      ],
      ru: [
        'Поиск жизни на Марсе не сводится к попытке найти крошечную окаменелость. Нужно вместе исследовать органические молекулы, минералы, газы атмосферы и геологический контекст. Особенно важны глубинные образцы, потому что тонкая атмосфера и отсутствие глобального магнитного поля оставляют поверхность под сильным ультрафиолетовым и космическим излучением. 🧬',
        'Я могу отмотать время на 88 секунд, а учёные иногда заглядывают на миллиарды лет назад, читая химию одного камня. В этом и смысл ExoMars: не ждать одного драматического момента «жизнь найдена», а шаг за шагом проверять доказательства древней обитаемости и возможных биологических следов.'
      ]
    },
    verify: {
      tr: [
        'Kaynak kontrolü bilimde temel bir beceridir. Resmî kurum kayıtları, görev arşivleri ve teknik belgeler birbirleriyle karşılaştırılır. Bir bilgi birçok sitede tekrarlandığı için otomatik olarak doğru olmaz; bazen aynı hata onlarca kez kopyalanabilir. 📚',
        'Ben Zihinsel Bağ ile düşünceleri hissedebilirim ama sizlerin daha değerli bir aracı var: eleştirel düşünme. Bir iddia gördüğünüzde “Bunu kim söylüyor, hangi belgeye dayanıyor, başka güvenilir kaynak doğruluyor mu?” diye sorun. Bu üç soru internetteki en güçlü bilim kalkanlarından biridir. 🛡️'
      ],
      en: [
        'Source checking is a fundamental scientific skill. Official agency records, mission archives and technical documents should be compared with one another. A statement does not become true merely because many websites repeat it; one error can be copied dozens of times. 📚',
        'I have a Mental Link, but you have a more useful everyday tool: critical thinking. When you see a claim, ask “Who says this? What evidence supports it? Does another reliable source confirm it?” Those three questions form one of the strongest shields against misinformation. 🛡️'
      ],
      ru: [
        'Проверка источников — базовый научный навык. Официальные реестры, архивы миссий и технические документы нужно сравнивать друг с другом. Утверждение не становится истинным только потому, что его повторили десятки сайтов: иногда одна ошибка просто копируется снова и снова. 📚',
        'У меня есть Ментальная Связь, но у вас есть более полезный повседневный инструмент — критическое мышление. Увидев утверждение, спросите: «Кто это сообщает? На каких доказательствах основано? Подтверждает ли это другой надёжный источник?» Эти три вопроса — отличный щит от дезинформации. 🛡️'
      ]
    }
  };

  const ENDINGS = {
    tr: 'Belki bugün yalnızca bir 3D modele bakıyorsunuz. Ama merak edip “Neden?”, “Nasıl?” ve “Ben daha iyisini yapabilir miyim?” diye sormaya devam ederseniz, bir gün yeni bir uyduyu, roverı, teleskobu ya da gezegenler arası sistemi tasarlayan kişi siz olabilirsiniz. 🌌🚀\n\nUnutmayın uzaydaşlar: Bilim, ezberlemekten çok doğru soruları sormak, kanıt aramak ve öğrenmeye devam etmektir.\n\nVael-khrun… İçinizdeki merak ışığı yıldızlara kadar ulaşsın! ✨',
    en: 'Today you may simply be looking at a 3D model. But if you keep asking “Why?”, “How?” and “Could I build something better?”, one day you may be the person designing a new satellite, rover, telescope or interplanetary system. 🌌🚀\n\nRemember, Spacemates: science is not mainly about memorising facts. It is about asking good questions, searching for evidence and continuing to learn.\n\nVael-khrun… May the light of curiosity inside you reach all the way to the stars! ✨',
    ru: 'Сегодня вы, возможно, просто рассматриваете 3D-модель. Но если продолжите спрашивать «Почему?», «Как?» и «Смогу ли я сделать ещё лучше?», однажды именно вы можете спроектировать новый спутник, марсоход, телескоп или межпланетную систему. 🌌🚀\n\nПомните, космодрузья: наука — это не столько заучивание фактов, сколько хорошие вопросы, поиск доказательств и постоянное обучение.\n\nВаэль-Крун… Пусть свет вашего любопытства дотянется до самых звёзд! ✨'
  };

  const OPENINGS = {
    tr: (title) => `Uzaylarca selam uzaydaşlar! 🌌👨‍🚀\n\nBugün birlikte ${title} hakkında gerçek bir uzay dersi yapacağız. Yalnızca nasıl göründüğüne değil; ne zaman ortaya çıktığına, nasıl çalıştığına ve bilim için neden önemli olduğuna da bakacağız.`,
    en: (title) => `Greetings across the stars, Spacemates! 🌌👨‍🚀\n\nToday we are going to turn ${title} into a real space lesson. We will look not only at what it looks like, but when it appeared, how it works and why it matters to science and engineering.`,
    ru: (title) => `Космический привет, космодрузья! 🌌👨‍🚀\n\nСегодня мы превратим знакомство с ${title} в настоящий космический урок. Разберём не только внешний вид, но и историю, принцип работы и то, почему этот объект важен для науки и техники.`
  };

  function languageFromPath(path) {
    if (/^\/eng\//i.test(path)) return 'en';
    if (/^\/rus\//i.test(path)) return 'ru';
    return 'tr';
  }

  function slugFromPath(path) {
    const parts = path.toLowerCase().split('/').filter(Boolean);
    for (const raw of parts) {
      const candidate = raw.replace(/\.html?$/i, '');
      if (OBJECTS[candidate]) return candidate;
    }
    return '';
  }

  function isRegularModelPath(path) {
    if (/\/atlas\//i.test(path)) return false;
    if (/^\/ar\//i.test(path)) return false;
    return true;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatNarration(text) {
    return text
      .trim()
      .split(/\n{2,}/)
      .map((paragraph) => escapeHtml(paragraph).replace(/\n/g, '<br>'))
      .join('<br><br>');
  }

  function buildNarration(entry, lang) {
    const title = entry.title[lang] || entry.title.tr;
    const category = CATEGORY[entry.kind] && CATEGORY[entry.kind][lang]
      ? CATEGORY[entry.kind][lang]
      : [];
    const facts = entry.facts[lang] || entry.facts.tr || [];
    return [
      OPENINGS[lang](title),
      ...facts,
      ...category,
      ENDINGS[lang]
    ].join('\n\n');
  }

  function applyNarration() {
    const path = (window.location.pathname || '/').replace(/\/index\.html$/i, '/');
    if (!isRegularModelPath(path)) return false;
    if (!document.querySelector('model-viewer')) return false;

    const slug = slugFromPath(path);
    if (!slug || EXCLUDED.has(slug)) return false;

    const lang = languageFromPath(path);
    const entry = OBJECTS[slug];
    if (!entry) return false;

    const paragraph = document.querySelector('main .container p, .container p, main p, p');
    if (!paragraph) return false;

    paragraph.innerHTML = formatNarration(buildNarration(entry, lang));
    paragraph.dataset.albamenNarration = `${slug}-${lang}`;
    document.documentElement.dataset.albamenNarration = `regular-${lang}-v1`;
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyNarration, { once: true });
  } else {
    applyNarration();
  }
})();

ALBASPACE GAME v0.2
===================

ТОЧКА ВХОДА
-----------
/game/AlbaSpace/ru/index.html

Страницы игры:
- /game/AlbaSpace/ru/teacher.html — управление комнатой преподавателем.
- /game/AlbaSpace/ru/player.html — экран игрока.
- /game/AlbaSpace/ru/classroom.html?room=<roomId> — readonly-экран для проектора.

АРХИТЕКТУРА v0.2
----------------
Игра использует существующий AlbaSpace account. Новый login для игры не создаётся.
Сессия проверяется сервером через cookie albaspace_session и endpoint /me.

Состояние активной игры хранится в Cloudflare Durable Object GameRoomDO. D1 хранит постоянный snapshot и audit events. Клиенты отправляют команды с requestId через REST API, а обновления получают через авторизованный Server-Sent Events (SSE) realtime-канал. localStorage и BroadcastChannel больше не используются для игровой синхронизации.

Основной backend API расположен на том же Worker, что и auth:
- POST /api/game/rooms
- POST /api/game/rooms/join
- GET /api/game/rooms/<roomId>/snapshot
- GET /api/game/rooms/<roomId>/events
- POST /api/game/rooms/<roomId>/command

ПОДГОТОВКА BACKEND
------------------
1. В Cloudflare Worker примените cloudflare-worker/schema.sql к существующей D1 database.
2. В конфигурации Worker используйте cloudflare-worker/wrangler.toml.example как основу.
3. Укажите реальный database_id существующей D1 database albaspace-auth.
4. Для Durable Object добавьте миграцию GameRoomDO и binding GAME_ROOMS.
5. Проверьте, что Worker доступен по https://albaspace-api.nncdecdgc.workers.dev или обновите API в assets/js/game-client.js.
6. Сохраните существующие secrets Google OAuth без изменений.
7. Выполните деплой Worker обычным способом через Wrangler из каталога cloudflare-worker.

ПЛЕЙТЕСТ
--------
1. Войдите в AlbaSpace через существующий email/password или Google account.
2. Откройте teacher.html и создайте комнату.
3. Откройте classroom.html?room=<roomId> на проекторе.
4. На двух телефонах войдите в AlbaSpace account и откройте player.html.
5. Введите код комнаты, создайте уникальные компании и выберите по три кадета.
6. После готовности игроков учитель запускает игру и вопросы.
7. Учитель закрывает приём ответов; backend сам считает scoring, credits, knowledge, graduation и winner.
8. Проверьте обновление classroom, перезагрузку player и временное отключение сети.

ПОВЕДЕНИЕ ТАЙМЕРОВ
------------------
Reminder timer вопроса виден только учителю. Он использует server deadline и после нуля переходит в положительное overtime-счётчик. Истечение reminder timer не закрывает ответы. Игрок может продолжать вводить и отправлять ответ до команды учителя CLOSE_ANSWERS.

Общий timer учителя считается от server startedAt и восстанавливается после reload.

БЕЗОПАСНОСТЬ
-----------
Backend сам определяет userId из AlbaSpace session. Frontend не является источником истины для credits, knowledge, winner, цен модулей, правильных ответов, tolerance или прав учителя. Правильный ответ не отправляется игроку до RESULT. Повтор команд с тем же requestId не выполняется повторно.

ЛОКАЛЬНАЯ ПРОВЕРКА HTML
-----------------------
Для проверки статики из корня репозитория:

python3 -m http.server 8080

Откройте:
http://localhost:8080/game/AlbaSpace/ru/index.html

Примечание: для multiplayer нужен опубликованный Worker и авторизованная AlbaSpace session; простого открытия HTML через file:// недостаточно.

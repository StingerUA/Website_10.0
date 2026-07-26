@echo off
chcp 65001 >nul
echo ================================================
echo Автоматическая настройка Git для сайта AlbaSpace
echo ================================================
echo.

echo 1. Проверка Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Git не найден!
    echo Пожалуйста, установите Git с https://git-scm.com/
    pause
    exit /b
)
echo Git найден.
echo.

echo 2. Настройка пользователя (если не настроено)...
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    echo Git не знает, кто вы. Давайте настроим это.
    set /p git_name="Введите ваше имя (на латинице): "
    set /p git_email="Введите ваш email: "
    
    git config --global user.name "%git_name%"
    git config --global user.email "%git_email%"
    echo Настройки сохранены.
) else (
    echo Пользователь Git уже настроен.
)
echo.

echo 3. Инициализация репозитория...
git init
echo.

echo 4. Добавление всех файлов...
git add .
echo.

echo 5. Создание коммита...
git commit -m "Fix registration modal visibility and align product galleries across languages"
if %errorlevel% neq 0 (
    echo Коммит не создан (возможно, нет изменений или произошла ошибка).
) else (
    echo Коммит успешно создан.
)
echo.

echo ================================================
echo Репозиторий готов.
echo Теперь нужно добавить удаленный репозиторий (GitHub/GitLab).
echo ================================================
echo.

set /p remote_url="Введите URL вашего репозитория (например, https://github.com/user/repo.git): "

if "%remote_url%"=="" (
    echo URL не введен. Пропуск настройки удаленного репозитория.
    echo Вы можете сделать это позже командами:
    echo git remote add origin <URL>
    echo git push -u origin main
    pause
    exit /b
)

echo 6. Добавление удаленного репозитория...
git remote remove origin >nul 2>&1
git remote add origin %remote_url%
echo.

echo 7. Отправка изменений (Push)...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo Возникла ошибка при отправке. Проверьте правильность URL и ваши права доступа.
) else (
    echo.
    echo УСПЕШНО! Изменения отправлены в репозиторий.
)

pause
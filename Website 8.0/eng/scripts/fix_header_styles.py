import os
import re
from pathlib import Path

# CSS стили для header-social и social-icon-svg
HEADER_SOCIAL_STYLES = """
.header-social {
      display: flex;
      gap: 14px;
      align-items: center;
    }
.header-social img {
      width: 22px;
      height: 22px;
      display: block;
      border-radius: 6px;
      transition: transform 0.15s, filter 0.2s;
    }
.header-social svg.social-icon-svg {
      width: 22px;
      height: 22px;
      display: block;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      color: #e5e7eb;
      transition: transform 0.15s, filter 0.2s;
    }
.header-social a:hover img,
.header-social a:hover svg.social-icon-svg {
      transform: translateY(-1px);
      filter: brightness(1.2);
    }"""

def add_header_social_styles(file_path):
    """Добавляет стили для header-social если их нет"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем есть ли уже стили для header-social
    if '.header-social' in content:
        return False  # уже есть
    
    # Ищем место для вставки - перед /* HERO */ или перед closing </style>
    hero_comment = '/* HERO */'
    style_close = '</style>'
    
    if hero_comment in content:
        # Вставляем перед HERO комментарием
        new_content = content.replace(
            hero_comment,
            HEADER_SOCIAL_STYLES + '\n/* HERO */'
        )
    elif '<style>' in content:
        # Вставляем перед </style>
        new_content = content.replace(
            style_close,
            HEADER_SOCIAL_STYLES + '\n' + style_close
        )
    else:
        return False
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

# Обрабатываем все HTML файлы в eng/ папке
eng_dir = Path('/workspaces/website5/eng')
modified_count = 0

for html_file in eng_dir.rglob('*.html'):
    # Пропускаем header и footer файлы
    if html_file.name in ['header-en.html', 'footer-en.html']:
        continue
    
    if add_header_social_styles(str(html_file)):
        print(f"✓ Обновлен: {html_file.relative_to(eng_dir.parent)}")
        modified_count += 1

print(f"\nВсего обновлено файлов: {modified_count}")

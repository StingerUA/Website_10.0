#!/usr/bin/env python3
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup, Comment
from deep_translator import GoogleTranslator

BASE = Path(__file__).resolve().parent.parent
TARGETS = {
    'eng': {
        'lang': 'en',
        'header': 'header-en',
        'footer': 'footer-en',
        'dest': 'en',
    },
    'rus': {
        'lang': 'ru',
        'header': 'header-ru',
        'footer': 'footer-ru',
        'dest': 'ru',
    },
}

TRANS_ATTRS = ['alt', 'title', 'placeholder', 'aria-label']
META_TAGS = {
    'description', 'keywords', 'og:title', 'og:description', 'twitter:title', 'twitter:description',
    'apple-mobile-web-app-title', 'application-name'
}
SKIP_TAGS = {'script', 'style', 'noscript', 'template', 'svg', 'path', 'defs', 'head'}

def normalize_include_path(value: str, target_code: str) -> str:
    if not value:
        return value
    value = value.strip()
    basename = Path(value).name
    match = re.match(r'^(header|footer)-([a-z]{2})(-.*)?(\.html)?$', basename)
    if not match:
        return value
    prefix, _, suffix, ext = match.group(1), match.group(2), match.group(3) or '', match.group(4) or ''
    return value.replace(basename, f'{prefix}-{target_code}{suffix}{ext}')


def translate_texts(texts, dest):
    if not texts:
        return []
    translator = GoogleTranslator(source='auto', target=dest)
    translated = []
    for i, text in enumerate(texts):
        try:
            translated_text = translator.translate(text)
        except Exception as exc:
            raise RuntimeError(f'Translation failed for text #{i} starting with {text[:40]!r}: {exc}')
        if translated_text is None:
            translated_text = text
        translated.append(str(translated_text))
    return translated


def translate_file(path: Path, locale_data):
    text = path.read_text(encoding='utf-8')
    if not text.strip():
        return False
    doctype_match = re.match(r'^\s*<!DOCTYPE[^>]*>\s*', text, flags=re.I | re.S)
    doctype = doctype_match.group(0) if doctype_match else '<!DOCTYPE html>\n'
    soup = BeautifulSoup(text, 'html.parser')
    changed = False

    # Remove stray top-level text nodes that may have appeared from broken doctype serialization.
    for top in list(soup.contents):
        if isinstance(top, str) and top.strip().upper() == 'HTML':
            top.extract()
            changed = True

    html_tag = soup.find('html')
    if html_tag is None:
        html_tag = soup.new_tag('html')
        if soup.contents:
            soup.insert(0, html_tag)
            changed = True
    if html_tag and html_tag.get('lang') != locale_data['lang']:
        html_tag['lang'] = locale_data['lang']
        changed = True

    # Normalize header/footer includes inside data-include and data-include-html attributes
    for tag in soup.find_all(True):
        for attr_name in list(tag.attrs):
            if attr_name in ('data-include', 'data-include-html'):
                old = tag[attr_name]
                new = normalize_include_path(old, locale_data['lang'])
                if new != old:
                    tag[attr_name] = new
                    changed = True

    # Also normalize direct header/footer references in href/src attributes
    for tag in soup.find_all(['a', 'link', 'script']):
        for attr in ['href', 'src']:
            if tag.has_attr(attr):
                old = tag[attr]
                new = normalize_include_path(old, locale_data['lang'])
                if new != old:
                    tag[attr] = new
                    changed = True

    # Collect text nodes for translation
    text_nodes = []
    original_texts = []
    node_info = []
    for element in soup.find_all(string=True):
        if isinstance(element, Comment):
            continue
        parent = element.parent
        if not parent:
            continue
        if parent.name in SKIP_TAGS:
            continue
        if not element.strip():
            continue
        if element.parent.name == 'title':
            pass
        elif element.parent.name == 'meta':
            continue
        elif element.parent.name == 'script' or element.parent.name == 'style':
            continue
        original = str(element)
        stripped = original.strip()
        if not stripped:
            continue
        text_nodes.append(element)
        original_texts.append(original)
        node_info.append((element, original))

    # Collect attributes for translation
    attr_nodes = []
    attr_texts = []
    for tag in soup.find_all(True):
        for attr in TRANS_ATTRS:
            if tag.has_attr(attr) and tag[attr].strip():
                attr_nodes.append((tag, attr, tag[attr]))
                attr_texts.append(tag[attr])
        if tag.name == 'meta':
            if tag.has_attr('name') and tag['name'].lower() in META_TAGS and tag.has_attr('content'):
                attr_nodes.append((tag, 'content', tag['content']))
                attr_texts.append(tag['content'])
            if tag.has_attr('property') and tag['property'].lower() in META_TAGS and tag.has_attr('content'):
                attr_nodes.append((tag, 'content', tag['content']))
                attr_texts.append(tag['content'])

    # Translate text nodes and attribute values
    all_texts = original_texts + attr_texts
    translated_texts = translate_texts(all_texts, locale_data['dest'])
    if len(translated_texts) != len(all_texts):
        raise RuntimeError(f'Expected {len(all_texts)} translations, got {len(translated_texts)}')

    for idx, text_node in enumerate(text_nodes):
        translated = translated_texts[idx]
        original = original_texts[idx]
        if translated.strip() != original.strip():
            prefix = original[:len(original) - len(original.lstrip())]
            suffix = original[len(original.rstrip()):]
            text_node.replace_with(prefix + translated + suffix)
            changed = True

    for attr_idx, (tag, attr_name, orig_value) in enumerate(attr_nodes, start=len(original_texts)):
        translated = translated_texts[attr_idx]
        if translated.strip() != orig_value.strip():
            tag[attr_name] = translated
            changed = True

    if changed:
        output = str(soup)
        if not output.lstrip().lower().startswith('<!doctype'):
            output = doctype + output
        path.write_text(output, encoding='utf-8')
    return changed


def main():
    updated = []
    errors = []
    for locale, locale_data in TARGETS.items():
        base_dir = BASE / locale
        if not base_dir.exists():
            print(f'Skipping missing locale directory: {base_dir}')
            continue
        for path in sorted(base_dir.rglob('*.html')):
            try:
                changed = translate_file(path, locale_data)
                if changed:
                    updated.append(str(path.relative_to(BASE)))
            except Exception as exc:
                errors.append((path, exc))
                print(f'ERROR: {path} -> {exc}', file=sys.stderr)
    print(f'Total updated files: {len(updated)}')
    if updated:
        for f in updated:
            print(f'UPDATED: {f}')
    if errors:
        print(f'Total errors: {len(errors)}', file=sys.stderr)
        for path, exc in errors:
            print(f'{path}: {exc}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

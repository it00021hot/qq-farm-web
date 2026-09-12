import io
import re

tc = io.open('/tmp/tc.txt', encoding='utf-8').read()
keys = sorted(set(re.findall(r'"(page\.farm\.settings\.[a-zA-Z0-9]+)"', tc)))
print('missing keys:', len(keys))

rust_zh = io.open(r'C:/Users/liu13/projects/qq-farm/qq-farm-rust/desktop-ui/src/locales/langs/zh-cn.ts', encoding='utf-8').read()
rust_en = io.open(r'C:/Users/liu13/projects/qq-farm/qq-farm-rust/desktop-ui/src/locales/langs/en-us.ts', encoding='utf-8').read()


def extract(rust, leaf):
    best = None
    for line in rust.split('\n'):
        m = re.match(r"^(\s+)" + leaf + r": (.+?),?\s*$", line)
        if m:
            if best is None or len(m.group(1)) < len(best[0]):
                best = (m.group(1), m.group(2))
    return best[1] if best else None


found_zh = {k.split('.')[-1]: extract(rust_zh, k.split('.')[-1]) for k in keys}
found_en = {k.split('.')[-1]: extract(rust_en, k.split('.')[-1]) for k in keys}
no_val = [k for k in keys if not found_zh.get(k.split('.')[-1])]
print('no value in rust:', no_val)


def insert(path, values, schema=False):
    with io.open(path, encoding='utf-8') as f:
        src = f.read()
    lines = []
    for k in keys:
        leaf = k.split('.')[-1]
        if re.search(r"^\s{8}" + leaf + r":", src, re.M):
            continue
        if schema:
            lines.append(f"        {leaf}: string;")
        else:
            v = values.get(leaf) or ("'" + leaf + "'")
            lines.append(f"        {leaf}: {v},")
    m = re.search(r"(      settings: \{\n)", src)
    assert m, path
    src = src.replace(m.group(1), m.group(1) + '\n'.join(lines) + '\n', 1)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(src)
    print('inserted', path, len(lines))


insert('src/locales/langs/zh-cn.ts', found_zh)
insert('src/locales/langs/en-us.ts', found_en)
insert('src/typings/app.d.ts', None, schema=True)

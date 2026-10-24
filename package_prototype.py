from pathlib import Path
import re, zipfile

root = Path(__file__).parent
html = (root / 'index.html').read_text(encoding='utf-8')
for name in ['nvg-standard-layout 1.css', 'plp.css']:
    html = html.replace(f'<link rel="stylesheet" href="./{name}">', '<style>\n' + (root / name).read_text(encoding='utf-8') + '\n</style>')
for name in ['plp-data.js', 'plp.js', 'plp-scan.js', 'plp-research-data.js', 'plp-research.js', 'plp-archive-data.js', 'plp-archive.js', 'plp-external.js', 'plp-aqua-data.js', 'plp-aqua-chat.js', 'plp-ma.js', 'plp-ma-reception.js', 'plp-users.js']:
    script = (root / name).read_text(encoding='utf-8').replace('</script', '<\\/script')
    html = html.replace(f'<script src="./{name}"></script>', '<script>\n' + script + '\n</script>')
(root / 'NOVA_GROUP_PLP_Prototype.html').write_text(html, encoding='utf-8')
files = ['plp-ma-reception.js', 'plp-users.js', 'login.html', 'verify-assessment.cjs', 'verify-ma.cjs', 'verification-ma.json', 'prototype-ma-sop06.png', 'BRD/MA_SOP06_Thiet_ke_prototype.md', 'plp_ma_service.py', 'requirements-plp.txt', 'verify-external.cjs', 'prototype-external-tree.png', 'plp_server.py', 'start-plp.ps1', 'Mo-PLP-AI.cmd', 'verify-ai.cjs', 'NOVA_GROUP_PLP_Prototype.html', 'README.md', 'index.html', 'nvg-standard-layout 1.css', 'plp.css', 'plp-data.js', 'plp.js', 'plp-scan.js', 'build_prototype.py', 'package_prototype.py', 'verify-prototype.cjs', 'verification.json', 'prototype-desktop.png', 'prototype-module.png', 'prototype-mobile.png', 'prototype-projects.png', 'prototype-legal-groups.png', 'prototype-scan.png']
with zipfile.ZipFile(root / 'NOVA_GROUP_PLP_Prototype.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for name in files + ['verify-scan.cjs', 'verification-scan.json', 'plp-research-data.js', 'plp-research.js', 'build_research_catalog.py', 'sharepoint-library-snapshot.json', 'prototype-research.png', 'verify-research.cjs', 'verification-research.json', 'plp-archive-data.js', 'plp-archive.js', 'plp-external.js', 'build_archive_tree.py', 'novainsight-tree-snapshots.json', 'prototype-archive.png', 'verify-archive.cjs', 'verification-archive.json', 'plp-aqua-data.js', 'plp-aqua-chat.js', 'plp-ma.js', 'build_aqua_bundle.py', 'aqua112-manifest.json', 'aqua112-extracted.json', 'verify-aqua-chat.cjs', 'verification-aqua-chat.json', 'prototype-aqua-chat.png']:
        if (root / name).exists():
            z.write(root / name, name)
    for pdf in (root/'archive_files'/'aqua112').glob('*.pdf'):
        z.write(pdf,pdf.relative_to(root).as_posix())
print('Created standalone HTML and ZIP package.')

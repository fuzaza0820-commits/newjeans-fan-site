from pathlib import Path
import re

p = Path(r'C:\Users\1\.qclaw\workspace-agent-5c622325\newjeans-index.html')
html = p.read_text(encoding='utf-8')

# ============================================================
# 1. CSS: 修复 responsive 中残留的 .photo-wall
# ============================================================
css_old = '''        @media (max-width: 768px) {
            .photo-wall {
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(4, 1fr);
            }
            .nav-links {'''

css_new = '''        @media (max-width: 768px) {
            .hero-slide img {
                object-position: center;
            }
            .hero-btn { width: 40px; height: 40px; font-size: 0.7rem; }
            .hero-btn-prev { left: 0.5rem; }
            .hero-btn-next { right: 0.5rem; }
            .hero-dots { bottom: 1rem; }
            .hero-counter { bottom: 1rem; right: 1rem; font-size: 0.4rem; }
            .nav-links {'''

if css_old in html:
    html = html.replace(css_old, css_new)
    print('[1] CSS responsive fixed')
else:
    print('[1] CSS responsive: .photo-wall not found (may already be fixed)')

# ============================================================
# 2. HTML: 替换整个 hero 区域为 slideshow 结构
# ============================================================
# 找到 <section class="hero" ...> 到第一个 </section> 之间的内容
# 用正则匹配 section.hero 的整个内部

hero_re = re.compile(
    r'(<section class="hero"[^>]*>\s*)\n.*?(\n\s*<!-- 前景内容 -->)',
    re.DOTALL
)

new_hero_body = '''        <!-- ===== 全屏图片轮播 ===== -->
        <div class="hero-slideshow" id="heroSlideshow">
            <div class="hero-slide active">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394690607_irfnnf_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394700609_7agu0w_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394708607_txye0e_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394720156_1ubbpt_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394735273_cw12sc_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394745673_4342an_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394760409_zok0pe_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/paste_1780394775325_h4cld4_landscape.jpg" alt="" loading="eager">
            </div>
            <div class="hero-slide">
                <img src="file:///C:/Users/1/.qclaw/workspace-agent-5c622325/landscape_final/%E6%94%B6%E8%97%8F%E5%88%B0%20%E6%BD%AE%E6%B5%81%E9%A3%8E%E5%90%91%E6%A0%87_landscape.jpg" alt="" loading="eager">
            </div>
        </div>

        <!-- VHS 叠加 -->
        <div class="vhs-overlay"></div>

        <!-- 左右切换按钮 -->
        <button class="hero-btn hero-btn-prev" onclick="heroSlide(-1)">&#9664;</button>
        <button class="hero-btn hero-btn-next" onclick="heroSlide(1)">&#9654;</button>

        <!-- 底部指示器 -->
        <div class="hero-dots" id="heroDots"></div>

        <!-- 图片计数器 -->
        <div class="hero-counter" id="heroCounter">01 / 09</div>

'''

# 尝试3种可能的 Hero 开头标记
patterns_tried = 0
for start_marker in [
    '<!-- ===== HERO with Photo Wall ===== -->\n    <section class="hero"',
    '<!-- ===== HERO - 全屏图片轮播 ===== -->\n    <section class="hero"',
    '<section class="hero" id="home">',
]:
    if start_marker in html:
        patterns_tried += 1
        # 找到 section.hero 的结束 tag
        end_marker = '<!-- ===== Members Section'
        if end_marker in html:
            before = html.split(start_marker)[0]
            after = html.split(end_marker)[1]
            html = before + start_marker.split('class="hero"')[0] + '    <section class="hero" id="home">\n' + new_hero_body + '        <!-- 前景内容 -->\n    </section>\n\n    <!-- ===== Members Section' + after
            print('[2] Hero HTML replaced via marker: ' + start_marker[:40])
            break
        else:
            print('[2] ERROR: end marker not found')
else:
    print('[2] WARNING: No hero section marker matched - checking for photo-wall div...')
    if 'photo-wall' in html or 'photoWall' in html:
        print('[2] FOUND photo-wall/photoWall in HTML - needs manual fix')
    else:
        print('[2] photo-wall NOT found in HTML (may already be fixed)')

# ============================================================
# 3. 删除残留的 hero-overlay div
# ============================================================
n_overlay = html.count('<div class="hero-overlay"></div>')
if n_overlay > 0:
    html = html.replace('<div class="hero-overlay"></div>', '')
    print(f'[3] Removed {n_overlay} hero-overlay div(s)')
else:
    print('[3] No hero-overlay div found (already clean)')

# ============================================================
# 4. 替换 JS: 删除 photoWall 视差，加入 heroSlide
# ============================================================
old_js = """        // ===== 照片墙视差跟随鼠标 =====
        const photoWall = document.getElementById('photoWall');
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 10;
            const y = (e.clientY / window.innerHeight - 0.5) * 6;
            photoWall.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
        });"""

new_js = """        // ===== Hero 轮播逻辑 =====
        let heroIndex = 0;
        const heroSlides = document.querySelectorAll('.hero-slide');
        const heroDots = document.getElementById('heroDots');
        const heroCounter = document.getElementById('heroCounter');

        // 生成指示器圆点
        heroSlides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => heroSlideTo(i);
            heroDots.appendChild(dot);
        });

        function heroSlide(dir) { heroSlideTo(heroIndex + dir); }

        function heroSlideTo(idx) {
            heroSlides[heroIndex].classList.remove('active');
            heroSlides[heroIndex].classList.add('leaving');
            heroDots.children[heroIndex].classList.remove('active');
            if (idx < 0) idx = heroSlides.length - 1;
            if (idx >= heroSlides.length) idx = 0;
            heroIndex = idx;
            heroSlides[heroIndex].classList.remove('leaving');
            heroSlides[heroIndex].classList.add('active');
            heroDots.children[heroIndex].classList.add('active');
            heroCounter.textContent = String(heroIndex+1).padStart(2,'0') + ' / ' + String(heroSlides.length).padStart(2,'0');
        }

        // 自动轮播（每5秒）
        setInterval(() => heroSlide(1), 5000);

        // 键盘左右切换
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') heroSlide(-1);
            if (e.key === 'ArrowRight') heroSlide(1);
        });"""

if old_js in html:
    html = html.replace(old_js, new_js)
    print('[4] JS: photoWall parallax replaced with heroSlide')
elif 'heroSlide' not in html:
    # 追加到 </script> 前
    html = html.replace('    </script>', new_js + '\n\n    </script>')
    print('[4] JS: heroSlide logic appended')
else:
    print('[4] JS: heroSlide already present, skipped')

# ============================================================
# 5. 保存
# ============================================================
p.write_text(html, encoding='utf-8')
print('\n[5] File saved. Verifying...')

v = p.read_text(encoding='utf-8')
print('  photo-wall :', v.count('photo-wall'))
print('  photoWall  :', v.count('photoWall'))
print('  hero-slide :', v.count('hero-slide'))
print('  heroSlide  :', v.count('heroSlide'))
print('  hero-btn   :', v.count('hero-btn'))
print('  file size   :', len(v), 'bytes')

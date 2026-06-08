from pathlib import Path
import re

p = Path(r'C:\Users\1\.qclaw\workspace-agent-5c622325\newjeans-index.html')
html = p.read_text(encoding='utf-8')

# ── 1. 干掉 CSS 里残留的 .photo-wall responsive 块 ──────────
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
    print('✓ CSS responsive 已修复')
else:
    print('⚠ 未找到 .photo-wall responsive 块（可能已修复）')

# ── 2. 把 HTML 中的 photo-wall 结构整体替换为 hero-slideshow ────────
# 找到 <section class="hero" ...> 到下一个 </section> 之间的内容，整体替换
# 用正则更稳健
hero_pattern = re.compile(
    r'(<section class="hero"[^>]*>\s*<!-- 照片墙背景 -->.*?)<!-- 前景内容 -->',
    re.DOTALL
)

new_hero_inner = '''        <!-- ===== 全屏图片轮播 ===== -->
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

            <!-- 前景内容 -->'''

m = hero_pattern.search(html)
if m:
    html = html[:m.start()] + new_hero_inner + html[m.end():]
    print('✓ Hero HTML 结构已替换为全屏轮播')
else:
    print('⚠ 未找到 Hero 块（正则未匹配），尝试字符串查找...')
    # fallback：查找标志性字符串
    if 'photo-wall' in html or 'photoWall' in html:
        print('  发现 photo-wall 残留，需要进一步手动修复')
    else:
        print('  HTML 中似乎已无 photo-wall')

# ── 3. 删除残留的 hero-overlay div（已在 CSS 中去掉，但 HTML 里可能还有）──
html = html.replace('<div class="hero-overlay"></div>', '')
print('✓ 清理 hero-overlay div')

# ── 4. 替换/注入 JS 轮播逻辑 ──────────────────────────────────────────
# 删除旧的 photoWall 视差 JS 块
old_js_1 = """        // ===== 照片墙视差跟随鼠标 =====
        const photoWall = document.getElementById('photoWall');
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 10;
            const y = (e.clientY / window.innerHeight - 0.5) * 6;
            photoWall.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
        });"""

# 新 JS 轮播逻辑
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

if old_js_1 in html:
    html = html.replace(old_js_1, new_js)
    print('✓ JS 视差代码已替换为轮播逻辑')
elif 'heroSlide' not in html:
    # 插入到 </script> 前
    html = html.replace('    </script>', new_js + '\n\n    </script>')
    print('✓ JS 轮播逻辑已插入（追加模式）')
else:
    print('ℹ JS 轮播逻辑已存在，跳过')

# ── 5. 保存 ──────────────────────────────────────────────────────────
p.write_text(html, encoding='utf-8')
print('\n 完成保存！正在验证...')

# 验证
v = p.read_text(encoding='utf-8')
print('  photo-wall :', v.count('photo-wall'))
print('  photoWall  :', v.count('photoWall'))
print('  hero-slide :', v.count('hero-slide'))
print('  heroSlide  :', v.count('heroSlide'))
print('  hero-btn   :', v.count('hero-btn'))
print('  文件大小   :', len(v), '字节')

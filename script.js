/*
 * Windows 11 Installation Simulator - training version
 *
 * Flow:  home() -> boot() -> setup(0..7) -> install() -> restartMsg() -> boot() -> oobe(0..5) -> desktop()
 * Everything is drawn into <div id="app"> by replacing its innerHTML.
 *
 * Helpers:
 *   $(sel)        document.querySelector shortcut
 *   esc(s)        escape user text before putting it into HTML
 *   logo(size)    four-square Windows logo
 *   later(fn,ms)  setTimeout that is cancelled by clear() when the screen changes
 *   nextBtn()     blue primary button used in the Setup footer
 *   err(msg)      red error banner
 */
const $ = s => document.querySelector(s), app = $('#app');
const esc = s => s.replace(/[&<>"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
}[c]));
const logo = (s, w) => `<div class="logo ${w ? 'w' : ''}" style="--s:${s}px"><i></i><i></i><i></i><i></i></div>`;
let user = 'User', tm = [];
const later = (f, ms) => tm.push(setTimeout(f, ms));

/** Cancel all pending timers; called whenever the screen changes */
function clear() {
    tm.forEach(clearTimeout);
    tm = [];
}

/** Show a red error banner (re-triggers the shake animation) */
function err(msg) {
    let e = $('.err');
    if (!e) {
        e = document.createElement('div');
        e.className = 'err';
        ($('.bd') || $('.c')).prepend(e);
    }
    e.innerHTML = '<b>⛔</b><span>' + msg + '</span>';
    e.classList.remove('shake');
    void e.offsetWidth;
    e.classList.add('shake');
    ($('.bd') || $('.c')).scrollTop = 0;
}

/** Black boot screen with spinner; calls next() after ms */
function boot(next, ms = 3200) {
    clear();
    app.innerHTML = `<div class="boot">${logo(90, 1)}<div class="spin"></div></div>`;
    later(next, ms);
}

/** Render a Windows Setup dialog: body HTML + footer buttons */
function dlg(body, btns) {
    app.innerHTML = `<div class="setup">
        <div class="dlg">
            <div class="tb">${logo(14)} Windows Setup</div>
                <div class="bd">${body}</div>
                    <div class="ft">${btns || ''}</div></div></div>`;
}
const nextBtn = (id = 'nx', t = 'Next', on = '') => `<button class="b p" id="${id}" ${on}>${t}</button>`;

/** Windows Setup wizard. One block per step (n = step number) */
function setup(n) {
    clear();
    // Step 0 - Language: all three options must be Thai
    if (n == 0) {
        dlg(`<div style="display:flex;justify-content:center">
            <div style="width:100%;max-width:420px">
                <div style="text-align:center;margin-bottom:10px">${logo(56)}</div>
                    <h1 style="text-align:center">Windows 11</h1><br>
 <label class="f">Language to install</label><select id="s1">
     <option value="en">English (United States)</option>
         <option value="ja">Japanese (Japan)</option>
             <option value="zh">Chinese (Simplified, China)</option>
                 <option value="th">Thai (Thailand)</option></select>
 <label class="f">Time and currency format</label><select id="s2">
     <option value="en">English (United States)</option>
         <option value="ja">Japanese (Japan)</option>
             <option value="zh">Chinese (Simplified, China)</option>
                 <option value="th">Thai (Thailand)</option></select>
 <label class="f">Keyboard or input method</label><select id="s3">
     <option value="en">US</option>
         <option value="ja">Japanese</option>
             <option value="zh">Chinese (Simplified) - US</option>
                 <option value="th">Thai Kedmanee</option></select></div></div>`, nextBtn());
        const ss = [$('#s1'), $('#s2'), $('#s3')];
        ss.forEach(x => x.onchange = () => {
            x.classList.remove('bad');
            $('.err')?.remove();
        });
        $('#nx').onclick = () => {
            const bad = ss.filter(x => x.value != 'th');
            ss.forEach(x => x.classList.toggle('bad', x.value != 'th'));
            if (bad.length)
                return err('Incorrect selection. Language, time/currency format and keyboard must all be set to Thai. Please change the highlighted options and try again.');
            setup(1);
        };
    }
    // Step 1 - "Install now" screen
    if (n == 1) {
        dlg(`<div class="hero">${logo(80)}<h1 style="margin-top:6px;font-size:32px">Windows 11</h1><button class="big" id="nx">Install now</button><br><a class="l" onclick="alert('This is a simulation. No real repair is performed.')">Repair your computer</a></div>`);
        $('#nx').onclick = () => setup(2);
    }
    // Step 2 - Product key: no key is ever valid, only the skip link continues
    if (n == 2) {
        dlg(`<h1>Activate Windows</h1>
            <h2>If this is your first time installing, enter your product key (any 25 characters will do)</h2><input class="t" id="k" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" maxlength="29" style="letter-spacing:1px">
                <p style="margin-top:14px;font-size:12.5px;color:#666">Your product key is usually in the purchase confirmation email or on the Windows box.</p>
                    <p style="margin-top:20px"><a class="l" id="sk">I don’t have a product key</a></p>`, nextBtn());
        const k = $('#k');
        k.oninput = () => {
            let v = k.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 25);
            k.value = v.match(/.{1,5}/g)?.join('-') || '';
            $('.err')?.remove();
            k.classList.remove('bad');
        };
        $('#sk').onclick = () => setup(3);
        $('#nx').onclick = () => {
            const v = k.value.replace(/-/g, '');
            if (v.length < 25) {
                k.classList.add('bad');
                return err(v ? 'The product key is incomplete. A valid product key has 25 characters. If you don’t have one, select <b>I don’t have a product key</b>.' : 'No product key entered. If you don’t have a product key, select <b>I don’t have a product key</b> to continue.');
            }
            k.classList.add('bad');
            err('This product key isn’t valid and can’t be verified. Check the key and try again, or select <b>I don’t have a product key</b> to continue.');
        };
    }
    // Step 3 - Edition: only Windows 10 Home continues
    if (n == 3) {
        dlg(`<h1>Select the operating system you want to install</h1>
            <h2>&nbsp;</h2>
                <div class="list" id="ls">${['Windows 10 Home', 'Windows 10 Home Single Language', 'Windows 10 Education', 'Windows 10 Pro', 'Windows 11 Home', 'Windows 11 Pro'].map(x => `<div class="it"><span>${x}</span><span style="color:#777">x64</span></div>`).join('')}</div>`, nextBtn());
        let sel = null;
        $('#ls').onclick = e => {
            const t = e.target.closest('.it');
            if (t) {
                document.querySelectorAll('.it').forEach(x => x.classList.remove('on', 'bad'));
                t.classList.add('on');
                sel = t.firstChild.textContent;
                $('.err')?.remove();
            }
        };
        $('#nx').onclick = () => {
            if (sel != 'Windows 10 Home') {
                const t = document.querySelector('.it.on');
                t?.classList.add('bad');
                return err(sel ? `Cannot continue: “${sel}” is not the required edition. You must select <b>Windows 10 Home</b> to proceed.` : 'Cannot continue: no edition selected. You must select <b>Windows 10 Home</b> to proceed.');
            }
            setup(4);
        };
    }
    // Step 4 - License terms: must scroll to the bottom before Accept is enabled
    if (n == 4) {
        dlg(`<h1>Applicable notices and license terms</h1>
            <h2>Microsoft Windows Software License Terms</h2>
                <div id="lt" style="height:42%;overflow:auto;border:1px solid #ccc;background:#fff;padding:12px;font-size:12.5px;line-height:1.6;user-select:text">These license terms are an agreement between you and Microsoft Corporation (or one of its affiliates). Please read them carefully. They apply to the Windows software you install, any media you received it on, fonts, icons, and any updates and related services. By installing or using the software, you accept these terms…<br><br>(This text is a simulation for learning purposes only and is not the actual Microsoft license.)</div><label style="display:flex;gap:8px;margin-top:18px;cursor:pointer"><input type="checkbox" id="ck" disabled> I accept the license terms</label>
                    <p id="hint" style="font-size:12px;color:#666;margin-top:6px">Scroll to the bottom of the license terms to enable this option.</p>`, nextBtn('nx', 'Next', 'disabled'));
        const lt = $('#lt'), T = [
            'Definitions', 'Scope of License', 'Use Rights', 'Data Collection', 'Updates and Services', 'Restrictions', 'Third-Party Software', 'Warranty Disclaimer', 'Limitation of Liability', 'Governing Law'
        ];
        let h = '';
        for (let i = 1; i <= 80; i++)
            h += `<p style="margin-top:12px"><b>${i}. ${T[i % 10]}</b><br>(a) This section describes the terms that apply to the software and related services. You must comply with all applicable laws, and the rights granted here are limited to those expressly stated. (b) Microsoft and its suppliers reserve all other rights not expressly granted. (c) Nothing in this agreement gives you the right to use any Microsoft trademarks, logos or service marks, to reverse engineer the software except where permitted by law, or to work around any technical limitations in the software. (d) These terms are provided for simulation purposes only.</p>`;
        lt.insertAdjacentHTML('beforeend', h + '<p style="margin-top:16px"><b>— End of license terms —</b></p>');
        lt.onscroll = () => {
            if (lt.scrollTop + lt.clientHeight >= lt.scrollHeight - 6) {
                $('#ck').disabled = false;
                $('#hint').textContent = 'You have reached the end. You can now accept the license terms.';
            }
        };
        $('#ck').onchange = e => $('#nx').disabled = !e.target.checked;
        $('#nx').onclick = () => setup(5);
    }
    // Step 5 - Installation type: only Custom continues
    if (n == 5) {
        dlg(`<h1>Which type of installation do you want?</h1>
            <h2>&nbsp;</h2>
                <div class="list">
                    <div class="it" id="up" style="display:block;padding:16px;border-color:#ccc;margin-bottom:10px"><b>Upgrade: Install Windows and keep files, settings, and applications</b><br><small>Only available when running Setup from within an existing Windows.</small></div>
                        <div class="it" id="cu" style="display:block;padding:16px;border-color:#ccc"><b>Custom: Install Windows only (advanced)</b><br><small>Files, settings, and applications aren’t transferred to Windows.</small></div></div>`, nextBtn());
        let ch = null;
        $('.list').onclick = e => {
            const t = e.target.closest('.it');
            if (t) {
                document.querySelectorAll('.it').forEach(x => x.classList.remove('on', 'bad'));
                t.classList.add('on');
                ch = t.id;
                $('.err')?.remove();
            }
        };
        $('#nx').onclick = () => {
            if (ch != 'cu') {
                document.querySelector('.it.on')?.classList.add('bad');
                return err(ch == 'up' ? 'Upgrade can’t be used here because Setup was started from boot media, not from inside an existing Windows. You must select <b>Custom: Install Windows only (advanced)</b> to continue.' : 'No installation type selected. You must select <b>Custom: Install Windows only (advanced)</b> to continue.');
            }
            setup(6);
        };
    }
    // Step 6 - Disk partitioning (see partition())
    if (n == 6)
        partition();
    // Step 7 - Copy files (see install())
    if (n == 7)
        install();
}

/** Partition manager: Refresh / Delete / Format / New / Load driver / Extend */
function partition() {
    const T = 476.9, SYS = 100 / 1024, MSR = 16 / 1024;
    let parts = [], sel = null, mode = null;
    const fmt = g => g < 1 ? (g * 1024).toFixed(1) + ' MB' : g.toFixed(1) + ' GB';
    const un = () => Math.max(0, T - parts.reduce((a, p) => a + p.size, 0));
    const avail = () => Math.max(0, un() - (parts.length ? 0 : SYS + MSR));
    const rows = () => {
        const r = parts.map((p, i) => ({
            id: 'p' + i, name: 'Drive 0 Partition ' + (i + 1), size: p.size, free: p.size, type: p.type
        }));
        if (un() > .05)
            r.push({
                id: 'u', name: 'Drive 0 Unallocated Space', size: un(), free: un(), type: 'Unallocated'
            });
        return r;
    };
    const note = m => {
        const e = document.createElement('div');
        e.className = 'okn';
        e.textContent = m;
        $('.bd').prepend(e);
    };
    const modal = (msg, ok, cancel = true) => {
        const m = document.createElement('div');
        m.className = 'mod';
        m.innerHTML = `<div>
            <p style="margin-bottom:18px;line-height:1.5">${msg}</p>
                <div style="display:flex;justify-content:flex-end;gap:8px"><button class="b p" id="mo">OK</button>${cancel ? '<button class="b" id="mc">Cancel</button>' : ''}</div></div>`;
        $('.dlg').appendChild(m);
        $('#mo').onclick = () => {
            m.remove();
            ok && ok();
        };
        if (cancel)
            $('#mc').onclick = () => m.remove();
    };
    const render = (msg) => {
        const R = rows(), S = R.find(r => r.id == sel), isU = S?.type == 'Unallocated', isP = S?.type == 'Primary';
        const B = (a, t, d) => `<button class="b" data-a="${a}" ${d ? 'disabled' : ''}>${t}</button>`;
        dlg(`<h1>Where do you want to install Windows?</h1>
            <h2>&nbsp;</h2>
                <table>
                    <tr><th>Name</th><th>Total size</th><th>Free space</th><th>Type</th></tr>${R.map(r => `<tr data-i="${r.id}" class="${r.id == sel ? 'on' : ''}" style="cursor:pointer"><td>${r.name}</td><td>${fmt(r.size)}</td><td>${fmt(r.free)}</td><td>${r.type}</td></tr>`).join('')}</table>
  <div class="tools">${B('refresh', '🔄 Refresh')}${B('delete', '✖ Delete', !S || isU)}${B('format', '🧹 Format', !isP)}${B('new', '✚ New', !isU)}${B('driver', '💾 Load driver')}${B('extend', '↔ Extend', !(isP && un() > .05))}</div>
  ${mode ? `<div style="margin-top:12px;padding:12px;border:1px solid #ccc;background:#fff;border-radius:4px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span>${mode == 'new' ? 'Size (GB):' : 'Extend by (GB):'}</span><input class="t" id="sz" type="number" min="1" step="1" value="${Math.floor(mode == 'new' ? avail() : un())}" style="width:130px"><span style="color:#666;font-size:12.5px">Available: ${(mode == 'new' ? avail() : un()).toFixed(1)} GB${mode == 'new' ? ' · minimum 100 GB' : ''}</span><button class="b p" data-a="apply">Apply</button><button class="b" data-a="cancel">Cancel</button></div>` : ''}`, nextBtn());
        if (msg)
            note(msg);
        $('.bd').onclick = e => {
            const tr = e.target.closest('tr[data-i]');
            if (tr) {
                sel = tr.dataset.i;
                mode = null;
                return render();
            }
            const a = e.target.dataset.a;
            if (!a)
                return;
            if (a == 'refresh')
                render('Drive list refreshed.');
            if (a == 'driver')
                modal('No device drivers were found. Make sure that the installation media contains the correct drivers, and then click OK.', null, false);
            if (a == 'new') {
                mode = 'new';
                render();
            }
            if (a == 'extend') {
                mode = 'extend';
                render();
            }
            if (a == 'cancel') {
                mode = null;
                render();
            }
            if (a == 'format')
                modal('Formatting this partition will delete all data stored on it. To continue, click OK.', () => render('Partition formatted successfully.'));
            if (a == 'delete')
                modal('Deleting this partition will erase all data stored on it. To continue, click OK.', () => {
                    const i = +sel.slice(1);
                    parts.splice(i, 1);
                    if (!parts.some(p => p.type == 'Primary'))
                        parts = [];
                    sel = null;
                    mode = null;
                    render('Partition deleted.');
                });
            if (a == 'apply') {
                const v = parseFloat($('#sz').value);
                if (mode == 'extend') {
                    if (!(v > 0) || v > un())
                        return err('Invalid size. Enter a value between 1 and ' + un().toFixed(1) + ' GB.');
                    parts[+sel.slice(1)].size += v;
                    mode = null;
                    return render('Partition extended.');
                }
                if (!(v >= 100))
                    return err('The Windows partition must be <b>at least 100 GB</b>. Enter a size of 100 GB or more and click Apply again.');
                if (v > avail() + 1e-9)
                    return err('The size you entered is larger than the available space (' + avail().toFixed(1) + ' GB).');
                modal(parts.length ? 'Create a new partition of ' + v + ' GB?' : 'To ensure that all Windows features work correctly, Windows might create additional partitions for system files. Do you want to continue?', () => {
                    if (!parts.length)
                        parts.push({
                            size: SYS, type: 'System'
                        }, {
                            size: MSR, type: 'MSR (Reserved)'
                        });
                    parts.push({
                        size: v, type: 'Primary'
                    });
                    sel = 'p' + (parts.length - 1);
                    mode = null;
                    render('New partition created.');
                });
            }
        };
        $('#nx').onclick = () => {
            const S = rows().find(r => r.id == sel);
            if (!S)
                return err('No partition selected. Select a partition to install Windows on, or create one with <b>New</b> (at least 100 GB).');
            if (S.type == 'Unallocated')
                return err('Windows can’t be installed on unallocated space. Click <b>New</b>, enter a size of <b>at least 100 GB</b>, click <b>Apply</b> and confirm to create the partition.');
            if (S.type != 'Primary')
                return err('Windows can’t be installed on a ' + S.type + ' partition. Select the Primary partition.');
            if (S.size < 100)
                return err('The selected partition is smaller than 100 GB. Extend it or create a larger one.');
            setup(7);
        };
    };
    render();
}

/** Installation progress screen (percentage + phases) */
function install() {
    const ph = ['Copying Windows files', 'Getting files ready for installation', 'Installing features', 'Installing updates', 'Finishing up'], cut = [0, 28, 45, 70, 90, 100];
    dlg(`<h1>Installing Windows</h1>
        <h2>Please wait. Your computer may restart several times.</h2>
            <div class="pct" id="pc">0%</div>
                <div class="bar"><i id="br"></i></div>
                    <div class="steps" id="st"></div>`);
    let p = 0;
    (function tick() {
        p = Math.min(100, p + Math.random() * 2.6 + .4);
        const i = cut.findIndex((c, j) => p >= c && p < cut[j + 1]);
        $('#pc').textContent = Math.floor(p) + '%';
        $('#br').style.width = p + '%';
        $('#st').innerHTML = ph.map((t, j) => `<div class="${j < i || p >= 100 ? 'done' : j == i ? 'now' : ''}">${j < i || p >= 100 ? '✓' : j == i ? '●' : '○'} ${t}</div>`).join('');
        if (p < 100)
            later(tick, 130);
        else
            later(restartMsg, 900);
    })();
}

/** "Windows needs to restart" countdown */
function restartMsg() {
    let s = 8;
    dlg(`<div class="hero">
        <h1>Windows needs to restart</h1>
            <h2 id="cd"></h2>
                <div class="spin" style="margin:30px auto;border-color:#0002;border-top-color:#0067c0"></div></div>`, `<button class="b p" id="rs">Restart now</button>`);
    const go = () => boot(() => oobe(0), 3500);
    $('#rs').onclick = go;
    (function t() {
        $('#cd').textContent = `Restarting in ${s} seconds`;
        if (s-- <= 0)
            go();
        else
            later(t, 1000);
    })();
}

/** Out-of-box experience after reboot (region, keyboard, Wi-Fi, user name...) */
function oobe(n) {
    clear();
    const W = (h, sub, body, ft) => {
        app.innerHTML = `<div class="oobe">
            <div class="c">
                <h1>${h}</h1>
                    <h2 style="margin-bottom:12px">${sub || ''}</h2>${body}<div class="ft2">${ft || ''}</div></div></div>`;
    };
    const pick = (arr, sel) => `<div class="list" id="ls">${arr.map((x, i) => `<div class="it ${i == sel ? 'on' : ''}">${x}</div>`).join('')}</div>`;
    const bind = () => $('#ls').onclick = e => {
        const t = e.target.closest('.it');
        if (t) {
            document.querySelectorAll('#ls .it').forEach(x => x.classList.remove('on', 'bad'));
            t.classList.add('on');
            $('.err')?.remove();
        }
    };
    // Step 0 - Region: must be Thailand
    if (n == 0) {
        W('Is this the right country or region?', '', pick([
            'United States', 'Japan', 'Singapore', 'United Kingdom', 'South Korea', 'Thailand', 'Australia', 'Germany'
        ], 0), nextBtn('nx', 'Yes'));
        bind();
        $('#nx').onclick = () => {
            if ($('#ls .it.on')?.textContent != 'Thailand') {
                $('#ls .it.on')?.classList.add('bad');
                return err('Incorrect region. You must select <b>Thailand</b> to continue.');
            }
            oobe(1);
        };
    }
    // Step 1 - Keyboard: must be Thai Kedmanee
    if (n == 1) {
        W('Is this the right keyboard layout?', '', pick(['US', 'Thai Pattachote', 'Japanese', 'Thai Kedmanee'], 0), nextBtn('nx', 'Yes'));
        bind();
        $('#nx').onclick = () => {
            if ($('#ls .it.on')?.textContent != 'Thai Kedmanee') {
                $('#ls .it.on')?.classList.add('bad');
                return err('Incorrect keyboard layout. You must select <b>Thai Kedmanee</b> to continue.');
            }
            oobe(2);
        };
    }
    // Step 2 - Wi-Fi: every network fails, only "I don't have internet" continues
    if (n == 2) {
        W('Let’s connect you to a network', 'Choose the Wi-Fi network you want to use', pick(['📶 พวกเด็กเบียว “67”', '📶 LnwZaa777', '📶 ใครใช้ไวไฟ ขอให้คนเก่าไม่รัก', '📶 T-Tech 5.0 GHz'], -1) + `<div id="pp" style="display:none;margin:-6px 0 18px"><label class="f">Network security key</label><input class="t" id="pw" type="password" placeholder="Enter the password" style="max-width:100%"></div>`, `<button class="b" id="no">I don’t have internet</button>${nextBtn('nx', 'Connect')}`);
        bind();
        $('#ls').addEventListener('click', e => {
            if (e.target.closest('.it')) {
                $('#pp').style.display = 'block';
                $('#pw').focus();
            }
        });
        $('#no').onclick = () => oobe(3);
        $('#nx').onclick = () => {
            const s = $('#ls .it.on');
            if (!s)
                return err('Select a Wi-Fi network first, or choose “I don’t have internet”.');
            const nm = s.textContent.slice(2).trim();
            if (!$('#pw').value)
                return err('Enter the network security key for “' + esc(nm) + '” first.');
            err('<b>คุณมีรหัสรึไง!!!</b> Can’t connect to this network.');
        };
    }
    // Step 3 - User name: 8-12 chars, needs a-z, A-Z and . or _
    if (n == 3) {
        W('Who’s going to use this device?', 'Choose a name for your local user account', '<input class="t" id="nm" placeholder="e.g. John_Smith" style="margin-bottom:12px"><div style="font-size:13px;line-height:1.8;color:#333;background:#fffa;border-radius:6px;padding:12px 16px;margin-bottom:22px"><b>เกณฑ์การตั้งชื่อ (ต้องถูกต้องครบทั้ง 5 ข้อ)</b><br>1. ความยาว 8–12 ตัวอักษร<br>2. ต้องมีตัวพิมพ์เล็ก <code>a–z</code> อย่างน้อย 1 ตัว<br>3. ต้องมีตัวพิมพ์ใหญ่ <code>A–Z</code> อย่างน้อย 1 ตัว<br>4. ต้องมีจุด <code>.</code> หรือขีดล่าง <code>_</code> อย่างน้อย 1 ตัว<br>5. ห้ามมีอักขระพิเศษอื่น เช่น <code>&amp;</code> <code>=</code> <code>&#39;</code> <code>-</code> <code>+</code> <code>,</code> <code>&lt;</code> <code>&gt;</code> และห้ามมีช่องว่าง<br><span style="color:#2e7d32">✅ ตัวอย่างที่ถูกต้อง:</span> <code>John_Smith</code>, <code>Somchai.Ab</code>, <code>Lnw.Zaa777</code><br><span style="color:#a4262c">⛔ ตัวอย่างที่ผิด:</span> <code>john_smith</code> (ไม่มีตัวพิมพ์ใหญ่), <code>JOHN.SMITH</code> (ไม่มีตัวพิมพ์เล็ก), <code>Jo_Ab</code> (สั้นเกินไป), <code>John-Smith1</code> (มี -), <code>John Smith_</code> (มีช่องว่าง)</div>', nextBtn('nx', 'Next', 'disabled'));
        const i = $('#nm');
        i.oninput = () => {
            $('.err')?.remove();
            i.classList.remove('bad');
            $('#nx').disabled = !i.value.trim();
        };
        i.focus();
        $('#nx').onclick = () => {
            const v = i.value, P = [], bad = [...new Set(v.match(/[^A-Za-z0-9._]/g) || [])];
            if (v.length < 8 || v.length > 12)
                P.push('Length must be 8–12 characters (yours: ' + v.length + ').');
            if (!/[a-z]/.test(v))
                P.push('Missing a lowercase letter (a–z).');
            if (!/[A-Z]/.test(v))
                P.push('Missing an uppercase letter (A–Z).');
            if (!/[._]/.test(v))
                P.push('Missing a dot (.) or an underscore (_).');
            if (bad.length)
                P.push('Contains characters that are not allowed: <b>' + bad.map(c => c == ' ' ? '(space)' : esc(c)).join(' ') + '</b>');
            if (P.length) {
                i.classList.add('bad');
                return err('<b>Invalid user name:</b><br>• ' + P.join('<br>• '));
            }
            user = v;
            oobe(4);
        };
    }
    // Step 4 - Privacy toggles
    if (n == 4) {
        const sw = ['Location', 'Find my device', 'Diagnostic data', 'Tailored experiences', 'Relevant ads'];
        W('Choose privacy settings for your device', 'You can change these settings anytime', sw.map(s => `<div class="sw">${s}<div class="tg"></div></div>`).join('') + '<br>', nextBtn('nx', 'Accept'));
        document.querySelectorAll('.tg').forEach(t => t.onclick = () => t.classList.toggle('off'));
        $('#nx').onclick = () => oobe(5);
    }
    // Step 5 - "Hi <name>" screen, then the desktop
    if (n == 5) {
        const m = ['Hi ' + esc(user), 'This might take several minutes. Please don’t turn off your PC', 'Setting up your apps', 'Almost there'];
        app.innerHTML = `<div class="oobe" style="background:#0067c0;color:#fff">
            <div style="text-align:center">
                <h1 id="mg" style="font-size:34px;font-weight:400"></h1>
                    <div class="spin" style="margin:40px auto"></div></div></div>`;
        m.forEach((x, i) => later(() => $('#mg').innerHTML = x, i * 2200));
        later(desktop, m.length * 2200);
    }
}
let z = 10;

/** Desktop: wallpaper, icons, taskbar, clock */
function desktop() {
    clear();
    app.innerHTML = `<div class="desk" id="dk">
        <div class="icons">${[
        ['♻️', 'Recycle Bin'], ['💻', 'This PC'], ['📁', 'Documents']
    ].map(i => `<div class="ic" data-a="${i[1]}"><b>${i[0]}</b>${i[1]}</div>`).join('')}</div>
 <div class="tbar" id="tb">
     <div class="rst" id="rst">↺ Restart training</div>
         <div class="tbi" id="sb">${logo(20)}</div>
             <div class="tbi">🔍</div>
                 <div class="tbi" data-a="file">📁</div>
                     <div class="tbi" data-a="web">🌐</div>
                         <div class="tbi" data-a="note">📝</div>
                             <div class="tbi" data-a="set">⚙️</div>
 <div class="tray"><span>^ 📶 🔊 🔋</span><span id="ck"></span></div></div></div>`;
    const clk = () => {
        const d = new Date();
        $('#ck').innerHTML = d.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit'
        }) + '<br>' + d.toLocaleDateString('en-US');
    };
    clk();
    clearInterval(window._c);
    window._c = setInterval(clk, 10000);
    const apps = {
        file: ['📁', 'File Explorer', explorer], web: ['🌐', 'Microsoft Edge', () => `<h2 style="color:#222">🌐 Microsoft Edge</h2>
            <p>Welcome to Edge! This is a simulated browser for this simulator.</p><br><input class="t" placeholder="Search or enter web address" style="max-width:100%">`], note: ['📝', 'Notepad', () => `<textarea placeholder="Type here…"></textarea>`], set: ['⚙️', 'Settings', about],
        'Recycle Bin': ['♻️', 'Recycle Bin', () => '<p style="color:#777">Recycle Bin is empty</p>'], 'This PC': ['💻', 'This PC', explorer], 'Documents': ['📁', 'Documents', explorer]
    };
    const open = k => {
        const a = apps[k];
        if (a) {
            win(a[0], a[1], a[2]());
            $('#sm')?.remove();
        }
    };
    $('#dk').addEventListener('dblclick', e => {
        const t = e.target.closest('.ic');
        if (t)
            open(t.dataset.a);
    });
    $('#tb').addEventListener('click', e => {
        const t = e.target.closest('[data-a]');
        if (t)
            open(t.dataset.a);
    });
    $('#rst').onclick = home;
    $('#sb').onclick = e => {
        e.stopPropagation();
        const o = $('#sm');
        if (o)
            return o.remove();
        startMenu(open);
    };
    $('#dk').addEventListener('pointerdown', e => {
        if (!e.target.closest('.start,#sb'))
            $('#sm')?.remove();
    });
}

/** Content of the File Explorer window */
function explorer() {
    return ['🖥️ Desktop', '📄 Documents', '⬇️ Downloads', '🖼️ Pictures', '🎵 Music', '💽 Local Disk (C:) — 476 GB'].map(x => `<div class="row">${x}</div>`).join('');
}

/** Content of Settings > System > About */
function about() {
    return `<h2 style="color:#222">System › About</h2><br>
        <div style="font-size:15px;line-height:2"><b>${esc(user)}</b><br>Device name: DESKTOP-SIM11<br>Processor: Intel(R) Core(TM) i7 @ 3.40GHz<br>Installed RAM: 16.0 GB<br>System type: 64-bit operating system<hr style="margin:10px 0;border:0;border-top:1px solid #ddd"><b>Windows specifications</b><br>Edition: Windows 10 Home<br>Installed on: ${new Date().toLocaleDateString('en-US')}</div>`;
}

/** Create a draggable window (title bar, minimize / maximize / close) */
function win(ic, t, body, w = 560, h = 380) {
    const d = document.createElement('div');
    d.className = 'win';
    const o = (tm.length % 5) * 28;
    Object.assign(d.style, {
        width: Math.min(w, innerWidth - 10) + 'px', height: Math.min(h, innerHeight - 80) + 'px', left: Math.max(0, (innerWidth - w) / 2 + o - 60) + 'px', top: (50 + o) + 'px', zIndex: ++z
    });
    d.innerHTML = `<div class="wt">
        <div>${ic} ${t}</div><span><button class="m">—</button><button class="r">☐</button><button class="x">✕</button></span></div>
            <div class="wb">${body}</div>`;
    $('#dk').appendChild(d);
    tm.push(0);
    d.onpointerdown = () => d.style.zIndex = ++z;
    d.querySelector('.x').onclick = () => d.remove();
    d.querySelector('.m').onclick = () => d.remove();
    d.querySelector('.r').onclick = () => d.classList.toggle('max');
    const bar = d.querySelector('.wt');
    bar.onpointerdown = e => {
        if (e.target.closest('button') || d.classList.contains('max'))
            return;
        const dx = e.clientX - d.offsetLeft, dy = e.clientY - d.offsetTop;
        bar.setPointerCapture(e.pointerId);
        bar.onpointermove = m => {
            d.style.left = m.clientX - dx + 'px';
            d.style.top = Math.max(0, m.clientY - dy) + 'px';
        };
        bar.onpointerup = () => bar.onpointermove = null;
    };
    bar.ondblclick = () => d.classList.toggle('max');
}

/** Start menu with Shut down / Restart */
function startMenu(open) {
    const m = document.createElement('div');
    m.className = 'start';
    m.id = 'sm';
    m.onpointerdown = e => e.stopPropagation();
    const ap = [
        ['🌐', 'Edge', 'web'], ['📁', 'Explorer', 'file'], ['📝', 'Notepad', 'note'], ['⚙️', 'Settings', 'set'], ['💻', 'This PC', 'This PC'], ['♻️', 'Recycle Bin', 'Recycle Bin'], ['🧮', 'Calculator', 'note'], ['📷', 'Camera', 'note'], ['🎵', 'Music', 'note'], ['🗓️', 'Calendar', 'note'], ['✉️', 'Mail', 'web'], ['🛒', 'Store', 'web']
    ];
    m.innerHTML = `<div class="sb">🔍 Type here to search</div>
        <h3>Pinned</h3>
            <div class="grid">${ap.map(a => `<div class="ap" data-k="${a[2]}"><b>${a[0]}</b>${a[1]}</div>`).join('')}</div>
                <h3>Recommended</h3>
                    <div style="padding:0 34px;color:#666;font-size:12.5px">No recent items</div>
 <div class="bt"><span>👤 ${esc(user)}</span><span class="pw" id="pw">⏻<div class="pm" id="pmn" style="display:none">
     <div data-p="s">Shut down</div>
         <div data-p="r">Restart</div></div></span></div>`;
    $('#dk').appendChild(m);
    m.querySelector('.grid').onclick = e => {
        const t = e.target.closest('.ap');
        if (t)
            open(t.dataset.k);
    };
    $('#pw').onclick = () => {
        const p = $('#pmn');
        p.style.display = p.style.display == 'none' ? 'block' : 'none';
    };
    $('#pmn').onclick = e => {
        const p = e.target.dataset.p;
        if (p == 'r')
            boot(() => setup(0), 2800);
        if (p == 's') {
            clear();
            app.innerHTML = '<div style="height:100%;background:#000;display:flex;align-items:center;justify-content:center;color:#888;cursor:pointer" onclick="location.reload()">Powered off — click to turn on</div>';
        }
    };
}

/** Power-on screen: the initial state, also used by the "Restart training" button */
function home() {
    clear();
    user = 'User';
    clearInterval(window._c);
    app.innerHTML = `<div class="boot" style="gap:30px">
        <div style="font:22px Consolas,monospace;color:#aaa;text-align:center;line-height:1.8">Windows 11 Installation Simulator<br>Press the button below to “boot from USB”</div><button class="b p" id="go" style="font-size:22px;padding:12px 48px">▶ Power on</button></div>`;
    $('#go').onclick = () => {
        document.documentElement.requestFullscreen?.().catch(() => {
        });
        boot(() => setup(0), 3000);
    };
}
home();

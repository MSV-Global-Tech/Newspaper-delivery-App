const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function replaceInFile(filePath, search, replace) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content.split(search).join(replace);
  if (content !== updated) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`  Updated: ${path.basename(filePath)}`);
  }
}

// Windows-safe folder rename using xcopy + rmdir
function renameFolder(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) return false;
  if (fs.existsSync(newPath)) {
    console.log(`  Skipped: ${path.basename(newPath)} already exists`);
    return true;
  }
  // Use xcopy to copy all contents, then delete old folder
  try {
    execSync(`xcopy "${oldPath}" "${newPath}" /E /I /H /Y`, { stdio: 'pipe' });
    execSync(`rmdir /S /Q "${oldPath}"`, { stdio: 'pipe' });
    console.log(`✓ Renamed ${path.basename(oldPath)} → ${path.basename(newPath)}`);
    return true;
  } catch (e) {
    console.error(`✗ Failed to rename ${path.basename(oldPath)}: ${e.message}`);
    return false;
  }
}

function walkAndFix(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walkAndFix(full);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      replaceInFile(full, '/(bottom_nav)/', '/bottom_nav/');
      replaceInFile(full, '/(tabs)/', '/bottom_nav/');
    }
  }
}

const appDir = path.join(__dirname, 'app');

// ── Step 1: Rename (bottom_nav) → bottom_nav (already done, skip if needed) ──
const oldBN = path.join(appDir, '(customer)', 'bottom_nav'); // already renamed in prev run
const oldBN2 = path.join(appDir, '(customer)', '(bottom_nav)');
// Check if (bottom_nav) still exists and rename
if (fs.existsSync(oldBN2)) renameFolder(oldBN2, path.join(appDir, '(customer)', 'bottom_nav'));
if (fs.existsSync(path.join(appDir, '(customer)', 'bottom_nav'))) {
  console.log('✓ bottom_nav already in place inside (customer)');
}

// ── Step 2: Rename (customer) → customer ─────────────────────────────────────
renameFolder(path.join(appDir, '(customer)'), path.join(appDir, 'customer'));

// ── Step 3: Rename (admin) → admin ───────────────────────────────────────────
renameFolder(path.join(appDir, '(admin)'), path.join(appDir, 'admin'));

// ── Step 4: Rename [id].tsx files ────────────────────────────────────────────

function renameFile(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) return;
  fs.renameSync(oldPath, newPath);
  console.log(`✓ Renamed ${path.basename(oldPath)} → ${path.basename(newPath)}`);
}

const delivOld = path.join(appDir, 'customer', 'delivery', '[id].tsx');
const delivNew = path.join(appDir, 'customer', 'delivery', '[delivery_id].tsx');
renameFile(delivOld, delivNew);
if (fs.existsSync(delivNew)) {
  replaceInFile(delivNew, 'useLocalSearchParams<{ id: string }>()', 'useLocalSearchParams<{ delivery_id: string }>()');
  replaceInFile(delivNew, 'const { id }', 'const { delivery_id }');
  replaceInFile(delivNew, 'item.id === id', 'item.id === delivery_id');
  replaceInFile(delivNew, '}, [id])', '}, [delivery_id])');
  replaceInFile(delivNew, "from '../../utils/store'", "from '../../../utils/store'");
}

const newsOld = path.join(appDir, 'customer', 'newspaper', '[id].tsx');
const newsNew = path.join(appDir, 'customer', 'newspaper', '[newspaper_id].tsx');
renameFile(newsOld, newsNew);
if (fs.existsSync(newsNew)) {
  replaceInFile(newsNew, 'useLocalSearchParams<{ id: string }>()', 'useLocalSearchParams<{ newspaper_id: string }>()');
  replaceInFile(newsNew, 'const { id }', 'const { newspaper_id }');
  replaceInFile(newsNew, '`/subscribe/${id}`', '`/subscribe/${newspaper_id}`');
  replaceInFile(newsNew, '}, [id])', '}, [newspaper_id])');
  replaceInFile(newsNew, " === id", " === newspaper_id");
  replaceInFile(newsNew, "from '../../utils/store'", "from '../../../utils/store'");
}

const subOld = path.join(appDir, 'customer', 'subscribe', '[id].tsx');
const subNew = path.join(appDir, 'customer', 'subscribe', '[subscription_id].tsx');
renameFile(subOld, subNew);
if (fs.existsSync(subNew)) {
  replaceInFile(subNew, 'useLocalSearchParams<{ id: string }>()', 'useLocalSearchParams<{ subscription_id: string }>()');
  replaceInFile(subNew, 'const { id }', 'const { subscription_id }');
  replaceInFile(subNew, '}, [id])', '}, [subscription_id])');
  replaceInFile(subNew, " === id", " === subscription_id");
  replaceInFile(subNew, "from '../../utils/store'", "from '../../../utils/store'");
}

// ── Step 5: Fix all router paths ─────────────────────────────────────────────
walkAndFix(path.join(appDir, 'customer'));
walkAndFix(path.join(appDir, 'admin'));

replaceInFile(path.join(appDir, 'index.tsx'), "'/(tabs)/home'", "'/bottom_nav/home'");
replaceInFile(path.join(appDir, 'index.tsx'), "'/(bottom_nav)/home'", "'/bottom_nav/home'");

// ── Step 6: Fix login route references ───────────────────────────────────────
const loginPath = path.join(appDir, 'customer', 'login.tsx');
replaceInFile(loginPath, "'/(tabs)/home'", "'/bottom_nav/home'");
replaceInFile(loginPath, "'/(bottom_nav)/home'", "'/bottom_nav/home'");

// ── Step 7: Fix admin tab import ─────────────────────────────────────────────
const adminTab = path.join(appDir, 'customer', 'bottom_nav', 'admin.tsx');
replaceInFile(adminTab, "import AdminScreen from '../admin';", "import AdminScreen from '../../admin/admin_dashboard';");

// ── Step 8: Fix root _layout.tsx ─────────────────────────────────────────────
const rootLayout = path.join(appDir, '_layout.tsx');
replaceInFile(rootLayout, 'name="(tabs)"', 'name="bottom_nav"');
replaceInFile(rootLayout, 'name="login"', 'name="customer/login"');
replaceInFile(rootLayout, 'name="newspapers"', 'name="customer/newspapers"');
replaceInFile(rootLayout, 'name="newspaper/[id]"', 'name="customer/newspaper/[newspaper_id]"');
replaceInFile(rootLayout, 'name="subscribe/[id]"', 'name="customer/subscribe/[subscription_id]"');

// ── Step 9: Fix delivery route in admin dashboard ─────────────────────────────
const adminDash = path.join(appDir, 'admin', 'admin_dashboard.tsx');
replaceInFile(adminDash, '`/delivery/${item.id}`', '`/customer/delivery/${item.id}`');
replaceInFile(adminDash, "'/delivery/'", "'/customer/delivery/'");

console.log('\n✅ Restructure complete!');
console.log('\nNew structure:');
console.log('   app/');
console.log('     customer/');
console.log('       bottom_nav/  ← tabs (home, papers, calendar, profile, admin)');
console.log('       delivery/[delivery_id].tsx');
console.log('       newspaper/[newspaper_id].tsx');
console.log('       subscribe/[subscription_id].tsx');
console.log('       login.tsx | newspapers.tsx | manage_subscription.tsx');
console.log('     admin/');
console.log('       admin_dashboard.tsx');
console.log('     index.tsx | _layout.tsx');

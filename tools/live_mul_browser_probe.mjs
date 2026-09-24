#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const chunkPath = path.join(repoRoot, 'src', 'data', 'mul', 'mul_ids_0_to_149.json');
const backupPath = `${chunkPath}.bak`;
const defaultIds = [1, 2, 6, 10];

function parseNumericId(value) {
  if (value === null || value === undefined || value === false || value === true) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Number(value);
  if (typeof value === 'string') {
    const match = value.match(/-?\d+/);
    return match ? Number(match[0]) : null;
  }
  return null;
}

function isLikelyCloudflareBlock(pageText = '') {
  const text = pageText.toLowerCase();
  return text.includes('just a moment') || text.includes('cloudflare') || text.includes('security verification');
}

async function loadJsonArray(filePath) {
  const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
  if (!Array.isArray(payload)) {
    throw new Error(`${filePath} does not contain a JSON array.`);
  }
  return payload;
}

function findChunkEntry(items, targetId) {
  return items.find((item) => {
    if (!item || typeof item !== 'object') return false;
    return parseNumericId(item.Id) === targetId;
  });
}

function upsertChunkEntry(items, liveRecord) {
  const targetId = parseNumericId(liveRecord?.Id);
  if (targetId === null) {
    return items;
  }

  const index = items.findIndex((item) => {
    if (!item || typeof item !== 'object') return false;
    return parseNumericId(item.Id) === targetId;
  });

  const merged = { ...liveRecord, Id: targetId };
  if (index >= 0) {
    items[index] = merged;
  } else {
    items.push(merged);
  }
  return items;
}

async function saveChunkIfNeeded(items, apply) {
  if (!apply) {
    console.log('Dry-run only: no file changes were written.');
    return;
  }

  await fs.copyFile(chunkPath, backupPath).catch(() => undefined);
  await fs.writeFile(chunkPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  console.log(`Updated ${chunkPath} with ${items.length} entries. Backup saved to ${backupPath}`);
}

async function searchPageForId(page, targetId) {
  const bodyText = await page.locator('body').innerText();
  if (isLikelyCloudflareBlock(bodyText)) {
    throw new Error('Cloudflare challenge blocked the live site request.');
  }

  const selectors = [
    'input[type="search"]',
    'input[placeholder*="Search" i]',
    'input[aria-label*="Search" i]',
    'input[name*="search" i]',
    'input[name*="unit" i]',
    'input'
  ];

  for (const selector of selectors) {
    const field = page.locator(selector).first();
    if ((await field.count()) === 0) continue;

    try {
      await field.fill(String(targetId));
      await field.press('Enter');
      await page.waitForTimeout(1500);
      break;
    } catch {
      // Try the next selector if the field is not usable.
    }
  }

  await page.waitForTimeout(2000);

  const extracted = await page.evaluate(() => {
    const textCandidates = [];
    const directText = document.body.innerText || '';
    const forms = Array.from(document.querySelectorAll('form, input, button, a, tr, li, div'));

    for (const element of forms) {
      const text = (element.textContent || '').trim();
      if (!text) continue;
      const lower = text.toLowerCase();
      if (lower.includes('unit') || lower.includes('mech') || lower.includes('battle')) {
        textCandidates.push(text);
      }
    }

    const nodes = Array.from(document.querySelectorAll('tr, li, a, div, td, p'));
    const rows = nodes
      .map((node) => {
        const text = (node.textContent || '').trim();
        if (!text) return null;
        const idMatch = text.match(/#?\s*(\d+)/);
        return {
          text,
          id: idMatch ? Number(idMatch[1]) : null,
          href: node instanceof HTMLAnchorElement ? node.href : null,
        };
      })
      .filter(Boolean);

    return { directText, rows: rows.slice(0, 80), candidateText: textCandidates.slice(0, 40) };
  });

  const directText = extracted.directText || '';
  if (isLikelyCloudflareBlock(directText)) {
    throw new Error('Cloudflare challenge blocked the live site request.');
  }

  const match = extracted.rows.find((row) => row && row.id === targetId);
  if (match) {
    return {
      Id: targetId,
      Name: (match.text || '').replace(new RegExp(`^.*?${targetId}.*?`, 'i'), '').trim() || `Unit ${targetId}`,
      rawText: match.text,
      href: match.href,
    };
  }

  const searchText = directText || '';
  if (searchText && searchText.includes(String(targetId))) {
    return {
      Id: targetId,
      Name: `Likely matching result for unit ${targetId}`,
      rawText: searchText.slice(0, 500),
    };
  }

  return null;
}

async function run() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  const idsRaw = args.has('--ids') ? process.argv[process.argv.indexOf('--ids') + 1] : defaultIds.join(',');
  const ids = idsRaw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));

  if (ids.length === 0) {
    console.error('No valid target ids were supplied. Example: --ids 1,2,6,10');
    process.exit(1);
  }

  console.log(`Targeting Ids: ${ids.join(', ')}`);
  console.log(`Apply mode: ${apply ? 'enabled' : 'dry-run only'}`);

  try {
    const existing = await loadJsonArray(chunkPath);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      const response = await page.goto('https://masterunitlist.battletech.com', {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      const baseText = await page.locator('body').innerText();
      console.log('Initial page status:', response ? response.status() : 'no-response');
      console.log('Initial page title:', await page.title());

      if (response && response.status() === 403 || isLikelyCloudflareBlock(baseText)) {
        throw new Error('Cloudflare challenge blocked access to the live site from this environment.');
      }

      const results = [];
      for (const targetId of ids) {
        const row = await searchPageForId(page, targetId);
        results.push({ targetId, row });
      }

      console.log('Live results:', JSON.stringify(results, null, 2));

      if (!apply) {
        console.log('No chunk file was modified because --apply was not set.');
        return;
      }

      const nextItems = [...existing];
      for (const item of results) {
        if (!item.row) {
          console.warn(`No record found for Id ${item.targetId}.`);
          continue;
        }
        upsertChunkEntry(nextItems, item.row);
      }

      await fs.copyFile(chunkPath, backupPath).catch(() => undefined);
      await fs.writeFile(chunkPath, `${JSON.stringify(nextItems, null, 2)}\n`, 'utf8');
      console.log(`Updated ${chunkPath} with fresh live data for ${ids.length} ids.`);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Unable to complete browser-driven MUL lookup.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

await run();

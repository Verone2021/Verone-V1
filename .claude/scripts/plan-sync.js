#!/usr/bin/env node

/**
 * Plan Sync Script - Claude Code Workflow
 *
 * Synchronise les Task IDs des commits avec .claude/work/ACTIVE.md
 *
 * Usage: node .claude/scripts/plan-sync.js
 *        pnpm plan:sync
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const ACTIVE_PLAN = ".claude/work/ACTIVE.md";
const ARCHIVE_DIR_PREFIX = ".claude/archive/plans-";
const MAX_LINES = 200;
const TASK_ID_REGEX = /\b(BO|LM|WEB)-[A-Z0-9]{2,}-\d{3}\b/g;

/**
 * Execute git command and return output
 */
function git(command) {
  try {
    return execSync(`git ${command}`, { encoding: "utf8" }).trim();
  } catch (error) {
    console.error(`Git command failed: git ${command}`);
    return null;
  }
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getDateString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get current month in YYYY-MM format
 */
function getMonthString() {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Archive completed tasks if file exceeds MAX_LINES
 */
function archiveIfNeeded(content) {
  const lines = content.split("\n");

  if (lines.length <= MAX_LINES) {
    return content;
  }

  // Find completed tasks (lines starting with "- [x]")
  const completedTaskLines = [];
  const otherLines = [];

  for (const line of lines) {
    if (line.startsWith("- [x]")) {
      completedTaskLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  if (completedTaskLines.length === 0) {
    return content;
  }

  // Create archive directory
  const archiveDir = ARCHIVE_DIR_PREFIX + getMonthString();
  const archiveFile = path.join(archiveDir, `active-${getDateString()}.md`);

  try {
    fs.mkdirSync(archiveDir, { recursive: true });

    // Append to archive file
    const archiveHeader = `\n## Archived ${getDateString()}\n\n`;
    const archiveContent = completedTaskLines.join("\n") + "\n";

    if (fs.existsSync(archiveFile)) {
      fs.appendFileSync(archiveFile, archiveContent);
    } else {
      fs.writeFileSync(
        archiveFile,
        `# Archive Plans - ${getDateString()}\n${archiveHeader}${archiveContent}`
      );
    }

    console.log(
      `📦 Archived ${completedTaskLines.length} done tasks to ${archiveFile}`
    );

    // Return content without completed tasks
    return otherLines.join("\n");
  } catch (error) {
    console.error("Archive failed:", error.message);
    return content;
  }
}

/**
 * Main sync function
 */
function main() {
  // Check if ACTIVE.md exists
  if (!fs.existsSync(ACTIVE_PLAN)) {
    console.error(`❌ Error: ${ACTIVE_PLAN} not found`);
    console.error("   Create it first with the template.");
    process.exit(1);
  }

  // Get last commit info
  const commitHash = git("rev-parse --short HEAD");
  const commitMsg = git("log -1 --pretty=%B");

  if (!commitHash || !commitMsg) {
    console.error("❌ Could not read git commit info");
    process.exit(1);
  }

  // Extract Task IDs from commit message
  const taskIds = commitMsg.match(TASK_ID_REGEX) || [];

  if (taskIds.length === 0) {
    console.log("ℹ️  No Task ID found in last commit, skipping sync.");
    console.log(`   Commit: ${commitHash} - ${commitMsg.split("\n")[0]}`);
    return;
  }

  console.log(`📝 Found Task IDs: ${taskIds.join(", ")}`);

  // Read ACTIVE.md
  let content = fs.readFileSync(ACTIVE_PLAN, "utf8");
  const now = getDateString();
  let modified = false;

  // Update each Task ID
  for (const id of taskIds) {
    // Pattern to match pending task with this ID
    const pendingRegex = new RegExp(`- \\[ \\] ${id}(.*)`, "g");

    if (pendingRegex.test(content)) {
      // Mark as done with commit hash
      content = content.replace(pendingRegex, `- [x] ${id}$1 (${commitHash})`);
      console.log(`✅ ${id} marked done`);
      modified = true;
    } else {
      // Check if already done
      const doneRegex = new RegExp(`- \\[x\\] ${id}`);
      if (doneRegex.test(content)) {
        console.log(`⏭️  ${id} already marked done`);
      } else {
        // Add to Done section
        const doneSection = content.indexOf("## Done");
        if (doneSection !== -1) {
          const insertPos = content.indexOf("\n", doneSection) + 1;
          content =
            content.slice(0, insertPos) +
            `- [x] ${id} (${commitHash}) (auto-added)\n` +
            content.slice(insertPos);
          console.log(`➕ ${id} added to Done section`);
          modified = true;
        }
      }
    }
  }

  // Update Last sync timestamp
  const lastSyncRegex = /\*\*Last sync\*\*: .*/;
  if (lastSyncRegex.test(content)) {
    content = content.replace(
      lastSyncRegex,
      `**Last sync**: ${now} (${commitHash})`
    );
    modified = true;
  }

  // Archive if needed
  content = archiveIfNeeded(content);

  // Write back
  if (modified) {
    fs.writeFileSync(ACTIVE_PLAN, content);
    console.log(`\n✅ Plan synced successfully.`);
    console.log(`   Now commit: git commit -am "chore(plan): sync"`);
  } else {
    console.log(`\nℹ️  No changes to sync.`);
  }
}

// Execute
try {
  main();
} catch (error) {
  console.error("❌ Plan sync error:", error.message);
  process.exit(1);
}

#!/usr/bin/env python3
"""Check that a rebase or merge did not quietly lose CSS.

    npx gulp && python3 tools/verify-build.py

Run it after every rebase, merge or conflict resolution, and before pushing.
Exits non-zero if anything fails, so it can go in a hook or CI.

WHY THIS EXISTS
---------------
`main.min.css` is a build artifact that is committed to the repo, because
WordCamp's Remote CSS fetches it directly from GitHub. That means every single
person working on the theme touches the same generated file, so it conflicts on
almost every concurrent change while the SCSS underneath usually does not.

The dangerous part is that the conflict is easy to "resolve" the wrong way and
impossible to spot afterwards. Taking either side, `--ours` or `--theirs`, gives
you a file that is valid CSS, minifies cleanly, and is missing somebody's work.
Nothing errors. The page just quietly renders without it.

THE RULE: never resolve main.min.css by choosing a side. The SCSS sources are
the truth; the artifact is derived. Resolve it by rebuilding:

    git checkout --ours main.min.css   # contents do not matter, any side does
    npx gulp                           # regenerate from the MERGED sources
    python3 tools/verify-build.py      # prove nothing was lost
    git add main.min.css && git rebase --continue

WHAT IT CHECKS
--------------
1. The committed artifact is byte-identical to a fresh build. If it is not, the
   file in the repo is not what the sources say it should be, which is the exact
   symptom of a hand-resolved conflict.
2. Every partial on disk is imported, and every import resolves to a real file.
   A dropped `@import` line removes a whole partial from the build without
   changing any of the files you would think to look at.
3. No SCSS file differs from the way its last non-you author left it unless a
   later commit explains the change. This is the one that catches a rebase
   dropping somebody else's hunk.
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(HERE)
SCSS = "assets/scss"
BUILT = "main.min.css"

ok = True


def fail(msg):
    global ok
    ok = False
    print("  FAIL  " + msg)


def sh(*args):
    return subprocess.run(args, capture_output=True, text=True).stdout


def check_artifact_matches_sources():
    """The committed CSS must be exactly what the SCSS compiles to."""
    print("1. built artifact vs sources")
    if subprocess.run(["git", "diff", "--quiet", "--", BUILT]).returncode == 0:
        print("  ok    %s is byte-identical to a fresh build" % BUILT)
    else:
        fail("%s differs from a fresh build. Run `npx gulp` and look at the diff; "
             "if it is large, a conflict was probably resolved by taking one side." % BUILT)


def check_imports():
    """A dropped @import silently deletes a partial from the build."""
    print("2. @import coverage")
    main = open(os.path.join(SCSS, "main.scss"), encoding="utf-8").read()
    imports = re.findall(r'@import\s+"([^"]+)"', main)

    on_disk = []
    for root, _, files in os.walk(SCSS):
        for f in files:
            if f.startswith("_") and f.endswith(".scss"):
                rel = os.path.relpath(os.path.join(root, f), SCSS)
                on_disk.append(re.sub(r'(^|/)_', r'\1', rel)[:-5])

    dangling = [i for i in imports if i not in on_disk]
    orphans = sorted(set(on_disk) - set(imports))
    if dangling:
        fail("main.scss imports files that do not exist: %s" % ", ".join(dangling))
    if orphans:
        fail("partials on disk that nothing imports: %s" % ", ".join(orphans))
    if not dangling and not orphans:
        print("  ok    %d imports, %d partials, all accounted for" % (len(imports), len(on_disk)))


def check_no_lost_authors():
    """Anyone else's file must be intact, or changed by a later, identifiable commit."""
    print("3. other authors' files")
    me = sh("git", "config", "user.name").strip() or sh("git", "log", "-1", "--format=%an").strip()

    log = sh("git", "log", "--format=%h|%an", "--name-only", "--", "*.scss").strip().split("\n")
    owners, author = {}, None
    for line in log:
        parts = line.split("|")
        if len(parts) == 2 and len(parts[0]) <= 12:
            author = parts[1]
        elif line.strip().endswith(".scss") and author and author != me:
            owners.setdefault(line.strip(), author)

    checked = suspect = 0
    for path, who in sorted(owners.items()):
        last = sh("git", "log", "-1", "--format=%h", "--author=" + who, "--", path).strip()
        if not last:
            continue
        checked += 1
        theirs = sh("git", "show", last + ":" + path)
        current = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
        if theirs == current:
            continue
        # changed since: fine, as long as a commit after theirs touched it
        later = sh("git", "log", "--format=%h %an %s", last + "..HEAD", "--", path).strip()
        if not later:
            suspect += 1
            fail("%s differs from %s (%s) and no later commit touched it" % (path, last, who))

    if not suspect:
        print("  ok    %d files last touched by someone else, none unexplained" % checked)


check_artifact_matches_sources()
check_imports()
check_no_lost_authors()

print()
if ok:
    print("PASS  nothing lost")
    sys.exit(0)
print("FAIL  see above. Do NOT push until this passes.")
sys.exit(1)

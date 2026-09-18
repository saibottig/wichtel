# Archive format for past years

Type: grilling
Status: resolved
Blocked by: 04

## Question

Past years are shown on the site, fed by results committed to the repository.
Decide the file that holds them and the flow that gets a result into it.

## Answer

**Archiving is a maintainer job and stays invisible to everyone else.**
Participants never see it, never copy anything, and never need to know it exists.
This rules out the copy-button and prefilled-editor flows that were on the table.

**A script in the repository does the work, taking the token as its argument.**
Run it with the token from the shared link.
It decodes the token, derives the year, letter and colour, and writes them into the archive JSON.
Nothing is typed by hand, so nothing can be mistyped.

**The page itself gains no archiving UI at all.**
It reads the archive file to render past years, and that is the whole of its involvement.

**Still to settle when this is built:**

- Whether the script refuses or overwrites when the year is already present, which is the re-roll case.
- Whether it commits by itself or only edits the file and leaves the commit to the maintainer.

Both are small enough to decide while writing the script, and neither blocks anything.

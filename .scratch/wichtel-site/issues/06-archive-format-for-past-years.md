# Archive format for past years

Type: grilling
Status: open
Blocked by: 04

## Question

Past years are shown on the site, fed by results committed to the repository.
Decide the file that holds them and the flow that gets a result into it.

Open points:

- The file itself. One JSON file keyed by year is the obvious candidate, but it needs a shape settled before anything reads it.
- How a drawn result travels from the link into the file. Hand-edited, or a copyable snippet the page produces so there is nothing to mistype.
- Whether the current year appears in the archive immediately or only once committed, which decides what a visitor sees in the gap between the draw and the commit.
- What happens if a year is drawn twice, for instance after a re-roll the group asked for.

Blocked by the link format, because the archive stores the same result the link carries.

# Make master the default branch

Type: task
Status: resolved

## Question

The repository still defaults to `claude/matpockock-skills-usage-1qhg5f`, the scratch branch created at the start of this work.
It carries none of the current setup.

Switch the default to `master` in the repository settings, under Branches.

This is human work, because no tool available in an agent session can change a repository setting.

Done when a fresh clone with no branch argument lands on `master`.
Consider deleting the scratch branch at the same time, since everything on it is superseded.

## Answer

Erledigt, und zwar bereits vor dieser Sitzung.

`git ls-remote --symref origin HEAD` zeigt `ref: refs/heads/master`, ein frischer Klon landet also ohne Zweig-Argument auf `master`.
`git ls-remote --heads origin` listet nur noch `refs/heads/master`.
Der Scratch-Zweig `claude/matpockock-skills-usage-1qhg5f` ist gelöscht, der Zusatzvorschlag aus der Frage damit auch abgearbeitet.

Wert festzuhalten: mit diesem Zweig kann auch die `CNAME` verschwunden sein, die GitHub beim Setzen der eigenen Domain in den Veröffentlichungszweig schreibt.
Auf `master` liegt keine. Siehe Ticket 08.

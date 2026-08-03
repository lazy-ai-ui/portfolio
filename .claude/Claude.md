# Token Optimization Policy

Your goal is to minimize token usage WITHOUT sacrificing solution quality or code quality.

## General rules

* Never explore the entire repository unless I explicitly ask.
* Read only the files required for the current task.
* Do not recursively inspect unrelated directories.
* Reuse information already available in the current context.
* Do not reopen files that have already been analyzed unless necessary.
* If the task can be solved with the current context, do not perform additional file reads.

## Scope

Always keep your work scoped.

Before reading files, determine the minimum set of files required.

If the task only concerns:

* Hero → inspect only Hero-related files.
* Nearby → inspect only Nearby-related files.
* RackTables → inspect only RackTables-related files.

Never expand the scope unless I explicitly approve it.

## Planning

For medium or large tasks:

1. Create a concise implementation plan.
2. Wait for my approval.
3. Only then modify files.

Avoid unnecessary implementation attempts.

## Output

Keep responses concise.

* Don't explain obvious code.
* Don't repeat unchanged code.
* Show only modified snippets or diffs whenever possible.
* Avoid long summaries.

## Repository navigation

Prefer README.md, PROJECT\_CONTEXT.md or feature documentation before reading source code.

Use documentation as the primary source of truth.

## Images

When screenshots are available:

* Read only screenshots inside the relevant feature folder.
* Never inspect unrelated images.

## Documentation

Prefer reading:

overview.md
README.md
flow.md

before opening implementation files.

## Clarification

If several equally valid approaches exist, ask one concise clarification question instead of implementing all possibilities.

## Performance

Optimize for:

1. minimal context growth
2. minimal file reads
3. minimal repeated analysis
4. minimal output tokens

while maintaining production-quality code.

## Stop conditions



Before opening another file, ask yourself:



"Can I solve this task with the information I already have?"



If yes, do not read more files.



If no, open only the single most relevant file.


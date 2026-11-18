# Repository contributor instructions

For every iteration that changes application behavior, configuration, dependencies, or documentation:
- Update CHANGE.md in the same change set, adding the next numbered, dated entry at the top of the history.
- Explain what each feature does and how an operator uses it, rather than only naming changed files.
- Record checks actually performed and distinguish implemented behavior from planned or unverified behavior.
- State configuration changes, compatibility limits, and remaining work. Update README.md when setup or usage changes.
- Preserve historical entries. Do not describe unfinished features as delivered or report tests that were not run.

Do not commit credentials or generated data. Keep OBS WebSocket private. Remote publication or deployment requires authorization from the user.

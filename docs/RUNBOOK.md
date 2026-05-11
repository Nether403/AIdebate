# Runbook

## Minimal benchmark run

Benchmark runs group one or more debates under a single configuration and persist run-level status/count metadata in `benchmark_runs`.

1. Apply migrations before running against a database:

```bash
npm run db:push
```

2. Copy `configs/frontier-smoke.example.json` to a local config file and replace the placeholder model IDs with active model UUIDs from the database.

3. Run the benchmark:

```bash
npm run benchmark:run -- --config configs/frontier-smoke.json
```

The command creates a `benchmark_runs` row, creates linked `debates` rows via `benchmark_run_id`, runs each debate sequentially, and updates run counts for `completed`, `failed`, and `evaluation_failed` debates.

`evaluation_failed` debates are preserved as diagnosable artifacts and counted separately from execution failures.

# Reports Index (current truth first)

- `baseline.md` - frozen pre-refactor baseline (commit `9181c8d5`, 851 nodes).
- `benchmark_report.md` + `benchmark_report.json` - latest full benchmark; regenerate via `python scripts/evaluate_ci.py` (fast, 50 cases) or `scripts/evaluate_extended.py` (100 cases).
- `baseline_benchmark.json`, `baseline_production_gap_audit.json`, `production_gap_upgrade_report.json` - archived earlier runs.
- `retrieval_opt/` - per-experiment JSON/MD from `scripts/run_retrieval_experiments.py`.
- `figures/` - charts for README; regenerate with benchmarks.

Current headline numbers: `scripts/evaluate_ci.py` 50/50 guardrail 100%, R@3/5 100%, MRR 0.764, p50 176ms p95 217ms (reranker OFF; ON trial: R@1 +6.9pts but p95 1118ms - rejected for prod).

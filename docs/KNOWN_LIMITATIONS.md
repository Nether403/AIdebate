# Known Limitations

## Current Limitations

- The core debate loop has been verified end-to-end (config → turns → judge → export) against live providers on disposable Neon branches, but only with fact-checking disabled. A live run with fact-checking enabled is not yet confirmed.
- Accepted turns are not length-validated: an empty model response is persisted as a 0-word turn and still counts toward a completed debate.
- The configured Gemini judge depends on Google access (direct API key or a billable OpenRouter BYOK link). When that is absent the judge must be repointed at another served model, or completed debates will fail evaluation.
- Provider model IDs and availability drift over time; OpenRouter slugs in the model registry must be revalidated against the live catalog. Run `npm run models:validate` to detect drift (it exits non-zero when any dispatchable slug is stale).
- The database schema and exports do not yet guarantee all required research metadata in every code path.
- Some old UI routes, APIs, docs, and tests still reflect the previous social-product direction.
- Azure OpenAI deployment names may not equal base model names, so deployment metadata must be recorded explicitly.
- AI judges can exhibit position bias, model-family bias, verbosity bias, and rubric-following failures.
- Fact-checking depends on search quality and should not be treated as definitive truth.
- Cost estimates now use OpenRouter's reported usage accounting for OpenRouter calls; estimates for other providers still depend on the static price table and may be incomplete.

## Interpretation Caveats

Judge outputs are model-based signals. They are useful for comparison under a fixed configuration, but they are not objective proof that one model is better or that one side of a motion is true.

## Data Governance Caveats

Outputs should remain private research artifacts until export schema, anonymization needs, data retention, and public-release limitations are documented.

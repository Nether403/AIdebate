# Known Limitations

## Current Limitations

- The core debate loop has not yet been verified as a reliable benchmark artifact pipeline.
- The database schema and exports do not yet guarantee all required research metadata.
- Some old UI routes, APIs, docs, and tests still reflect the previous social-product direction.
- Provider model IDs and availability can drift over time.
- Azure OpenAI deployment names may not equal base model names, so deployment metadata must be recorded explicitly.
- AI judges can exhibit position bias, model-family bias, verbosity bias, and rubric-following failures.
- Fact-checking depends on search quality and should not be treated as definitive truth.
- Cost estimates may be incomplete until provider-call accounting is normalized.

## Interpretation Caveats

Judge outputs are model-based signals. They are useful for comparison under a fixed configuration, but they are not objective proof that one model is better or that one side of a motion is true.

## Data Governance Caveats

Outputs should remain private research artifacts until export schema, anonymization needs, data retention, and public-release limitations are documented.

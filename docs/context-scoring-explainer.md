# Context-Aware Scoring Explainer

## Overview

The VALID Assessment uses a context-aware scoring system to show how a person's decision-making tendencies shift in different scenarios (contexts). This is achieved by analyzing answer patterns and applying context-specific weights to different question groupings (categories).

---

## 1. Question Categories (Groupings)

Each question in the assessment is assigned a `category` field. These categories correspond to the groupings or headers you see in the assessment UI. For example:

| Header in UI                        | Category in Data      |
|-------------------------------------|----------------------|
| Decision Triggers & Approach        | decision_triggers    |
| Information Sources & Weighting     | information          |
| Confidence & Certainty              | confidence           |
| Pressure & Urgency                  | urgency              |
| Conflict & Disagreement             | conflict             |
| Evaluation & Learning               | evaluation           |
| General Validation Preferences      | general              |
| Social Desirability Scale (MCSF)    | quality              |

**Note:** The `category` field in each question in `questions-data.js` must match the keys used in the context analysis (see below).

---

## 2. Contexts (Scenarios)

Contexts (or scenarios) are defined in `scenarios.js`. Each context represents a different real-world situation (e.g., "Work & Professional", "Crisis & High Pressure").

Each context has a `questionEmphasis` object that assigns a weight (emphasis) to each category. For example:

```js
work: {
  questionEmphasis: {
    decision_triggers: 1.1,
    information: 1.3,
    confidence: 1.0,
    urgency: 1.2,
    conflict: 1.1,
    evaluation: 1.2,
    general: 1.0,
    quality: 1.0
  },
  ...
}
```

A higher value means that category is more important in that context. Lower values de-emphasize a category.

---

## 3. How Scoring Works

- When a user completes the assessment, their answers are stored with question IDs.
- For each context, the system:
  1. Looks up each answer's question and its `category`.
  2. Multiplies the answer by the context's `questionEmphasis` for that category.
  3. Aggregates these weighted answers by dimension (V, A, L, I, D).
  4. Applies additional context-specific interpretation (thresholds, emphasis) to produce the final scores.
- This means the same answers can yield different results in different contexts, reflecting how tendencies shift.

---

## 4. How to Verify or Adjust Mappings

- **To check mappings:**
  - Open `js/questions-data.js` and review the `category` field for each question.
  - Open `js/scenarios.js` and review the `questionEmphasis` keys for each context.
  - Ensure every category in your questions is present in each context's `questionEmphasis`.
- **To add or rename a category:**
  - Update both the questions and all `questionEmphasis` objects in `scenarios.js`.
- **To add a new context:**
  - Add a new entry in `scenarios.js` with the appropriate `questionEmphasis` and `dimensionInterpretation`.

---

## 5. Example Mapping Table

| Question ID | Dimension | Category           | Example Text                                               |
|-------------|----------|--------------------|------------------------------------------------------------|
| DT-01       | verity   | decision_triggers  | When facing an important choice, I start by gathering facts|
| IG-02       | association | information      | I value input from people whose judgment I respect         |
| CB-03       | lived    | confidence         | I'm confident in choices that mirror what's worked for me  |
| UP-01       | verity   | urgency            | I make decisions quickly when time is limited              |
| ...         | ...      | ...                | ...                                                        |

---

## 6. Summary

- **Categories** = question groupings/headers (must match between questions and context weights)
- **Contexts** = scenarios with different weights for each category
- **Scoring** = answers are weighted by context, so results shift based on scenario

If you want to change how results are calculated for a context, adjust the `questionEmphasis` weights in `scenarios.js`.

---

**For further research:**
- Look up "contextual weighting in psychometrics" or "context-aware assessment scoring" for academic background.
- Review the code in `js/questions-data.js` and `js/scenarios.js` for your current mappings. 
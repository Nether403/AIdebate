
## 1. Updated Frontier Landscape (late 2025)

As of **Nov 2025**, the serious contenders you should be thinking about for your agents are:

* **OpenAI GPT-5.1**

  * Just released on the API platform (mid-Nov 2025). Focuses on **dynamic thinking time** (spends more “brainpower” on hard tasks), improved reasoning vs GPT-5, and is **faster / more token-efficient** on routine stuff.

* **Google Gemini 3 Pro**

  * Rolled out this week; now powers Google Search and Gemini app. Marketed as a major jump with **fewer hallucinations** and stronger multimodal/agent behavior. Multiple outlets call it Google’s most capable model yet, with Pro available in Vertex and Canvas.

* **Anthropic Claude Sonnet 4.5 / Opus 4.x**

  * Sonnet 4.5 is positioned by Anthropic as their **best overall “coding & agent” model**, with improved reasoning/math and strong long-horizon autonomy. Docs note training on data through mid-2025 with stable snapshots.

* **xAI Grok 4 / 4.1 (Thinking)**

  * Grok 4 announced as “most intelligent model in the world,” with **native tool use + real-time search** baked in and exposed via API for some tiers. Grok 4.1 and Grok 4.1 Thinking just dropped and are topping at least one community leaderboard (LMArena).

* **Meta Llama 4 (Scout / Maverick / Behemoth / Reasoning)**

  * Open-weight family with multimodal support and big context, billed as beating GPT-4.5 in many open benchmarks and designed as the **flagship open model line** for 2025. You realistically plan around **Scout/Maverick/Reasoning**; Behemoth is huge and partially restricted.

This is the pool we should be pulling from for each agent role.

Given your credits on **AgentRouter** and **MegaLLM**, plus access to OpenRouter, you’re in a good spot to **route across providers** without locking into one.

---

## 2. Role-by-Role: Late-2025 Model Choices

### 2.1 Pro/Con Debater Agents (RCR prompting)

**What they need:**

* Top-tier **reasoning & argumentation**
* Strong **consistency over multiple turns**
* Plays well with **Reflect–Critique–Refine** (can inspect its own output and improve)
* Good **tool-using variant** later, but not required day one

**Primary tier (for serious benchmark runs):**

1. **GPT-5.1 (Thinking mode when available)**

   * Best all-rounder for structured argument, RCR loops, and long debates.
   * Dynamic thinking time is literally designed for this: it burns more compute on hard reasoning and less on fluff, which is exactly what a debater needs.
   * Use this as **default debater** when you care about benchmark integrity over cost.

2. **Gemini 3 Pro**

   * Very strong candidate where **grounded reasoning + tool use** matter.
   * It’s now powering Google Search itself, and Google is explicitly advertising “fewer lies” and stronger agent behavior.
   * Great pick for **debates that lean on real-world knowledge** or multimodal content (e.g., charts, images).

3. **Claude Sonnet 4.5**

   * Anthropic frames this as their best model for **complex agents + long-running workflows** with strong reasoning and math improvements.
   * Sonnet 4.5 is ideal for **persona-heavy, consistent style debates** and long transcripts (big context window, stable behavior).
   * I’d slot Sonnet 4.5 as your **third “frontier” debater** and often pair it vs GPT-5.1 or Gemini 3.

**Second tier (cost-optimized / open):**

* **Grok 4.1 (Thinking)**

  * If/when you get API access, this is a fun “spicy” debater: very strong reasoning plus **real-time search** built-in, but currently more consumer/app-oriented than benchmark-oriented. Great as a **wildcard model** in the arena.

* **Llama 4 Maverick / Reasoning**

  * Your best **open-weight debaters**: good reasoning, big context, free to hammer via your own infra. They reportedly beat GPT-4.5 on many tasks and give you a “no vendor lock-in” story.
  * Perfect for **high-volume, low-cost brackets** or as baselines vs closed-source giants.

**Practical stance:**
For the *serious* leaderboard, default to **GPT-5.1 vs Gemini 3 Pro vs Claude Sonnet 4.5**, and use Grok 4.1 + Llama 4 Reasoning as extra contenders in special ladders or “open vs closed” exhibition matches.

---

### 2.2 Fact-Checker Agent (live hallucination firewall)

Nothing fundamental changed here except that tooling got **more mature** and some models now have **native web grounding**.

**What you want:**

* A **cheap but competent summarizer** model
* A **primary web search API** with good coverage, low latency, transparent pricing
* Optional: specialist tools (numeric/computational, etc.)

**Updated stack:**

* **Model:**

  * **GPT-4o-mini / GPT-4.1-mini equivalent** (or a 5.1 “small”/Instant tier once exposed in the API) for the LLM “checker” step.
  * If that’s not yet clearly exposed, **GPT-4o / GPT-4.1** or **Claude Haiku 4.x** are still good “lightweight brains”: far cheaper than 5.1/Sonnet 4.5, but very solid at extracting and verifying facts.

* **Primary web search API: Brave Search API**

  * Independent index (30B+ pages, refreshed ~100M/day) with rich snippets, AI-friendly JSON, and **a real free tier**.
  * Pricing: free up to ~2,000 requests/month; then **$3/1k requests (Base)** or $5/1k (Pro) as of the current dashboard.
  * This should be your **default retrieval layer**.

* **Second web layer: Tavily Search API**

  * Tavily is now **very explicitly branded as “web access layer for AI agents”**, aggregating and pre-filtering multiple sources into LLM-ready snippets for RAG.
  * Billing: credit-based; Basic search = 1 credit, Advanced = 2 credits, with per-credit costs spelled out in docs.
  * Use it when you **really care about snippet quality** and want to outsource the ranking/condensing step.

* **Optional tools:**

  * **Perplexity Search API** – $5 per 1k requests for raw web search (no token-based charges) as of their docs, nice if you want a “one call = cleaned search results” experience.
  * **WolframAlpha API** – still king for math/science/quantitative facts.
  * If you lean into Grok 4 or Gemini 3 Pro, they already have **native web grounding**; but I’d still keep an external search layer so your fact-checker isn’t hard-wired to one vendor.

**Pattern I’d use:**

* Brave Search → short snippets
* Feed snippets + original claim into **GPT-4o-mini / Haiku** with a fixed schema:

  * `{ "claim": "...", "verdict": "true/false/uncertain", "evidence": [ ... ], "sources": [...] }`
* Use Tavily only when:

  * Brave returns obviously thin results, **or**
  * You’re running high-stakes evals where the extra cost is justified.

That keeps the **firewall cheap, fast, and not married to any one lab’s internal tools**.

---

### 2.3 Judge Agent (structured rubric eval)

This is where you use your **absolute best thinking model**, because if the judge slacks, the whole benchmark becomes noise.

**What changed since the “old” report:**

* **GPT-5.1** exists, and is explicitly pitched as improved reasoning + dynamic depth.
* **Claude Sonnet 4.5** is Anthropic’s “best agent model” with strong reasoning and long-context stability.
* **Gemini 3 Pro** is tuned for fewer hallucinations and is being used in Google’s own products, including Search.

**New top tier for judging:**

1. **Primary: GPT-5.1 (Thinking mode)**

   * Use this as your **gold-standard judge**:

     * It can spend more compute on difficult transcripts, which is exactly what evaluating multi-round debates is.
     * It’s OpenAI’s current flagship; any public paper/leaderboard you do will be taken more seriously if your main judger is the current frontier model.

2. **Co-primary: Claude Sonnet 4.5**

   * Designed to excel at **complex agent workflows** and long-running contexts; Anthropic literally markets it for this.
   * Great for:

     * Very long transcripts (100k context).
     * Cross-checking GPT-5.1 on contentious matches.
     * Lowering cost for *bulk* judging while staying frontier-level.

3. **Third axis: Gemini 3 Pro**

   * Use it as:

     * A **third opinion** in an ensemble for research runs.
     * Or a **Google-centric track** where both debaters and judge live in Gemini land (nice for vendor-comparison experiments: “How does a Gemini-run arena rank GPT-5.1 vs Claude 4.5 vs Llama 4?”).

**Practical scheme:**

* **Production leaderboard:**

  * Default judge = GPT-5.1.
  * For a subset (say playoffs), also run Claude Sonnet 4.5 and log disagreement rates.

* **Research mode:**

  * Tri-judge: GPT-5.1 + Claude Sonnet 4.5 + Gemini 3 Pro.
  * If 2/3 agree, that’s the final verdict; otherwise mark as “contentious” and optionally surface to human raters.

You *still* use a rubric and JSON schema like before — the change is simply: **promote 5.1 / Sonnet 4.5 / Gemini 3 Pro to top tier, demote GPT-4/Claude 3.5 to “legacy baseline judges”.**

---

### 2.4 Moderator Agent

Here nothing fancy changed, but the small-model landscape got better.

You still want:

* Ultra-cheap, ultra-obedient, **low-latency**
* Good instruction-following, zero creativity

**Recommended now:**

* **OpenAI 5.1 “Instant” / 5.1-mini** (or 4o-mini if that’s what’s actually exposed)

  * Use the **smallest 5.x/4o tier** that still handles instructions well.
  * This keeps your stack simple (same provider as judge or debater in many cases).

* **Claude Haiku 4.5**

  * Anthropic’s small, fast model; good if you’re already heavy on Claude in other roles.

* **Gemini 3 Flash / Nano** (if/when exposed for API use)

  * Google is explicitly pushing lighter Gemini configs for cost-efficient tasks; that’s exactly what a moderator is.

You can absolutely still do this with GPT-3.5, but at this point there’s not much reason if 4o-mini/5.1-mini exist and are **cheaper/faster per capability**.

Open-source small stuff (Mistral, Llama 4 Scout, etc.) is fine if you want to run the moderator entirely locally, but it’s not where your cost is, so I’d keep it boring and centralize around **one cheap proprietary small model**.

---

### 2.5 Topic Generator Agent

This one is less sensitive: bad topics annoy users, they don’t corrupt the benchmark core.

**Updated suggestions:**

* **GPT-5.1 (cheap/fast mode)**

  * Great for “give me 10 motions in ethics/tech/policy that have strong arguments both ways”.
  * You can run this **offline to seed your topic DB**, so cost is a one-time hit.

* **Claude Sonnet 4.5**

  * Very good at brainstorming + structured output (e.g., motion + category + difficulty).
  * Use it to batch-generate topic libraries and metadata: domain tags, difficulty estimates, etc.

* **Gemini 3 Pro**

  * If you want **news-aligned topics**, hook Gemini up with live news search (or just rely on Google’s own underlying knowledge) and prompt:
    *“Generate motions based on current news in X domain.”*

Cheaper options:

* For day-to-day new topic suggestions in the UI, you can drop to **4o-mini / Haiku / Gemini Flash** and it’ll still be more than good enough.

---

## 3. Fact-Checking APIs: 2025 Reality Check

You asked specifically about non-Tavily options; here’s the updated picture:

* **Brave Search API**

  * Independent index, high quality, **free 2k/month, then $3–5 per 1k requests** depending on plan, with clear limits and good RPS.
  * Best default **“raw web” backend** for fact-checking calls.

* **Tavily Search API**

  * Now very explicitly positioned as a **LLM-optimized RAG backend** — reviews multiple sources and returns condensed, ready-to-use snippets.
  * Credit-based; Basic vs Advanced search at 1 vs 2 credits per query.
  * Perfect as a **secondary, higher-quality retrieval option**.

* **Perplexity Search API**

  * Priced at **$5 per 1k Search API requests**, with no token costs.
  * Good if you want richer, already-summarized SERP results; slightly more expensive than Brave but still sane.

* **SerpAPI / SERPex / Oxylabs & friends**

  * Still the go-tos for **raw Google SERP scraping**, but increasingly niche compared with Brave/Tavily for LLM use. Blogs comparing 2025 SERP APIs explicitly position them around SEO/scraping, not agent workflow.

So your fact-checker’s “web tools” palette in late 2025 should be:

> **Brave** as the workhorse → **Tavily** when you want curated RAG-style responses → **Perplexity** occasionally when convenience outweighs control → specialized stuff like **Wolfram** for quant.

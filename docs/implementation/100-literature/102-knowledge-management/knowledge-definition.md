
# Core foundations: what “knowledge” is
(chatgpt 09.10.25)

- **Polanyi — _The Tacit Dimension_** (tacit vs. explicit; “we know more than we can tell”). ([University of Chicago Press](https://press.uchicago.edu/ucp/books/book/chicago/T/bo6035368.html?utm_source=chatgpt.com "The Tacit Dimension, Polanyi, Sen"))
    
- **Nonaka & Takeuchi — SECI model** (Socialization↔Externalization↔Combination↔Internalization) and “Ba” (shared context). Great for mapping transfer mechanisms. ([Accelerating Systemic Change Network](https://ascnhighered.org/ASCN/change_theories/collection/seci.html?utm_source=chatgpt.com "SECI Model of Knowledge Creation: Socialization, ..."))
    
- **Davenport & Prusak — _Working Knowledge_** (practical KM primer). ([Amazon](https://www.amazon.com/Working-Knowledge-Organizations-Manage-What/dp/0875846556?utm_source=chatgpt.com "Working Knowledge: How Organizations Manage What ..."))
    
- **Alavi & Leidner (MISQ, 2001)** — canonical KM review & process view (create/store/transfer/apply). ([home.business.utah.edu](https://home.business.utah.edu/actme/7410/Alavi%20and%20Leidner.pdf?utm_source=chatgpt.com "Alavi and Leidner.pdf"))
    
- **DIKW (Data→Info→Knowledge→Wisdom)** — use with caution, but helpful scaffolding when designing pipelines. ([Wikipedia](https://en.wikipedia.org/wiki/DIKW_pyramid?utm_source=chatgpt.com "DIKW pyramid"))
    

# Organizational knowledge transfer (how it moves)

- **Szulanski — “stickiness”** (stages & barriers to transfer). ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S074959780092884X?utm_source=chatgpt.com "The Process of Knowledge Transfer: A Diachronic Analysis ..."))

- **Hansen — search-transfer problem** (weak ties help search, hinder transfer of complex knowledge). ([SAGE Journals](https://journals.sagepub.com/doi/10.2307/2667032?utm_source=chatgpt.com "The Search-Transfer Problem: The Role of Weak Ties in ..."))

- **Argyris & Schön — organizational learning** (single vs. double-loop). ([Internet Archive](https://archive.org/details/organizationalle00chri?utm_source=chatgpt.com "Organizational learning : a theory of action perspective"))

- **Wenger — communities of practice** (social substrate for tacit transfer). ([Cambridge University Press & Assessment](https://www.cambridge.org/highereducation/books/communities-of-practice/724C22A03B12D11DFC345EEF0AD3F22A?utm_source=chatgpt.com "Communities of Practice: Learning, Meaning, and Identity"))

- **Grant / Spender — knowledge-based theory of the firm** (coordination & integration of specialized knowledge). ([Wiley Online Library](https://sms.onlinelibrary.wiley.com/doi/abs/10.1002/smj.4250171110?utm_source=chatgpt.com "Toward a knowledge‐based theory of the firm - Grant - SMS"))

# Knowledge types you’ll want to detect

- **Tacit vs. explicit** (Polanyi; Nonaka). ([University of Chicago Press](https://press.uchicago.edu/ucp/books/book/chicago/T/bo6035368.html?utm_source=chatgpt.com "The Tacit Dimension, Polanyi, Sen"))

- **Know-what / know-why / know-how / know-who** (Lundvall & Johnson). Use these as labels/classes in your schema. ([redesist.ie.ufrj.br](https://www.redesist.ie.ufrj.br/ga2012/textos/Lundvall/Lecture%203_Knowledge%20management%20for%20PTF.pdf?utm_source=chatgpt.com "KNOWLEDGE MANAGEMENT IN THE LEARNING ..."))

- **Declarative vs. procedural** (Anderson’s skill acquisition). Helpful for spotting “how-to” instructions vs. facts. ([act-r.psy.cmu.edu](https://act-r.psy.cmu.edu/wordpress/wp-content/uploads/2012/12/63ACS_JRA_PR.1982.pdf?utm_source=chatgpt.com "Acquisition of cognitive skill - ACT-R"))

- **Transactive memory** (who knows what / who to ask). Great for routing. ([dtg.sites.fas.harvard.edu](https://dtg.sites.fas.harvard.edu/DANWEGNER/pub/Wegner%20Transactive%20Memory.pdf?utm_source=chatgpt.com "Transactive M.emory: A Contemporary Analysis of the ..."))

# Representing knowledge (so LLMs can use it)

- **Ontologies & KGs**: Gruber’s definition; Protégé’s “Ontology 101”; _Handbook on Ontologies_. ([tomgruber.org](https://tomgruber.org/writing/definition-of-ontology.pdf?utm_source=chatgpt.com "Ontology - Tom Gruber"))

- **ISO 30401:2018** — KM systems requirements (useful for governance & process alignment). ([ISO](https://www.iso.org/standard/68683.html?utm_source=chatgpt.com "ISO 30401:2018 - Knowledge management systems"))

- **Boisot’s I-Space / Knowledge Assets** — how codification & diffusion shape flows. ([Oxford University Press](https://global.oup.com/academic/product/knowledge-assets-9780198296072?utm_source=chatgpt.com "Knowledge Assets - Paperback - Max H. Boisot"))


# LLMs for knowledge transfer (what actually works now)

- **RAG (Retrieval-Augmented Generation)** — the baseline pattern to keep models current & cite sources. Read the original paper. ([arXiv](https://arxiv.org/pdf/2005.11401?utm_source=chatgpt.com "Retrieval-Augmented Generation for Knowledge-Intensive ..."))

- **Self-RAG** — retrieve only when needed and critique outputs with reflection tokens. Boosts factuality & citations. ([arXiv](https://arxiv.org/abs/2310.11511?utm_source=chatgpt.com "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection"))

- **RAPTOR** — hierarchical (tree) retrieval via recursive clustering/summarization; great for long manuals/wikis. ([arXiv](https://arxiv.org/abs/2401.18059?utm_source=chatgpt.com "RAPTOR: Recursive Abstractive Processing for Tree ..."))

- **LLMs × Knowledge Graphs** — roadmaps & 2024 surveys on unifying KGs with LLMs (three paradigms: KG-enhanced LLMs, LLM-augmented KGs, synergized). ([arXiv](https://arxiv.org/abs/2306.08302?utm_source=chatgpt.com "Unifying Large Language Models and Knowledge Graphs: A Roadmap"))

- **Knowledge editing & neurons** — ROME/MEMIT, knowledge-neuron work; relevant for surgical fact updates vs. retraining. ([arXiv](https://arxiv.org/abs/2202.05262?utm_source=chatgpt.com "Locating and Editing Factual Associations in GPT"))

- **Memorization & privacy** — be aware of training-data extraction risks. ([USENIX](https://www.usenix.org/conference/usenixsecurity21/presentation/carlini-extracting?utm_source=chatgpt.com "Extracting Training Data from Large Language Models"))


# Eliciting tacit knowledge (to feed your system)

- **Applied Cognitive Task Analysis (ACTA)** — structured interviews/CTA for expert know-how. ([PubMed](https://pubmed.ncbi.nlm.nih.gov/9819578/?utm_source=chatgpt.com "Applied cognitive task analysis (ACTA): a practitioner's ..."))


---

## Mini-playbook: making LLMs _identify_ and _retranscribe_ knowledge

1. **Define your ontology** around the four “knows”, tacit/explicit, and declarative/procedural. Start light (classes + properties like _has_step_, _requires_tool_, _owned_by_role_, _evidence_). Use Protégé; export OWL/RDF. ([protege.stanford.edu](https://protege.stanford.edu/publications/ontology_development/ontology101-noy-mcguinness.html?utm_source=chatgpt.com "What is an ontology and why we need it - protégé"))
    
2. **Chunk semantically, not by tokens.** Segment docs by sections/steps/goals (semantic chunking) and attach labels from your ontology; store provenance (URL, author, timestamp). ([Medium](https://thedatafreak.medium.com/semantic-chunking-for-rag-unlocking-better-contextual-retrieval-5c13c39b42c4?utm_source=chatgpt.com "Semantic Chunking for RAG: Unlocking Better Contextual ..."))
    
3. **Build RAG with hierarchy.** Use RAPTOR for multi-level summaries (procedure → substeps). Keep citations mandatory. ([arXiv](https://arxiv.org/abs/2401.18059?utm_source=chatgpt.com "RAPTOR: Recursive Abstractive Processing for Tree ..."))
    
4. **Capture tacit → externalize.** Run ACTA interviews with experts; convert to “how-to” steps, decision cues, and common pitfalls; link each to roles (transactive memory). ([PubMed](https://pubmed.ncbi.nlm.nih.gov/9819578/?utm_source=chatgpt.com "Applied cognitive task analysis (ACTA): a practitioner's ..."))
    
5. **Add a people layer.** Maintain a lightweight directory of _who knows what_ + _artifact ownership_; let the assistant route to SMEs when confidence is low. (Transactive memory in practice.) ([dtg.sites.fas.harvard.edu](https://dtg.sites.fas.harvard.edu/DANWEGNER/pub/Wegner%20Transactive%20Memory.pdf?utm_source=chatgpt.com "Transactive M.emory: A Contemporary Analysis of the ..."))
    
6. **Governance.** Align flows with **ISO 30401**: ownership, change logs, review cadence, and deprecation rules. ([ISO](https://www.iso.org/standard/68683.html?utm_source=chatgpt.com "ISO 30401:2018 - Knowledge management systems"))
    
7. **Evaluation (transfer, not just accuracy).**
    
    - **Discovery**: time-to-answer, search success rate (Hansen’s search vs. transfer). ([SAGE Journals](https://journals.sagepub.com/doi/10.2307/2667032?utm_source=chatgpt.com "The Search-Transfer Problem: The Role of Weak Ties in ..."))
        
    - **Use**: task success with procedural steps (Anderson); error reduction after using the assistant. ([act-r.psy.cmu.edu](https://act-r.psy.cmu.edu/wordpress/wp-content/uploads/2012/12/63ACS_JRA_PR.1982.pdf?utm_source=chatgpt.com "Acquisition of cognitive skill - ACT-R"))
        
    - **Retention**: how often tacit items get externalized and reused (SECI spiral). ([Accelerating Systemic Change Network](https://ascnhighered.org/ASCN/change_theories/collection/seci.html?utm_source=chatgpt.com "SECI Model of Knowledge Creation: Socialization, ..."))
        

---

## Shortlist to buy/skim first (ordered for impact)

1. **Working Knowledge** — Davenport & Prusak (operations-friendly). ([Google Books](https://books.google.com/books/about/Working_Knowledge.html?id=-4-7vmCVG5cC&utm_source=chatgpt.com "Working Knowledge: How Organizations Manage what ..."))
    
2. **The Knowledge-Creating Company** — Nonaka & Takeuchi (SECI, Ba). ([OUP Academic](https://academic.oup.com/book/52097?utm_source=chatgpt.com "How Japanese Companies Create the Dynamics of Innovation"))
    
3. **Alavi & Leidner (2001)** — survey article you’ll cite constantly. ([home.business.utah.edu](https://home.business.utah.edu/actme/7410/Alavi%20and%20Leidner.pdf?utm_source=chatgpt.com "Alavi and Leidner.pdf"))
    
4. **Communities of Practice** — Wenger (social side). ([Cambridge University Press & Assessment](https://www.cambridge.org/highereducation/books/communities-of-practice/724C22A03B12D11DFC345EEF0AD3F22A?utm_source=chatgpt.com "Communities of Practice: Learning, Meaning, and Identity"))
    
5. **ISO 30401:2018** — for governance & rollout. ([ISO](https://www.iso.org/standard/68683.html?utm_source=chatgpt.com "ISO 30401:2018 - Knowledge management systems"))
    
6. **RAG / Self-RAG / RAPTOR** — the LLM engineering core. ([arXiv](https://arxiv.org/pdf/2005.11401?utm_source=chatgpt.com "Retrieval-Augmented Generation for Knowledge-Intensive ..."))
    
7. **Polanyi** — to frame tacit capture programs. ([University of Chicago Press](https://press.uchicago.edu/ucp/books/book/chicago/T/bo6035368.html?utm_source=chatgpt.com "The Tacit Dimension, Polanyi, Sen"))
    
8. **Gruber + Ontology 101** — to structure your schema. ([tomgruber.org](https://tomgruber.org/writing/definition-of-ontology.pdf?utm_source=chatgpt.com "Ontology - Tom Gruber"))
    

If you want, I can turn this into a 1-page blueprint (ontology starter + eval metrics + RAG stack diagram) tailored to your lab/company context.
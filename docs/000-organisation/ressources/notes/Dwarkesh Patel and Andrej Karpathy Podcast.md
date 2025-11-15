
### Part 1: The Decade of Agents and Cognitive Bottlenecks

The speaker suggests that the industry is in the **decade of agents**, a reaction to what he views as overpredictions regarding the "year of agents".

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Agent Definition:** An agent should function like an employee or intern. Examples of early agents include Claude and Codex, which are considered impressive.|**Trend:** The focus is on developing fully capable agents that can perform knowledge work, moving past the idea of the "year of agents".|
|**Cognitive Deficits:** Current models are "cognitively lacking" and "just not working" for the role of a capable agent.|**Bottlenecks:** Achieving true agent capability requires addressing several technical issues, including: **sufficient intelligence**, **multimodality**, the ability to perform **computer use** (operating systems/software), and **continual learning**.|
|**Timeline Intuition:** Resolving these issues is expected to take roughly a decade.||

### Part 2: Historical Context and the Prerequisite of Representation Power

The development of AI has proceeded through several "seismic shifts".

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Early Agent Attempts:** Initial attempts at building agents included deep reinforcement learning (RL) applied to Atari games (around 2013) and projects aimed at agents using keyboard and mouse to operate web pages (the Universe Project at OpenAI).|**Misstep Analysis (Tip):** Training agents using sparse rewards from simulated environments (like games or early web interaction) was a conceptual "misstep" because the reward was too sparse. This approach burned significant compute without learning.|
|**LLMs as Prerequisite:** Agents failed early because they lacked robust **representation power**. This power is now achieved through **pre-training Large Language Models (LLMs)**.|**Practice:** Agent development requires establishing strong language models and representations first, before layering other capabilities onto the stack.|

### Part 3: AI as "Ghosts" and the Cognitive Core

The fundamental nature of current AI intelligence is defined by its training method.

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Ghosts vs. Animals:** Current models are "building ghosts" or "ethereal spirit entities" because they are fully digital and mimic humans based on imitation of internet data. This is distinct from the evolutionary process that created animal brains.|**Concept:** Pre-training is considered "crappy evolution"—a practical, technologically possible method to create an entity with built-in knowledge and intelligence.|
|**Pre-training Functions:** Pre-training yields two outcomes: number one, acquiring knowledge; and number two, becoming intelligent (developing internal algorithms/circuits for problem-solving).|**Research Direction (NPTT):** Future research must focus on separating knowledge from intelligence. The goal is to **remove knowledge** and retain the **"cognitive core"**—the intelligent entity stripped of external memory but containing the algorithms for problem-solving and strategy.|

### Part 4: Learning Mechanisms: Context Window vs. Weights

The model's performance varies dramatically depending on whether information is stored in the weights or the context window.

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Hazy Recollection:** Information stored in the neural network weights (from pre-training) is analogous to a **"hazy recollection"** due to the dramatic compression required to compress trillions of tokens into a few billion parameters.|**Working Memory Analogy (NPTT):** Information stored in the context window (KV cache) is analogous to **"working memory"** and is much more directly accessible to the neural network. Using the context window leads to dramatically better results (e.g., giving the full chapter of a book vs. asking questions based only on pre-trained knowledge).|
|**In-Context Learning (ICL):** ICL is where models demonstrate visible intelligence. It is a form of pattern completion. Some research suggests ICL may implement a small gradient descent loop internally.||

### Part 5: Continual Learning and Architectural Evolution

Humans possess cognitive mechanisms that LLMs currently lack.

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Missing Brain Structures:** LLMs are still missing analogs for various brain parts, such as those responsible for emotions (amygdala) and memory structuring (hippocampus).|**Research Focus:** The models lack a **"distillation phase"**, analogous to sleep, where the day's experiences are analyzed, synthetic data is generated, and knowledge is condensed back into the weights. This distillation is crucial for achieving continual learning.|
|**Future Architecture:** Progress involves redoing cognitive tricks developed by evolution using a different process. The architecture will likely still be a giant neural network trained with gradient descent, but with algorithmic improvements.|**Architectural Trend (NPTT):** Expect the evolution of the Transformer to include **much more modified attention** and possibly **sparser MLPs**. Early signs of this include the implementation of **sparse attention** in models like DeepSeek v3.2 to handle extremely long context windows.|

### Part 6: Coding Models and Software Engineering Practices

The automation of software engineering is currently driven by LLMs, but they remain imperfect tools.

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Coding as the Perfect Target:** Coding is an ideal initial target for LLMs because it is fundamentally text-based, and extensive infrastructure (IDEs, diffs, terminals) already exists to support agents.|**Tool Calibration (Tip):** LLMs are useful for **boilerplate code** and tasks frequently seen on the internet. They lower the barrier to entry for learning new programming languages (like Rust) by providing auto-completion and examples.|
|**Limitations in Complexity:** LLM agents struggle with "intellectually intense code" or code that is fairly unique (like the Nanochat repository). They exhibit cognitive deficits, often misunderstanding custom code, attempting to use deprecated APIs, and trying to bloat codebases with unnecessary boilerplate (like `try/catch` statements for non-production environments). They are specifically bad at code that has "never been written before".|**Current Best Practice (NPTT):** For complex or unique code, the **autocomplete feature** is the preferred method of interaction, as it offers a "very high information bandwidth" (pointing where the code should go and typing the first few pieces) compared to typing out long requests in English.|
|**Learning/Development Tip (NPTT):** To gain a deeper understanding of technical concepts, one must **build the code from scratch**, referring to examples but **not copy-pasting**.||

### Part 7: Reinforcement Learning (RL) Limitations and Advanced Supervision

RL is viewed as conceptually flawed in its current implementation.

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**RL Flaw:** Current RL uses a final outcome-based reward, which is "terrible". This process is described as **"sucking supervision through a straw,"** where a single reward is broadcast across an entire complex trajectory, leading to noise and upweighting incorrect intermediate steps.|**Research Trend:** The need for **process-based supervision** (rewarding intermediate steps) is obvious to those in the field.|
|**The LLM Judge Problem:** Automating process supervision by using LLMs as judges to assign partial credit is a challenging research path. These LLM judges are gameable, and prolonged RL against them will eventually find **adversarial examples** (nonsensical solutions that receive 100% reward).|**Anticipated Algorithm Update (NPTT):** Expect a major update in LLM algorithms to incorporate **"reflect and review"** processes, moving beyond simple imitation or outcome-based RL.|

### Part 8: Synthetic Data, Model Collapse, and Culture

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Data Collapse:** When LLMs generate synthetic data (e.g., thinking about a book chapter), the samples are **"silently collapsed"**—they occupy a narrow manifold and lack the richness, diversity, and entropy of human data. Training on too much of this self-generated data causes the model to collapse.|**Research Problem:** A major challenge is determining how to achieve synthetic data generation while **maintaining entropy** and diversity in the samples.|
|**LLM Culture and Self-Play:** LLMs currently lack an equivalent of culture.|**Multi-Agent Research Directions (NPTT):** 1. Create LLM culture: a **giant scratch pad** that LLMs can edit, or allow them to write books for each other. 2. Implement **self-play** (similar to AlphaGo), where one LLM creates progressively difficult problems for another to solve, driving competitive intelligence.|

### Part 9: Technical Education (Eureka) and Ramps to Knowledge

The goal of the Eureka project is to fundamentally change education using AI capabilities, even if the optimal AI tutor is not yet achievable.

|Technical Summary|New Practices, Trends, & Tips (NPTTs)|
|:--|:--|
|**Ideal Tutor Bar:** An ideal tutor (human or AI) instantly understands the student's world model, serves content that is neither too hard nor too trivial, and maximizes "Eurekas per second" (understanding per second).|**Concept (NPTT):** Education is a **"technical problem"** of building **"ramps to knowledge"**. A ramp (like the Nanochat repository) is a simplified, full-stack artifact that allows the student to progress without getting stuck.|
|**Curriculum Design Tips (NPTT):** **Focus on First-Order Terms:** Simplify complex systems by finding the first-order components and approximating the structure (e.g., the spherical cow analogy from physics). **Layered Learning:** Structure material so that every concept depends only on the concept before it, untangling the knowledge for the student. **Motivation:** Present the pain point or problem before presenting the solution to maximize appreciation and understanding. **Active Learning:** Prompt the student to guess or solve the problem themselves before presenting the answer.|
|**Self-Learning Tips (NPTT):** **Alternation:** Balance learning depth-wise (project-driven, on-demand) with breadth-wise learning (general curriculum). **Explaining:** Regularly explaining concepts to others forces one to reconcile gaps in understanding and reinforces knowledge.|
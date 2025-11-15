# 01 LLM Reasoning
Denny Zhou, Google DeepMind

## 1. Comprehensive Class Summary

The class material introduces LLM Agents as the next frontier in AI, shifting LLMs from simple text-in/text-out systems to sophisticated reasoning and planning components within dynamic systems. The core mechanism enabling this is the use of **intermediate reasoning steps (Chain-of-Thought)**, which provides significant computational advantages and overcomes inherent limitations of the transformer architecture.

### Technical Summary: Systems and Mechanisms

1. **LLM Agent Architecture:** An LLM serves as the **key brain for reasoning and planning**. The agent system is characterized by its capacity for interaction with diverse environments, sensory input, and external resources. Mechanisms include:

    - **External Interaction:** Agents interact with external environments (e.g., web APIs, physical robots).
    - **Tool Use/Retrieval (RAG):** Agents use external tools, databases, and knowledge bases for retrieval and task execution.
    - **Multi-Agent Systems:** Agents can collaborate with other agents and humans to solve complex tasks, often leveraging principles like multi-agent debate (though often less effective than simpler consensus methods).
    - **Continuous Learning:** Agents need capabilities for continuous learning, self-improvement, and recovery from mistakes in long-horizon tasks.

2. **Chain-of-Thought (CoT) Mechanism:** CoT involves deriving the final answer through a series of small, explicit steps. The efficacy of CoT stems from a fundamental computational principle: it **empowers constant-depth transformers to solve inherently serial problems**. Without CoT steps, transformers are limited to functions solvable by parallel circuit classes ($AC0$ or $TC0$), and require enormous depth to solve inherently serial tasks. CoT boosts the number of serial computation steps possible to $T$, where $T$ is the length of the CoT.

3. **CoT Elicitation Mechanisms:** Reasoning pathways can be induced through:

    - **Prompting:** Few-shot prompting (using examples with intermediate steps) or zero-shot prompting (e.g., "let's think step by step").
    - **Decomposition (Least-to-Most Prompting):** Structuring the problem into simpler, sequentially solvable sub-problems to enable easy-to-hard generalization.
    - **CoT-Decoding:** A novel, unsupervised decoding technique that elicits intrinsic reasoning without explicit prompts by exploring alternative top-$k$ token paths (branching at the first decoding step) and selecting the path that correlates with the **highest model confidence in the final answer**.

4. **Major Limitations and Brittleness:** LLMs exhibit critical reasoning weaknesses that agents must overcome:

    - **Intrinsic Self-Correction Failure:** LLMs generally struggle to self-correct their reasoning based solely on their internal capabilities (intrinsic self-correction); performance often degrades without the use of external feedback (oracle labels).
    - **Premise Order Sensitivity:** LLMs are surprisingly brittle to the ordering of premises in the input, even when the underlying task logic is unchanged. Accuracy significantly drops (e.g., over 30%) when premise order deviates from the optimal forward chain alignment required for the proof.
    - **Distractibility:** LLMs are susceptible to performance drops when irrelevant context or distracting rules are introduced into the prompt.

### Top 6 Most Important Ideas

1. **CoT Enables Serial Computation:** CoT fundamentally alters the computational capability of transformers, enabling constant-depth models to solve problems requiring inherently serial steps, such as those found in complex arithmetic and symbolic reasoning tasks.
2. **Intrinsic Reasoning is Latent:** Pre-trained LLMs inherently possess CoT reasoning paths, which are often obscured by standard greedy decoding but can be revealed and leveraged through _CoT-decoding_ techniques.
3. **Confidence Correlates with Correct CoT:** The presence of a CoT reasoning path correlates with significantly **higher model confidence** in decoding the final answer token, providing an internal metric to select reliable paths without external oracle guidance.
4. **Self-Correction Requires External Oracles:** Intrinsic self-correction (without external feedback) is largely ineffective for reasoning tasks, suggesting that successful agent refinement mechanisms must leverage external tools, verification models, or unit tests to provide crucial feedback.
5. **Brittle Reliance on Input Order:** LLM reasoning is highly dependent on the sequential order of premises in the input (position bias), indicating that LLMs prefer left-to-right reasoning and struggle when problems require looking back and forth.
6. **Self-Consistency as a Simple Power Tool:** Simple techniques like **Self-Consistency** (majority voting over sampled responses) reliably boost step-by-step reasoning performance and outperform complex multi-agent debate strategies at equivalent inference costs.

---

## 2. Agent Design and Engineered Efficiency Best Practices

The sources highlight design practices and methodologies focused on maximizing LLM utility and minimizing wasteful iterative refinement, thus promoting efficiency and potentially reducing computational overhead.

|Aspect|Essential Framework, Design Pattern, or Methodology|Step-by-Step Breakdown (Where and How)|
|:--|:--|:--|
|**Decoding Efficiency & Intrinsic Elicitation**|**CoT-Decoding** (A novel decoding strategy leveraging internal model confidence).|**How:** This approach bypasses costly prompt engineering and is demonstrably more effective than standard decoding or sampling methods.1. **Standard Input:** Input the query in a simple Question-Answer format (e.g., "Q: [question]\nA:").2. **First-Step Branching:** Instead of selecting only the top-1 token (greedy decoding), generate multiple potential decoding paths ($k$ paths) by considering the top-$k$ alternative tokens at the initial decoding step.3. **Confidence Scoring:** For each path, calculate the final answer confidence ($\Delta_{k, \text{answer}}$). This is approximated by averaging the probability difference between the top and second-best tokens (minimum-margin) across all tokens belonging to the final answer span.4. **Path Selection:** Select the path corresponding to the maximum calculated confidence score, as this path is overwhelmingly correlated with the presence of a correct CoT reasoning process.|
|**Iterative Improvement/Correction**|**Leveraging External Tools/Oracles for Feedback** (Self-Debugging pattern).|**How:** Since intrinsic self-correction fails and often degrades performance, agents must rely on external verification to guide refinement, ensuring computational efforts are directed towards known errors.1. **Initial Generation:** LLM generates an output (e.g., code, mathematical solution).2. **External Verification:** The agent uses an external tool (e.g., code executor, calculator, verifier model) to generate objective feedback on the correctness of the output.3. **Feedback Integration:** The agent feeds this high-quality external feedback (e.g., error messages, unit test results) back to the LLM.4. **Guided Refinement:** The LLM, now having informative external guidance, attempts to correct the mistake. This is significantly more effective than unguided self-critique.|
|**Prompt Design & Initial Inference Quality**|**Equal Effort in Prompt Design** (Maximizing Initial Response Quality).|**How:** Poor initial prompts lead to reliance on expensive multi-step correction loops. This practice ensures all necessary information is provided upfront to yield the optimal initial response.1. **Comprehensive Task Definition:** Include the _complete task description_ and constraints (e.g., required output format, specific concepts to include) in the prompt for generating the initial response.2. **Avoid Piecemeal Instruction:** Do **not** withhold part of the task description only to be supplied later in a feedback prompt, as this inflates the perceived value of the correction step and wastes computational resources on subsequent calls.|
|**Multi-Response Consensus**|**Self-Consistency over Multi-Agent Debate**.|**How:** When requiring multiple model generations to improve reliability (e.g., for stochastic reasoning), select the most computationally efficient technique.1. **Generate Multiple Responses:** Prompt the single LLM instance to generate multiple independent responses via sampling.2. **Majority Voting:** Select the most frequent final answer. This process proves superior to orchestrating complex, resource-intensive "multi-agent debates" that consume significantly more tokens and are still outperformed by simple majority voting.|

---

## 3. Within that class explore paths to Sustainable LLMs via Agents

The implementation of LLM agents, when combined with optimized reasoning strategies, can indirectly contribute to reducing the hardware footprint (computation, memory, energy) by decreasing the **number of operations (FLOPs) required per accurate query** and by enabling accurate inference with less expressive (shallower) models.

|Resource Area|Bottleneck/Challenge|Agent's Potential Contribution (Mechanism)|
|:--|:--|:--|
|Inference/Computation|High FLOPs/long latency per query; unnecessary large model activation|**Agentic Task Decomposition (Least-to-Most Prompting)**: The agent explicitly manages the workflow by breaking down complex problems. This mitigates the computational difficulty of inherently serial problems for constant-depth LLMs. By solving simpler sub-tasks sequentially, the system reduces the risk of error and potentially the need for massive, continuous activation of the entire large model throughout a brittle, monolithic reasoning attempt, thus reducing overall FLOPs per accurate solution.|
|Inference/Computation|High resource usage from iterative correction/refinement cycles (Wasted FLOPs).|**External Oracle/Verifier Integration (Self-Debugging)**: Agents use external tools (e.g., code executors, verifiers) to provide concrete, verifiable feedback, effectively turning iterative correction into **guided debugging**. This reliance on objective truth reduces computationally wasteful cycles where the LLM attempts to intrinsically guess and correct its own reasoning errors, a task it performs poorly.|
|Inference/Computation|Inefficient search/sampling strategies (e.g., complex debate, random sampling) required for consensus.|**CoT-Decoding for Optimized Search**: The agent incorporates CoT-decoding to efficiently search for the best reasoning path. By using the model’s internal **answer confidence** as a selection signal, the agent can find highly accurate answers by checking a small number of paths (e.g., $k=10$). This mechanism requires fewer model calls and associated FLOPs/latency compared to methods that require extensive, unguided sampling to achieve similar reliability.|
|Inference/Computation|Computational drag from processing irrelevant context (Distractibility).|**Context Preprocessing and Organization**: Agents, functioning as input processors, can apply strategies to prune or organize input context/premises. Since LLMs are brittle and susceptible to irrelevant context, removing unnecessary text (or ensuring premises align with the forward reasoning chain) reduces the computational burden of processing and attending to extraneous tokens, thereby improving efficiency and accuracy simultaneously.|
|Inference/Computation|High reliance on large, expensive models (High hardware footprint).|**Leveraging CoT for Shallower Architectures**: The theory suggests that CoT _empowers transformers_. If CoT allows a model with constant depth to solve problems previously requiring immense depth or larger models (due to serial computation constraints), LLM developers could potentially rely on **shallower architectures** combined with CoT methodologies, indirectly enabling operation on lower-tier hardware (less memory, energy, and smaller footprint).|
# 02 LLM agents: brief history and overview
Shunyu Yao, OpenAI
## 1. Class Summary

The class explores the concept and history of intelligent systems, defining agents based on their interaction with an environment and focusing specifically on the evolution and mechanisms of **Large Language Model (LLM) agents**.

#### Agent Concepts and Evolution

1. **Agent Definition:** An intelligent system that interacts with some environment (physical, digital, or human). The definition of "intelligent" is notoriously broad and changes over time.
2. **Levels of LLM Agents:**
    - **Level 1: Text agent:** Interacts using text observation and text action (e.g., ELIZA, LSTM-DQN). These are typically domain-specific and rely on manual rule design or extensive training with scalar rewards.
    - **Level 2: LLM agent:** A text agent that uses an LLM primarily to act (e.g., SayCan, Language Planner).
    - **Level 3: Reasoning agent:** Uses an LLM to **reason to act** (e.g., **ReAct**, AutoGPT). This is the key focus of the field.
3. **Historical Paradigm Shift:**
    - **Symbolic AI (1960s):** Maps observations to a symbolic state using IF/ELSE rules to derive actions; requires intensive manual effort and is task-specific.
    - **Deep RL (2000s):** Maps observations (pixels/text) to neural embeddings to derive actions; requires extensive training steps and is task-specific.
    - **Reasoning Agents (LLM era):** Uses **open-ended natural language** as the intermediate representation between observation and action, relying on rich priors from LLMs and being inference-time scalable and highly general.

#### ReAct: Synergizing Reasoning and Acting

**ReAct (Reasoning + Acting)** is a general paradigm that prompts LLMs to generate both verbal reasoning traces (thoughts) and task-specific actions in an **interleaved manner**.

- **Mechanism (Augmented Action Space):** ReAct augments the agent's action space to $\hat{A} = A \cup L$, where $L$ is the space of language (thoughts or reasoning traces).
- **Thought Mechanism:** A thought ($\hat{a}_t \in L$) is an **internal action** that does not affect the external environment and thus leads to no observation feedback. Instead, it updates the agent's internal context/memory to support future reasoning or acting.
- **Synergy:** Reasoning helps the model induce, track, and update action plans, handle exceptions, and maintain working memory. Actions allow the agent to interface with and gather external information (e.g., knowledge bases, environments) to incorporate into reasoning.

#### Memory Systems

Reasoning agents leverage memory architectures to handle long-horizon tasks and generalize across experiences.

|Memory Type|Mechanism/Role|Characteristics|
|:--|:--|:--|
|**Short-Term Memory**|The context window of the LLM.|Append-only, limited context size, limited attention, does not persist over new tasks.|
|**Long-Term Memory**|Stores generalized experience, knowledge, and skills (e.g., task knowledge, learned behaviors).|Supports read and write operations, persists over new experiences.|
|**Examples**|**Reflexion:** Uses verbal reinforcement learning where the agent reflects on failures and updates language (task knowledge) in long-term memory. **Voyager/Generative Agents:** Employ procedural memory (skills) and episodic/semantic memory (logged events, reflective knowledge).||

#### Environments and Benchmarks

The development of LLM agents is heavily dependent on scalable, practical benchmarks.

- **WebShop:** A large-scale simulated e-commerce website with 1.18 million real-world products and 12,087 crowd-sourced instructions. It challenges agents in understanding noisy text, query reformulation, and strategic exploration over long horizons.
- **ALFWorld:** A synthetic text-based game focused on embodied reasoning and planning for household tasks, requiring commonsense knowledge to determine likely object locations.

---

## 2. Agent Design for Efficiency

Efficient agent operation is enabled primarily by integrating reasoning into the action loop, allowing agents to minimize redundant steps, token generation, and the need for extensive training data.

#### 2.1 Architecture & Reasoning

**Outline the agent’s loop and note where efficiency can be optimized:**

The core ReAct agent loop involves an interleaved sequence of generations: **Thought $\rightarrow$ Action $\rightarrow$ Observation**. This entire sequence is appended to the context for the next generation step.

- **Efficiency Optimization Point:** Optimization primarily occurs at the **Thought generation step**, where the LLM reasons to formulate an effective action. By dynamically updating the plan and handling exceptions based on observations, the agent avoids generating repetitive, failed actions.

**Explain reasoning shortcuts that minimize tokens, steps, and latency:**

|Efficiency Goal|Reasoning Shortcut/Mechanism|Mechanism Details/Support|
|:--|:--|:--|
|**Minimize Steps/Latency**|**Strategic Exploration:** Reasoning guides search queries and exploration/exploitation tradeoffs. This prevents the agent from getting stuck in loops of failed actions, unlike Act-only baselines.|Act-only models often repeat failed actions because they lack the capacity to reason that an item is unavailable or a subgoal is complete. ReAct ensures the goal is systematically decomposed and tracked, leading to success rates far exceeding Act-only models.|
|**Minimize Tokens**|**Sparse, Flexible Reasoning:** In decision-making tasks (like ALFWorld), thoughts are generated asynchronously only when needed (e.g., to track subgoals, handle exceptions).|This selective use of thoughts reduces the computational overhead compared to **dense thoughts** (thought-action-observation at every step, typically used in QA tasks).|
|**Avoid Exhaustive Search**|Reasoning avoids computationally intensive exhaustive search over the state and action space.|The _Choice Oracle_, which exhaustively checks all options to maximize reward, required hundreds or thousands of steps, compared to 4.5 steps (IL+RL) or 11.3 steps (Human Experts) on WebShop. Reasoning enables the agent to pick the best path without brute-force exploration.|

**Highlight patterns that reduce computational overhead:**

A key pattern is the **few-shot learning capability** of ReAct. Few-shot prompting enables agents to achieve strong generalization and superior performance in interactive decision-making with only **one or two in-context examples**. This drastically reduces the computational overhead and resource demands associated with collecting large-scale training data and performing extensive reinforcement learning (RL) or imitation learning (IL) runs (which historically required $10^3 \sim 10^5$ task instances).

#### 2.2 Systems & Best Practices

**Describe how to think in systems: breaking tasks into minimal specialized agents to reduce total computation:**

While the source primarily champions ReAct as a "simple, unifying solution" rather than requiring complex multi-agent setups, the underlying system design encourages modularity and the use of **external specialized tools** (which function as non-LLM specialized systems).

- **Modular Environment Design (WebShop):** WebShop is designed modularly, disentangling website transitions from task-specific aspects (instructions, reward), allowing easy extension to new domains. This decomposition aids in developing agents that interact specifically with high-level search and choose actions, rather than low-level mouse clicks, making them more **scalable and transferable**.
- **Tool Use/Grounding:** ReAct offloads computationally complex tasks (like arithmetic or external knowledge retrieval) to specialized systems like a search engine or calculator, reducing the LLM's internal computational burden.

**List concrete best practices mentioned for hardware-efficient agent design:**

- **Prompting (Few-Shot):** Use ReAct prompting with minimal in-context examples (e.g., 1 to 6) to leverage the LLM’s rich language priors for task generalization. This approach is significantly cheaper than acquiring large datasets or running extensive fine-tuning.
- **Action Space Design:** Utilize **high-level, text-based actions** (e.g., `search[Query]`, `choose[Text button]`) that abstract away low-level operations. These are more scalable and transferable to real-world settings (sim-to-real transfer) compared to low-level mouse-click actions.
- **Memory Use (Internal Reasoning):** Employ **verbal reasoning/thoughts** to track subgoals, handle context, and adjust plans. This function serves as an augmented **working memory**.
- **Memory Use (External Storage):** Implement long-term memory mechanisms (e.g., Reflexion, Voyager) that **persist knowledge and learned skills** across tasks, avoiding the need for the LLM to recalculate solutions or relearn complex behaviors from scratch (which saves future computational effort).
- **Execution Control:** When generating search queries, sampling multiple candidates (e.g., top-5 search queries via beam search) and randomly choosing one encourages **diverse actions and exploration**, preventing the agent from getting stuck or missing optimal candidates.

---

## 3. Paths to Sustainable LLMs via Agents

Agents, particularly those built using the ReAct paradigm, contribute to sustainability and efficiency by actively reducing the need for massive data collection/training and by optimizing inference-time computation through strategic action guidance and external tool usage.

|Resource Area|Bottleneck/Challenge|Agent's Potential Contribution (Mechanism)|
|:--|:--|:--|
|**Inference/Computation**|High FLOPs/long latency per query; unnecessary large model activation.|**Strategic Action Guidance (Reasoning)**: ReAct uses reasoning traces (`Thought`) to dynamically guide actions and adjust plans based on observations, preventing repetitive failed actions and systemic errors. This minimizes unnecessary LLM activation steps and reduces the overall length of execution trajectories.|
|**Inference/Computation**|LLM required to perform computation or recall specific, current facts.|**External Tool Offloading**: Agents interface with external sources (e.g., Wikipedia API, search engine, calculator). This offloads external knowledge retrieval and complex numerical computation, tasks that are computationally expensive or inaccurate for the LLM's internal knowledge base.|
|**Inference/Computation**|Generating verbose output (high token count) in interactive tasks.|**Sparse Thought Generation**: For decision-making tasks, ReAct employs flexible, sparse thoughts that appear only when relevant (e.g., goal decomposition or error handling), minimizing the total number of tokens generated and processed per episode.|
|**Training/Energy Use**|Need for massive datasets and extensive training/fine-tuning (e.g., Imitation Learning or RL on $10^5$ instances).|**Few-Shot Generalization**: ReAct leverages the language model's rich priors to achieve superior performance with minimal (one or two) in-context demonstrations. This capability eliminates the enormous computational and energy costs associated with large-scale data collection and reinforcement learning training runs.|
|**Training/Energy Use**|Requirement to use the largest available LLMs for performance.|**Fine-tuning Smaller Models**: Fine-tuning ReAct trajectories allows smaller models (e.g., PaLM-8B or 62B) to achieve performance competitive with or superior to zero/few-shot prompting of the largest models (e.g., 540B). This provides a sustainable path for deployment on more hardware-efficient infrastructure.|
# 03 Agentic AI Frameworks & AutoGen
Chi Wang, AutoGen-AI
## 1. Class Summary

The class explores **Large Language Model Agents**, defined as LLMs enhanced to interact with an external environment. The LLM serves as the central brain responsible for **Reasoning & Planning**.

**System Architecture and Mechanism:**

LLM agents operate via a dynamic, iterative agent workflow, often conceptualized in a continuous loop: the agent acts based on its internal **memory** and **prompt**, the **action** is executed in the **environment**, and the agent then updates its state by observing the resultant **feedback**.

1. **Reasoning and Planning:** This is a core capability. Techniques like **Chain-of-Thought (CoT)** reasoning enable LLMs to generate intermediate steps, which improves performance on complex reasoning tasks, such as arithmetic and symbolic tasks. Theoretically, CoT empowers constant-depth transformers with the ability to perform inherently serial computation. Advanced reasoning approaches include:

    - **ReAct (Reasoning + Acting):** Interleaving reasoning traces (thoughts) with task-specific actions. Thoughts compose useful information and update the agent's context, while actions interface with external resources.
    - **CoT-decoding:** Eliciting reasoning capabilities directly from pre-trained LLMs by altering the decoding process (e.g., investigating top-$k$ alternative tokens) rather than relying on manual prompt engineering.

2. **Tool Use and Retrieval:** Agents expand their capabilities by leveraging external tools (e.g., code execution, APIs, search) and retrieving knowledge from external databases. This provides **grounding** in the external world, mitigating issues like hallucination and error propagation common in static CoT reasoning.

3. **Memory:** Agents utilize **short-term memory** (the context window of the LLM) and **long-term memory**, which stores persistent experience, knowledge, and skills. Long-term memory is crucial for long-horizon tasks, where agents must learn and self-improve from environment feedback.

**Agent Frameworks and Systems Thinking:**

Complex task solving is often streamlined using multi-agent systems and modular design.

- **Multi-Agent Conversation:** Frameworks like **AutoGen** leverage chat-optimized LLMs to support multi-agent conversations, enabling **task decomposition** and **division of labor** among specialized agents. This paradigm, referred to as **conversation programming**, unifies complex workflows.

- **Compound AI Systems:** Programs that use LLMs as modular, specialized components (e.g., Retrieval-Augmented Generation or RAG). This modularity enhances **quality, control, transparency, and efficiency**.

- **Agent-Computer Interface (ACI):** For digital environments like software engineering (e.g., SWE-agent), the interface between the LLM and the computer is abstracted. A well-designed ACI is tailored to the LLM’s limitations (e.g., token limits) and abilities, improving performance without modifying the underlying model weights.

## 2. Agent Design for Efficiency

Efficient agent operation is primarily achieved by optimizing the architecture for token and step minimization, leveraging specialized reasoning methods, and using structured system design.

### 2.1 Architecture & Reasoning

**Agent Loop and Optimization Points:**

The agent operates in an iterative loop: **Act($m_t$) $\rightarrow$ Execute($s_{t-1}, a_t$) $\rightarrow$ Update($r_t, o_t$)**. Efficiency optimization centers on reducing the computational load of the _Act_ phase and minimizing the total number of _turns_ (steps) required for task completion.

|Component/Phase|Optimization Focus|Mechanism/Challenge|
|:--|:--|:--|
|**Act (LLM Inference)**|**Tokens/Latency:** Reduce prompt length and LLM size.|Sensitive to context length; tokens cost money and time. Use smaller models optimized via distillation.|
|**Reasoning/Planning**|**Steps/Latency:** Reduce intermediate steps while maintaining accuracy.|Use fast reasoning shortcuts or specialized modules to avoid unnecessary internal computation.|
|**Action/Execution**|**Steps/Efficiency:** Maximize progress per step.|Actions should be compact and efficient, consolidating operations to achieve higher-order operations in fewer turns.|
|**Update (Memory)**|**Tokens:** Optimize context for next prompt.|Use effective context management to exclude outdated information.|

**Reasoning Shortcuts that Minimize Tokens, Steps, and Latency:**

- **Dual-Process Thinking (Dualformer):** This framework trains a single Transformer model to seamlessly integrate **fast thinking** (System 1, outputs solutions only) and **slow thinking** (System 2, outputs reasoning traces and solutions). In experiments, Dualformer achieved enhanced planning power and faster reasoning, reducing the trace length (reasoning steps) by **49.4%** compared to models trained on complete traces. In **fast mode**, it operates with a lower computational cost and quicker response time.
- **CoT-decoding:** This approach minimizes the tokens and steps usually associated with **prompt engineering** by extracting CoT reasoning implicitly during decoding. By sampling alternative top-$k$ tokens, it uncovers reasoning paths inherent in the model, bypassing the need for explicit few-shot CoT demonstrations in the prompt.

**Patterns that Reduce Computational Overhead:**

- **State-Driven Workflows (StateFlow):** By conceptualizing complex task-solving as state machines, StateFlow provides better control and efficiency. It decomposes long, general instructions into **shorter, concise prompts** specific to the current state. This systematic control drastically reduces LLM usage cost, achieving a **$3\times$ to $5\times$ cost reduction** compared to methods like ReAct, while minimizing prompt tokens.
- **Compacting Actions:** Agent actions (especially in ACIs) should be defined to be compact and efficient, enabling the agent to achieve meaningful progress toward a goal in a single step. For instance, combining operations into a single action avoids sequences of simple actions (like repeated `cd`, `ls`, `cat` commands) that consume more tokens and steps.
- **Efficient Context Management:** The context management system tracks history and ensures that only the relevant context is fed back to the LLM at each turn. **Collapsing old observations** reduces the number of tokens processed, minimizing cost and processing time.

### 2.2 Systems & Best Practices

**Thinking in Systems: Breaking Tasks into Minimal Specialized Agents:**

The utilization of specialized agents and compound AI systems is a core strategy for efficiency and performance.

- **Division of Labor:** Breaking a complex task into subtasks allocated to **specialized agents** (e.g., in AutoGen, CrewAI, CAMEL, or MetaGPT) facilitates division of labor. This approach naturally leads to **modularity**, allowing agents to focus on simpler, more contained tasks, thus reducing the workload and complexity required from a single monolithic agent.
- **Increased Performance and Code Reduction:** In AutoGen's multi-agent coding system, the division of labor (Commander, Writer, Safeguard) boosted performance (e.g., 8-35% F-1 score improvement over single-agent design) and dramatically simplified development, reducing the core workflow code from over 430 lines to 100 lines.
- **Reusability:** By decomposing the decision-making aspect from the environment interaction, developers can **reuse decision-making agents** for new tasks with minimal effort, rather than building specialized agents for every new environment.

**Concrete Best Practices for Hardware-Efficient Agent Design:**

|Area|Best Practice/Mechanism|Rationale/Benefit|
|:--|:--|:--|
|**Prompting**|Design actions to be **simple and easy to understand**.|Reduces the need for extensive demonstrations or costly fine-tuning.|
|**Prompting**|Use concise, focused prompts, especially in state-driven modules (e.g., StateFlow).|Lowers prompt tokens used, reducing inference cost and latency.|
|**Memory Use**|Employ sophisticated **context management** (history processors).|Reduces token usage per interaction by trimming or summarizing history, avoiding duplicate context.|
|**Execution Control**|Utilize **Agent-Computer Interfaces (ACIs)** tailored for LMs.|Compensates for LLM limitations (e.g., small short-term memory) and avoids unnecessary context.|
|**Execution Control**|Use sandboxed execution environments (e.g., Docker).|Ensures security and safety (e.g., preventing unintentional asset removal) while allowing execution of agent-generated code.|

## 3. Paths to Sustainable LLMs via Agents

Agents contribute significantly to sustainability by enabling **cost-effective deployment** of LLMs through distillation and optimization, fundamentally lowering the reliance on massive, computationally expensive models during inference.

| Resource Area             | Bottleneck/Challenge                                                             | Agent's Potential Contribution (Mechanism)                                                                                                                                                                                                                  |
| :------------------------ | :------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inference/Computation** | High FLOPs/long latency per query; unnecessary large model activation.           | **Agent Distillation:** A high-quality Teacher Agent (e.g., Llama-405B multi-node) generates high-fidelity reasoning traces ("tapes"). A smaller Student Agent (e.g., Llama-8B single-node) is **finetuned** on these tapes.                                |
| **Inference/Computation** | High token count, complexity of multi-step prompts, high cost.                   | **Prompt & Architecture Optimization:** The Student agent uses a single-node architecture with a **single, condensed prompt** optimized for length, drastically reducing the number of input and output tokens per turn compared to the multi-node Teacher. |
| **Inference/Computation** | Costly deployment of large, proprietary models (high API cost).                  | **Cost Reduction Outcome:** In a case study, the finetuned Student Agent (Llama-8B) achieved performance (GREADTH score) comparable to the Teacher Agent (Llama-405B) while being **$300\times$ cheaper** per million agent turns.                          |
| **Inference/Computation** | Fixed, single reasoning strategy leading to potentially long, suboptimal traces. | **Dualformer Efficiency:** Training agents (using structured trace dropping) to achieve enhanced planning power and reasoning speed, resulting in a **shorter reasoning trace** and reducing the required computational steps.                              |
| **Inference/Computation** | Inefficient step-wise computation in complex workflows.                          | **StateFlow Efficiency:** By using concise, context-specific instructions based on the workflow state, StateFlow reduces prompt tokens and achieves **$3\times$ to $5\times$ cost reduction** compared to purely iterative approaches.                      |
# 04 Enterprise trends for generative AI, and key components of building successful agents/applications
Burak Gokturk, Google

# 05 Compound AI Systems & the DSPy Framework

# 06 Agents for Software Development

# 07 AI Agents for Enterprise Workflows

# 08 Towards a unified framework of Neural and Symbolic Decision Making

# 09 Project GR00T: A Blueprint for Generalist Robotics
Percy Liang, Stanford University

# 10 Open-Source and Science in the Era of Foundation Models
Percy Liang, Stanford University

# 11 Measuring Agent capabilities and Anthropic’s RSP
Ben Mann, Anthropic

# 12 Towards Building Safe & Trustworthy AI Agents and A Path for Science‑ and Evidence‑based AI Policy
Dawn Song, UC Berkeley
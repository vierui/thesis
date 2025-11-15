# 1 Introduction
## What is an agent ?

- Agent is an **AI model capable of reasoning, planning, and interacting with its environment**

- Agent because it has _agency_ (ability to interact w/ an environment)

- has two parts :
	- a brain (ai model) : which actions to take
	- a body (capabilities and tools) : actions

- agency levels and corresponding outputs : 
	- **processor** : has no impact on program flow
	- **router** : determines basic control flow
	- **tool caller** : determines function execution
	- **multi-step** : controls iteration and program continuation
	- **multi** : can start an other agentic worklow

- An Agent can perform any task we implement via **Tools** to complete **Actions**.

- **design of the Tools is very important and has a great impact on the quality of your Agent**.

***remark*** : `smolagents` is a library that enables you to run powerful agents in a few lines of code.
### tl;dr 
an Agent is a system that uses an AI Model (typically an LLM) as its core reasoning engine, to:

- **Understand natural language:** Interpret and respond to human instructions in a meaningful way.
- **Reason and plan:** Analyze information, make decisions, and devise strategies to solve problems.
- **Interact with its environment:** Gather information, take actions, and observe the results of those actions.
---
## LLMs

-  each Agent needs **an AI Model at its core** : LLMs

- LLM is a type of AI model that excels at **understanding and generating human language** (**Transformer architecture** mostly)

- Types of transformers and their outputs 
	- Encoder : dense representation of input text
	- Decoders : generates new tokens to complete a sequence, one token at a time.
	- Seq2Seq (Encoder–Decoder) : 1) Encoder processes the input into a context representation. 2) Decoder generates output sequence

- LLMS : **its objective is to predict the next token, given a sequence of previous token**

- LLMs are said to be **autoregressive**, meaning that **the output from one pass becomes the input for the next one**.

- attention : _context length_ = attention span 

- prompting : to guide the generation of the LLM toward the desired output.

- training : underlying patterns in text, allowing the model to generalize to unseen data.

- llms provide the foundation for understanding and generating human language.

---
## Messages and Special Tokens
focuses on **how Large Language Models (LLMs) structure their inputs through chat templates**.

### Conversation Abstraction and Prompt Concatenation
- User interaction via a chat interface is a **UI abstraction**.

- The LLM does not inherently "remember" the conversation.

- Before processing, **all messages in the conversation are concatenated and formatted** into a single, stand-alone prompt sequence. This full prompt is read by the model for every turn.

### The Role of Chat Templates
- **Definition:** Chat templates function as the **bridge** between sequential conversational messages and the LLM's **specific formatting requirements**.

- **Function:** They ensure the model receives a correctly structured prompt, regardless of the model's unique special tokens, formatting rules, and delimiters.

- **Special Tokens:** Templates utilize special tokens to **delimit where the user and assistant turns start and end**.

- **Consistency:** The same list of messages can be translated into drastically different prompt strings depending on the required model template (e.g., SmolLM2 versus Llama 3.2 formatting).

### Message Types and Structure
Messages are typically structured as a list of dictionaries containing <mark style="background: #BBFABBA6;">`role`</mark> and <mark style="background: #BBFABBA6;">`content`</mark>.
#### System Messages (System Prompts) 
Define **how the model should behave** and serve as **persistent instructions** guiding interactions.

- In Agents, the System Message includes information about **available tools**, instructions on **action formatting**, and guidelines for **thought process segmentation**.
#### Conversational Messages 
Consist of alternating exchanges between a Human (`user`) and an LLM (`assistant`). Templates preserve this history to maintain context across multi-turn interactions.

### Model Compatibility and Standardization
#### Base Models vs. Instruct Models
- A **Base Model** is trained purely to predict the next token.

- An **Instruct Model** is fine-tuned to follow instructions and engage in conversations.

- To utilize a Base Model as an instruct model, prompts must be formatted consistently using templates.
#### ChatML 
is a common template format that structures conversations using clear role indicators (system, user, assistant).

### Technical Implementation in `transformers`
- **Implementation Language:** Chat templates within the transformers library are implemented using Jinja2 code.

- **Jinja2 Role:** The Jinja2 code describes how to transform the ChatML list of JSON messages into the necessary textual representation (the prompt string).

- **Conversion Function:** The easiest method for prompt conversion is using the tokenizer's `chat_template` via the **tokenizer.apply_chat_template(messages, ...)** function. This function automatically converts the list of messages into the final `rendered_prompt` string ready for model input.

### Links
- [Hugging Face Chat Templating Guide](https://huggingface.co/docs/transformers/main/en/chat_templating)
- [Transformers Doc](https://huggingface.co/docs/transformers/index)
---
## Tools
The capacity for AI Agents to take **actions** is a crucial aspect of their functionality, which is achieved through the use of **Tools**.

### Defining AI Tools
- A **Tool is a function given to the LLM** that must fulfill a **clear objective**.
- Tools **complement the power of an LLM**, providing capabilities that surpass the model's native-text abilities.
- Tools are essential to overcome limitations related to LLM training data:
    - **Static Knowledge:** LLMs predict completion based on internal knowledge limited to events prior to their training.
    - **Real-time Data:** Tools must be provided if the Agent requires **up-to-date data**.
    - **Precision Tasks:** Tools like a **calculator** provide better results for arithmetic than relying on the model's predictive capabilities.

- Examples of commonly used Tools include:
    - **Web Search:** Fetches up-to-date information from the internet.
    - **Image Generation:** Creates images based on text descriptions.
    - **API Interface:** Interacts with external services (e.g., GitHub, Spotify).

### Technical Structure of a Tool
- A **textual description of what the function does**.

- A _Callable_ (the mechanism used to perform an action).

- _Arguments_ with typings.

- (Optional) Outputs with typings.

### How Tools Work (The Agent System)
LLMs operate exclusively on text inputs and outputs and **have no intrinsic ability to call tools**. The execution is managed entirely by the Agent:

1. **Instruction:** The LLM is taught about the tool's existence and instructed to generate a text-based invocation when a tool is necessary.
2. **Invocation:** When the LLM recognizes an opportunity to use a tool, it generates a text output that represents a tool call (e.g., `call weather_tool('Paris')`).
3. **Execution:** The **Agent** intercepts this response, identifies the required tool call, and executes the function on the LLM’s behalf.
4. **Context Injection:** The Agent retrieves the actual data generated by the tool execution.
5. **Continuation:** The Agent appends the output/steps of the tool call as a **new message** to the conversation history (typically hidden from the user).
6. **Final Response:** The LLM processes this updated conversation context and generates a natural-sounding response for the user.

### Tool Integration via the System Prompt
Tools are provided to the LLM using the **system prompt**.

- This integration requires high precision regarding:
    1. **What the tool does**.
    2. **What exact inputs it expects**.
- Tool descriptions are usually delivered using precise structures like computer languages or JSON, although any precise and coherent format works.
- The textual representation of the tool (including its name, description, arguments, and outputs) is **injected** into the system prompt for the LLM to understand and use.

### Generic Tool Implementation

A generic `Tool` class can be implemented to represent a reusable piece of code.

- **Attributes (Data Specifications):**
    - `name` (_str_): The identifier of the tool.
    - `description` (_str_): A textual description of its purpose.
    - `func` (_Callable_): The underlying function.
    - `arguments` (_list_): Expected input parameters.
    - `outputs` (_str_ or _list_): Expected return type(s).
- **Methods (System Actions):**
    - <mark style="background: #BBFABBA6;">`to_string()`</mark>: Converts the tool's attributes into a standardized string representation suitable for the LLM prompt. Example format: `Tool Name: [name], Description: [description], Arguments: [args], Outputs: [outputs]`.
    - `__call__()`: Invokes the underlying function (`func`).

### Automated Tool Specification

- Python implementations often inherently contain all necessary specifications (name, docstring description, typed arguments, return types).
- **Introspection:** Python's introspection features (like the `inspect` library) can be leveraged to automatically extract these relevant portions from the source code.
- A **`@tool` decorator** automates the creation of a `Tool` instance by retrieving the function signature, docstring, parameter types, and return annotation, thus automatically generating the necessary textual description string.

### Model Context Protocol (MCP)

- MCP is an **open protocol** designed to **standardize how applications provide tools to LLMs**.
- Advantages of MCP:
    - Offers a growing list of pre-built integrations.
    - Provides flexibility to switch between LLM providers and vendors.
    - Ensures consistent leveraging of tools across different frameworks without requiring reimplementation.

---
## Agent Workflow 

Agents' work is a continuous cycle of :
**Thought (next step decision) → Action (tool call) → Observation (reflects on tool's response)**

This sequence functions analogous to a **while loop**, allows them to reason, use tools, and adapt dynamically until until its goal is achieved..

 The system prompt defines:
 - The agent’s behavior
 - Which tools it can access
 - The logic of the reasoning cycle itself
 
**Key Takeaways**
- **Reason → Act → Reflect:** the essence of _ReAct-style_ agents.
- **Tool integration** lets agents use real-time data, not just internal knowledge.
- **Dynamic adaptation:** each observation refines future reasoning.
- **System prompt** is the blueprint that embeds all these rules.
---

## Thoughts (Reasoning)

Thoughts represent the **LLM’s internal reasoning** used to plan, analyze and make decisions during a task. They enable the agent to:

- Evaluate current observations
- Choose the next action
- Refine strategies iteratively

Common types of thoughts include planning, analysis, decision making, problem solving, memory integration, self-reflection, goal setting, and prioritization.
For function-calling models, this step can sometimes be omitted since reasoning may be embedded in the action logic itself.

The section also introduces **Chain-of-Thought (CoT)** and **ReAct**, two prompting techniques that structure and enhance this reasoning process.
### Chain-of-Thought (CoT)

**Chain-of-Thought** is a prompting strategy where the model explicitly reasons step by step before giving an answer.
It helps with logical or mathematical reasoning and does not involve external tools.

>**Example**
> 	*Question: What is 15% of 200?*
> 	*Thought: Let’s think step by step. 10% of 200 is 20, 5% is 10, total is 30.*
> 	*Answer: 30*

This technique strengthens internal reasoning for tasks that depend on pure logic rather than external data.

### ReAct: Reasoning + Acting

**ReAct** combines _reasoning_ with _action_. It encourages the model to alternate between internal reasoning (Thought), external tool usage (Action), and environmental feedback (Observation).

This enables agents to handle multi-step, information-seeking tasks dynamically.

>**Example**
>	*Thought: I need to find the latest weather in Paris.*
>	*Action: Search["weather in Paris"]*
>	*Observation: It's 18°C and cloudy.*
>	*Thought: Now that I know the weather...*
>	*Action: Finish["It's 18°C and cloudy in Paris."]*

ReAct thus extends CoT by linking reasoning with tool interaction and reflection.

### Comparison: ReAct vs. CoT

| **Feature**        | **Chain-of-Thought (CoT)**  | **ReAct**                                      |
| ------------------ | --------------------------- | ---------------------------------------------- |
| Step-by-step logic | ✅ Yes                       | ✅ Yes                                          |
| External tools     | No                          | ✅ Yes (Actions + Observations)                 |
| Best suited for    | Logic, math, internal tasks | Dynamic, multi-step, information-seeking tasks |

#### Remarks

- While CoT focuses on structured reasoning within the model, **ReAct integrates reasoning with tool use and feedback**, forming the basis for adaptive, autonomous AI agents. 
  Both are prompting strategies (**training-level technique**), where the model learns to think via examples. 

- Modern models like **Deepseek R1** or **OpenAI’s o1** were fine-tuned to _think before answering_. They use structured tokens like `<think>` and `</think>` to explicitly separate the reasoning phase from the final answer -- formalizing the thought process at the training level rather than through prompts alone.
---

## Actions: Enabling the Agent to Engage with Its Environment

Actions are the concrete steps an **AI agent takes to interact with its environment**. They are the agent's structured outputs (formatted as JSON, code, or function calls - text only) that allow it to interact with the world. This process relies on the **stop and parse** method to hand off control from the LLM to an external tool executor.

### Types of Agent Actions

Agents can be categorized by how they format their intended actions:

- **JSON Agent:** 
  Outputs the action and its parameters in a JSON structure.
- **Code Agent:** 
  Generates a block of executable code (e.g., Python) to perform the action.
- **Function-calling Agent:** 
  A specialized JSON Agent fine-tuned to generate a distinct message for each action, structured for function invocation.

Actions serve several key purposes, including:

- Information Gathering (e.g., web search)
- Tool Usage (e.g., API calls)
- Environment Interaction (e.g., controlling interfaces or devices)
- Communication (e.g., user chat)

### The Stop and Parse Approach

This is a fundamental mechanism for agent execution, ensuring the LLM's output is structured and predictable.

1. **Generation in a Structured Format:**
   The LLM outputs the intended action in a predefined format (like JSON or a code block).
2. **Halting Further Generation:** 
   The LLM **must stop** generating new tokens immediately after the complete action is defined. This passes control back to the agent framework.
3. **Parsing the Output:** 
   An external parser processes the formatted text, identifies the tool to be called, and extracts the necessary parameters.

**JSON Example:** The LLM generates a "Thought" and an "Action" block. The `Action` block is the machine-readable part.
```json
Thought: I need to check the current weather for New York.
Action :
{
  "action": "get_weather",
  "action_input": {"location": "New York"}
}
```

### Code Agents

Code Agents offer an alternative to JSON by generating executable code, typically in a language like Python.
![[Pasted image 20251111142328.png]]

**Advantages:**

- **Expressiveness:** 
  Code can represent complex logic, including conditionals and loops, more naturally than JSON.
- **Modularity:** 
  Generated code can define and reuse functions.
- **Enhanced Debuggability:** 
  Syntax errors in code are often easier to detect.
- **Direct Integration:** 
  Code can directly import libraries and interact with APIs for complex tasks.

**Security:** Executing LLM-generated code carries significant security risks (e.g., prompt injection). It is recommended to use agent frameworks like `smolagents` that provide default safeguards.

**Code Agent Example (Python):**
Like JSON agents, Code Agents also follow the **stop and parse** approach. The entire code block is generated, the LLM stops, and the framework then executes the code to get a result (e.g., capturing the output of a `print()` function).
```python
# Code Agent Example: Retrieve Weather Information
def get_weather(city):
    import requests
    api_url = f"https://api.weather.com/v1/location/{city}?apiKey=YOUR_API_KEY"
    response = requests.get(api_url)
    if response.status_code == 200:
        data = response.json()
        return data.get("weather", "No weather information available")
    else:
        return "Error: Unable to fetch weather data."

# Execute the function and prepare the final answer
result = get_weather("New York")
final_answer = f"The current weather in New York is: {result}"
print(final_answer)
```
---

## Observe: Integrating Feedback to Reflect and Adapt

Observations are how an **agent perceives the consequences of its actions**. 

They are the feedback signals from the environment that the agent uses to guide its next thought process. 

 **In the observation phase** :
- **Collects Feedback:** 
  Receives data or confirmation that its action was successful (or not).
- **Appends Results:** 
  Integrates the new information into its existing context, effectively updating its memory.
- **Adapts its Strategy:** 
  Uses this updated context to refine subsequent thoughts and actions.

This **iterative incorporation of feedback** loop ensures the agent remains aligned with its goals and can adjust its behavior based on real-world outcomes.

### Observations Nature

|**Type of Observation**|**Example**|
|---|---|
|**System Feedback**|Error messages, success notifications, status codes|
|**Data Changes**|Database updates, file system modifications, state changes|
|**Environmental Data**|Sensor readings, system metrics, resource usage|
|**Response Analysis**|API responses, query results, computation outputs|
|**Time-based Events**|Deadlines reached, scheduled tasks completed|
Observations are essentially **"logs" or textual feedback** resulting from a tool's execution. 

### The Appending Process

After an agent generates an **Action**, the framework executes the following steps:

1. **Parse the Action:** 
   Identify the tool (function) to call and the arguments to use.
2. **Execute the Action:** 
   Run the specified tool with the extracted arguments.
3. **Append the Result as an **Observation** :** 

This completes the **Thought-Action-Observation Cycle**, which repeats until the agent's goal is met.

---
## Dummy Agents Workbook 

Template for system prompt :

``` 
""" Question: the input question you must answer

Thought: you should always think about one action to take. Only one action at a time in this format:

Action:

'```

$JSON_BLOB

'```

Observation: the result of the action. This Observation is unique, complete, and the source of truth.

... (this Thought/Action/Observation can repeat N times, you should take several steps when needed. The $JSON_BLOB must be formatted as markdown and only use a SINGLE action at a time.)

  

You must always end your output with the following format:

  

Thought: I now know the final answer

Final Answer: the final answer to the original input question
  

Now begin! Reminder to ALWAYS use the exact characters `Final Answer:` when you provide a definitive answer. """
```

## Notebook : Dummy agent library
the **core of an agent library is to append information in the system prompt**.

This system prompt is a bit more complex than the one we saw earlier, but it already contains:

1. **Information about the tools**
2. **Cycle instructions** (Thought → Action → Observation)

Risk of agents → hallucinations (can be of non- tool or function call)

Observation : to build an agent 
1. run it naively
2. see where it hallucinates 
3. stopping generation before "Observation:" is a **best practice** even if your current model behaves well
3. Different models have different levels of instruction-following
4. implement step by step the call functions/tools
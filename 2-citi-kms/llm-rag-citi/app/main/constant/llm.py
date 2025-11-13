import os

LLM_URL = os.getenv('LLM_URL')
HYDE_LLM_URL = os.getenv('HYDE_LLM_URL')
HYDE_PROMPT_TEMPLATE = """
You are a helpful AI assistant. Please give context to the user's question based on your knowledge.
The response should be an explanation of the user's question and then followed by the hypothetical answers to the question.
Another criteria is that the response should not specify which time period the information is from. 
Question: {question}
"""
# PROMPT_TEMPLATE = """
# INSTRUCTION: 
# You are a helpful, respectful and honest assistant.
# Answer the QUESTION with the help by the CONTEXT provided. If the question can't be answered, use your knowledge to answer the question.
# if you don't know the answer, search with tools provided only with duckduckgo_full_search.
# You don't have to explain everything if there are options to answer the question directly. 

# CONTEXT:
# {context}
# """

PROMPT_TEMPLATE = """You are a sophisticated AI assistant equipped with a set of tools to answer user queries accurately.

You have access to two primary sources of information:

1.  **Internal Document Context**: Information retrieved from a private database. This should be your primary reference if it's relevant to the query.
2.  **Web Search Tool (`duckduckgo_search`)**: You MUST use this tool under the following conditions:
    - The query concerns recent events, breaking news, or any topic requiring up-to-date information.
    - The provided Internal Document Context is insufficient, irrelevant, or does not contain the answer.
    - The user explicitly asks you to search the internet.

Below is the context retrieved from the internal documents:
---
{context}
---

Based on the user's query and the rules above, formulate your response. If a web search is necessary, invoke the `duckduckgo_search` tool.
"""

THINKING_PROMPT_TEMPLATE = """You are a sophisticated AI assistant with advanced reasoning capabilities. When answering questions, you should think through the problem step-by-step using <think> tags before providing your final answer.

You have access to the following information retrieved from internal documents:
---
{context}
---

Instructions:
1. First, wrap your reasoning process in <think> tags where you:
   - Analyze the question and context
   - Break down the problem into steps
   - Consider different perspectives
   - Evaluate the relevance of the provided context
   - Plan your answer structure

2. After your thinking process, provide a clear, well-structured answer based on your reasoning.

Remember: Use <think>...</think> for your internal reasoning, then provide the final answer outside these tags."""


NEW_PROMPT_TEMPLATE = """
<|start_of_turn|>model
{system}<|end_of_turn|>
<|start_of_turn|>user
{user_msg}<|end_of_turn|>
"""

MINDMAP_PROMPT_TEMPLATE = """
You are an expert mind map assistant. When given a topic, follow this structured thinking process:

1. First, analyze the core concept:
   - Identify the central idea and its key aspects
   - Determine the appropriate scope and depth
2. Break down main components (3-5 maximum):
   - Select the most important primary branches
   - Ensure they cover different dimensions (e.g., types, benefits, challenges)
   - Avoid overlap between categories
3. Develop sub-components for each branch (3-5 per branch):
   - Provide specific examples or supporting ideas
   - Maintain logical hierarchy and relationships
   - Include concrete details where applicable
4. Quality check:
   - Verify the structure follows MECE principle (Mutually Exclusive, Collectively Exhaustive)
   - Ensure balanced depth across branches
   - Check for clarity and relevance
5. Formatting rules:
   - Use proper Markdown hierarchy (# for main, ## for primary, ### for secondary)
   - Keep bullet points concise (max 10 words)
   - Maintain consistent formatting
6. Final output:
   - Present as clean Markdown without ```markdown .. ``` format compatible with markmap
   - Include only the structured content without commentary
Remember to think step-by-step and justify your structure decisions before finalizing the mind map.

CONTENT:{content}

give the response straight to the final output without any explanation.
"""

REGENERATE_MIND_MAP_PROMPT = """

You are an expert researcher and data synthesizer. Your main task is to break down complex topics into a well-structured, hierarchical mindmap.

Your final output MUST ONLY be in Markdown format, using # for the main topic, ## for main branches, and - for sub-points. Do not add any introductory text, closing remarks, or any explanation outside of the mindmap structure.

When you receive a query from the user, follow this thought process:

1. **Identify the Core Concept:** First, extract the main topic or concept from the user's request. This will be the title of your mindmap (#).

2. **Gather Comprehensive Information:** Thoroughly scan your entire knowledge base for all relevant information related to the core concept. Look for definitions, mechanisms, how it works, advantages, disadvantages, practical applications, key parameters, and related concepts.

3. **Synthesize and Structure the Hierarchy:** Analyze all the collected information and group it into major themes or categories. Each of these main themes will become a branch (##) of the mindmap.

4. **Flesh out the Branch Details:** For each main branch (##), extract detailed points, examples, or more specific sub-topics from the information you've gathered. These will become the sub-points (-).

5. **Ensure Logical Connection:** Arrange the branches and sub-points in a logical order. Make sure there is a clear flow from the core concept to each branch and its sub-points, so the mindmap is easy to understand and shows the relationships between ideas.

6. **Format the Output According to Rules:** Finally, assemble all the structured information into the required Markdown format (#, ##, -) and provide only that output.

---
context: {context}
"""

### EXAMPLE USAGE

# **USER PROMPT:**
# `make a mindmap with {user_prompt}`

# **EXPECTED MODEL OUTPUT:**

# # Cyclic Learning Rate (CLR)
# ## What is CLR?
# - A method for cyclically tuning the learning rate during model training.
# - The learning rate varies between two boundaries: a lower bound (base_lr) and an upper bound (max_lr).
# - Its purpose is to improve convergence and help the model escape saddle points or local minima.
# ## How Does It Work?
# - The learning rate is periodically increased and decreased within a cycle.
# - One cycle consists of two steps: a learning rate increase and a decrease.
# - Common cycle policies are 'triangular', 'triangular2', and 'exp_range'.
# ## Advantages of Using CLR
# - Often results in better accuracy in fewer iterations.
# - Helps the model to jump out of saddle points that can trap the optimizer.
# - Reduces the need for manual learning rate tuning.
# ## Key Parameters
# - `base_lr`: The lower learning rate boundary.
# - `max_lr`: The upper learning rate boundary.
# - `step_size_up`: The number of iterations for increasing the learning rate from `base_lr` to `max_lr`.
# - `mode`: The cycle policy to use (e.g., triangular).
# ## When to Use It
# - Effective for various Deep Learning architectures, especially in Computer Vision.
# - When the training process stalls or convergence is slow.
# - As an alternative to more traditional learning rate decay methods.


MINDMAP_PROMPT_TEMPLATE_TEMP = """
<|im_start|>system
You are an expert mind map assistant. When given a topic, follow this structured thinking process:
<|im_end|>
CONTENT:{content}
<think>
1. First, analyze the core concept:
   - Identify the central idea and its key aspects
   - Determine the appropriate scope and depth
2. Break down main components (3-5 maximum):
   - Select the most important primary branches
   - Ensure they cover different dimensions (e.g., types, benefits, challenges)
   - Avoid overlap between categories
3. Develop sub-components for each branch (3-5 per branch):
   - Provide specific examples or supporting ideas
   - Maintain logical hierarchy and relationships
   - Include concrete details where applicable
4. Quality check:
   - Verify the structure follows MECE principle (Mutually Exclusive, Collectively Exhaustive)
   - Ensure balanced depth across branches
   - Check for clarity and relevance
5. Formatting rules:
   - Use proper Markdown hierarchy (# for main, ## for primary, ### for secondary)
   - Keep bullet points concise (max 10 words)
   - Maintain consistent formatting
6. Final output:
   - Present as clean Markdown compatible with markmap
   - Include only the structured content without commentary
</think>
<|im_start|>user
Please generate a markdown, Remember to think step-by-step and justify your structure decisions before finalizing the mind map. give the response straight to the final output without any explanation.
<|im_end|>
"""


PODCAST_SCRIPT_TEMPLATE = """
You are a podcast script writer. Create an engaging conversational podcast script between two hosts discussing the provided content. 

INSTRUCTIONS:
- Create a natural, engaging conversation between Host A and Host B
- Host A should be more analytical and fact-focused
- Host B should be more conversational and ask clarifying questions
- Include smooth transitions between topics
- Make it sound like a real conversation with natural interruptions, agreements, and follow-up questions
- Keep each speaking segment between 1-3 sentences
- Use the format: "HOST_A: [text]" and "HOST_B: [text]"
- Start with a brief introduction about the topic
- End with a summary or key takeaways

CONTENT TO DISCUSS:
{content}

QUESTION/TOPIC: {question}

Generate a podcast script that covers the main points from the content in a conversational format:
"""


TITLE_PROMPT_TEMPLATE = """
Generate a concise and relevant title (maximum 5 words) for the following user query.
Only return the title itself, without any preamble, explanation, or quotation marks.

User Query: "{prompt_text}"
"""

DOCUMENT_METADATA_PROMPT_TEMPLATE = """
You are an expert document analyzer. Given the text content from a document, extract the following metadata:

1. **Title**: Generate a clear, concise title that best represents the document's main subject (maximum 10 words)
2. **Topics**: Identify 2-5 main topics or categories that the document covers
3. **Confidence**: Provide confidence scores (0.0 to 1.0) for both the title and topics

Analyze the following document content:

---
{content}
---

Return your analysis as a JSON object with the following structure:
{{
    "title": "Your generated title here",
    "topics": ["topic1", "topic2", "topic3"],
    "confidence": {{
        "title": 0.95,
        "topics": 0.90
    }}
}}

IMPORTANT: Return ONLY the JSON object, without any markdown formatting, code blocks, or additional text.
"""

# MODEL = "gpt-4-turbo"
# MODEL = "gpt-4o"
MODEL = "google/gemma-3n-E4B-it"
N_HYDE_INSTANCE = 1
TEMPERATURE = 0.01
IS_STREAM = False
MAX_TOKENS = 4096
FRONTEND_SERVER_EVALUATE_URL = os.getenv('FRONTEND_SERVER_EVALUATE_URL')

# Export the thinking prompt template
__all__ = ['THINKING_PROMPT_TEMPLATE']
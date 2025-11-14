# from langchain.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser

from ...main import hyde_llm
from ..constant.llm import HYDE_PROMPT_TEMPLATE

from llama_index.core import PromptTemplate
from llama_index.core.llms import ChatMessage

# def get_context(question:str):
#     prompt_template = HYDE_PROMPT_TEMPLATE    
#     prompt = PromptTemplate(input_variables=["question"], template=prompt_template)

#     llm_chain = prompt | hyde_llm | StrOutputParser()
#     print('question', question)
#     context = llm_chain.ainvoke({'question':question, 'stream': False})
#     return context

async def get_context(question:str):
    print(f'[get_context] Received question: {question}')
    prompt_template = PromptTemplate(HYDE_PROMPT_TEMPLATE)
    formatted_prompt = prompt_template.format(question=question)
    print(f'[get_context] Formatted prompt: {formatted_prompt[:200]}...')  # Print first 200 chars
    
    response = await hyde_llm.acomplete(formatted_prompt)
    context = response.text
    print(f'[get_context] LLM response: {context}')
    
    # Fallback to original question if response is empty
    if not context or context.strip() == '':
        print('[get_context] WARNING: Empty response from LLM, using original question')
        context = question
    
    return context


def format_conversation_history(history:list):
    new_hist = []
    for message in history:
        if message["type"] == "request":
            new_hist.append(
                # Ganti jadi objek ChatMessage
                ChatMessage(
                    role="user",
                    content=message["message"]
                )
            )
        else:
            new_hist.append(
                # Ganti jadi objek ChatMessage
                ChatMessage(
                    role="assistant",
                    content=message["message"]
                )
            )
    return new_hist
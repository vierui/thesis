from flask import request, jsonify, Response, stream_with_context
from ..service.llm_service import question_answer, Streaming, agent_search, regenerate_mind_map_service, generate_title

from ..service.evaluate import evaluate_single_turn_rag
import threading
from ..response import HTTPRequestException, HTTPRequestSuccess
from ...main import semaphore
import json
from llama_index.core.agent.workflow import AgentStream
import asyncio

# Metrics
from ..metrics.collectors import RequestTimer, format_config

def chat_with_llm():
    semaphore.acquire()
    body = request.get_json()
    question = body.get('question')
    print("this is question", question)
    conversation_history = body.get('conversation_history')
    hyde = body.get('hyde')
    hyde = True if hyde == 'true' else False
    reranking = body.get('reranking')
    reranking = True if reranking == 'true' else False
    ultrathink = body.get('ultrathink')
    ultrathink = True if ultrathink == 'true' else False
    user_id = body.get('userId')
    document_ids = body.get('document_ids', None)  # Bisa None atau list of strings
    print(body)
    print(f"hyde: {hyde}, reranking: {reranking}, ultrathink: {ultrathink}")

    # Metrics: format config for labeling and start timing
    config = format_config(hyde, reranking)
    metrics_timer = RequestTimer("chat_with_llm", config)

    try:
        llm_stream, retrieved_docs, is_thinking = Streaming(
            question=question,
            user_id=user_id,
            conversations_history=conversation_history,
            document_ids=document_ids,
            hyde=hyde,
            reranking=reranking,
            ultrathink=ultrathink
        )


        # Buat sebuah "inner function" (generator) untuk format SSE
        def generate_chunks():
            try:
                # 1. Kirim ID dokumen sebagai event pertama
                for doc in retrieved_docs:
                    doc_payload = json.dumps({"retrieved_doc": doc})
                    yield f"data: {doc_payload}\n\n"

                # 2. Parse thinking tags and stream separately
                in_thinking = False
                thinking_buffer = ""
                answer_buffer = ""

                # 2. Loop melalui stream dari LLM
                for chunk in llm_stream:
                    token = chunk.delta
                    if token:
                        # Check for thinking tags if ultrathink is enabled
                        if is_thinking:
                            # Buffer the complete text to parse tags properly
                            answer_buffer += token

                            # Check for opening <think> tag
                            if '<think>' in answer_buffer and not in_thinking:
                                # Send any text before <think> as answer
                                before_think = answer_buffer.split('<think>')[0]
                                if before_think:
                                    data_payload = json.dumps({"answer_token": before_think})
                                    yield f"data: {data_payload}\n\n"
                                in_thinking = True
                                answer_buffer = answer_buffer.split('<think>', 1)[1]

                            # Check for closing </think> tag
                            if '</think>' in answer_buffer and in_thinking:
                                # Send thinking content
                                parts = answer_buffer.split('</think>', 1)
                                thinking_content = thinking_buffer + parts[0]
                                if thinking_content:
                                    thinking_payload = json.dumps({"thinking_token": thinking_content})
                                    yield f"data: {thinking_payload}\n\n"
                                thinking_buffer = ""
                                in_thinking = False
                                answer_buffer = parts[1]

                            # Stream content based on current mode
                            if in_thinking:
                                # In thinking mode - check for potential closing tag
                                if len(answer_buffer) > 50 and '</' not in answer_buffer:
                                    # Buffer is large enough and no closing tag in sight
                                    thinking_payload = json.dumps({"thinking_token": answer_buffer})
                                    yield f"data: {thinking_payload}\n\n"
                                    thinking_buffer += answer_buffer
                                    answer_buffer = ""
                            elif not in_thinking and answer_buffer:
                                # Not in thinking mode - check for potential opening tag
                                # Don't stream if we might be building up to a tag
                                if '<' not in answer_buffer[-7:]:  # Check last 7 chars for incomplete tag
                                    # Safe to stream - no tag markers
                                    data_payload = json.dumps({"answer_token": answer_buffer})
                                    yield f"data: {data_payload}\n\n"
                                    answer_buffer = ""
                                elif len(answer_buffer) > 10 and not answer_buffer.endswith(('<', '<t', '<th', '<thi', '<thin', '<think', '<think>')):
                                    # Buffer is large and doesn't end with partial tag
                                    # Stream everything except the potentially partial tag at the end
                                    safe_part = answer_buffer[:-7]
                                    if safe_part:
                                        data_payload = json.dumps({"answer_token": safe_part})
                                        yield f"data: {data_payload}\n\n"
                                    answer_buffer = answer_buffer[-7:]
                        else:
                            # No thinking mode, stream normally
                            data_payload = json.dumps({"answer_token": token})
                            yield f"data: {data_payload}\n\n"

                # Send any remaining buffered content
                if answer_buffer:
                    if in_thinking:
                        thinking_payload = json.dumps({"thinking_token": answer_buffer})
                        yield f"data: {thinking_payload}\n\n"
                    else:
                        data_payload = json.dumps({"answer_token": answer_buffer})
                        yield f"data: {data_payload}\n\n"

                # Opsional: Kirim sinyal bahwa stream sudah selesai
                yield f"data: [DONE]\n\n"

            except Exception as e:
                print(f"Error during streaming: {e}")
                import traceback
                traceback.print_exc()
                # Metrics: record error
                metrics_timer.record_error()
            else:
                # Metrics: record success if no exception occurred
                metrics_timer.record_success()
            finally:
                semaphore.release() # Pastikan semaphore dilepas di akhir stream

        return Response(stream_with_context(generate_chunks()), mimetype='text/event-stream')

    except HTTPRequestException as e:
        semaphore.release() # Pastikan semaphore dilepas jika ada error di awal
        # Metrics: record error
        metrics_timer.record_error()
        return e.to_response()


# def chat_with_llm():    
#     semaphore.acquire()
#     body = request.get_json()
#     question = body.get('question')
#     conversation_history = body.get('conversation_history')
#     hyde = body.get('hyde', 'false').lower() == 'true'
#     reranking = body.get('reranking', 'false').lower() == 'true'
#     user_id = body.get('userId')

#     try:
#         # Panggil fungsi SINKRON kita yang baru
#         llm_stream_generator, retrieved_docs = agent_search(
#             question, user_id, conversation_history, hyde, reranking
#         )
        
#         def generate_chunks():
#             try:
#                 # 1. Kirim dokumen dulu
#                 source_event = {"sources": retrieved_docs}
#                 yield f"data: {json.dumps(source_event)}\n\n"
                
#                 # 2. Loop melalui stream SINKRON dari agent
#                 for event in llm_stream_generator:
#                     # Pastiin event-nya tipe yang bener
#                     if isinstance(event, AgentStream):
#                         token = event.delta
#                         if token:
#                             data_payload = json.dumps({"answer_token": token})
#                             yield f"data: {data_payload}\n\n"
                
#                 yield f"data: [DONE]\n\n"

#             except Exception as e:
#                 print(f"Error during streaming generation: {e}")
#             finally:
#                 semaphore.release()
                
#         return Response(stream_with_context(generate_chunks()), mimetype='text/event-stream')

#     except HTTPRequestException as e:
#         semaphore.release()
#         return e.to_response()
#     except Exception as e:
#         # Fallback error handler
#         semaphore.release()
#         return Response(json.dumps({'error': str(e)}), status=500, mimetype='application/json')

async def create_title():  
    body = request.get_json()
    prompt = body.get('prompt')

    try:
        title = await generate_title(prompt)
        
        return HTTPRequestSuccess(
            message="Title generated successfully", 
            status_code=200, 
            payload={"title": title}
        ).to_response()
    
    except HTTPRequestException as e:
        print(e.message)
        return e.to_response()

def evaluate_chat():
    try:
        body = request.get_json()
        message_id = body.get('message_id')
        question = body.get('question')
        answer = body.get('answer')
        contexts = body.get('contexts')

        # Validasi input...
        if not all([message_id, question, answer, contexts]):
            return jsonify({"error": "Missing required fields"}), 400

        # Jalankan di background thread
        eval_thread = threading.Thread(
            target=evaluate_single_turn_rag,
            args=(message_id, question, answer, contexts)
        )
        eval_thread.start()

        return jsonify({"status": "Evaluation scheduled"}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
async def regenerate_mind_map():
    body = request.get_json()
    question = body.get('question')
    # hyde = body.get('hyde')
    # hyde = True if hyde == 'true' else False
    # reranking = body.get('reranking')
    # reranking = True if reranking == 'true' else False
    user_id = body.get('user_id')
    
    # ====== Testing ======
    # question = "make a mindmap about Cycling Learning Rate"
    # user_id = "user_2yfckZL2Y68NPUyEMOMy456sBWD"
    hyde = True
    reranking = True
    
    try:
        res = await regenerate_mind_map_service(
            question, user_id, hyde, reranking
        )
        
        print('res ==', res)
        
        return HTTPRequestSuccess(message="Mind map regenerated", status_code=200, payload=res).to_response()
    
    except HTTPRequestException as e:
        print(e.message)
        return e.to_response()

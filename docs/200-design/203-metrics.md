Final checklist – the short list you should implement now

If I compress everything to your minimal but sufficient set:
	•	Latency/Throughput
	•	e2e_p95_ms
	•	ttft_ms
	•	tok_s_decode
	•	qps
	•	qps_per_gpu
	•	retrieval_p95_ms, prefix_ms, decode_ms, embed_ms, rerank_ms
	•	Energy
	•	gpu_power_j, cpu_power_j
	•	j_per_token, j_per_answer
	•	Memory / VRAM
	•	gpu_vram_peak_mb
	•	vram_headroom_mb or %
	•	kv_pages_evicted
	•	Cache Efficiency
	•	kv_cache_reuse_ratio
	•	embedding_cache_hit_rate
	•	(optional) retrieval_cache_hit_rate

This set:
	•	Lets you compare directly to RAGO (TTFT, TPOT via tok_s_decode, QPS, QPS/Chip via qps_per_gpu).
	•	Captures your sustainability angle (energy + cache + VRAM health).
	•	Stays manageable, so you don’t drown in metrics.

If you want next, I can help you turn this into a table schema for your logging JSON / DB (field names + types) so you can instrument your pipeline cleanly.

---
| Dimension            | RAGO (Paper) Metrics                                   | Your Planned Metrics                                                        | Comment / Critique |
|----------------------|--------------------------------------------------------|------------------------------------------------------------------------------|--------------------|
| Latency (user view)  | TTFT (Time-To-First-Token), TPOT (Time-Per-Output-Token)  | P95 e2e_ms (end-to-end), ttft_ms, queue_ms                                   | You add P95 and queueing, so you capture “real” user experience under load, not just idealized stage times. |
| Generation speed     | TPOT (implicitly via decode modeling)                  | tok_s_decode (tokens/sec)                                                    | Same concept; you expose it explicitly as throughput rather than inverse latency. |
| Throughput / capacity| QPS (queries/sec), QPS/Chip (normalized throughput)  | (Planned) QPS, possibly QPS_per_GPU or QPS_per_100W                          | They’re stronger here today; you just need to add QPS to be directly comparable. |
| Component breakdown  | Time share per stage: retrieval vs prefix vs decode vs encoder vs rewriter vs reranker  | retrieval_ms, rerank_ms, (planned) prefix_ms, embed_ms, router_ms           | Both do breakdowns; you complement time with energy and memory pressure later. |
| Compute cost model   | FLOPs per component (inference), bytes scanned for retrieval  | Not explicit FLOPs model (you rely on measured latency + energy)             | They have a beautiful analytical model; you trade that for real measurements, which is fine for a single system. |
| Energy / sustainability | None                                                | gpu_power_j, cpu_power_j, j_per_token, (planned) J/answer                    | This is your big novelty; they don’t touch energy at all. |
| Memory health        | Modeled HBM capacity & BW, but no user-facing metric  | gpu_vram_peak_mb, VRAM headroom, kv_pages_evicted                            | You’re more practical on “can this workflow actually run without OOM / thrash?”. |
| CPU / retrieval load | Modeled via bytes scanned, CPU throughput, % time spent in retrieval  | retrieval_ms (P95), cpu_power_j                                              | They do deep modeling; you do direct measurement + energy, which is exactly what you need for sustainability. |
| Quality (answers)    | None (they assume algorithmic quality from prior RAG work) | (Planned) EM/F1/recall@k or small human eval                                 | They focus on performance only; you’ll need quality to claim “same-quality but greener”. |
| Agentic behavior     | None                                                  | (Later) #tool_calls, #model_hops, loop_depth, route_distribution             | This is your second novelty: quantifying cost of agentic orchestration itself. |



# GPT-Review
**file**  "./ch03/02_bonus_efficient-multihead-attention/mha-implementations.ipynb"
 notebook that evaluate different multi-head attention mechanisms 
## **TL;DR**

- Prefer **SDPA/Flash** (5/8) with **packed QKV**; avoid explicit causal masks.
    
- Use **FlexAttention** when you need structured sparsity with Flash-like performance.
    
- These choices cut both **runtime** and **peak memory** (no L² tensors), and scale to long contexts far better than hand-rolled attention.
---
## What clearly wins (and why)

1. **Use PyTorch SDPA / FlashAttention kernels whenever you can**

    - Implementations **5**, **8** (MHA with need_weights=False), and **5/6** (direct scaled_dot_product_attention) route to PyTorch’s fused SDPA kernels.
    - When is_causal=True **and** you don’t pass an explicit mask, PyTorch can pick a **FlashAttention-style kernel** that does **IO-aware tiling** and **doesn’t materialize the full L×L attention matrix**. That’s the core reason they are typically the fastest and most memory-lean.
    - Passing a dense attn_mask (**6**) disables FlashAttention and falls back to a slower kernel (still SDPA, but with materialization costs). If you need causality, prefer is_causal=True with **no mask tensor**.
        
2. **Pack QKV into a single linear**
    
    - Implementations **3**, **5–9** do **one fused GEMM** to compute Q,K,V (via nn.Linear(d_in, 3*d_out)). That improves GPU utilization and **cuts memory traffic** (one read of X, one write of concatenated QKV) vs three separate linears in **1/2/4**.
    - Fused QKV generally wins in both speed and memory because the workload is dominated by GEMMs and memory bandwidth.
        
3. **nn.MultiheadAttention with need_weights=False is a safe “fast default”**
    
    - In PyTorch ≥2.0, need_weights=False allows the module to dispatch to SDPA under the hood (your **8**). It’s convenient, stable, and **usually equals direct SDPA** without you manually wiring masks.
        
4. **FlexAttention (PyTorch ≥2.5, CUDA only) is for custom sparsity with Flash-like speed**
    
    - Your **9** shows FlexAttention matching the IO-aware spirit of Flash while letting you customize masking via a **block mask**. It’s **the right tool** if you need structured sparsity beyond plain causal (e.g., sliding windows, local+global tokens) without giving up speed.
    - Caveat today: **no dropout** in FlexAttention. It’s an inference-friendly and research-friendly path to sparse patterns.

## What to avoid (and why)

- **Hand-rolled attention with explicit attn_scores/attn_weights (1/2/4)**
    These versions **materialize** B×H×L×L tensors and do multiple transposes; they’re **bandwidth-heavy** and **RAM-hungry**, especially for long contexts. They’re good for teaching; not for production.
    
- **Einsum (4)**
	Elegant but typically **slower** than cuBLAS-backed matmuls/SDPA. It also still materializes the full attention matrix.
    
- **Explicit boolean/float masks when you could use is_causal=True**
    Providing a mask often **forces a non-Flash kernel**, costing both time and memory.

## Memory efficiency: where it’s won and lost

- **Materialized attention vs. tile-wise compute**

    - Naïve attention allocates O(B·H·L²) for scores and weights. With L=1024 this is already sizable; push to 8k and you’re done.
    - **Flash/SDPA causal** computes attention in **blocks** (queries × keys windows), **streams V**, and never holds full L×L. The **peak memory** behaves closer to O(B·H·L·d_head) plus workspace, not L².
    
- **Packed QKV** reduces activations**
    
    - Three separate projections write three activations; a single packed projection writes once, then splits **view-wise**. Less memory traffic, fewer kernel launches.
    
- **Keep dtype and layout in mind**

    - Use **FP16/BF16** on GPU (BF16 preferred for numeric safety on A100/Hopper) and **channels-last** (for CNNs; less relevant here) to get better cache behavior and tensor-core use.
    - For A100: torch.set_float32_matmul_precision("high") lets some FP32 ops pick tensor-core friendly paths; but for attention you should be in BF16/FP16 anyway.
    
## Kernel dispatch rules (practical)

- **To get FlashAttention:**

    - Call `torch.nn.functional.scaled_dot_product_attention(q,k,v, is_causal=True, attn_mask=None, dropout_p=0 or training)`
    - Or use nn.MultiheadAttention(..., need_weights=False) with an internal self-attention call and **no external mask** (and enable causal mode appropriately in your block).
    - On GPU with recent PyTorch, this will pick a flash-or-math kernel depending on shape/dtype.
- **To avoid disabling Flash by accident:**
	- **Don’t pass a dense mask** for pure causality.
	- If you **must** mask, consider **FlexAttention** with a block mask.

## Numerical & correctness notes you surfaced (good hygiene)

- **Mask fill with -inf and low-precision dtypes:**
    
    - In FP16/BF16, prefer **-1e9** or PyTorch’s SDPA causal mode rather than manually filling with -inf, which can produce nan when scaled. SDPA handles this internally.
        
    
- **Mask device/dtype** must match Q/K device/dtype; you registered masks as buffers (good).
    
- **Time measurement**
    
    - Your timeit on CUDA would be misleading due to async; you correctly used **CUDA events** for the GPU benchmarks.
        
    - Warmups + torch.cuda.synchronize() are essential; you did both.
        
    

  

## What to do on your machines (M4 Pro now, A100 later)

**On your Mac (MPS backend):**

- You won’t get CUDA FlashAttention kernels, but **SDPA path (5/8)** still reduces Python overhead and unnecessary allocations.
- Keep **packed QKV** and prefer **scaled_dot_product_attention(..., is_causal=True)** or **nn.MultiheadAttention(..., need_weights=False)**.

**On A100 (or any recent NVIDIA GPU):**

- **Default to SDPA/Flash** implementations (**5** or **8**).
- Use **BF16** if available (better stability than FP16).
- Consider **FlexAttention** if you need custom sparse patterns (local/global, dilated, block-sparse) while keeping IO-aware performance.
- Enable kernel selection as needed:
```python
from torch.backends.cuda import sdp_kernel
# Let PyTorch pick the best:
sdp_kernel(enable_flash=True, enable_mem_efficient=True, enable_math=True)
```
## Concrete implementation guidance (for production blocks)

- **API choice:**
    - Training & inference, dense causal: **F.scaled_dot_product_attention** (minimal code, maximal control) or **nn.MultiheadAttention(need_weights=False)** (plug-and-play).
    - Custom sparsity but fast: **FlexAttention** (PyTorch ≥ 2.5, CUDA).
- **Projection path:** **One Linear for QKV**, split via view/unbind.
- **Masking:** Prefer is_causal=True (no dense mask).
- **Dropout:**
    - SDPA supports it (training only).
    - FlexAttention currently **does not**; keep dropout outside attention, or disable for Flex runs.
- **Precision:** BF16/FP16 on GPU; keep layer-norms and softmax stable (BF16 preferred).
- **Long-context inference:** Pair Flash/SDPA with **KV-cache** to avoid re-computing K,V (not covered in the notebook, but crucial in practice).
## Quick mental model: why speeds differ

- **Kernel fusion & tiling** (SDPA/Flash/Flex) → fewer reads/writes, no L² intermediates.
- **Fewer large GEMMs** (packed QKV) → higher arithmetic intensity, better occupancy.
- **Less Python/Tensor wrangling** (no manual transposes/masks) → fewer launches, less overhead.
- **Avoiding materialization** (no full attention matrices) → both **time** and **peak memory** drop dramatically as L grows.
    
---
# Conclusions 
The implemented causal MHA (ch03) from the videos is quite good. The Pytorch ones are definitely better. The 9) is optimized for compilation while the other ones 5) and 6) are not. 5) is overall the most efficient attention mechanism. 
## Speed comparison with warmup (fwrd pass only) - Nvidia A100 GPU
![[Pasted image 20251012215421.png]]
## Speed comparison (Nvidia A100 GPU) with warmup and compilation (forward and backward pass)
![[Pasted image 20251012215459.png]]
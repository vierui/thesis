https://www.youtube.com/watch?v=p3sij8QzONQ
freeCodeCamp

# Part 1  : Foundational Introduction
outlining the end-to-end workflow of modern Large Language Models (LLMs) and hyper-focusing on the **vanilla transformer architecture** (decoder-only).
## LLM training pipeline
1. Pretraining
	   A. process data
	   B. language modeling (predict token)
	   C. output : base model (long - cost)
2. supervsied finetuning
	   relatively sparse
	   transition the base model from a purely next-token predictor to an **assistant**
3. Alignement
	   prevent bias and abuse for quality and security via reward modeling 
4. Reinforcement learning
	   **Learning from Human Feedback** using proximal policy optimization
	   

## The transformer (attention mechanism)

![[Pasted image 20251005235641.png]]

1. **Input**
	   tokenized  -> embedding step -> positional encoding

2. **Transformer** (the more layers, the bigger the model)
	1. (Masked) multi head attention
		   - The input embeddings are split into three parts: **Query (Q), Key (K), and Value (V)**, each routed through its own **linear layer**.
		   - The core calculation is the **scaled dot-product attention** mechanism -> applying a **scale component**, using a **mask** :
		     boolean mask for causal attention -- do not want to see future tokens in the sequence
			   *eg. the cas is on the mat. -> when evaluating the attention for 'on' we do not want to see 'the' and 'mat'.*
		   applying a **softmax**, and then multiplying the result by $V$ ($dim_{X}= dim_{V}$)
		   	- Outputs from the different heads are **concatenated** passed through a final linear layer
		   	- Key constraint : model's embedding dimension ($\text{D}_{\text{model}}$) must be evenly divisible by the number of heads ($\text{N}_{\text{head}}$)
		   	- `d_head = d_model // n_head` meaning : `d_model % n_head == 0`
	2. Normalization (layer norm + positional embedding)
		   	- **Positional Encoding** :
		   buffer -> not learnable parameter -> not stored in the gradient desc
			   - sinusoidal positional encoding (sin = even, cos = odd)
			   - learned positional 
3. **Linearized**
4. **Softmax for probabilities**
## Implementation notes

1. in the forward pass it's possible to use reshape instead of view() when 
   ctx has shape (B, n_head, T, d_head) - output from each attention head Goal: Concatenate all heads back into (B, T, d_model) where d_model = n_head * d_head = C
   **Current** (explicit control over memory):
	   out = ctx.transpose(1, 2).contiguous().view(B, T, C)
   
   **Alternative 1** (let reshape handle it):
	   out = ctx.transpose(1, 2).reshape(B, T, C)  # may copy if needed
   
   **Alternative 2** (torch built-in, most efficient):
	  out = ctx.transpose(1, 2).flatten(2, 3)  # flattens last 2 dims
	
	  Why use .contiguous().view() instead of .reshape()?
	  - More explicit about memory operations (educational code)
	  - Guarantees behavior (view never copies)
	  - Slightly faster in this case since we know transpose makes it
	  non-contiguous
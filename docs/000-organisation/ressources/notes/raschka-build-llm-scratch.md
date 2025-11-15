
# Book Summary 
## 1 : Understanding Large Language Models
https://www.youtube.com/watch?v=yAcWnfsZhzo

### 1.1 What is an LLM
1.  **idea** : predict next token. understanding is functionnal (not conscious)
2.  **embedding** : text → tokens (integers) → embeddings (vectors)
        next token based on probability distribution 
        loss = cross entropy over distribution 
3.  **context window** : span of past tokens
4.  **limits** : do not know the 'truth', only patterns in data

### 1.2 LLMs are good at 
-   Generation, following instructions, analysis (classfication, extraction, weak reasoning)
-   Tool use and augmentation : fetch facts and execute actions

### 1.3 From-scratch” pipeline (high-level plan)
1. data and tokenization (BPE/tokenizer)
2. architecture (decoder e.g.)
3. pretraining
4. fine-tuning
5. evaluation / deployment (sampling, KV cache, quantization)

### 1.4 The transformer
**self-attention**
	QKᵀ pairwise interactions - O(L²) complexity
	let every token “look at” others, in parallel.
	replaces recurrence (RNN/LSTM/GRU), time-step *t* depend on *t-1* -- sequential, $O(L) = O(1)$)
#### Input tokens → vectors
w/ attention, assuming a L sequence of length 4, e.g. ["The", "cat", "eats", "fish"] and d the embedding dimension (columns), which is randomly set at first (before pre-training)$$X \in \mathbb{R}^{L \times d}, \space  X = \begin{bmatrix} x_{the} \\ x_{cat} \\ x_{eats} \\ x_{fish} \end{bmatrix} \begin{bmatrix} 0.1 & 0.2 & 0.7 \\ 0.5 & 0.1 & 0.3 \\ 0.6 & 0.4 & 0.9 \\ 0.9 & 0.8 & 0.2 \end{bmatrix}$$each d column represents a dimension of the vectors space the tokens live in (e.g. $d=3$)
#### Project into Q, K, V
Each token gets 3 Matrices :
- **query vector (V)** what this token is asking for
- **key vector (K)** how other tokens describe themselves (“what I have”)
- value vector ($V$)*** the actual information content to share if matched.
			such as : $Q = X W_Q \quad K = X W_K \quad V = X W_V$   
			where :
			   $W_Q, W_K, W_V \in \mathbb{R}^{d \times d_{head}}$
			   $Q, K, V \in \mathbb{R}^{L \times d_{head}}$

so, we end up with 3 matrices.
	1. You feed tokens into the model.
	2. Compute attention with QKᵀ.
	3. The final prediction (say, predicting the next word) gives a **loss**.
	4. Backpropagation computes gradients w.r.t. $W_Q, W_K, W_V.$
	5. Optimizer (Adam, SGD, etc.) updates them.
  
#### All-pairs similarity = Q K^T
  Compute attention. - Result squared matrix : $L \times L$
  → **all tokens compared with all others at once**.$$QK^T = \begin{bmatrix} \text{The→The} & \text{The→Cat} & \text{The→Eats} & \text{The→Fish} \\ \text{Cat→The} & \text{Cat→Cat} & \text{Cat→Eats} & \text{Cat→Fish} \\ \text{Eats→The} & \dots & \dots & \dots \\ \text{Fish→The} & \dots & \dots & \dots \end{bmatrix}$$ Think of Q and K as:
   $Q$ = questions people ask at a party
   $K$ = badges on their shirts (“I know X”)
  
#### Softmax→ Weights
   We normalize each row with *Softmax* to turn scores into probabilities:$$A = \text{softmax}(QK^T / \sqrt{d_{head}})$$**Each row sums to 1 where Row $i$ = attention distribution of token $i$ over all tokens.**
   
#### Weighted sum with V
   weighted sum of all value vectors, weighted by how much attention it gives to each other token.
   
   $\text{Attention}(Q, K, V) = A V$
	  where : $A \in \mathbb{R}^{L \times L}$,   $V \in \mathbb{R}^{L \times d_{head}}$   and    the result is  $L \times d_{head}$ (same shape as $X$, but transformed)

---
## 2 : Working with Text Data
https://www.youtube.com/watch?v=341Rb8fJxY0

Necessary technical procedures for transforming raw text into the numerical format required for training Large Language Models (LLMs).
This preparation constitutes the critical first stage of the LLM development pipeline.
![[Pasted image 20251008234353.png]]
It covers text tokenization, vocabulary construction, advanced subword techniques, data sampling strategies for next-word prediction, and the creation of final vector representations (embeddings) that feed into the LLM architecture.

### 2.1 Understanding word embeddings

The fundamental requirement for training LLMs is that deep learning models cannot process raw text or other raw data (like video or audio); thus, the input must be converted into **dense vector representations (embeddings)**.

- **Necessity of Embeddings:** Embeddings transform discrete data, such as words or images, into continuous vector spaces, making them compatible with neural network operations.
- **Dimensionality:** Embeddings vary in dimension, ranging from one to thousands. For instance, the smallest GPT-2 models typically utilize an embedding size of **768 dimensions**.
- **LLM Approach:** Unlike older techniques like Word2Vec, LLMs commonly generate their own embeddings as part of the input layer, which are then **updated and optimized during the training process**.

### 2.2 Tokenizing text

This section details the first step of text processing: breaking the raw input text into individual, distinct units called **tokens**.

- **Token Definition:** Tokens can be individual words, subwords, or special characters, including punctuation.
- **Simple Tokenization:** A basic implementation involves splitting text using delimiters like whitespace and various punctuation marks.
- **Preserving Case:** For language understanding tasks, it is generally recommended to refrain from converting all text to lowercase, as capitalization aids LLMs in distinguishing proper nouns and understanding sentence structure.

### 2.3 Converting tokens into token IDs

After obtaining a list of tokens, the next step is mapping these text strings to unique integers, known as token IDs.

![[Pasted image 20251009004255.png]]

- **Vocabulary Creation:** A **vocabulary** is constructed from all unique tokens in the training dataset, assigning each unique token to a unique integer value.
- **Encoding and Decoding:** The integer-to-string mapping is used during **encoding** (text to token IDs) and the inverse mapping is used during **decoding** (token IDs back to text).
- **Out-of-Vocabulary Problem:** A simple tokenization scheme runs into issues when encountering words not present in the pre-built vocabulary, resulting in a `KeyError` and highlighting the need for large, diverse training sets or more advanced tokenization methods.

### 2.4 Adding special context tokens

To enhance the model's robustness and handle various textual contexts, special markers are incorporated into the vocabulary.

- **Unknown Token ($\text{<|unk|}>$):** Used to represent words that appear in the input text but are **not present in the vocabulary**.
- **End-of-Text Token ($\text{<|endoftext|}>$):** Used to delineate boundaries between unrelated text sources (e.g., separating two different documents concatenated for training), acting similarly to an End of Sequence token ([EOS]). In GPT models, $\text{<|endoftext|}>$ is also utilized for padding purposes.
- **GPT Tokenizer Simplicity:** The tokenizer specifically used for GPT models avoids the $\text{<|unk|}>$ token and simplifies context markers, primarily relying on $\text{<|endoftext|}>$.

### 2.5 Byte pair encoding (BPE)

BPE is a sophisticated tokenization scheme utilized in popular LLMs such as GPT-2 and GPT-3.
![[Pasted image 20251009010645.png]]

- **Subword Units:** BPE addresses the out-of-vocabulary issue by breaking down unknown words into smaller **subword units or individual characters**. This capability ensures the tokenizer can process _any_ text.
- **Vocabulary Construction (BPE):** BPE constructs its vocabulary iteratively by starting with individual characters and then merging the most frequent character combinations into subwords.
- **GPT Vocabulary Size:** The BPE tokenizer used for GPT-2/3 features a total vocabulary size of **50,257**, where the $\text{<|endoftext|}>$ token is assigned the largest integer ID (50256).

### 2.6 Data sampling with a sliding window

This section focuses on generating the necessary input-target pairs for the LLM's core training task: **next-word prediction**.
![[Pasted image 20251009011417.png]]

- **Input-Target Pairing:** Training data consists of input sequences ($x$) and target sequences ($y$), where the target sequence is derived by **shifting the input sequence forward by one position**.
- **Sliding Window Approach:** A **sliding window approach** is implemented to efficiently organize the tokenized data into these input-target sequences.
- **Data Loading:** Efficient data handling is achieved using PyTorch's built-in `Dataset` and `DataLoader` classes to return the data as batches (multidimensional arrays or tensors). Also, there are **better tools for memory optimization** !! 
```python
def create_dataloader_v1(txt, batch_size=4, max_length=256, stride=128,
							shuffle=True, drop_last=True, n-um_workers=0):
	# Initialize the tokenizer
	tokenizer = tiktoken.get_encoding("gpt2")
	
	# Create dataset
	dataset = GPTDatasetV1(txt, tokenizer, max_length, stride)
	
	# Create dataloader
	dataloader = DataLoader(
		dataset,
		batch_size=batch_size,
		shuffle=shuffle,
		drop_last=drop_last,
		num_workers=num_workers
		)
	
	return dataloader
```
-  `drop_last` avoids loss spikes -- since the batch sizes may not be full by the last remaining batch. (!!)
- `batch_size` == how many samples 
- `max_length` == context

If we overlap the batches similar to top position, where the token are repeated -> could lead to overfitting. Also it is possible to iterate through it more efficiently (!!)
![[Pasted image 20251009142419.png]]
### 2.7 Creating token embeddings

Final step in preparing the text data, where the integer token IDs are converted into continuous numerical vectors (embedding vectors).
![[Pasted image 20251009015739.png]]

- **Embedding Layer as Lookup
	  *PyTorch's `nn.Embedding` layers are used to perform a **lookup operation**, retrieving the specific embedding vector corresponding to a token ID from the embedding layer's weight matrix. They facilitate the layer lookup. ([embeddings-and-linear-layers.ipynb](/Users/rvieira/Documents/side-quests/LLMs-from-scratch/ch02/03_bonus_embedding-vs-matmul/embeddings-and-linear-layers.ipynb))
- **Weight Optimization:**
	  These embedding weights are initialized randomly and are subsequently **optimized during the LLM training process** through backpropagation.
- **Consistency:**
	  The token embedding layer ensures that the same token ID always maps to the same vector representation, regardless of its position in the input sequence.
### 2.8 Encoding word positions
Because the self-attention mechanism in LLMs is inherently position-agnostic, explicit positional information must be injected into the input representation.
![[Pasted image 20251009151158.png]]
- **Positional Embeddings:** 
	Positional information is captured via dedicated **positional embeddings**, which are added directly to the token embeddings.
	
	These blocs will not be duplicated over the batch dimension , since it's added to each batch separately. -- made automatically in Pytorch : "block casting"
	```python
	token_embeddings = token_embedding_layer(inputs)
	#result = torch.Size([8, 4, 256])
	
	pos_embeddings = pos_embedding_layer(torch.arange(max_length))
	#result = torch.Size([4, 256])
	```
- **Absolute Positional Encoding (GPT):** 
	GPT models utilize **absolute positional embeddings**, meaning a unique embedding is added for each specific position (e.g., the first token gets one distinct positional vector, the second token gets another, and so on).
- **Final Input Structure:** 
	The resulting vector, a combination of the token embedding and the positional embedding, forms the enriched input representation for the main LLM layers. These positional embeddings are also optimized during model training.
### 2.9 Optional Code
- [dataloader-intuition.ipynb](/Users/rvieira/Documents/side-quests/LLMs-from-scratch/ch02/04_bonus_dataloader-intuition/dataloader-intuition.ipynb)is a minimal notebook with the main data loading pipeline implemented in this chapter
- [embeddings-and-linear-layers.ipynb](/Users/rvieira/Documents/side-quests/LLMs-from-scratch/ch02/03_bonus_embedding-vs-matmul/embeddings-and-linear-layers.ipynb)
- [bpe-from-scratch.ipynb](/Users/rvieira/Documents/side-quests/LLMs-from-scratch/ch02/05_bpe-from-scratch/bpe-from-scratch.ipynb)

---
## 3. Coding Attention Mechanisms
Detailed technical implementation of the core component of the Transformer architecture: the attention mechanism.

The primary **goal** of the chapter is to progress through four variants of attention, culminating in a compact and efficient implementation of the **multi-head causal attention** module, which will be integrated into the full GPT architecture in the following chapter
![[Pasted image 20251009183238.png]]
where to reach to the MHA, 4 steps implementation will be detailed :![[Pasted image 20251009190301.png]]
### 3.1 The problem with modeling long sequences
This section sets the historical context for the necessity of attention mechanisms.

- **RNN Limitation:** <span style="color:#DD7700;">Prior encoder-decoder models, such as Recurrent Neural Networks (RNNs), processed input text sequentially</span>. The encoder captured the entire meaning of the input sentence within a single, final **hidden state** (or memory cell).![[Pasted image 20251009190806.png]]

- **Context Loss:** The decoder relied solely on this single hidden state to generate output, meaning it<span style="color:#DD7700;"> could not directly access earlier states from the encoder</span>. This leads to a loss of context, particularly in complex or long sentences where dependencies span long distances.

- **Motivation:** This limitation was the primary motivation for developing attention mechanisms.

### 3.2 Capturing data dependencies with attention mechanisms

This section introduces how attention mechanisms solve the context bottleneck problem.

- **Attention Concept:** The Bahdanau attention mechanism modified the encoder-decoder structure, allowing the decoder to **selectively access different parts of the input sequence** at each decoding step.![[Pasted image 20251009190530.png]]

- **Self-Attention in LLMs:** The modern Transformer architecture introduced the **self-attention mechanism**. Self-attention enables each position in the input sequence to **attend to and weigh the importance of all other positions** within that _same_ sequence -- <span style="color:#DD7700;">it can look at the output at the whole input!</span>![[Pasted image 20251009190733.png]]

### 3.3 Attending to different parts of the input with self-attention

**Goal** : of self-attention is to compute a **context vector** () for each input element (), which serves as an enriched embedding vector containing information from all other relevant elements in the sequence.
#### 3.3.1 A simple self-attention mechanism without trainable weights

This variant is purely for illustrative purposes, demonstrating the core mechanics.![[Pasted image 20251012165709.png]]

_we compute the reference based on a reference "query"_

1. **Compute Attention Scores ($\omega$):** The unnormalized scores are calculated using the **dot product** between a query input (e.g., $x^{(2)}$) and all input tokens. The dot product quantifies the similarity or alignment between vectors.

2. **Normalize Scores:** The scores are normalized using the **softmax function** to obtain **attention weights** ($\alpha$), which sum up to 1. Softmax is preferred for stability and favorable gradient properties during training.

3. **Compute Context Vector ($z$):** The context vector is calculated as a **weighted sum** of the input vectors, using the attention weights as the weighting factors.

#### 3.3.2 Computing attention weights for all input tokens

This subsection generalizes the process to compute attention weights and context vectors for all input tokens simultaneously.

- **Efficiency via Matrix Multiplication:** The matrix of all pairwise attention scores is computed efficiently using batched matrix multiplication: $Attention\ Scores = Inputs \times Inputs^T$.
```python
attn_scores = inputs @ inputs.T
```


- **Normalization and Context Calculation:** The `torch.softmax(..., dim=-1)` operation normalizes the rows, and the final set of context vectors (Z) is calculated as $Z = \text{Attention Weights} \times \text{Inputs}$. (do not naively code it - inefficient (!!))

```python
attn_weights = torch.softmax(attn_scores, dim=-1)
```
_This function doesn’t work directly with NLLLoss, which expects the Log to be computed between the Softmax and itself. Use log_softmax instead (it’s faster and has better numerical properties)._

### 3.4 Implementing self-attention with trainable weights

This section implements the **Scaled Dot-Product Attention** mechanism used in transformers and GPT models.![[Pasted image 20251012174859.png]]

- **Trainable Weights:** The main distinction is the introduction of three trainable weight matrices: $W_q$, $W_k$, and $W_v$. These weights allow the model to learn context-specific transformations.![[Pasted image 20251012175605.png]]

- **QKV Projection:** Input embeddings ($x^{(i)}$) are projected via matrix multiplication with these weight matrices to create **query ($q$)**, **key ($k$)**, and **value ($v$)** vectors (e.g., $q^{(i)} = x^{(i)},W_q$).
```python
query_2 = x_2 @ W_query # _2 because it's with respect to the 2nd input element
key_2 = x_2 @ W_key
value_2 = x_2 @ W_value
```

- **Scaled Attention Scores:** Attention scores are computed via $Q \times K^T$ and then scaled by dividing them by the square root of the key embedding dimension ($\sqrt{d_k}$) before applying softmax. This scaling step helps stabilize the training process and prevent exploding gradients.![[Pasted image 20251012175625.png]]

- **Context Vector Calculation:** The final context vector is a weighted sum over the **value**  weighted by the scaled attention weights (not the inputs ! - intermediate values = linear transform of the input) ,![[Pasted image 20251012175543.png]]
  They should be normlized over the dimension under the hood : 
  ```python
d_k = keys.shape[1]
attn_weights_2 = torch.softmax(attn_scores_2 / d_k**0.5, dim=-1)
context_vec_2 = attn_weights_2 @ values
  ```

- **Compact Implementation:** The mechanism is encapsulated in Python classes like `SelfAttention_v1` or `SelfAttention_v2` (using `nn.Linear` layers).
<span style="color:#FF0A0A;">**Remark** : 
**reducing the number of required weight matrices or matrix multiplications**. Papers have demonstrated that the full complexity (using three separate weight matrices) might not be strictly necessary, and alternative implementations could use fewer weight matrices</span> (!!)

- Linear layers :![[Pasted image 20251012184021.png]]
  We can streamline the implementation above using PyTorch's Linear layers, which are equivalent to a matrix multiplication if we disable the bias units
  
  Another big advantage of using `nn.Linear` over our manual `nn.Parameter(torch.rand(...)` approach is that `nn.Linear` has a preferred weight initialization scheme, which leads to more stable model training (!!)

### 3.5 Hiding future words with causal attention

Causal attention, also known as masked attention, is necessary for generative LLMs to ensure that the prediction for a given token depends only on the current and preceding tokens, not future ones.![[Pasted image 20251012191412.png]]

- **Causal Masking:** This is achieved by masking out the attention weights located above the diagonal of the attention score matrix. ![[Pasted image 20251012184201.png]]

- **Efficient Masking:** Instead of zeroing out scores and then renormalizing, the preferred efficient method is to <span style="color:#DD7700;">mask the unnormalized attention scores with **negative infinity**</span> ($-\infty$) before the softmax operation. This mathematically ensures that the probability of masked tokens is zero, while the remaining probabilities sum correctly to one.

- **Dropout:** To reduce overfitting, **dropout** is randomly applied to the attention weights during training. It makes the model rely less on certain positions. (not common anymore !! )![[Pasted image 20251012190708.png]]

- **Class Implementation:** The `CausalAttention` class integrates QKV projection, the negative infinity mask, and dropout, designed to handle batched inputs.
**Remarks** : 

- self.register_buffer 'buffer' ensures that the mask is not a parameter to be trained.
- _ ops are in-place `attn_scores.masked_fill_()` modifies directly the attn_score


### 3.6 Multi-head attention

MHA is designed to allow the model to jointly attend to information from different representation subspaces at different positions. It consists of multiple parallel single-head attention modules stacked on top of each other.

- **Feature Extraction**: The purpose of having multiple heads is to enable the model to extract more diverse types of information from the input data, as each head learns slightly different features during training.

- **Dimensions:** The input dimension (`d_in`) and the output dimension (`d_out`) are maintained through the Transformer Block. The output dimension (`d_out`) must be cleanly divisible by the number of heads (`num_heads`), defining the dimension of each head: `head_dim = d_out / num_heads`.

- **Process Overview:** Each head calculates its own Query, Key, and Value vectors (Q, K, V) using separate weight matrices (or shared matrices that are split). Each head produces its own context vector (e.g., Z1​,Z2​).

- **Output Generation:** The context vectors from all individual heads are combined (concatenated) along the last axis to form the final combined context tensor.

#### Remarks

| Implementation                                             | Description                                                                                                                                                                                                           | Efficiency                                                                                                                                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sequential Wrapper (****MultiHeadAttentionWrapper****)** | This method involves instantiating and combining several `CausalAttention` objects (one for each head). The forward pass iterates through these heads sequentially, collecting the results.                           | **Less Efficient:** Processing heads sequentially via a Python `for` loop is slow, as calculations cannot be fully parallelized.                                              |
| **Efficient Weight Splits (****MultiHeadAttention****)**   | This method integrates multi-head functionality into a single class. It uses larger linear layers (`W_query`, `W_key`, `W_value`) and mathematically splits the resulting projected tensors into heads via reshaping. | **Highly Efficient:** Enables calculation for all heads simultaneously through batched matrix multiplication, which is faster on GPUs. - splits matrices cheaper with .view() |

#### Additional Components

The efficient `MultiHeadAttention` class also typically includes an **output projection layer** (`self.out_proj`) after combining the context vectors, which performs a final linear transformation. This layer is a common convention but is not strictly necessary.


Tricks that Boost GPU Calculation and Good Procedures

The primary goal of the "weight splits" implementation (Section 3.6.2) is to replace slow sequential operations with fast, parallelizable matrix multiplications, which are essential for high-performance computing, especially on GPUs.

1. **Prioritizing Matmul** Matrix multiplication is executed efficiently by PyTorch on the underlying hardware (like a GPU), whereas native Python `for` loops are computationally slow and inhibit parallelism.

2. **Consolidating Weight Matrices:** Instead of repeating computationally expensive matrix multiplications for each individual head sequentially (as done in the wrapper method), the efficient approach uses **one larger matrix multiplication** (e.g., combining WQ1​ and WQ2​ into one large WQ​). The inputs are multiplied by this larger matrix in a single, efficient step.

3. **Splitting via View/Reshape:** After the large matrix multiplication, the resulting tensor (which represents the combined outputs for all heads) is **split implicitly** into individual heads by introducing a `num_heads` dimension using the `.view()` or `.reshape()` method. The sequence is reshaped from `(batch, num_tokens, d_out)` to `(batch, num_tokens, num_heads, head_dim)`.

4. **Transposition for Batched Operations:** Tensors are immediately **transposed**—for example, from `(b, num_tokens, num_heads, head_dim)` to `(b, num_heads, num_tokens, head_dim)`—to bring the `num_heads` dimension forward. This alignment is crucial for performing efficient **batched matrix multiplications** of the queries and keys across all heads simultaneously.

5. **Memory Management (****.contiguous()****):** The efficiency implementation often uses `.contiguous().view()` to reorganize tensors in the memory to avoid performance penalties associated with fractured memory layout, ensuring efficient subsequent operations.

6. **Using Native PyTorch Implementations:** For maximum performance, recommended to use PyTorch's native functions, such as `torch.nn.functional.scaled_dot_product_attention`, as they are highly optimized and can internally access modern accelerators like **FlashAttention**. Benchmarks confirm that native implementations, especially when compiled, tend to be the fastest.****
### 3.7 Summary
- Attention mechanisms transform input elements into enhanced context vector representations that incorporate information about all inputs.
- A self-attention mechanism computes the context vector representation as a weighted sum over the inputs.
- In a simplified attention mechanism, the attention weights are computed via dot products.
- A dot product is just a concise way of multiplying two vectors element-wise and then summing the products.
- Matrix multiplications, while not strictly required, help us to implement computations more efficiently and compactly by replacing nested for-loops.
- In self-attention mechanisms that are used in LLMs, also called scaled-dot product attention, we include trainable weight matrices to compute intermediate transformations of the inputs: queries, values, and keys.
- When working with LLMs that read and generate text from left to right, we add a causal attention mask to prevent the LLM from accessing future tokens.
- Next to causal attention masks to zero out attention weights, we can also add a dropout mask to reduce overfitting in LLMs.
- The attention modules in transformer-based LLMs involve multiple instances of causal attention, which is called multi-head attention.
- We can create a multi-head attention module by stacking multiple instances of causal attention modules.
- A more efficient way of creating multi-head attention modules involves batched matrix multiplications.
---
## 4 : Implementing a GPT model fr om Scratch to Generate Text
https://www.youtube.com/watch?v=YSAkgEarBGE
focuses on assembling the various building blocks previously introduced into a complete GPT architecture that is ready for training. 
![[Pasted image 20251014113803.png]]
- coding the core structure
	- normalization layers
	- feed-forward networs
	- shortcut connections
- combining these components into the repeatable Transformer Block.
### 4.1 Coding an LLM Architecture

This section provides a top-down view and structure for the GPT model, typically patterned after the smallest 124 million parameter GPT-2 model,.

- **GPT Model Structure:** The overall architecture consists of **token embeddings** and **positional embeddings** (covered in Chapt. 2), followed by a repetition of **Transformer Blocks**, a final **Layer Normalization (LayerNorm)**, and an **output layer (out_head)**.
- **Configuration:** The model hyperparameters are defined in a configuration dictionary (`cfg`), including:
    - `vocab_size`: 50,257 (based on the BPE tokenizer).
    - `context_length`: The maximum number of tokens the model supports (e.g., 1,024, or 256 for efficiency) (The longer the context size the more hardware is requires usually)
    - `emb_dim`: The embedding size (e.g., 768 dimensions for GPT-2 small).
    - `n_layers`: The number of repeated Transformer Blocks (e.g., 12).
- **Input and Output Flow:** The input layer maps from the vocabulary space into the embedding space, and the output layer maps the final embeddings back to the **vocabulary size (50,257 dimensions)** to generate unnormalized logit scores.

### 4.2 Normalizing Activations with Layer Normalization

Layer Normalization (LayerNorm) is a critical component used both within the Transformer Block and at the end of the GPT model. It is independent from the batch size ![[Pasted image 20251014140539.png]]
- **Purpose:** Layer normalization stabilizes neural network training by normalizing the outputs (activations) of a given layer.

- **Mechanism:** LayerNorm ensures that the layer outputs have a consistent **zero mean and a variance of 1** across the embedding dimension (the last dimension of the input tensor).
	  *When not this generates vanishing gradient problems and exploding gradient probelms --> Stabilizes the training for the next training -> Stabilizes the training*

- **Trainable Parameters:** It utilizes two trainable parameters, _scale_ and _shift_, which allow the LLM to learn appropriate scaling and shifting for optimization.

### 4.3 Implementing a Feed Forward Network with GELU Activations

This section introduces the Feed Forward Network (FFN), a small multilayer neural network submodule utilized within the Transformer Block.

- **Activation Function:** The FFN uses the **GELU (Gaussian Error Linear Unit)** activation function,. GELU is chosen over traditional ReLU because its smoothness at zero provides better optimization properties, especially in deep and complex networks.![[Pasted image 20251014153430.png]]

- **Structure:** The FFN consists of two linear layers. It first **expands the embedding dimension** (e.g., by a factor of four, from 768 to 3,072) and then **contracts it back** to the original embedding dimension (768). This expansion/contraction allows the network to explore a richer representation space.![[Pasted image 20251014153520.png]]

### 4.4 Adding Shortcut Connections

Shortcut connections, also known as skip connections, are vital for training very deep neural networks efficiently.

- **Purpose:** They address the **vanishing gradient problem** where gradients become too small to effectively update early layers in deep networks. By adding the input of a layer directly to its output, they create an alternative, shorter path for the gradient to flow through the network during the backward pass.![[Pasted image 20251014153643.png]]
- **Impact:** Shortcut connections help ensure **consistent gradient flow across layers**, facilitating more effective training of deep architectures like LLMs.

### 4.5 Connecting Attention and Linear Layers in a Transformer Block

The Transformer Block is the fundamental, core structural component of GPT models, combining elements coded in this chapter and Chapter 3.

- **Components:** The Transformer Block encapsulates the entire feature transformation process for a token sequence:![[Pasted image 20251014153731.png]]
    1. A **Layer Normalization** layer.
    2. The **masked multi-head attention module** (from Chapter 3).
    3. A **shortcut connection** (adding the attention output back to the normalized input).
    4. Another **Layer Normalization** layer.
    5. The **FeedForward** module (with GELU activations).
    6. A second **shortcut connection**.
    
- **Shape Preservation:** The block is designed to maintain the input tensor dimensions (e.g., `[batch_size, num_tokens, emb_dim]`) in its output, ensuring that the module can be repeated sequentially multiple times,. The output is an enriched _context vector_ for each input token.

### 4.6 Coding the GPT Model

This section completes the full LLM architecture by replacing the initial dummy placeholders with the actual `TransformerBlock` and `LayerNorm` modules.

- **Final Assembly (`GPTModel`):** The implementation utilizes `torch.nn.Sequential` to stack the `TransformerBlock` modules `n_layers` times,. The data flows from token and positional embeddings, through the stacked transformer blocks, through a final `LayerNorm`, and finally into the linear output head (`out_head`).

- **Weight Tying and Parameters:** The implementation for the 124M GPT-2 architecture contains 163,009,536 total parameters. The original GPT-2 model parameter count of 124 million is achieved by using **weight tying**, a concept where the output layer shares its weight matrix with the token embedding layer, reducing the number of parameters by over 38 million. Possible to share the weights since the sizes.
  
  If you use the _same vectors_, then “understanding a token” and “predicting a token” happen in the **same semantic space**.
	- At the start, the model learns: “what does each token mean?” → via $W_E$ (token emb Matrix)
	- At the end, it predicts: “given a context vector h, which token does it correspond to?” → via $W_{out}$ (Output projection (logits) )
  
  It's not always a win ! No free lunch thoery
  The model can learn two _different_ mappings without sharing
	- Not sharing = two different dictionaries — one for reading, one for writing — but let the model figure out how to translate between them.”

- **Storage:** The smallest 163 million parameter GPT model requires about 621.83 MB of storage (assuming 32-bit floats),.

### 4.7 Generating Text

Text generation is the final step in the forward pass, converting the model's numerical outputs into human-readable tokens and is an iterative procedure.

- **Iterative Process:** LLMs generate text **one token at a time**. The generated token is appended to the input sequence (context), and the entire sequence is fed back into the model to predict the next token, repeating the process until a maximum number of tokens is reached.![[Pasted image 20251018153650.png]]
- **Logit Extraction:** The GPT model outputs a tensor where the final dimension matches the vocabulary size. Due to the causality of the model and how training targets are shifted, **only the last row of the output tensor** (corresponding to the last input token) is used to predict the next token.![[Pasted image 20251018153611.png]]
- **Token Selection (Greedy Decoding):** To determine the next token, the logit vector for the last position is used. The simplest method, greedy decoding, selects the **index corresponding to the highest value** in the logit vector (or the corresponding probability vector after a softmax operation).
- **Functionality:** A `generate_text_simple` function is implemented to manage the truncation of the context length, suppress gradient computation during inference (`torch.no_grad`), and perform the iterative prediction loop,,. Untrained models, operating on random weights, produce incoherent text ("gibberish").
## 4.8 Summary

- Layer normalization stabilizes training by ensuring that each layer's outputs have a consistent mean and variance.

- Shortcut connections are connections that skip one or more layers by feeding the output of one layer directly to a deeper layer, which helps mitigate the vanishing gradient problem when training deep neural networks, such as LLMs.

- Transformer blocks are a core structural component of GPT models, combining masked multi-head attention modules with fully connected feed-forward networks that use the GELU activation function.

- GPT models are LLMs with many repeated transformer blocks that have millions to billions of parameters.

- GPT models come in various sizes, for example, 124, 345, 762, and 1542 million parameters, which we can implement with the same GPTModel Python class.

- The text generation capability of a GPT-like LLM involves decoding output tensors into human-readable text by sequentially predicting one token at a time based on a given input context.

- Without training, a GPT model generates incoherent text, which underscores the importance of model training for coherent text generation, which is the topic of subsequent chapters.

---
## 5 Pre-training on Unlabeled Data
![[Pasted image 20251018163438.png]]
****### 5.1 Evaluating Generative Text Models

This section sets up the implemented GPT model for text generation and introduces a quantitative measure for assessing the quality of the generated text. ![[Pasted image 20251018163533.png]]

#### 5.1.1 Using GPT to Generate Text
- The GPT model is initialized, typically configured to match the structure of the smallest GPT-2 model (124 million parameters), but with a reduced **context length** (e.g., 256 tokens) to make training feasible on standard hardware.

- The text generation process is outlined: input text is converted to token IDs, fed into the GPT model to produce output **logits**, and these logits are converted back to token IDs and then decoded into text.

- Utility functions (`text_to_token_ids` and `token_ids_to_text`) are implemented to streamline tokenization and decoding using the `tiktoken` tokenizer.

- An untrained model, initialized with random weights, generates nonsensical output or **gibberish**.

#### 5.1.2 Calculating the Text Generation Loss
The **Cross Entropy Loss** (CE Loss) is introduced as the primary metric for numerically measuring text generation quality. This loss must be minimized to optimize the model.![[Pasted image 20251019214208.png]]

- The model learns to predict the next token, where the **targets** are the input tokens shifted by one position.

- The goal of training is to maximize the probability score corresponding to the correct target token ID (ideally towards 1).

- The CE Loss is synonymous with the **negative average log probability** of the target tokens.

- PyTorch provides an optimized built-in function, `torch.nn.functional.cross_entropy`, which calculates the CE Loss directly from the model outputs (logits) and the target token IDs, handling internal steps like the softmax function.
  However it expects expects **2D logits** and **1D targets**: it means it's necessary to flatten our tensor → it’s mathematically equivalent to:
	- compute loss per token,
	- then average over all tokens and batches.

- **Perplexity** is a related evaluation measure, calculated as the exponential of the CE Loss (eloss). Perplexity offers an interpretable score indicating the effective size of the vocabulary about which the model is uncertain.

#### 5.1.3 Calculating the Training and Validation Set Losses
![[Pasted image 20251019214116.png]]
- The CE Loss calculation is applied across the entire training and validation datasets to obtain generalized performance scores.

- The dataset used is the short story "The Verdict," which is very small for an LLM (5145 tokens), serving solely educational purposes to enable rapid training.

- The data is split (e.g., 90% training, 10% validation) and processed into batches (e.g., size 2, length 256) using data loaders implemented in Chapter 2.

- Initial losses (e.g., around 10.98) are calculated, confirming the poor performance of the randomly initialized model. Utility functions (`calc_loss_batch`, `calc_loss_loader`) facilitate this iterative loss calculation over data batches.

### 5.2 Training an LLM

This section implements the core training function, guiding the model to minimize the calculated cross entropy loss.![[Pasted image 20251019221446.png]]

- The training procedure iterates over multiple **epochs** (full passes over the training data).

- For each batch, the training loop follows standard PyTorch practices:
    1. **Reset Gradients:** `optimizer.zero_grad()` clears gradients from the previous step.

    2. **Forward Pass & Loss:** Compute logits and the CE Loss on the current batch.

    3. **Backward Pass:** `loss.backward()` computes the loss gradients with respect to all trainable parameters.

    4. **Weight Update:** `optimizer.step()` updates the model weights using the calculated gradients.

- The **AdamW optimizer** is employed, a variant of Adam popular for LLM training due to its improved handling of weight decay.

- During training, the model must be set to `model.train()` mode to enable stochastic elements like **Dropout**.

- Due to the small dataset size and multiple epochs, the model quickly begins **overfitting**, resulting in a significant divergence between the rapidly dropping training loss and the stagnating validation loss. This is evidenced by the model memorizing verbatim passages from the training text.

### 5.3 Decoding Strategies to Control Randomness

After training, the model tends to memorize and use "greedy decoding" (always selecting the token with the highest probability via `torch.argmax`). This section introduces techniques to increase diversity and creativity in generated text.

#### 5.3.1 Temperature Scaling

- Temperature scaling controls the probability distribution of the next token by dividing the logits by a temperature value (T).

- Instead of greedy decoding, sampling occurs using **probabilistic selection** via `torch.multinomial`.

- If T<1, the distribution is sharpened, favoring high-probability tokens (less randomness); if T>1, the distribution is flattened, increasing diversity but raising the risk of incoherent text.

#### 5.3.2 Top-k Sampling

- Top-k sampling limits the universe of possible next tokens to the k tokens associated with the highest logits.

- Logits for tokens outside the top k are masked using **negative infinity** (−∞) before softmax, ensuring they receive a probability score of 0. This approach maintains coherence by excluding highly unlikely predictions while still enabling sampling diversity.

#### 5.3.3 Modifying the Text Generation Function

- A sophisticated `generate` function is implemented, combining both temperature scaling and top-k sampling.

- The updated function also incorporates an optional **End-of-Sequence (EOS) token ID** check to allow the model to halt generation early, conserving computational resources when an answer is complete.

### 5.4 Loading and Saving Model Weights in PyTorch

- To save trained models without requiring a full re-run of training, PyTorch recommends saving the model's **state_dict**, a dictionary mapping parameter names to their learned values (weights and buffers).

- Saving is done via `torch.save(model.state_dict(), "file.pth")`.

- Loading requires first initializing the model architecture and then applying the saved parameters using `model.load_state_dict()`.

- The **optimizer state** should also be saved if training is intended to be resumed, particularly for adaptive optimizers like AdamW, which store historical learning data.

### 5.5 Loading Pretrained Weights from OpenAI

This section details how to bypass the extensive cost and time required for full pretraining by loading openly available, highly capable GPT-2 weights into the custom-implemented architecture.

- OpenAI shared GPT-2 weights in various sizes (e.g., 124M, 355M).

- To load the **official weights**, the TensorFlow library is briefly required because the original files were saved in a TensorFlow format; alternative loading methods exist for environments that cannot support TensorFlow.

- The custom model architecture configuration must be adjusted to match the official GPT-2 settings, including setting the context length to **1024** and enabling the **qkv_bias** parameter, which is unique to OpenAI's implementation.

- A complex utility function (`load_weights_into_gpt`) is necessary to convert and map the external weights correctly into the implemented PyTorch modules. This includes handling quirks like the official model storing Query, Key, and Value matrices in a merged format which must be split for the custom implementation.

- The official GPT-2 model uses **weight sharing** (or weight tying), where the token embedding weights are reused for the final output layer.

- Successful loading is confirmed by generating coherent, high-quality text, validating the quality of the imported weights.
### 5.6 Summary

- When LLMs generate text, they output one token at a time.

- By default, the next token is generated by converting the model outputs into probability scores and selecting the token from the vocabulary that corresponds to the highest probability score, which is known as "greedy decoding."

- Using probabilistic sampling and temperature scaling, we can influence the diversity and coherence of the generated text.

- Training and validation set losses can be used to gauge the quality of text generated by LLM during training.

- Pretraining an LLM involves changing its weights to minimize the training loss.

- The training loop for LLMs itself is a standard procedure in deep learning, using a conventional cross entropy loss and AdamW optimizer.

- Pretraining an LLM on a large text corpus is time- and resource-intensive so we can load openly available weights from OpenAI

### BONUS : PyTorch Performance Tips for Faster LLM Training 
 [[/Users/rvieira/Documents/side-quests/LLMs-from-scratch/ch05/10_llm-training-speed/README.md]]

1. Pinned memory in the data loader
   pin_memory=True in `DataLoader` to push data saved in CPU during training to GPU → allocate the samples in page-locked memory (speed up)

2. Create causal mask on the fly

3. Use tensor cores (only available with Ampere GPUs)

4. Fused AdamW optimizer

5. Using bfloat16 precision

6. Replacing from-scratch code by PyTorch classes (LayerNorm and GeLU from-scratch implementation by PyTorch's native implementations)

7. Using FlashAttention (PyTorch's self-attention function)

8. Using `pytorch.compile`

9. Vocabulary padding
10. Increasing the batch sizeo the largest power of 2 supported by the GPU
---
## 6 Finetuning for Classification
details the technical process of adapting a pre-trained Large Language Model (LLM) into a specialized text classifier.
![[Pasted image 20251020175950.png]]

The chapter is structured around three main stages: **Dataset Preparation**, **Model Setup**, and **Finetuning and Evaluation**.

### 6.1 Different Categories of Finetuning

This section introduces two primary methods of model adaptation after pre-training:![[Pasted image 20251020180026.png]]

- **Instruction-Finetuning:** Training the LLM to follow specific, natural language instructions (covered in Chapter 7).
- **Classification-Finetuning (Focus of Chapter 6):** Training the model to map input text to a fixed, predefined set of **class labels** (e.g., predicting "spam" or "not spam"). Classification models are highly specialized and often easier to develop than models capable of general instruction following. The resulting model responds only with class labels, without requiring further instruction alongside the input text.

### 6.2 Preparing the Dataset

This stage focuses on acquiring and cleaning the data for the classification task:

- **Data Source:** The **SMSSpamCollection** dataset from UCI is used. This dataset is a tab-separated value (TSV) file containing messages labeled as 'ham' (non-spam) or 'spam'.
- **Data Balancing:** To simplify the classification problem and ensure faster training for illustrative purposes, the dataset is **balanced**. This involves identifying the number of spam messages (747 examples) and randomly sampling an equivalent number of non-spam messages ('ham'), resulting in a **balanced dataset**.
- **Data Splitting:** The balanced dataset is partitioned using a `random_split` function into three subsets: **70% for training, 10% for validation, and 20% for testing**.

### 6.3 Creating Data Loaders

Since classification inputs (text messages) have varying lengths, unlike the fixed-length sequences used in pre-training, special attention is paid to padding:

- **Variable Lengths and Padding:** Because PyTorch requires fixed-size batches, shorter text messages must be **padded** to match the length of the longest sequence in the dataset.
- **Maximum Length Determination:** The implementation determines the maximum sequence length (`max_length`) based on the longest example found in the **training set** (which is 120 tokens in the example). This practice ensures that validation and test sets use parameters derived only from the training data, avoiding potential information leakage.
- **Padding Token:** The **`<|endoftext|>` token (Token ID 50,256)** is used as the padding token.![[Pasted image 20251020183821.png]]
- **Target Data:** The PyTorch dataset class (`SpamDataset`) returns input tokens and corresponding **integer class labels** (0 for non-spam, 1 for spam), rather than the next token IDs, as the target.
- **Data Loaders:** Data loaders are instantiated to return batches (e.g., batch size 8) of text messages and their corresponding class labels.

### 6.4 Initializing a Model with Pretrained Weights

This step prepares the LLM foundation for specialization:

- **Base Model Loading:** The code reuses the architecture and weight loading functions from Chapter 5 to load a **pretrained GPT model** (e.g., the 124 million parameter model). The pre-training provides a "Foundation model" with learned feature extraction capabilities.
- **Pre-trained Limitation:** Initial testing confirms that the pre-trained model is **incapable of following explicit instructions** (like "Is this spam? Answer yes or no:") and instead attempts to continue generating text based on the prompt's input.

### 6.5 Adding a Classification Head

The model architecture is fundamentally altered to switch from text generation to classification:![[Pasted image 20251020191651.png]]

- **Replacing the Output Layer:** The original large output layer (`out_head`), which projected embeddings (e.g., 768 dimensions) to the full vocabulary size (50,257 dimensions), is **replaced**.

- **New Classification Head:** A new linear output layer is introduced, mapping the hidden state dimensions (e.g., 768) directly to the **number of classes** (2 in this binary spam/non-spam case).

- **Weight Freezing:** The majority of the model's weights (including embedding layers and earlier Transformer blocks) are **frozen** by setting `requires_grad=False`. This prevents them from being updated during fine-tuning, as they already hold general language knowledge.

- **Trainable Layers:** The new classification head is trainable by default. Additionally, the **final LayerNorm** and the **last Transformer block** are explicitly unfrozen to allow fine-tuning of the highest-level feature extraction layers.

- **Focus on the Last Token:** Due to the **causal attention mask** in GPT, the **last token** in the sequence is the only one that receives information from all preceding tokens (full message)![[Pasted image 20251020202729.png]]
  Therefore, the fine-tuning process relies exclusively on the output logits corresponding to the last token position for the classification prediction.![[Pasted image 20251020202652.png]]

### 6.6 Calculating the Classification Loss and Accuracy

Model evaluation functions are implemented before fine-tuning begins:

- **Prediction Mechanism:** The model converts the logits of the last output token into a class label (0 or 1) by determining the index with the highest magnitude using `torch.argmax`.
- **Accuracy Calculation:** The `calc_accuracy_loader` function is defined to measure **classification accuracy** (the percentage of correct predictions) across the dataset.
- **Loss Function:** The training objective uses the **cross entropy loss**, identical to the pre-training loss, but calculated exclusively based on the **logits of the last token** (`logits = model(input_batch)[:, -1, :]`). Initial loss values are high, and initial accuracy is close to 50% (random guessing).

### 6.7 Finetuning the Model on Supervised Data

The classification fine-tuning process is executed:

- **Training Loop:** A standard PyTorch training loop (`train_classifier_simple`) is employed, iterating over epochs, calculating loss gradients, and updating the trainable weights using an optimizer (e.g., AdamW).
- **Tracking Metrics:** The training function tracks both the loss and the classification accuracy across epochs.
- **Results:** Training for five epochs yielded strong results, with the training loss sharply declining and the validation loss generalizing well without immediate overfitting. The final model achieved high accuracies (e.g., Test accuracy: 95.67%).

### 6.8 Using the LLM as a Spam Classifier

The final, production-ready use of the model is demonstrated:

- **Classification Function:** A utility function (`classify_review`) is implemented to handle the necessary preprocessing (tokenization, padding to the trained max length) for new, unseen input text.
- **Inference:** The model, set to evaluation mode (`model.eval()`), predicts the class label ("spam" or "not spam") using the highest logit value from the last output token.
- **Model Saving:** The weights of the fine-tuned model are saved as a state dictionary (e.g., `"review_classifier.pth"`) using `torch.save` for later reuse or deployment.

### Summary

|Concept|Technical Details / Significance|Sources|
|:--|:--|:--|
|**Finetuning Strategy**|**Classification Fine-tuning** is highly specialized, requiring a smaller output layer and focusing on fixed class labels (0/1).||
|**Data Preparation**|Uses the **SMSSpamCollection** dataset, **undersampling** 'ham' examples to balance the classes (e.g., 747 of each). The dataset is split 70/10/20 for train/validation/test.||
|**Padding**|Necessary due to varying input text lengths. All inputs are padded to the **maximum length of the longest training sequence** (e.g., 120 tokens). The **`<|endoftext|
|**Model Modification (Classification Head)**|The vast original output layer (e.g., $768 \to 50,257$) is replaced by a slim **classification head** ($768 \to 2$ nodes).||
|**Trainable Parameters**|**Weights are frozen** in most layers. Only the **new classification head**, the **final LayerNorm**, and the **last Transformer block** are set to `requires_grad=True`.||
|**Prediction Focus**|Classification decisions are made **only on the logits of the last token position** in the sequence output. This token captures context from all preceding tokens due to the causal attention mask.||
|**Loss and Evaluation**|The objective function is **cross entropy loss**, applied exclusively to the last token's logits. Model performance is measured using **classification accuracy**.||
|**Finetuning Outcome**|Even with limited trainable parameters, the fine-tuned LLM achieves high classification accuracy (e.g., 95%+ on the test set).||

---
Chapter 7, "Finetuning to Follow Instructions," details the process of **Supervised Instruction Finetuning (SFT)**, which is essential for adapting a pretrained Large Language Model (LLM) to function as a personal assistant or chatbot capable of following human commands and generating free-form responses. This process is independent of the classification finetuning covered in Chapter 6.

The instruction finetuning process is broken down into three main stages: Dataset Preparation, Model Setup and Finetuning, and Model Evaluation.

---

## 7 Instruction Finetuning

### 7.1 Introduction

- **Goal:** To overcome the limitations of pretrained LLMs, which are primarily capable of text completion and often struggle with specific instructions (e.g., translating or fixing grammar). Instruction fine-tuning (SFT) improves the LLM's ability to comprehend and appropriately respond to specific requests.
- **Alignment:** Instruction fine-tuning is typically followed by an optional step called **alignment** or **preference tuning** (e.g., using DPO or RLHF), which further refines the LLM's behavior to generate preferred responses aligned with human values.

### 7.2 Preparing a Dataset for Supervised Instruction Finetuning

- **Dataset Source:** The chapter uses a relatively small dataset of 1,100 instruction-response pairs (`instruction-data.json`) to allow for rapid training (e.g., 5-10 minutes) for educational purposes.
- **Data Structure:** Each entry is a dictionary containing an **'instruction'**, an optional **'input'** field, and a **'output'** field (the desired response).
- **Prompt Formatting (Prompt Styles):** The dictionary entries must be converted into a continuous text format (prompt style) that the LLM can process.
    - The chapter uses the popular **Alpaca prompt style**, which uses defined sections like "### Instruction:" and "### Response:" to structure the input-output relationship.
    - Shorter prompt styles, such as the **Phi-3 style**, are often preferred in practice as they require fewer tokens, making inference cheaper.
- **Data Partitioning:** The dataset is split into 85% for training, 10% for testing, and the remaining 5% for validation.

### 7.3 Organizing Data into Training Batches

This is a crucial, technical phase because instruction fine-tuning, like pretraining, relies on minimizing the loss from **next-token prediction**.

- **Sequence Preparation:** The instruction and the desired response are concatenated and tokenized to create the full sequence.
- **Custom Collator Function:** A **custom collate function** (`custom_collate_fn`) is implemented and passed to the PyTorch `DataLoader` to handle the batching requirements.
    - It pads sequences within a single batch to match the longest sequence length in that batch, minimizing unnecessary padding. The padding token used is the **`<|endoftext|>` token** (token ID **50256**).
- **Target Token ID Creation:** The target token IDs are generated by shifting the input token IDs by one position to the right, consistent with next-token prediction.
- **Loss Masking (Replacing Padding Tokens):** Excessive padding tokens (ID 50256) in the _target_ tensor are replaced with the **placeholder value of -100**.
    - This is essential because the **cross entropy loss function in PyTorch automatically ignores any target index equal to -100**, preventing padding tokens from influencing the training process.
- **End-of-Text Retention:** Crucially, one `<|endoftext|>` token (ID 50256) is **retained** in the target sequence at the end of the response text. This teaches the LLM to generate this specific token, which signals the completion of the response during inference.
- **Instruction Masking (Optional):** It is also possible to replace the target token IDs corresponding to the instruction and input with -100 (masking them out) to focus the loss calculation solely on the generated response. However, the primary implementation in the chapter **does not** use instruction masking.

### 7.4 Creating Data Loaders for an Instruction Dataset

- The `InstructionDataset` class and the customized `custom_collate_fn` are assembled into standard PyTorch `DataLoader` objects for the training, validation, and test sets.
- The `custom_collate_fn` is typically wrapped using `functools.partial` to fix arguments like the device and the `allowed_max_length` (e.g., 1024, the context length of the model).
- The resulting data loaders successfully yield batches of varying sizes, maintaining training efficiency by minimizing padding for shorter sequences.

### 7.5 Loading a Pretrained LLM

- **Model Choice:** The **GPT-2 medium model (355 million parameters)** is chosen, as the smaller 124 million parameter model is insufficient for achieving qualitatively satisfactory results in complex instruction following tasks.
- **Weight Loading:** The model weights (approximately 1.42 GB) are loaded using the `download_and_load_gpt2` and `load_weights_into_gpt` functions developed in previous chapters.
- **Baseline:** Prior to fine-tuning, the pretrained model's baseline performance is assessed, confirming its inability to follow instructions—it typically repeats or completes the input sentence rather than providing the desired response.

### 7.6 Finetuning the LLM on Instruction Data

- **Training Loop:** The instruction fine-tuning leverages the identical **`train_model_simple`** function and the **cross entropy loss** utilities used for pretraining in Chapter 5.
- **Loss Minimization:** The initial loss (e.g., ~3.8) is minimized over several epochs (e.g., 2 epochs) using an optimizer like AdamW.
- **Computational Cost:** Training the larger 355M model is computationally intensive. Runtimes vary significantly by hardware (e.g., 15.78 minutes on an M3 MacBook Air vs. 0.86 minutes on an NVIDIA A100 GPU for 2 epochs).
- **Training Outcome:** The training and validation losses decrease substantially, indicating the model learns effectively, although continued training may lead to overfitting. The model's progress is tracked by periodically generating text samples and observing the reduction in gibberish and improved coherence.

### 7.7 Extracting and Saving Responses

- **Inference:** After fine-tuning, the model is put into evaluation mode, and the generalized `generate` function is used to produce responses for the held-out test set inputs.
- **Response Cleaning:** Raw generated text includes the input instruction/prompt template, which is removed via post-processing (e.g., string slicing and `replace()` operations) to isolate the model's free-form answer.
- **Saving:** The generated model responses are appended to the test data and saved as an "instruction-data-with-response.json" file for subsequent evaluation. The final fine-tuned model checkpoint is also saved (e.g., `gpt2-medium355M-sft.pth`).

### 7.8 Evaluating the Finetuned LLM

- **Evaluation Challenge:** Evaluating instruction-finetuned LLMs is difficult because responses are free-form, and multiple answers may be acceptable.
- **Automated Scoring:** The chapter implements an automated evaluation method by leveraging a separate, more capable LLM (a **Judge LLM**) to score the finetuned model's responses, similar to the approach used in benchmarks like AlpacaEval.
- **Judge LLM Implementation:** This is achieved by running the **8 billion parameter Llama 3 instruct model locally using the Ollama application**.
- **Scoring Mechanism:** The Judge LLM is provided with the input instruction, the expected correct output, and the fine-tuned model's generated response, and is tasked with returning a **numeric score** (e.g., 0-100) based on customizable criteria.
- **Quantifying Performance:** The final model performance is quantified by calculating the **average score** across all test samples.

---

### Relevant GitHub Code/Folders (ch07)

The repository material highlights several optional notebooks related to Chapter 7:

- **`ch07.ipynb`**: Contains the main code implementation for instruction finetuning.
- **Dataset Utilities**: Includes code for finding near duplicates and generating instruction data.
- **Evaluation Utilities**: Notebooks dedicated to evaluating instruction responses using the OpenAI API and the local Ollama Judge LLM.
- **Preference Tuning (DPO)**: Supplementary materials are available in the `04_preference-tuning-with-dpo` folder for implementing **Direct Preference Optimization (DPO)**, an optional step after instruction fine-tuning to align the model with human preferences, which is otherwise too technical and lengthy for the main chapter.
- **LoRA Exercise**: The **Parameter-efficient Finetuning with LoRA** exercise (Exercise 7.4) is provided, demonstrating how to use LoRA to speed up training runtime (e.g., 28% faster in one example) while maintaining performance.

# Developing an LLM: Building, Training, Finetuning
https://www.youtube.com/watch?v=kPGTx4wcm_w


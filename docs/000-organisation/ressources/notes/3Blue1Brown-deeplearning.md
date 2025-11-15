# 1. What is a neural network
https://www.youtube.com/watch?v=aircAruvnKk
## Summary 
*focuses on laying the foundational structure and mathematical representation of a basic, plain vanilla neural network designed to recognize handwritten digits*

The technical concepts presented describe the network's architecture, its components, and how information flows (how they are connected):
### 1. Neurons and Activations
A neuron is a function -- fundamentally a component that holds a number, specifically a value between 0 and 1, which is called its **activation**. 
This number represents the "brightness" or activity of the neuron.
### 2. Layered Structure
The network is organized into layers, including an **input layer** (e.g., 784 neurons for a 28x28 pixel image), **hidden layers** (arbitrarily chosen as two layers of 16 neurons each in the example), and an **output layer** (10 neurons, one for each digit). Activations in one layer determine the activations in the next layer.
### 3. Core Calculation (Weighted Sum and Bias)
- The activation of a neuron in the next layer is determined by taking a **weighted sum** of all the activations in the preceding layer, and then adding a **bias**.

- **Weights:** These are numbers assigned to the connections between neurons and determine what (pixel) pattern or feature the neuron is picking up on.

- **Bias:** This is an added number that sets the threshold for how high the weighted sum needs to be before the neuron becomes meaningfully active.

- The example network has nearly **13,000 total weights and biases** that are tunable parameters.
### 4. Non-Linearity (Squishification Function)
The resulting weighted sum (plus bias) is passed through a non-linear function to "squish" the value into the desired activation range (0 to 1).

- The **Sigmoid function** (logistic curve) was a common early choice.![[Pasted image 20251006145935.png]]

- The **Rectified Linear Unit (ReLU)**, which takes the maximum of zero and the input, is a simpler, more modern function noted to be much easier to train.

### 5. Mathematical Representation
The transition of activations from one layer to the next is often expressed compactly using linear algebra: organizing activations as a vector, weights as a matrix, and computing the result via a **matrix-vector product**.
![[Pasted image 20251006150044.png]]
## Remarks 
- learning = finding the right weights and biases.

- If you build up a little of a relationship with what those weights and biases actually -> starting place to change the structure to improve (!!)

- when it works but not for the reasons your expect --> digging into what the weights and biases are doing is a good way to challenge your assumptions and expose the full space of possible solutions. *When it works dig into why* (!!)

- code is simpler with a matrice form because optimized for ´matmul´ and operations
## Optimization areas
The concepts presented in Chapter 1 highlight that the network's function is an "absurdly complicated function" involving **13,000 parameters** and iterating many matrix-vector products and non-linear functions. Minimizing hardware use (both in terms of memory footprint and computational load) requires optimizing these parameters and computations.

Based strictly on the foundational concepts introduced (weights, biases, dense matrix connections, and activation functions), the following areas within the neural network itself offer room for optimization:

### 1. Parameter Reduction and Connectivity
The network's size (13,000 weights and biases in the small example) is directly proportional to the dense connections between neurons in adjacent layers. Minimizing hardware use requires reducing this count or the cost of handling them.

| Area of Improvement                      | Description                                                                                                                                                                                                                                                                                                                                                                         | Relevant Technical Concept                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Sparsity and Pruning**                 | Reducing the parameter count by eliminating weights that contribute little to the outcome (setting them to zero). Since the weights are organized as dense matrices, converting these to sparse matrices reduces memory requirements and computation during matrix multiplication.                                                                                                  | The total count of 13,000 weights is derived from the **fully connected** structure: (Neurons in L) * (Neurons in L-1). |
| **Low-Rank Approximation**               | For matrix multiplication, if the full weight matrix is large, it can be approximated by factoring it into two smaller matrices. This reduces the total number of parameters needed to represent the transformation. (This concept is specifically mentioned later in the context of the attention block's value matrix, but it applies generally to matrix-based neural networks). | The weight matrix organization, where the bulk of the parameters reside.                                                |
| **Structural/Architectural Constraints** | Exploring alternatives to the fully connected (dense) layers shown, such as convolutional layers or other architectures that impose spatial constraints and require far fewer weights to achieve similar or better performance.                                                                                                                                                     | The choice of hidden layer size (16 neurons) was arbitrary, and the architecture is a **plain vanilla form**.           |

### 2. Computational Efficiency and Precision
The computation involves matrix-vector products (weighted sums) followed by non-linear application.

| Area of Improvement                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                  | Relevant Technical Concept                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Weight and Activation Quantization**    | The weights and activations are continuous real numbers. Using reduced precision (e.g., converting 32-bit floating point numbers to 8-bit integers) for weights and/or activations reduces the memory footprint and allows faster arithmetic operations, minimizing hardware use during both training and inference.                                                                                                         | The use of continuous values for activations.                                    |
| **Activation Function Optimization**      | The ReLU function is noted as being superior to Sigmoid because it is easier to train. This highlights that the computational cost and complexity of the non-linear function itself is a factor. Further optimizing the activation function to be computationally cheaper, especially during the derivative calculation required for training (backpropagation, not covered in Chapter 1 but implied by "learning"), is key. | The use of activation functions like Sigmoid or ReLU after the weighted sum.     |
| **Hardware-Specific Matrix Optimization** | Ensuring that matrix-vector multiplication is performed in a way that maximizes parallel processing (which is why matrix multiplication is preferred for speed). This involves tuning the size and shape of weight matrices for optimal hardware utilization (e.g., GPU memory alignment).                                                                                                                                   | The preference for using **matrix multiplication** for computational efficiency. |

---
# 2. How neural networks learn - Gradient descent
https://www.youtube.com/watch?v=IHZwWFHWa-w
## Summary

The learning process is framed as a calculus optimization problem focused on minimizing the network's "lousiness":

### 1. Cost Function (Measure of Lousiness)

- The network begins with **random weights and biases**
  (e.g., $\approx 13,000$ parameters in the example network) and performs poorly.

- The **cost function** is defined for a single training example by summing the squares of the differences between the network's output activations (the "trash output") and the desired target values (e.g., 1 for the correct digit, 0 for others).$$C^{(x)} = \frac{1}{2} \sum_{j=1}^{10} (a_j - y_j)^2$$where
	- $a_j$: activation of output neuron j
	- $y_j$: desired output (1 for correct digit, 0 otherwise)

- The **total cost** of the network is the average error of these individual costs over all $n$ training dataset within one weights/bias-configuration providing a single scalar of how "lousy" the network's current parameter settings are. $$C = \frac{1}{n} \sum_{x} C^{(x)}$$
- The cost function takes the **depends on every weights and biases** in the netwokr as inputs and outputs a single measure of lousiness.
  So we’re differentiating is the **cost function with respect to all network parameters** : $C = C(w_1, w_2, …, w_{n})$

### 2. Gradient and Sensitivity

- To minimize the cost, the network uses the mathematical concept of the **gradient**.

- The **negative gradient** is a vector in the high-dimensional parameter space (13,000 inputs) that specifies the direction in which to step to achieve the **most rapid decrease** in the cost function (the "downhill direction").

- Each component of this negative gradient vector indicates how **sensitive** the cost function is to a change in the **corresponding weight or bias**. The magnitude of the gradient tells the model which changes give the "most bang for your buck".

### 3. Gradient Descent (The Learning Algorithm)

- The method of repeatedly nudging the input (weights and biases) by some multiple of the negative gradient is called **gradient descent**.

- The algorithm involves computing the gradient, taking a small step downhill in that direction, and repeating this process until a local minimum (a "valley") in the cost function is reached. Step sizes are typically proportional to the steepness (slope) of the function, which helps avoid overshooting the minimum.

### 4. Stochastic Gradient Descent (Computational Efficiency)

- Computing the _true_ gradient requires calculating the cost average over **all** training examples, which is computationally slow.

- To achieve significant computational speedup, **stochastic gradient descent (SGD)** is commonly used. This involves randomly dividing the training data into smaller **mini-batches** (e.g., 100 examples) and computing the gradient step based only on that small subset. While this results in less efficient, "stumbling" steps, the speedup is significant.

### 5. Performance Analysis (Failure of Vanilla Network)

- The analysis of the basic, plain vanilla network reveals that while it achieves decent accuracy (about 96% on unseen images), it often fails to learn the intuitive features (like edges and loops) that were hoped for.

- The visualizations of the weights connecting the first layer to the second layer appear "almost random".

- Furthermore, the network lacks uncertainty; it gives "confidently... some nonsense answer" when presented with random noise, suggesting its tight training setup never incentivized cautious decision-making
## Remarks 

- random starting of the weights (room for improvement ?) (!!)

- Cost function -> cost is large when BS,  **'average'** (!!) cost is how bad the training. goal is to averaged over all the training data (minimzed on ALL the samples) -> focus on some parts only ? 

- local minimum doable, global minimal 
  gradient -> increase / decrease the steepest ascent + length of the vector matter

- learning = minimizing a cost function 
  requires smooth output (!!) -> this is why continuously ranging activation (no binary)

- gradient of the costs tells what nudges to all these weights and biases cause the fastest change to the value of the cost function = which weights and which biases matter the most ! 

- when inputing a random image not a number (system not smart) -> non-sense answer with the same certainty as if it was an actual number 
  -> the system can recognize digits well but no idea on how to draw them !
- if the dataset is stuctured you should be able tof find local minimums way more easily. 
- when calculating the cost function, could we already have a cap and use (keep the minimal in mind so we wouldn't need to compute till the end if we already see that it's worse ?  evne though with gradient descent it shouldnt be the case ...)

## Optimization areas
Revolves around reducing the vast computational requirements associated with processing the training data and calculating the gradient (e.g across 13,000 parameters.)

### 1. Efficiency of Gradient Calculation (The Learning Part)

Minimizing hardware use in the learning phase relies heavily on optimizing the trade-off between the quality of the gradient estimate and the speed of the computation.

| Area of Improvement                                         | Relevant Technical Concept (Chapter 2)                                                                                                                                                           | Room for Optimization / Possible Improvement                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mini-batch Sizing and Training Schedule**                 | The use of **mini-batches** in Stochastic Gradient Descent (SGD) is introduced to gain a "significant computational speedup" because calculating the gradient over the full dataset is too slow. | Although SGD uses mini-batches, the size of the batch (e.g., 100) is arbitrary. Optimization can involve finding the **optimal batch size** that maximizes parallel processing capacity (hardware utilization, especially GPUs) while maintaining training convergence quality.                                                                                                                            |
| **Optimization Algorithms (Beyond Basic Gradient Descent)** | Gradient descent is compared to a ball rolling down a hill. The goal is to reach a local minimum efficiently.                                                                                    | Standard gradient descent steps are slow and may be prone to getting stuck in poor local minima. Improvement lies in using advanced algorithms (e.g., methods incorporating _momentum_ or _adaptive learning rates_—concepts not detailed in Chapter 2 but implied by the basic "drunk man stumbling" analogy) to accelerate convergence and reduce the total number of expensive training steps required. |
| **Cost Function Design for Gradient Stability**             | The cost function must have a "nice smooth output" for the gradient descent to work well. The cost function involves averaging effects over many examples.                                       | Hardware efficiency is improved if the calculation of the gradient (or its components via backpropagation) is numerically stable and less computationally intensive. Modifying the **cost function itself** or introducing **regularization terms** could smooth the "cost surface" further, allowing for larger, faster steps without "overshooting" the minimum.                                         |

### 2. Interpretation and Feature Learning (Hidden Layers / Analysis)

While not a direct computational step, the efficiency of the learned representation directly impacts the final hardware requirements (especially for inference, where the network must perform useful computation quickly).

| Area of Improvement                                | Relevant Technical Concept (Chapter 2)                                                                                             | Room for Optimization / Possible Improvement                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architectural Constraints for Feature Learning** | The network failed to learn abstract, meaningful features like edges and patterns; instead, the weights look "almost random".      | Improvement involves introducing **structural constraints** (e.g., using Convolutional Neural Networks, which restrict connectivity based on local regions, leading to fewer parameters and more robust feature detection) to force the network to learn efficient, reusable features, minimizing the parameter count necessary for high performance. |
| **Sparsity and Parameter Pruning**                 | The network contains about 13,000 weights and biases.                                                                              | If the learned weights are "almost random," many may be near zero or irrelevant to performance. Optimization includes **pruning** (eliminating) weights or encouraging **sparsity** through specific training constraints, reducing the overall memory footprint and required computation during inference.                                           |
| **Calibration and Uncertainty**                    | The network is "utterly confident" even when presented with random noise, which stems from the tightly constrained training setup. | Minimizing hardware use requires high reliability. Optimization could involve updating the **cost function** or adding **regularization terms** that penalize overconfidence (or reward uncertainty) on ambiguous or non-data inputs, improving the quality of the network's output beyond simple classification accuracy.                            |

---

# 3. Backpropagation (part I)
https://www.youtube.com/watch?v=Ilg3gGewQ5U
## Summary
Backpropagation is an algorithm that efficiently computes the gradient of this cost function with respect to **every parameter** in the network: $$\nabla C = \left[ \frac{\partial C}{\partial w_1}, \frac{\partial C}{\partial w_2}, …, \frac{\partial C}{\partial b_1}, … \right]$$
This gradient specifies how every weight and bias should be changed to achieve the **most rapid decrease** in the cost (the measure of network "lousiness").

The key technical concepts presented are:

1. **The Goal of the Gradient:** The magnitude of each component of the negative gradient tells you the **sensitivity** of the cost function to that specific weight or bias. This dictates which adjustments offer the "most bang for your buck".

2. **Working Backward from Error:** Backpropagation begins with a single training example (e.g., an image of a '2') and starts at the output layer. It determines the **desired change** (or nudge) for each output activation, where the size of the nudge is proportional to how far the current activation is from its target value.

3. **Propagation of Influence to Weights and Biases:** The desired change in an activation is translated into desired changes for the weights and biases in the preceding layer.

	- **Weight Adjustments:** Weights connecting to neurons in the preceding layer that are already **brighter** (more active) have a stronger influence on the final cost. Therefore, these weights receive a proportionally larger adjustment (strengthening of connections). This concept loosely aligns with Hebbian theory: "neurons that fire together wire together".

	- **Bias Adjustments:** Changes to the bias also contribute to the increase or decrease of the next neuron's activation.

4. **Aggregation of Desires (The Backward Step):** The desired changes for the activations of a given layer (L-1) are determined by summing the desires of **all** subsequent neurons in layer (L) that connect to them. This summation, weighted by the corresponding connections, gives a composite list of nudges desired for the layer's activations. This process is repeated recursively, moving backward through the network, hence the name "backpropagation".

5. **Averaging and Stochastic Gradient Descent (SGD):**

	- The true negative gradient requires calculating and **averaging** the desired nudges across _all_ tens of thousands of training examples.

	- For computational efficiency, **SGD** is commonly employed: the training data is divided into **mini-batches** (e.g., 100 examples). The network computes the gradient step based on this small subset, resulting in a significant computational speedup, though the path is less efficient ("drunk man stumbling aimlessly down a hill").

## Remarks

- because the cost function involves averaging a certain cost per example over all the training exemples, the way we adjust the weights ans the biases for a single gradient step also depends on every single exemple (but trick computing to avoid doing avery single exemple on every single step) !!

- what can be change on the activation of one neuron ? 
	- the **bias**
	- the **weights** have themselves already different effects weights -- (hebbian theory)
	  *in proportion to the corresponding activations*
	  the biggest increases to weights, the biggest strengthening of connections happens between the neurons that are the most active and the one we wish to become more active. 
	- change the **activation** from the previous layer
	  *in proportion to the corresponding weights*

- we have to change all layers all at same -> *sum of changes* per neurons (list of nudges that you want to happen to that last layer)
- required to do this fo every training exemple -> averages changes over all training data = the negative gradient of the cost function (propertional to it) ( would it make sense weight the trainings based on their accuracy generale ??)
- (stochastic gradient descent)

## Optimization areas

 primary hardware optimization challenge lies in managing the high volume of parallel gradient calculation and subsequent aggregation. The reliance on averaging the influence of training examples (mini-batches) and the non-uniform sensitivity of parameters present key avenues for innovation.

### Gradient Sparsification and Dynamic Precision (Memory Bandwidth & Storage Consumption)

**Technical Rationale:** Backpropagation involves computing the negative gradient vector, which dictates nudges for every weight and bias. The sources indicate that certain weight adjustments provide significantly "more bang for your buck" (i.e., higher sensitivity) than others. Transmitting and storing full-precision, dense gradients for all $\approx 13,000$ parameters (in the example network) or billions (in large models) is a major memory bandwidth and energy bottleneck, especially during distributed training synchronization.

**Improvement Axis:** **Deploy adaptive, sensitivity-driven sparse gradient communication layers.**

- **Mechanism:** Instead of transmitting the dense gradient vector $\nabla C$ for the mini-batch, specialized on-chip hardware should dynamically calculate the relative magnitude of the partial derivatives $\partial C / \partial w$ for all weights and biases. We should focus on establishing a dynamic threshold $\tau$ (a learned parameter) for gradient magnitude.

- **Hardware Implementation:** Integrate a dedicated **Gradient Thresholding and Quantization (GTQ) Unit** in the memory access path. This unit would enforce:

    1. **Sparsity:** Only transmit gradient values $g$ where $|g| > \tau$. This leverages the concept that many weights might be less important for a given step.

    2. **Precision Adaptation:** Use ultra-low precision formats (e.g., 4-bit fixed-point) for gradients that are _just_ above $\tau$, while reserving higher precision (e.g., 16-bit float) only for the top $K$ most sensitive gradient components (the "bang for your buck" components). This minimizes the data footprint required for mini-batch averaging, dramatically cutting down on energy consumed in data movement.

### In-Situ Mini-Batch Reduction (Throughput & Latency)

**Technical Rationale:** SGD requires iterating backpropagation across a mini-batch and then averaging the resulting desired changes (nudges). This averaging step usually introduces synchronization latency, especially when the mini-batch is spread across parallel hardware units (GPUs/TPUs). The "drunk man stumbling" analogy highlights the trade-off between speed and accuracy.

**Improvement Axis:** **Implement hyper-optimized, low-latency, on-chip gradient accumulators for instantaneous mini-batch aggregation.**

- **Mechanism:** Backpropagation calculates the nudges from each training example sequentially or in parallel. We must eliminate the latency inherent in waiting for all components to finish before starting the aggregation/averaging step.

- **Hardware Implementation:** Design **Asynchronous Gradient Reduction Trees (AGRTs)**—dedicated, non-blocking hardware accumulation units integrated directly into the processing pipeline (e.g., within the Layer-L-to-L-1 boundary). As soon as the gradient components for a single example within the mini-batch are computed and transmitted backwards, the AGRT immediately begins adding them to the running average for that batch.

- **Benefits:** By performing the weighted summation/averaging _in-situ_ and continuously (parallelized across the mini-batch duration), we maximize utilization, enable higher effective batch sizes (improving gradient stability), and reduce the total cycle count per SGD step.

### Weight-Activation Co-location (Memory Access & Consumption)

**Technical Rationale:** The core mechanics involve calculating the required adjustment to a weight, which depends on how strong the previous neuron's activation was ($\propto a^{(L-1)}$). This requires simultaneous access to both the weight parameter ($W$) and the activation state ($A$) during the backward pass.

**Improvement Axis:** **Architect specialized register files designed for synergistic weight and activation state storage during the backward pass.**

- **Mechanism:** Maximize the temporal and spatial locality of the data needed for the calculation of the derivative of the weighted sum $\frac{\partial z^{(L)}}{\partial w^{(L)}}$, which is necessary during the backward pass.

- **Hardware Implementation:** Develop **Activation-Weighted Update (AWU) Register Caches**. These caches are specifically structured to store the weights $W$ and the corresponding input activations $A^{(L-1)}$ (which are needed for the next layer's gradient calculation, $\frac{\partial z^{(L)}}{\partial w^{(L)}} = a^{(L-1)}$) in adjacent, low-latency memory blocks. This ensures that the two critical numbers required for determining the magnitude of the weight adjustment are fetched concurrently, drastically reducing memory latency and power consumption associated with repeated data fetches during the intensive backpropagation phase.
---
# 4. Backpropagation (part II)
https://www.youtube.com/watch?v=tIeHLnjs5U8&t=1s
## Summary
 ![[Pasted image 20251007125042.png]]

The main objective is to understand the sensitivity of the cost function ($C$) to model parameters (weights, $w$, and biases, $b$) to determine adjustments that lead to the most efficient decrease in cost.

Core Concepts and Mechanisms:

1. **Network Setup (Simple Case):** The explanation begins with an extremely simple network where each layer has a single neuron.

	- **Activation Notation:** The activation of a neuron in layer $L$ is denoted $a^{(L)}$.
	
	- **Weighted Sum (Pre-activation):** The input to the non-linear function is the weighted sum, , defined as $z^{(L)} = w^{(L)} \cdot a^{(L-1)} + b^{(L)}$
	
	- **Activation Function:** The activation  is computed by passing  through a special non-linear function, such as the sigmoid or ReLU.
	
	- **Cost Function:** For a single training example with desired output $y$, the cost $C_0$ is defined as $(a^{(L)} - y)^2$.

2. **The Mechanism of the Chain Rule:** The sensitivity of the cost function $C$ to a small change in a weight $w^{(L)}$ (the derivative $\partial C / \partial w^{(L)}$) is calculated by breaking down the influence through a sequence of steps: $w^{(L)}$ influences $z^{(L)}$, which influences $a^{(L)}$, which finally influences $C$. The calculation is defined by the **Chain Rule**: $$\frac{\partial C}{\partial w^{(L)}} = \frac{\partial C}{\partial a^{(L)}} \cdot \frac{\partial a^{(L)}}{\partial z^{(L)}} \cdot \frac{\partial z^{(L)}}{\partial w^{(L)}}$$
3. **Calculation of Derivative Terms (Single Neuron Case):** The chapter computes the specific derivatives required for the Chain Rule:

    ◦ **Sensitivity to Activation ($\partial C / \partial a^{(L)}$):** This works out to **$2(a^{(L)} - y)$**. This value's magnitude is proportional to the difference between the network's actual output and the desired output, indicating that slight parameter changes have a large impact if the current output is far from the target.

    ◦ **Derivative of the Non-linearity ($\partial a^{(L)} / \partial z^{(L)}$):** This term is simply the **derivative of the chosen sigmoid or nonlinearity function**.

    ◦ **Sensitivity of Weighted Sum to Weight ($\partial z^{(L)} / \partial w^{(L)}$):** This term comes out to be **$a^{(L-1)}$** (the activation of the previous neuron). This result reinforces the idea that the influence of nudging a weight depends on how strong the previous neuron's activation is—a concept related to Hebbian theory ("neurons that fire together wire together").

4. **Sensitivity to Bias and Backward Propagation:**

    ◦ **Sensitivity to Bias ($\partial C / \partial b^{(L)}$):** This is calculated similarly, substituting $\partial z / \partial w$ with $\partial z / \partial b$. That derivative comes out to **1**.

    ◦ **Propagating Sensitivity:** To iterate the process backward, the sensitivity of the cost function to the previous layer's activation ($a^{(L-1)}$) is needed. The initial derivative term $\partial z / \partial a^{(L-1)}$ comes out to be the weight **$w^{(L)}$**. This result allows the cost sensitivity to be propagated backwards through the network to calculate derivatives for previous weights and biases.

5. **Generalizing to Multiple Neurons per Layer:** When expanding the network to include multiple neurons per layer, the core equations remain essentially the same. However, the cost function $C$ becomes a sum over the squares of differences for all final layer neurons $j$: $\sum (a^{(L)}_j - y_j)^2$. The key technical change is that a neuron in layer $L-1$ (indexed $k$) influences the cost function through **multiple different paths** (via every connected neuron $j$ in layer $L$). Therefore, the sensitivity of the cost function to a previous activation $\partial C / \partial a^{(L-1)}_k$ requires **adding up the contributions** (derivatives) from all these paths. Once this multi-path summation is calculated for $a^{(L-1)}$, the process repeats backward.
## Remarks 

## Optimization area

### Deploy specialized, low-rank approximation units for non-linearity derivative calculations.

**Technical Rationale:** The computation of the gradient requires the derivative of the activation function ($\partial a^{(L)} / \partial z^{(L)}$) for every neuron in every layer. While functions like ReLU simplify this (derivative is 0 or 1), common non-linearities (like the traditional sigmoid mentioned in the context of the weighted sum calculation or its complex variants) require computationally expensive floating-point operations.

**Mechanism for Optimization:** Instead of standard floating-point ALUs for these derivatives, which contribute to computational latency:

- We should integrate specialized hardware acceleration blocks optimized for approximation. These blocks could use polynomial approximations or dedicated look-up tables (LUTs) pre-populated with highly accurate, fixed-point representations of the derivative curves (e.g., $\sigma'(z)$ or $\text{GELU}'(z)$ derivatives) across the relevant input range ($z^{(L)}$).

- This approach minimizes computational cycles and power consumption related to the complex mathematical components of the second term of the Chain Rule, ensuring high-speed parallelism for a step required by _all_ neurons during the backward pass.

### Architect concurrent summation trees for high-bandwidth gradient aggregation.

**Technical Rationale:** The shift from a single-neuron layer to a multi-neuron layer introduces the requirement to sum the cost sensitivity contributions across all output paths leading back to a specific activation $a^{(L-1)}_k$. This necessary aggregation of error signals (the core of the matrix-vector transpose operation in the backward pass) is a fundamental computational bottleneck when maximizing layer parallelism.

**Mechanism for Optimization:** The processor architecture must explicitly address the fan-in summation described in the multi-neuron calculation:

- We must implement dedicated, on-chip hierarchical aggregation units (summation trees) tied directly to the weight memory blocks. These units will be designed to perform highly parallel reduction sums for calculating $\partial C / \partial a^{(L-1)}_k$.

- Crucially, this design must utilize **ultra-wide, high-bandwidth internal interconnects** optimized solely for the concurrent movement and accumulation of the calculated downstream gradient components ($\partial C / \partial a^{(L)}_j$) weighted by $w^{(L)}_{jk}$. This minimizes the latency penalty associated with aggregating signals that traverse multiple computation paths, speeding up the recursive propagation of the gradient backwards through the network.
---
# 5. Transformers
https://www.youtube.com/watch?v=wjZofJX0v4M
## Summary
Transformer architecture, the core technology underlying modern LLMs like GPT. The network is fundamentally designed to take a piece of text and predict the probability distribution over what token or word comes next.

### Predict, Sample, Repeat
The capability to generate long sequences of text is achieved by iteratively running the model: predicting the next word, randomly sampling from the output distribution, appending the sample to the input text, and repeating the process. This mechanism is responsible for the word-by-word output seen in chatbots like ChatGPT.

### Inside a Transformer
The data flow within the transformer involves repeated alternation between two main types of operations:

1. **Attention Block:** This operation allows the high-dimensional vectors associated with the input tokens to "talk to each other". Its purpose is to pass and exchange information, enabling the refinement of a token's meaning based on its surrounding context (e.g., resolving ambiguity like the word "model").

2. **Multi-Layer Perceptron (MLP) / Feed-Forward Layer:** In contrast to the attention block, vectors flow through the MLP block in parallel and do not interact with each other during this step. This block is conceptualized as asking a long list of questions about each vector and updating them based on the answers.

The fundamental computations within both blocks rely on a large volume of **matrix multiplications**. The essential meaning of the entire input passage is ultimately encoded into the **very last vector** in the sequence, which is then used to generate the final prediction.

### The Premise of Deep Learning 
The transformer architecture adheres to the core principles of deep learning, where a flexible structure with numerous **tunable parameters** (weights and biases) is set up and then refined using massive amounts of training data.

- **Data Representation:** All input data must be formatted as **arrays of real numbers** (tensors).

- **Weighted Sums/Matrix Products:** Model parameters (weights) only interact with the data through **weighted sums**, which are conveniently packaged and computed as **matrix-vector products**.

- **Scale:** GPT-3 illustrates this scale, featuring 175 billion parameters organized into approximately 28,000 distinct matrices.

### Word Embeddings
The initial step in processing text is transforming tokens into high-dimensional vectors, known as **embeddings**.

- **Mechanism:** This transformation is governed by the **Embedding Matrix ($W_E$)**. For a vocabulary size of 50,257 tokens (in GPT-3), this matrix contains a column for every token, defining its initial vector.

- **Dimensionality and Meaning:** These vectors operate in a high-dimensional space (12,288 dimensions for GPT-3). Directions within this space often correspond to **semantic meaning** (e.g., gender differences, or relations between concepts like countries and leaders).

- **Dot Products:** The **dot product** is a crucial mechanism for measuring how well two vectors **align**. Positive dot products indicate similar directions, zero indicates perpendicularity, and negative indicates opposite directions. This operation, being a weighted sum, is efficient for computation.

### Embeddings Beyond Words 
Initial embeddings only encode the meaning of the individual word, but the network's goal is to enable these vectors to **soak up rich contextual meaning**. Embeddings must also encode the **position** of the word. The transformer processes a fixed number of vectors at a time, defined by its **context size** (2048 for GPT-3).

### Unembedding
At the final stage, the context-rich meaning encoded in the last vector of the sequence is converted into a prediction distribution.

- **Mechanism: ** This uses the **Unembedding Matrix ($W_U$)**. This matrix performs a multiplication on the last embedding vector, mapping its high dimension (12,288) to a list of raw values corresponding to every token in the vocabulary (over 50,000).

- **Parameters:** $W_U$ is a large weight matrix, similar in size to $W_E$, adding about 617 million parameters to the network.

- **Logits:** The raw, unnormalized outputs of this final matrix multiplication are referred to as **logits**.
### Softmax with Temperature (22:22 - 26:03)
The logits must be transformed into a valid probability distribution where all values range from 0 to 1 and sum to 1.

- **Softmax Function:** This function achieves normalization by first raising $e$ to the power of each logit (ensuring positive values) and then dividing each term by the sum of all resulting positive terms. It ensures that the largest input values end up closest to 1 in the output distribution.

- **Temperature (T):** A constant $T$ (temperature) can be introduced into the denominator of the exponents in the softmax function.

	- **High T:** Increases the weight given to lower values, resulting in a **more uniform distribution** (more randomness/less predictable output).
	
	- **Low T:** Causes the bigger values to dominate more aggressively, leading to a **more predictable output**



---
prediction on next piece of word based on probability distribution. 
difference GPT2 and GPT3. -> recursive prediction word appending on gpt2 a sentence generation and re-feeding this new sentece + generative word etc it does not make sense. while with GPT3 it does make sense in the story. (repeated generation )

- embedding 
- attention 
- mlps
- unembedding

1 tokenization of a sentence (broken words) into vectors
2 vectorization 
3 attention (meaning of the words and how to modify that meaning )
4 multilayer perceptron
5  


deep learning - class of models - scale well but with a specific format only  
- inputs must be an array of numebr (high dim arrays = tensors)
- progressively tranformed the tensors in smallers arrays 
![[Pasted image 20251007161959.png]]

Careful : 
weights of the model -> learned during the training 
encodes whatever specific input is fed into the model for a given run. 

tokenization / embedding 
- not broken completely into words (which kind of tokenization)
- pre-defined vocab. and the embedding matrix has column for each word !
- embedding space for each word 
- embedding matrice is learnt on 
- ![[Pasted image 20251007174223.png]]
- concept of projection the words.
- also when embedding have the same meaning, semantic meaning carried in vector length . to find difference between 2 vectors (or not) you can also compute ) the difference within these two vectors. (eg. diff woman and man is almost the same a queen and king because one direction in the space encodes gender information ) --> Optimize embeddings dimension for knowledge systems ??
- the vector also encode position and has the capacitiy to soak in context -> vector sum. meaning comes from context (!!)
- extend of context -> context size limits how much text a
- prediction maps last word (last vector of the context)  but there are the other words in the context matrice but more efficient to predict with the last matrice only. 

softmax
 high temperature gives more weight to the lower values, while when T-> 0, all of the weight goes to that maximum value. 
 logits are the raw vector from the last word before prediction multiplied by the umbedding matrix and the results is a vector called logits.  

## Remarks
- use less likely words along the way at random - shouldn't be the case since we aim on having a deterministic tool
- transformer was introduced in 2017 by google via the paper : attention is all you need
- (eg. diff woman and man is almost the same a queen and king because one direction in the space encodes gender information ) --> Optimize embeddings dimension for knowledge systems ?? --> Closest neighboor theory
- dot product of vectors ables to define how much they are aligned ! (positive if the vectors point in similar directions)
- 

## Optimization areas
The core technical challenge presented by the transformer architecture, as defined in Chapter 5, is the massive scale of parameters and computation dominated by **matrix multiplication** across multiple layers. The GPT-3 scale (175 billion parameters total, $12,288$ embedding dimension, 2048 context size, 96 layers) serves as a critical benchmark for identifying hardware bottlenecks in memory, energy consumption, and compute efficiency.

Improvement Axis 1: Ultra-Low Bit Width Matrix Weights (Memory & Energy Consumption)

The parameters of the Embedding ($W_E$) and Unembedding ($W_U$) matrices alone account for over 1.2 billion parameters. The majority of the 175 billion parameters reside in various other matrices throughout the network. Storing and accessing these large matrices consumes enormous memory and energy.

### **Optimization Proposal: Heterogeneous Precision Engine**

1. **Extreme Quantization of Static Weights:** Implement an aggressive low-bit quantization strategy (e.g., **2-bit or 1-bit binary precision**) specifically for the static weight matrices ($W_E, W_U$, and primary Feed-Forward Network matrices) during inference. This dramatically cuts the memory footprint and the bandwidth required to fetch weights from off-chip DRAM.

2. **In-Memory Compute (IMC) for Low-Bit Operations:** Design specialized, custom ASIC/FPGA hardware capable of performing matrix multiplications directly within the low-power memory structures (like resistive RAM or specialized SRAM arrays). These IMC units would be optimized to handle low-bit integer or binary arithmetic, significantly **reducing the energy per operation** compared to standard floating-point ALUs required by the weighted sums. This addresses the energy cost of the "giant pile of matrix multiplications".

Improvement Axis 2: Context Scaling Acceleration (Context Memory Bandwidth)

The context size is a non-trivial bottleneck. As models continue to scale, the need to handle a growing sequence of high-dimensional embedding vectors (e.g., $2048$ tokens $\times$ $12,288$ dimensions for GPT-3) places enormous strain on data transfer rates during repeated flow through 96 layers.

### **Optimization Proposal: Context-Aware Tiled Processing (CATP)**

1. **On-Chip Context Cache:** Allocate dedicated, ultra-high-speed, local memory banks (e.g., $10^5$ registers or equivalent specialized SRAM) integrated directly within the transformer block to store the full, actively processed sequence of embedding vectors. This minimizes the energy and latency costs associated with continuously fetching and storing these large vectors from slower, off-chip memory between attention and MLP steps.

2. **Parallel Tiling for Sequence Operations:** Design processing elements (PEs) that can efficiently tile and parallelize the matrix-vector products necessary for processing the entire context sequence. Given that operations like the MLP block act on all tokens in parallel, the hardware should be structured to process contiguous chunks of the context sequence simultaneously, maximizing throughput and leveraging the parallelizability noted as a major advantage of the transformer architecture.

Improvement Axis 3: Non-Linearity Acceleration and Softmax Efficiency (Compute Latency)

While matrix multiplication is the volume bottleneck, non-linear functions like Softmax (used for final prediction and internally within attention) require specialized computation, particularly exponentiation. The Softmax must operate efficiently over the entire vocabulary (50,000+ terms).

**Optimization Proposal: Softmax and Low-T Distribution Sampler**

1. **Custom Softmax/Exp Co-processor:** Integrate a dedicated, highly optimized hardware block near the final Unembedding matrix ($W_U$) that handles the Softmax calculation. This co-processor could use optimized function approximation algorithms (like CORDIC or specialized lookup tables) instead of general-purpose floating-point units for the exponentiation step ($e^x$). This significantly reduces the latency and power associated with generating the probability distribution, especially critical during the auto-completion process where the model is run repeatedly.

2. **Hardware-Accelerated Temperature Sampling:** Since varying the temperature $T$ allows for control over the distribution's sharpness, the final sampling step should be accelerated. Design the Softmax output stage to seamlessly integrate with a hardware-based random number generator and sampler that efficiently draws a token from the normalized probability distribution. This ensures that the computational overhead of applying temperature (T) and subsequent sampling does not hinder the generation speed (throughput) of the model.

---
# 6. Attention in transformers


---
# 7. How might LLMs store facts



---
# A. LLMs explained briefly
A Large Language Model (LLM) is fundamentally defined as a **sophisticated mathematical function** designed to predict the word (or token) that comes next for any given piece of text. Its output is a **probability distribution** over all possible subsequent words.

When utilized as a chatbot, the LLM operates by **repeatedly predicting and sampling** from this distribution, appending the chosen word, and then feeding the growing text back into the system (autoregressive generation) to continue the output.

### Technical Architecture and Data Flow

The core technology behind modern LLMs (such as those where GPT is an acronym for Generative Pretrained **Transformer**) is the **transformer architecture**.

1. **Tokenization and Embedding:** The initial input text is broken down into small pieces called **tokens**. Each token is associated with a **high-dimensional vector**, referred to as its **embedding**. These embeddings are lists of continuous numbers, allowing the training process to work. In a high-dimensional space (e.g., 12,288 dimensions in GPT-3), directions within the space correspond to **semantic meaning**.

2. **Layered Processing:** The resulting sequence of vectors flows repeatedly through many iterations of two primary operation types, often involving matrix multiplications:
    - **Attention Block:** This unique operation allows the vectors to **"talk" to one another** and **refine the meaning they encode based on context**, performing these updates in **parallel**.
    
    - **Multi-Layer Perceptron (MLP) / Feed-Forward Network:** This block adds extra capacity to **store patterns** and knowledge learned during training. Crucially, during this step, the vectors **do not talk to each other** but flow through the same operation in parallel.

3. **Final Output:** After the vectors flow through many layers, the final prediction of the next word is determined by performing a specific function on the **last vector in the sequence**. This operation often involves an **Unembedding matrix** ($W_U$) and a normalization function called **softmax**, which converts a raw list of unnormalized outputs (logits) into a valid probability distribution where all values are between 0 and 1 and sum to 1.

### Scale and Training Mechanism

The functionality of the model is determined entirely by its **parameters** (weights). LLMs are characterized by their massive scale; for example, GPT-3 had **175 billion parameters**.

1. **Pre-training:** Parameters start at random. Training involves showing the model trillions of example passages and comparing its predicted next word with the true next word in the text. The goal is to adjust the parameters to minimize a **cost function**.

2. **Backpropagation:** The algorithm used to efficiently tweak the parameters is **backpropagation**. This process computes how each of the hundreds of billions of parameters needs to be adjusted to make the model slightly more likely to choose the correct next word (i.e., finding the negative gradient of the cost function).

3. **Hardware Optimization:** The staggering computational scale of training (estimated to take over 100 million years if performed sequentially at a rate of a billion operations per second) is managed through the use of **special computer chips (GPUs)** optimized for running **many operations in parallel**.

4. **Refinement:** After this initial large-scale **pre-training**, LLMs undergo further refinement using **reinforcement learning with human feedback** to improve helpfulness and address problematic predictions.
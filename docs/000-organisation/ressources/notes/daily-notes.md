## 30.09.2025

#Literature 
### Robin Burghardt MT
Optimizing RAG-Based Knowledge Mgmt. w/ fine-tuned quantized LLMs 
- knowledge mgmt. systems (kms)

---
## 01.10.2025
### [Developing an LLM: Building, Training, Finetuning](https://www.youtube.com/watch?v=kPGTx4wcm_w)

---
## 02.10.2025
### Talk with Fadhil - purpose of research - alignement 
→ How it helps synthetize

- output efficiency (how fast) 

- data synthesis (contextualization of data) -> model comparisons ? 
- knowledge application driven thinking 
- improve the knowledge transfer / snythetization process !!!! (To solve within the kms)

- what if it doesnt solve : ? (Current solution : quantization - prunning - finetunning - )

- t-t-t based (multi model is the end application tho)

---
## 08.10.2025
Calibration 
Better than accuracy ?

### Idea 01
Could we delete word from the data such as determinants to reduce the size of the data ? Keep accuracy ? 

---
# 09.10.2025
### "blackboxes" when integrating llms
- encoders (byte pair encoding)
- loaders (sampling w/ sliding window ?)
  currently used from pytorch dataset classes (DataLoader)
  -> if large dataset there are better ways to do it. HOW (memory issue) (video 2 = 59:20)
- embedding layers (vs linear layers)
- manual_seed() ??

# 11.10.2025
## Email from Prof. Chou 


## Remark about ineficiencies in tensors size
1. We can extend a tensor size but it's highly innefficient !so the size of the tensors must be defined
2. do not code softmax function like below since it's not stable numerically. ! 
```
def softmax_naive(x):
	return torch.exp(x) / torch.exp(x).sum(dim=0)
attn_weights_2_naive = softmax_naive(attn_scores_2)

print("Attention weights:", attn_weights_2_naive)
print("Sum:", attn_weights_2_naive.sum())
```
(!!) use the PyTorch implementation of softmax instead, which has been highly optimized for performance:


# 21.10.25
## meeting with Olivier 
- optic of the thesis 
	- **research** -> study and global evaluation of the klm 
		e.g does it make more sense having a wiki than paying for rag host etc ?
		global evalution -> 
		- Why is it better than a simple gpt ?
		- rag components ? vectorization ?
		- global infra costs ?
		- ...
	- **engineering**  -> solution to improve the computational ressources
		- evaluated on metrics and comparison

- llms is not point of the work. the work relies on how the architecture with the rag is improved and stacked. 


## meeting with Fadhil and Ishaq

Global overview of the architecture : 
- Models 
	- embedding
	- llm -> private model usable with an api key that we host
	- 

![[Pasted image 20251022034316.png]]

Rag - wiki +

Ou recherche 

Evaluer les besoins au milieu possible -- quelles sont les composants du rang - vector

---


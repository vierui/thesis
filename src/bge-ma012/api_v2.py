from fastapi import FastAPI, HTTPException, Body
from FlagEmbedding import BGEM3FlagModel
import torch
import numpy as np
from typing import List, Dict, Optional
from pydantic import BaseModel

# Model configuration
MODEL_PATH = "BAAI/bge-m3"  # BGE-M3 model path
device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize BGE-M3 model
embedding_model = BGEM3FlagModel(
    MODEL_PATH,
    use_fp16=True if device == "cuda" else False,
    device=device
)

app = FastAPI(title="BGE-M3 Embedding Service", version="1.0.0")

class EmbedRequest(BaseModel):
    content: str
    model: Optional[str] = "bge-m3"
    return_dense: Optional[bool] = True
    return_sparse: Optional[bool] = True
    return_colbert_vecs: Optional[bool] = True

def document_to_embeddings_bge_m3(content: str, return_dense: bool = True, 
                                 return_sparse: bool = True, 
                                 return_colbert_vecs: bool = True) -> Dict:
    """
    Use BGE-M3 model that natively supports dense, sparse, and ColBERT embeddings
    """
    try:
        # BGE-M3 encode method returns dict with different embedding types
        embeddings = embedding_model.encode(
            content,
            return_dense=return_dense,
            return_sparse=return_sparse,
            return_colbert_vecs=return_colbert_vecs
        )
        
        result = {}
        
        if return_dense and 'dense_vecs' in embeddings:
            dense_vecs = embeddings['dense_vecs']
            if isinstance(dense_vecs, np.ndarray):
                result["dense_embeddings"] = dense_vecs.tolist()
            else:
                result["dense_embeddings"] = dense_vecs
            
        if return_sparse and 'lexical_weights' in embeddings:
            # Convert sparse embeddings to Milvus-compatible format
            # Use INTEGER keys for compatibility with Milvus
            sparse_dict = {}
            lexical_weights = embeddings['lexical_weights']
            
            # Handle different possible formats of lexical_weights
            if isinstance(lexical_weights, (list, tuple, np.ndarray)):
                for i, weight in enumerate(lexical_weights):
                    try:
                        # Convert weight to float to handle string/numeric issues
                        weight_float = float(weight)
                        # Only include positive weights (Milvus requirement)
                        if weight_float > 0:
                            sparse_dict[i] = weight_float  # Use integer key directly
                    except (ValueError, TypeError) as e:
                        print(f"Warning: Skipping invalid weight at index {i}: {weight} - {e}")
                        continue
            elif isinstance(lexical_weights, dict):
                for key, weight in lexical_weights.items():
                    try:
                        # Convert both key and weight to proper types
                        key_int = int(key) if isinstance(key, str) else key
                        weight_float = float(weight)
                        if weight_float > 0:
                            sparse_dict[key_int] = weight_float
                    except (ValueError, TypeError) as e:
                        print(f"Warning: Skipping invalid sparse entry {key}:{weight} - {e}")
                        continue
            else:
                print(f"Warning: Unexpected lexical_weights format: {type(lexical_weights)}")
                
            result["sparse_embeddings"] = sparse_dict
            
        if return_colbert_vecs and 'colbert_vecs' in embeddings:
            colbert_vecs = embeddings['colbert_vecs']
            if isinstance(colbert_vecs, np.ndarray):
                result["colbert_embeddings"] = colbert_vecs.tolist()
            else:
                result["colbert_embeddings"] = colbert_vecs
            
        return result
        
    except Exception as e:
        print(f"Error in document_to_embeddings_bge_m3: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Failed to generate embeddings: {str(e)}")

@app.post("/embed")
async def embed_text(request: EmbedRequest):
    """
    Generate embeddings using BGE-M3 model
    Supports dense, sparse, and ColBERT embeddings
    """
    try:
        if not request.content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        # Validate model parameter
        if request.model and request.model != "bge-m3":
            raise HTTPException(status_code=400, detail="Only 'bge-m3' model is supported")
            
        # Generate embeddings
        embeddings = document_to_embeddings_bge_m3(
            content=request.content,
            return_dense=request.return_dense,
            return_sparse=request.return_sparse,
            return_colbert_vecs=request.return_colbert_vecs
        )
        
        return embeddings
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in embed_text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Backward compatibility endpoint
@app.post("/embed/simple")
async def embed_text_simple(content: str = Body(..., embed=True)):
    """
    Simple endpoint for backward compatibility - returns only dense embeddings
    """
    try:
        if not content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
            
        embeddings = document_to_embeddings_bge_m3(content, return_dense=True)
        return {"embeddings": embeddings.get("dense_embeddings", [])}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model": "bge-m3", "device": device}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "BGE-M3 Embedding Service",
        "endpoints": {
            "/embed": "Main embedding endpoint with full BGE-M3 features",
            "/embed/simple": "Simple endpoint for backward compatibility",
            "/health": "Health check",
            "/docs": "API documentation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=1234) 

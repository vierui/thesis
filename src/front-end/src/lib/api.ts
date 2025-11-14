// API service functions for the notebook interface
import { useAuth } from '@clerk/nextjs'

// Types
export interface ChatBox {
  id: number
  name: string
  updatedAt: Date
}

export interface ChatBoxGroup {
  [key: string]: ChatBox[]
}

export interface Document {
  id: string
  title: string
  topic: string
  original_name: string
  file_size_formatted: string
  public: boolean
  createdAt: string
  tag: string
}

export interface Message {
  id: number
  request: string
  response: string
  thinking?: string
  userId: string
  chatBoxId: number
  createdAt: Date
  responseTime?: number
  liked?: boolean
  disliked?: boolean
  rating?: number
}

export interface UploadDocumentData {
  title: string
  topic: string
  file: File
}

export interface DocumentMetadata {
  body: {
    message: string
    payload: {
      title: string
      topics: string[]
      confidence: {
        title: number
        topics: number
      }
    }
  }
}

export interface CreateChatBoxData {
  name: string
}

export interface CreateMessageData {
  request: string
  userId: string
  chatBoxId: string
  response: string
  responseTime?: number
}

export interface GeneratePodcastData {
  question: string
  user_id: string
  speaker_voices?: {
    HOST_A?: any
    HOST_B?: any
  }
}

export interface PodcastResponse {
  question: string
  script: string
  segments: Array<{
    speaker: string
    text: string
    audio_path: string
    segment_index: number
  }>
  final_audio_path: string
  user_id: string
  sources: any[]
  segment_count: number
}

// API Functions
export class NotebookAPI {
  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  // ChatBox API
  static async getChatBoxes(): Promise<{ message: string; data: ChatBoxGroup }> {
    const response = await fetch(`/api/chatbox`)
    return this.handleResponse(response)
  }

  static async createChatBox(data: CreateChatBoxData): Promise<{ message: string; id: string }> {
    const formData = new FormData()
    formData.append('name', data.name)

    const response = await fetch('/api/chatbox', {
      method: 'POST',
      body: formData,
    })
    return this.handleResponse(response)
  }

  static async updateChatBox(id: number, name: string): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append('id', id.toString())
    formData.append('name', name)

    const response = await fetch('/api/chatbox', {
      method: 'PUT',
      body: formData,
    })
    return this.handleResponse(response)
  }

  static async deleteChatBox(id: number): Promise<{ message: string }> {
    const response = await fetch(`/api/chatbox?id=${id}`, {
      method: 'DELETE',
    })
    return this.handleResponse(response)
  }

  // Document API
  static async extractDocumentMetadata(file: File): Promise<DocumentMetadata> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/document/', {
      method: 'POST',
      body: formData,
      headers: {
        'action': 'extract-title',
      }
    })
    
    return this.handleResponse(response)
  }

  static async uploadDocument(data: UploadDocumentData): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('title', data.title)
    formData.append('topic', data.topic)

    const response = await fetch('/api/document', {
      method: 'POST',
      body: formData,
    })
    return this.handleResponse(response)
  }

  static async downloadDocument(id: string, tag: string): Promise<Blob> {
    const response = await fetch(`/api/document?id=${id}&tag=${tag}`)
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`)
    }
    return response.blob()
  }

  static async updateDocument(
    id: string,
    title: string,
    topic: string,
    isPublic: boolean
  ): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append('id', id)
    formData.append('title', title)
    formData.append('topic', topic)
    formData.append('public', isPublic.toString())

    const response = await fetch('/api/document', {
      method: 'PUT',
      body: formData,
    })
    return this.handleResponse(response)
  }

  static async deleteDocument(id: string): Promise<{ message: string }> {
    const response = await fetch(`/api/document?id=${id}`, {
      method: 'DELETE',
    })
    return this.handleResponse(response)
  }

  // Documents API (for listing)
  static async getDocuments(params?: {
    searchTerm?: string
    tag?: string[]
    page?: number
    n?: number
    userId?: string
  }): Promise<{ message: string; data: { list: Document[]; docCounts: number } }> {
    const searchParams = new URLSearchParams()
    
    if (params?.searchTerm) searchParams.append('searchTerm', params.searchTerm)
    if (params?.tag) params.tag.forEach(t => searchParams.append('tag', t))
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.n) searchParams.append('n', params.n.toString())
    if (params?.userId) searchParams.append('id', params.userId)

    const response = await fetch(`/api/documents?${searchParams.toString()}`)
    return this.handleResponse(response)
  }

  // Message API
  static async createMessage(data: CreateMessageData): Promise<{ message: string; id: number }> {
    const formData = new FormData()
    formData.append('request', data.request)
    formData.append('userId', data.userId)
    formData.append('chatBoxId', data.chatBoxId)
    formData.append('response', data.response)
    if (data.responseTime) formData.append('responseTime', data.responseTime.toString())

    const response = await fetch('/api/message', {
      method: 'POST',
      body: formData,
    })
    return this.handleResponse(response)
  }

  static async updateMessageFeedback(
    id: number,
    liked?: boolean,
    disliked?: boolean,
    rating?: number
  ): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append('id', id.toString())
    if (liked !== undefined) formData.append('liked', liked.toString())
    if (disliked !== undefined) formData.append('disliked', disliked.toString())
    if (rating !== undefined) formData.append('rating', rating.toString())

    const response = await fetch('/api/message', {
      method: 'PUT',
      body: formData,
    })
    return this.handleResponse(response)
  }

  // LLM Server Integration
  static async queryLLM(
    questions: string[],
    userId?: string,
    documents?: string[],
    hyde: boolean = true,
    reranking: boolean = true,
    selectedModel: string = "Llama 3 8B - 4 bit quantization"
  ): Promise<any> {
    // Use the internal API route instead of directly calling external LLM server
    const formData = new FormData()
    formData.append("question", questions[0]) // Take first question for now
    formData.append("conversation_history", JSON.stringify([]))
    formData.append("hyde", hyde.toString())
    formData.append("reranking", reranking.toString())
    formData.append("selected_model", selectedModel)

    const response = await fetch('/api/prompt', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`LLM query failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.message
  }

  // TTS/Podcast API
  static async generateConversationalPodcast(data: GeneratePodcastData): Promise<PodcastResponse> {
    const response = await fetch('/api/tts/podcast/conversational', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const result = await this.handleResponse(response)
    return result.payload
  }

  static async downloadAudio(filename: string): Promise<Blob> {
    const response = await fetch(`/api/tts/download?filename=${filename}`)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`)
    }
    return response.blob()
  }

  static async generateMindMap(
    collection_name: string,
    document_id: string,
    tag: string

  ): Promise<any> {
    const formData = new FormData()
    formData.append("collection_name", collection_name)
    formData.append("document_id", document_id)
    formData.append("tag", tag)

    const response = await fetch('/api/mind_map', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Mind map generation failed: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('Mind map response dari api.ts:', data)

    return data.message
  } 

  static async regenerateMindMap(
    question: string

  ): Promise<any> {
    const formData = new FormData()
    formData.append("question", question)

    const response = await fetch('/api/regenerate_mind_map', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Mind map regeneration failed: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('Regenerated mind map response dari api.ts:', data.message)

    return data.message
  }


}


// Custom hooks for API integration
export function useNotebookAPI() {
  const { userId } = useAuth()

  return {
    userId,
    api: NotebookAPI,
  }
} 
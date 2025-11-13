"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, FileText, X, MoreVertical, Upload, Loader2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Document, NotebookAPI } from '@/lib/api'

interface SourcesPanelProps {
  sources: Document[]
  selectedSources: string[]
  onSourceSelection: (sourceIds: string[]) => void
  onDocumentUpload: (file: File, title: string, topic: string) => void
  onDocumentDelete: (documentId: string) => void
  isLoading: boolean
}

export function SourcesPanel({
  sources,
  selectedSources,
  onSourceSelection,
  onDocumentUpload,
  onDocumentDelete,
  isLoading
}: SourcesPanelProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    topic: '',
    file: null as File | null,
  })
  const [suggestions, setSuggestions] = useState<{
    title: string | null
    topics: string[]
  }>({
    title: null,
    topics: []
  })
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null)

  const toggleSourceSelection = (id: string) => {
    const newSelected = selectedSources.includes(id)
      ? selectedSources.filter(sourceId => sourceId !== id)
      : [...selectedSources, id]
    onSourceSelection(newSelected)
  }

  const toggleAllSources = () => {
    if (selectedSources.length === sources.length) {
      onSourceSelection([])
    } else {
      onSourceSelection(sources.map(source => source.id))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadForm(prev => ({ ...prev, file: files[0] }))
      setUploadDialogOpen(true)
      // Extract metadata in the background
      extractMetadataFromFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, file }))
      setUploadDialogOpen(true)
      // Extract metadata in the background
      extractMetadataFromFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title || !uploadForm.topic) return

    try {
      await onDocumentUpload(uploadForm.file, uploadForm.title, uploadForm.topic)
      setUploadForm({ title: '', topic: '', file: null })
      setSuggestions({ title: null, topics: [] })
      setExtractionMessage(null)
      setUploadDialogOpen(false)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setUploadDialogOpen(open)
    if (!open) {
      // Clear suggestions when modal closes
      setSuggestions({ title: null, topics: [] })
      setExtractionMessage(null)
      setIsExtracting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || 'unknown'
  }

  const getFilenameWithoutExtension = (filename: string) => {
    return filename.substring(0, filename.lastIndexOf('.')) || filename
  }

  const extractMetadataFromFile = async (file: File) => {
    setIsExtracting(true)
    setExtractionMessage(null)
    setSuggestions({ title: null, topics: [] })

    // Check if it's a PDF file
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (isPdf) {
      // Try to extract metadata from PDF using API
      try {
        const result = await NotebookAPI.extractDocumentMetadata(file)
        console.log('Extraction result:', result)
        const { title, topics, confidence } = result.body.payload;

        // Check confidence scores
        const lowConfidence = confidence.title < 0.7 || confidence.topics < 0.7

        if (lowConfidence) {
          setExtractionMessage(
            `Auto-suggestions have low confidence (Title: ${Math.round(confidence.title * 100)}%, Topics: ${Math.round(confidence.topics * 100)}%). Please review carefully.`
          )
        }

        setSuggestions({
          title: title || null,
          topics: topics || []
        })
      } catch (error: any) {
        console.error('Metadata extraction failed:', error)
        // Fallback to filename-based suggestion
        setSuggestions({
          title: getFilenameWithoutExtension(file.name),
          topics: []
        })
        setExtractionMessage(
          'Could not extract metadata from PDF. Using filename as title suggestion.'
        )
      }
    } else {
      // For non-PDF files, use filename as title suggestion
      setSuggestions({
        title: getFilenameWithoutExtension(file.name),
        topics: []
      })
      setExtractionMessage(
        'Auto-suggestions for title and topic are only available for PDF files. Suggested title is based on filename.'
      )
    }

    setIsExtracting(false)
  }

  return (
    <div className="h-full flex flex-col dark:bg-gray-700 dark:border-gray-600 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 dark:hover:text-white">Sources</h2>
          <Dialog open={uploadDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-gray-600 dark:hover:bg-gray-500">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Add a new document to your knowledge base.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.md"
                  />
                  {uploadForm.file && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Selected: {uploadForm.file.name}
                    </p>
                  )}
                </div>

                {/* Extraction Status */}
                {isExtracting && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting metadata...</span>
                  </div>
                )}

                {/* Extraction Message */}
                {extractionMessage && !isExtracting && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      {extractionMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Title Suggestions */}
                {suggestions.title && !isExtracting && (
                  <div className="space-y-2">
                    <Label>Suggested Title</Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors px-3 py-1.5"
                        onClick={() => setUploadForm(prev => ({ ...prev, title: suggestions.title || '' }))}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {suggestions.title}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Click to use</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                  />
                </div>

                {/* Topic Suggestions */}
                {suggestions.topics.length > 0 && !isExtracting && (
                  <div className="space-y-2">
                    <Label>Suggested Topics</Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.topics.map((topic, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors px-3 py-1.5"
                          onClick={() => setUploadForm(prev => ({ ...prev, topic }))}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {topic}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Click a topic to use it</span>
                  </div>
                )}
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={uploadForm.topic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Enter document topic"
                  />
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={!uploadForm.file || !uploadForm.title || !uploadForm.topic}
                  className="w-full"
                >
                  Upload Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-200 dark:hover:text-white">
          <span>Select all sources</span>
          <Checkbox 
            checked={selectedSources.length === sources.length && sources.length > 0}
            onCheckedChange={toggleAllSources}
          />
        </div>
      </div>

      {/* Sources List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-200 dark:hover:text-white">No documents uploaded yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-200 dark:hover:text-white">Upload your first document to get started</p>
            </div>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedSources.includes(source.id)
                    ? 'border-blue-200 bg-blue-50 dark:bg-slate-800 dark:border-gray-600 dark:hover:border-gray-500' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={() => toggleSourceSelection(source.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <Badge variant="secondary" className="text-xs dark:bg-gray-600 dark:text-gray-200">
                          {getFileExtension(source.original_name).toUpperCase()}
                        </Badge>
                        {source.public && (
                          <Badge variant="outline" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 dark:text-gray-200 dark:hover:text-white">
                        {source.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1 dark:text-gray-200">
                        Topic: {source.topic}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-200">
                        <span>{source.file_size_formatted}</span>
                        <span>•</span>
                        <span>{new Date(source.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 dark:hover:bg-gray-600">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDocumentDelete(source.id)}>
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Upload Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2 dark:text-gray-200 dark:hover:text-white">
            Drag and drop files here, or click to browse
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setUploadDialogOpen(true)}
          >
            Choose files
          </Button>
          <p className="text-xs text-gray-500 mt-2 dark:text-gray-200 dark:hover:text-white">
            Supports PDF, DOC, TXT, and more
          </p>
        </div>
      </div>
    </div>
  )
} 
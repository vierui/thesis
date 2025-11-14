"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { SourcesPanel } from '@/components/notebook/SourcesPanel'
import { ChatPanel } from '@/components/notebook/ChatPanel'
import { StudioPanel } from '@/components/notebook/StudioPanel'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Play, Settings, Share, PanelLeftClose, PanelRightClose, Sun, Moon, SunMoon, ChevronLeft, Check } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { useNotebookAPI, Document } from '@/lib/api'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/useTheme'

interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  img_url: string
}

interface NotebookPageProps {
  user: User | null
  mode: string
  notebookId: string | null
  token: string | null
}

const NotebookPage = ({ user, mode, notebookId, token }: NotebookPageProps) => {
  const { api } = useNotebookAPI()
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const settingsRef = useRef<HTMLDivElement>(null);
  const [sources, setSources] = useState<Document[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [isLoadingSources, setIsLoadingSources] = useState(false)
  const [currentChatBoxId, setCurrentChatBoxId] = useState<string>(notebookId || '')

  const loadUserDocuments = useCallback(async () => {
  // Pindahin `if` guard ke dalem sini, lebih aman
  if (!user?.id) return; 
  
  try {
    setIsLoadingSources(true);
    const response = await api.getDocuments({ userId: user.id, page: 0, n: 100 });
    setSources(response.data?.list || []);
  } catch (error) {
    console.error('Failed to load documents:', error);
    toast.error('Failed to load your documents');
  } finally {
    setIsLoadingSources(false);
  }
}, [user?.id, setIsLoadingSources, setSources, api]);

  // Load user's documents when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserDocuments()
    }
  }, [loadUserDocuments, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsRef]);

  useEffect(() => {
    if (mode === 'session' && notebookId) {
      setCurrentChatBoxId(notebookId)
    } else if (mode === 'document' && notebookId) {
      // Auto-select a specific document if navigating to /notebook/document/123
      setSelectedSources([notebookId])
    }
  }, [mode, notebookId, setCurrentChatBoxId, setSelectedSources])

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    )
  }

  // Handle different modes




  const handleSourceSelection = (sourceIds: string[]) => {
    setSelectedSources(sourceIds)
  }

  const handleDocumentUpload = async (file: File, title: string, topic: string) => {
    if (!user?.id) {
      toast.error('Please sign in to upload documents')
      return
    }

    try {
      await api.uploadDocument({
        file,
        title,
        topic,
      })
      toast.success('Document uploaded successfully')
      // Reload documents
      await loadUserDocuments()
    } catch (error) {
      console.error('Failed to upload document:', error)
      toast.error('Failed to upload document')
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await api.deleteDocument(documentId)
      toast.success('Document deleted successfully')
      // Remove from sources and selected sources
      setSources(prev => prev.filter(doc => doc.id !== documentId))
      setSelectedSources(prev => prev.filter(id => id !== documentId))
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Citi Knowledge Management System
            </h1>
            <Button
              onClick={() => window.location.href = "/prompt"}
              className="h-fit p-2 rounded-xl border bg-white text-gray-700 hover:bg-white shadow-none hover:shadow-blue-200 hover:shadow dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Go to Prompt!
            </Button>
            {mode !== 'default' && (
              <span className="text-sm text-gray-500 capitalize">
                • {mode} {notebookId ? `#${notebookId}` : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
          >
            <PanelRightClose className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white">
            <Share className="w-4 h-4" />
          </Button>
          <div className="relative" ref={settingsRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick= {() => setSettingsOpen((prev) => !prev)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:bg-gray-800">
                {/* Item "Theme" dengan submenu, event hover diterapkan di sini */}
                <div
                  onMouseEnter={() => setIsThemeSubmenuOpen(true)}
                  onMouseLeave={() => setIsThemeSubmenuOpen(false)}
                >
                  {/* Tombol ini tidak lagi memiliki onClick */}
                  <button
                    className="w-full flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-500 dark:text-gray-200 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <SunMoon className="w-4 h-4" />
                      <span>Theme</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 transition-transform ${isThemeSubmenuOpen ? '-rotate-90' : ''}`} />
                  </button>

                  {/* Submenu yang terbuka ke bawah saat hover */}
                  {isThemeSubmenuOpen && (
                    <div className="py-1">
                      {/* Tombol Light Theme */}
                      <button
                        onClick={() => {
                          if (theme === 'dark') {
                            toggleTheme();
                          }
                        }}
                        className="w-full flex justify-between items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md dark:hover:bg-gray-500 dark:text-gray-200 dark:hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                            <Sun className="w-4 h-4" />
                            <span>Light</span>
                        </div>
                        {theme === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                      
                      {/* Tombol Dark Theme */}
                      <button
                        onClick={() => {
                          if (theme === 'light') {
                            toggleTheme();
                          }
                        }}
                        className="w-full flex justify-between items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md dark:hover:bg-gray-500 dark:text-gray-200 dark:hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                            <Moon className="w-4 h-4" />
                            <span>Dark</span>
                        </div>
                        {theme === 'dark' && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>  
          <Separator orientation="vertical" className="h-6" />
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sources Panel */}
        {leftPanelOpen && (
          <div className="w-80 bg-white border-r border-gray-200 dark:border-gray-600 flex flex-col">
            <SourcesPanel 
              sources={sources}
              selectedSources={selectedSources}
              onSourceSelection={handleSourceSelection}
              onDocumentUpload={handleDocumentUpload}
              onDocumentDelete={handleDocumentDelete}
              isLoading={isLoadingSources}
            />
          </div>
        )}

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          <ChatPanel 
            sources={sources}
            selectedSources={selectedSources}
            currentChatBoxId={currentChatBoxId}
            onChatBoxCreate={setCurrentChatBoxId}
          />
        </div>

        {/* Studio Panel */}
        {rightPanelOpen && (
          <div className="w-96 bg-white border-l border-gray-200 dark:border-gray-600 flex flex-col">
            <StudioPanel selectedSources={selectedSources} />
          </div>
        )}
      </div>
    </div>
  )
}

export default NotebookPage 
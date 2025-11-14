"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Download, 
  BookOpen, 
  Brain, 
  Clock, 
  FileText, 
  Headphones,
  Plus,
  MoreVertical,
  CheckCircle,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotebookAPI, PodcastResponse, useNotebookAPI } from '@/lib/api'
import { useAuth } from '@clerk/nextjs'
import useMindMapStore from './markmap'
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { Toolbar } from 'markmap-toolbar';
import { ChatPanel } from './ChatPanel'

interface StudyTool {
  id: string
  type: 'audio-overview' | 'study-guide' | 'timeline' | 'faq' | 'briefing-doc' | 'mind-map'
  title: string
  description: string
  status: 'ready' | 'generating' | 'error'
  duration?: string
  progress?: number
}

interface StudioPanelProps {
  selectedSources: string[]
}

function renderToolbar(mm: Markmap, wrapper: HTMLElement) {
  while (wrapper?.firstChild) wrapper.firstChild.remove();
  if (mm && wrapper) {
    const toolbar = new Toolbar();
    toolbar.attach(mm);
    // Register custom buttons
    toolbar.register({
      id: 'alert',
      title: 'Click to show an alert',
      content: 'Alert',
      onClick: () => alert('You made it!'),
    });
    toolbar.setItems([...Toolbar.defaultItems, 'alert']);
    wrapper.append(toolbar.render());
  }
}

interface Props {
  onNodeClick: (text: string) => void;
}

export function StudioPanel({ selectedSources }: StudioPanelProps) {
  const { userId } = useAuth()
  const { api } = useNotebookAPI()
  // TODO: Implement actual audio playback - currently just toggles UI icon
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false)
  const [isLoadingRegenerateMindmap, setIsLoadingRegenerateMindmap] = useState(false)
  const [podcastData, setPodcastData] = useState<PodcastResponse | null>(null)
  const [podcastError, setPodcastError] = useState<string | null>(null)
  const [studyTools, setStudyTools] = useState<StudyTool[]>([
    {
      id: '1',
      type: 'audio-overview',
      title: 'Audio Overview',
      description: selectedSources.length > 0 
        ? `Ready to generate from ${selectedSources.length} selected source${selectedSources.length !== 1 ? 's' : ''}`
        : 'Select sources to generate audio overview',
      status: selectedSources.length > 0 ? 'ready' : 'error',
      duration: selectedSources.length > 0 ? `${selectedSources.length} source${selectedSources.length !== 1 ? 's' : ''}` : undefined
    },
    {
      id: '2',
      type: 'study-guide',
      title: 'Study Guide',
      description: selectedSources.length > 0 
        ? 'Study guide and glossary from selected documents'
        : 'Select sources to generate study guide',
      status: selectedSources.length > 0 ? 'ready' : 'error'
    },
    {
      id: '3',
      type: 'timeline',
      title: 'Timeline',
      description: selectedSources.length > 0 
        ? 'Chronological overview of key events from your documents'
        : 'Select sources to generate timeline',
      status: selectedSources.length > 0 ? 'ready' : 'error'
    },
    {
      id: '4',
      type: 'briefing-doc',
      title: 'Briefing Document',
      description: selectedSources.length > 0 
        ? 'Executive summary from your selected documents'
        : 'Select sources to generate briefing',
      status: selectedSources.length > 0 ? 'ready' : 'error'
    }
  ])

  const getToolIcon = (type: StudyTool['type']) => {
    switch (type) {
      case 'audio-overview':
        return <Headphones className="w-5 h-5" />
      case 'study-guide':
        return <BookOpen className="w-5 h-5" />
      case 'timeline':
        return <Clock className="w-5 h-5" />
      case 'faq':
        return <Brain className="w-5 h-5" />
      case 'briefing-doc':
        return <FileText className="w-5 h-5" />
      case 'mind-map':
        return <Brain className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: StudyTool['status']) => {
    switch (status) {
      case 'ready':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Ready</Badge>
      case 'generating':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Generating...</Badge>
      case 'error':
        return <Badge variant="destructive" className="text-xs">Select Sources</Badge>
      default:
        return null
    }
  }

  const generateNewTool = (type: StudyTool['type']) => {
    if (selectedSources.length === 0) {
      return // Don't generate if no sources selected
    }

    const newTool: StudyTool = {
      id: `tool-${toolIdCounterRef.current++}`,
      type,
      title: type === 'faq' ? 'FAQ' : type.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: `Generating from ${selectedSources.length} selected source${selectedSources.length !== 1 ? 's' : ''}...`,
      status: 'generating',
      progress: 0
    }

    setStudyTools([...studyTools, newTool])

    // Simulate generation progress
    const interval = setInterval(() => {
      setStudyTools(tools => tools.map(tool => {
        if (tool.id === newTool.id && tool.status === 'generating') {
          const newProgress = (tool.progress || 0) + Math.random() * 15
          if (newProgress >= 100) {
            clearInterval(interval)
            return { ...tool, status: 'ready', progress: 100, description: 'Ready to view' }
          }
          return { ...tool, progress: newProgress }
        }
        return tool
      }))
    }, 500)
  }

  const generatePodcast = async () => {
    if (!canGenerate || !userId) return

    setIsGeneratingPodcast(true)
    setPodcastError(null)

    try {
      // Generate a question based on the selected sources
      const question = `Please create a comprehensive overview of the content from these ${selectedSources.length} selected document${selectedSources.length !== 1 ? 's' : ''}.`
      
      const response = await NotebookAPI.generateConversationalPodcast({
        question,
        user_id: userId,
        // Optional: customize speaker voices
        speaker_voices: {
          HOST_A: {
            predefined_voice_id: "Adrian.wav",
            temperature: 0.6,
            exaggeration: 0.8
          },
          HOST_B: {
            predefined_voice_id: "Emily.wav", 
            temperature: 0.8,
            exaggeration: 1.2
          }
        }
      })

      setPodcastData(response)
      console.log('Podcast generated successfully:', response)
    } catch (error) {
      console.error('Error generating podcast:', error)
      setPodcastError(error instanceof Error ? error.message : 'Failed to generate podcast')
    } finally {
      setIsGeneratingPodcast(false)
    }
  }

  const downloadPodcast = async () => {
    if (!podcastData?.final_audio_path) return

    try {
      const filename = podcastData.final_audio_path.split('/').pop()
      if (!filename) return

      const audioBlob = await NotebookAPI.downloadAudio(filename)
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading podcast:', error)
    }
  }

  const handleNodeClick = useCallback((nodeText: string, parentText?: string) => {
    // Ini adalah fungsi yang bakal jalan pas node di-klik

    let nodeInfo;

    if(!parentText) {
      // Kalo gak ada konteks bapak, langsung kirim nodeText aja
      nodeInfo = JSON.stringify({ nodeText });
    } else {
      // Kalo ada konteks bapak, gabungin konteksnya
      nodeInfo = JSON.stringify({ nodeText, parentText });
    }

    const event = new CustomEvent('mindmapNodeClick', { detail: nodeInfo });

    setShowMindMap(false); // Tutup mind map modal

    // 2. Teriak ke "toa" global (window)
    window.dispatchEvent(event);
  }, []);

  const canGenerate = selectedSources.length > 0

  // const transformer = new Transformer();

  const { mindMapData, setMindMapData, isLoadingMindMap, setIsLoadingMindMap } = useMindMapStore(); 
  const [ showMindMap, setShowMindMap ] = useState(false);

  const refSvg = useRef<SVGSVGElement>(null);
  // Ref for markmap object
  const refMm = useRef<Markmap>(null);
  // Ref for toolbar wrapper
  const refToolbar = useRef<HTMLDivElement>(null);
  // Ref for deterministic ID generation
  const toolIdCounterRef = useRef<number>(0);

  const handleGenerateNewMindmap = useCallback(async (query: any) => {
    // 1. Kasih tau UI kalo lagi loading, biar user gak bingung
    // setIsLoading(true);
    console.log(`🚀 Nge-hit API dengan query: "${query}"`);
    setIsLoadingRegenerateMindmap(true);

    const question = `make a mindmap about ${query}`;

    try {
      const response = await api.regenerateMindMap(
        question
      );

      // 3. Cek kalo request-nya gagal (misal server error 500)
      console.log('Response dari handleGenerateNewMindmap:', response);

      setMindMapData(response);

    } catch (error) {
      // 6. Kalo ada error di network atau dari 'throw' di atas, tangkep di sini
      console.error('Anjir, gagal generate mind map baru:', error);
      // Di sini lo bisa nampilin notif error ke user
      
    } finally {
      // 7. Apapun yang terjadi (sukses atau gagal), matiin loading indicator
      // setIsLoading(false);
      setIsLoadingRegenerateMindmap(false);
    }
  }, [api, setMindMapData, setIsLoadingRegenerateMindmap]);


useEffect(() => {
  if (!showMindMap || !mindMapData || !refSvg.current) {
    return;
  }

  const transformer = new Transformer();

  const { root } = transformer.transform(mindMapData);

  const svgEl = refSvg.current;

  // Instance Markmap selalu dibuat baru biar fresh
  const mm = Markmap.create(svgEl, { autoFit: true, initialExpandLevel: 0 });
  refMm.current = mm; 
  
  mm.setData(root);
  mm.fit();

  const attachListeners = () => {
    const nodeGroups = svgEl.querySelectorAll<SVGGElement>('g.markmap-node');

    nodeGroups.forEach(group => {
      // Pake dataset buat nandain, biar gak dobel listener
      if (group.dataset.nodeListener === 'true') return;
      group.dataset.nodeListener = 'true';
      group.style.cursor = 'pointer';

      // Cek apakah ini node terakhir (leaf node) dengan liat ada 'circle' atau nggak
      const isLeafNode = !group.querySelector('circle');

      // ==========================================================
      // INJEKSI FITUR BARU MULAI DARI SINI
      // ==========================================================
      if (isLeafNode) {
        // Biar gak dobel-dobel bikin tombol kalo fungsi ini kepanggil lagi
        if (group.querySelector('.interactive-button-container')) return;

        // 1. Ambil ukuran & posisi kotak teks biar tombolnya presisi
        const textBox = group.querySelector('foreignObject');
        if (!textBox) return;
        const textBoxRect = textBox.getBBox();

        // 2. Bikin semua elemen SVG baru pake namespace yang bener
        const ns = 'http://www.w3.org/2000/svg';
        const buttonContainer = document.createElementNS(ns, 'g');
        const buttonRect = document.createElementNS(ns, 'rect');
        const buttonText = document.createElementNS(ns, 'text');
        

        // 3. Atur posisi container tombolnya
        //    Posisinya di kanan kotak teks, tengah-tengah secara vertikal
        const buttonX = textBoxRect.x + textBoxRect.width + 10; // 10px spasi
        const buttonY = textBoxRect.y + textBoxRect.height / 2;
        buttonContainer.setAttribute('transform', `translate(${buttonX}, ${buttonY})`);
        buttonContainer.classList.add('interactive-button-container');
        buttonContainer.style.cursor = 'pointer';

        // 4. Styling & atribut si tombol (awalnya bulet)
        buttonRect.setAttribute('x', '-10'); // Setengah dari width biar pusatnya di 0,0
        buttonRect.setAttribute('y', '-10'); // Setengah dari height
        buttonRect.setAttribute('width', '20');
        buttonRect.setAttribute('height', '20');
        buttonRect.setAttribute('rx', '10'); // rx=ry=setengah width/height -> jadi bulet
        buttonRect.setAttribute('ry', '10');
        buttonRect.setAttribute('fill', '#4A90E2'); // Warna biru, bebas ganti
        buttonRect.classList.add('interactive-button-rect'); // Class buat transisi CSS

        // 5. Styling & atribut teks '?' di dalem tombol
        buttonText.textContent = '?';
        buttonText.setAttribute('text-anchor', 'middle'); // Teks rata tengah horizontal
        buttonText.setAttribute('dominant-baseline', 'central'); // Teks rata tengah vertikal
        buttonText.setAttribute('fill', 'white');
        buttonText.setAttribute('font-weight', 'bold');
        buttonText.setAttribute('font-size', '14px');
        buttonText.style.pointerEvents = 'none'; // Biar gak ngehalangin event di container

        // 6. Gabungin semua elemen jadi satu
        buttonContainer.appendChild(buttonRect);
        buttonContainer.appendChild(buttonText);
        group.appendChild(buttonContainer);

        // 7. Magic-nya di sini: event hover!
        buttonContainer.addEventListener('mouseenter', () => {
          // Tambahkan class Tailwind untuk animasi & style
          buttonRect.setAttribute('x', '-10');
          buttonRect.setAttribute('width', '20');
          buttonRect.setAttribute('rx', '10');
          buttonText.textContent = '?';
          buttonText.setAttribute('font-size', '14px');
          buttonRect.setAttribute('fill', '#90cdf4'); // biru muda (Tailwind: blue-300)
        });

        buttonContainer.addEventListener('mouseleave', () => {
          // Balikin ke bentuk & teks semula
          buttonRect.setAttribute('x', '-10');
          buttonRect.setAttribute('width', '20');
          buttonRect.setAttribute('rx', '10');
          buttonText.textContent = '?';
          buttonText.setAttribute('font-size', '14px');
          buttonRect.setAttribute('fill', '#4A90E2'); // Warna biru, bebas ganti
        });
          
        buttonContainer.addEventListener('click', (event) => {
            event.stopPropagation();
            
            // Ambil teks dari node yang diklik
            const nodeText = group.querySelector('foreignObject > div > div')?.textContent?.trim();
            
            if (nodeText) {
                // Panggil fungsi asinkron-nya di sini!
                handleGenerateNewMindmap(nodeText);
            }
        });

      }
      // ==========================================================
      // AKHIR DARI INJEKSI FITUR BARU
      // ==========================================================

      group.addEventListener('click', (event) => {
        event.stopPropagation();

        // 1. Ambil info si anak (node yang diklik)
        const childTextContainer = group.querySelector('foreignObject > div > div');
        const childText = childTextContainer?.textContent?.trim();
        const childPath = group.dataset.path;

        if (!childText || !childPath) return;

        let fullQuery = childText; // Default query
        let parentText = '';

        // 2. Cek & cari bapaknya kalo ada
        if (childPath.includes('.')) {
          const parentPath = childPath.split('.').slice(0, -1).join('.');

          // Cari elemen si bapak di seluruh SVG
          const parentEl = svgEl.querySelector<SVGGElement>(`g.markmap-node[data-path="${parentPath}"]`);

          if (parentEl) {
            const parentTextContainer = parentEl.querySelector('foreignObject > div > div');
            parentText = parentTextContainer?.textContent?.trim() || '';
          }
        }

        // 3. Gabungin konteks bapak & anak
        if (parentText) {
          fullQuery = `${parentText}: ${childText}`;
          handleNodeClick(childText, parentText); // Kirim query yang udah lengkap
        } else {
          handleNodeClick(childText); // Kirim query anak aja
        }
      });
    });

    const circles = svgEl.querySelectorAll<SVGCircleElement>('g.markmap-node circle');
    circles.forEach(circle => {
      if (circle.dataset.circleListener === 'true') return;
      circle.dataset.circleListener = 'true';

      circle.addEventListener('click', (event) => {
        event.stopPropagation();
        setTimeout(attachListeners, 0);
      });
    });
  };

  attachListeners();

  // Cleanup function, ini udah bener
  return () => {
    refMm.current?.destroy();
  };

}, [showMindMap, mindMapData, handleNodeClick, handleGenerateNewMindmap]);


  return (
    <div className="h-full flex flex-col dark:bg-gray-700 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 dark:hover:text-white">Studio</h2>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
          size="sm" 
          variant="outline"
          disabled={!canGenerate}
          >
          <Plus className="w-4 h-4 mr-1" />
          Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 ">
          <DropdownMenuItem 
          onClick={() => generateNewTool('audio-overview')}
          disabled={!canGenerate}
          >
          <Headphones className="w-4 h-4 mr-2" />
          Audio Overview
          </DropdownMenuItem>
          <DropdownMenuItem 
          onClick={() => generateNewTool('study-guide')}
          disabled={!canGenerate}
          >
          <BookOpen className="w-4 h-4 mr-2" />
          Study Guide
          </DropdownMenuItem>
          <DropdownMenuItem 
          onClick={() => generateNewTool('timeline')}
          disabled={!canGenerate}
          >
          <Clock className="w-4 h-4 mr-2" />
          Timeline
          </DropdownMenuItem>
          <DropdownMenuItem 
          onClick={() => generateNewTool('faq')}
          disabled={!canGenerate}
          >
          <Brain className="w-4 h-4 mr-2" />
          FAQ
          </DropdownMenuItem>
          <DropdownMenuItem 
          onClick={() => generateNewTool('briefing-doc')}
          disabled={!canGenerate}
          >
          <FileText className="w-4 h-4 mr-2" />
          Briefing Doc
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!canGenerate && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
        Select sources to enable studio tools
        </div>
      )}
      </div>

      {/* Audio Overview Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-orange-200 dark:bg-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
        <Headphones className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-200 dark:hover:text-white">Audio Overview</h3>
        <p className="text-sm text-gray-600 dark:text-gray-200 dark:hover:text-white">
          {canGenerate 
          ? `Create an Audio Overview from ${selectedSources.length} source${selectedSources.length !== 1 ? 's' : ''}!`
          : 'Select sources to create an Audio Overview!'
          }
        </p>
        </div>
      </div>
      
      <Button 
        className="w-full mb-3 bg-orange-500 hover:bg-orange-600 text-white"
        disabled={!canGenerate || isGeneratingPodcast}
        onClick={generatePodcast}
      >
        {isGeneratingPodcast ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating Podcast...
        </>
        ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          Generate Audio Overview
        </>
        )}
      </Button>
      
      {/* Error Message */}
      {podcastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
        <p className="text-sm text-red-800">{podcastError}</p>
        </div>
      )}

      {/* Audio Player (when generated) */}
      {podcastData && (
        <div className="bg-white rounded-lg p-4 border border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">
          Conversational Podcast ({podcastData.segment_count} segments)
          </span>
          <span className="text-xs text-gray-500">
          {podcastData.segments.length} speakers
          </span>
        </div>
        
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-2">
          {podcastData.script.substring(0, 100)}...
          </p>
          <Progress value={100} className="mb-3" indicatorColor="bg-orange-500" />
        </div>
        
        <div className="flex items-center justify-between">
          <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPlaying(!isPlaying)}
          >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button 
          size="sm" 
          variant="ghost"
          onClick={downloadPodcast}
          >
          <Download className="w-4 h-4" />
          </Button>
        </div>
        </div>
      )}

      {/* Generation Status */}
      {isGeneratingPodcast && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Generating Podcast</span>
        </div>
        <p className="text-xs text-blue-700">
          Creating conversational audio overview from your selected documents...
        </p>
        </div>
      )}
      </div>

      {/* Notes Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-gray-200 dark:hover:text-white">Notes</h3>
        <Button size="sm" variant="ghost" disabled={!canGenerate}>
        <Plus className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm text-gray-500 italic dark:text-gray-200 dark:hover:text-white">
        {canGenerate 
        ? 'Ready to take notes from your selected sources.'
        : 'Select sources to enable note-taking.'
        }
      </p>
      </div>

      {/* Study Tools */}
      <div className="flex-1">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-3">
        {studyTools.map((tool) => (
          <div
          key={tool.id}
          className={`p-3 rounded-lg border transition-colors cursor-pointer ${
            tool.status === 'error' 
            ? 'border-gray-200 bg-gray-50 opacity-60' 
            : 'border-gray-200 hover:border-gray-300'
          }`}
          >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
            <div className={`${tool.status === 'error' ? 'text-gray-400' : 'text-gray-600'}`}>
              {getToolIcon(tool.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
              <h4 className={`text-sm font-medium truncate ${
                tool.status === 'error' ? 'text-gray-400' : 'text-gray-900'
              }`}>
                {tool.title}
              </h4>
              {getStatusBadge(tool.status)}
              </div>
              <p className={`text-xs line-clamp-2 ${
              tool.status === 'error' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {tool.description}
              </p>
              {tool.duration && tool.status !== 'error' && (
              <p className="text-xs text-gray-500 mt-1">
                {tool.duration}
              </p>
              )}
            </div>
            </div>
            
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              disabled={tool.status === 'error'}
              >
              <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Download
              </DropdownMenuItem>
              <DropdownMenuItem>
              <FileText className="w-4 h-4 mr-2" />
              View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {tool.status === 'generating' && tool.progress !== undefined && (
            <div className="space-y-1">
                    <Progress value={tool.progress} className="h-1" indicatorColor="bg-blue-500" />
                    <p className="text-xs text-gray-500">
                      {Math.round(tool.progress)}% complete
                    </p>
                  </div>
                )}
                
                {tool.status === 'ready' && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">Ready to use</span>
                  </div>
                )}
              </div>
            ))}

            {/* Mind Map Section */}

              {mindMapData && (<div
                className="p-3 rounded-lg border transition-colors cursor-pointer border-gray-200 hover:border-gray-300"
                onClick={() => setShowMindMap(true)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-gray-600">
                      {getToolIcon('mind-map')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate text-gray-900">
                          Mind Map
                        </h4>
                        {getStatusBadge('ready')}
                      </div>
                      <p className={"text-xs line-clamp-2 text-gray-600"}>
                        Visual representation of your documents structure and relationships.
                      </p>
                    </div>
                  </div>
                </div>
                
              </div>)}

          </div>
        </ScrollArea>
      </div>

          {/* Mind Map Modal */}
          {showMindMap && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg w-full h-fit max-w-7xl relative p-6 flex flex-col">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowMindMap(false)}
                aria-label="Close"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5" /> Mind Map
              </h3>
              <div className="relative w-full flex-1 flex justify-center items-center min-h-0">
                {isLoadingRegenerateMindmap && (
                  // <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-10">
                  // <Loader2 className="w-8 h-8 mb-2 animate-spin text-gray-600" />
                  // <p className="text-gray-600">Regenerating mind map...</p>
                  // </div>
                    <div className="absolute inset-0 bg-white bg-opacity-70 transition-[backdrop-filter] duration-300 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <h4 className="text-lg font-semibold text-gray-00">
                      <span className="
                        animate-shimmer 
                        bg-gradient-to-r 
                        from-gray-600 via-gray-300 to-gray-600 
                        bg-[length:200%_100%] 
                        bg-clip-text 
                        text-transparent
                      ">
                        Regenerating Mindmap ...
                      </span>
                    </h4>
                  </div>
                )}
                <svg
                ref={refSvg}
                width="100%"
                height="100%"
                style={{
                  display: mindMapData ? 'block' : 'none',
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  minHeight: '50vh',
                  maxWidth: '100%',
                  height: '100%',
                  // overflow: 'visible',
                }}
                className="w-full h-full transition-all"
                />
                <div
                ref={refToolbar}
                className="absolute top-2 right-2 z-10"
                />
              </div>
              </div>
            </div>
          )}


    </div>
  )
} 